# Beanify Android 移植方案

> 将当前 Vite + React 拼豆图纸生成器打包为 Android App 的技术调研与实施计划。
> 日期：2026-06-05

---

## 一、方案选型对比

### 对比维度

| 特性 | Capacitor | React Native | Tauri Mobile | PWA |
|------|-----------|-------------|-------------|-----|
| **Web 代码复用** | 100%（现有代码不动） | ~60%（需重写 UI） | 100% | 100% |
| **原生 API 访问** | 插件桥接 | 直接调用 | Rust 桥接 | 有限 |
| **包体积增量** | ~8MB | ~15MB | ~5MB | 0 |
| **构建时间** | 30s (sync) | 5min+ | 3min | 0 |
| **Play Store 上架** | ✅ | ✅ | ✅ | ❌ |
| **离线可用** | ✅ | ✅ | ✅ | 部分 |
| **学习成本** | 低 | 高 | 中 | 无 |
| **维护成本** | 低 | 高 | 中 | 无 |
| **WebView 限制** | 是 | 否 | 否 | 是 |

**结论：Capacitor 是最适合当前项目的方案。** 理由：
- 零代码重写成本——现有 React SPA 直接跑在 WebView 里
- 只需要通过插件桥接少数原生能力
- 纯前端 SPA 没有后端依赖，天然适合离线场景

---

## 二、Capacitor 工作原理解析

```
┌──────────────────────────────────────────┐
│              Android App (APK)            │
│  ┌────────────────────────────────────┐  │
│  │    Capacitor Runtime (Java)         │  │
│  │    - WebView 管理                    │  │
│  │    - 插件注册与路由                   │  │
│  │    - 生命周期绑定                     │  │
│  ├────────────────────────────────────┤  │
│  │    Capacitor WebView (Chromium)     │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Beanify React SPA          │  │  │
│  │  │   (dist/ 静态文件)            │  │  │
│  │  └──────────────────────────────┘  │  │
│  ├────────────────────────────────────┤  │
│  │    Capacitor Plugins                │  │
│  │    Camera · Filesystem · Share      │  │
│  │    StatusBar · SplashScreen         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Web → Native 通信

Capacitor 通过在 WebView 中注入 `window.Capacitor` 全局对象来桥接原生能力：

```javascript
// JavaScript 侧（现有 UI 代码）
import { Camera } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  resultType: CameraResultType.DataUrl
});
// → Capacitor 将调用序列化为 JSON → Native 端执行
// → 返回结果反序列化回 JS
```

### 生命周期映射

| Web 事件 | Android 生命周期 |
|---------|----------------|
| `appStateChange` (foreground) | `onResume()` |
| `appStateChange` (background) | `onPause()` |
| `appRestoredResult` | `onNewIntent()` |
| 无 | `onDestroy()`（由 Runtime 自动处理） |

---

## 三、项目改造步骤

### 3.1 前置条件

- Node.js 20+
- Android Studio (建议 Ladybug 2024.3+)
- JDK 17+
- Android SDK 34+
- Gradle 8.x

验证工具链：

```bash
java -version
# openjdk 17.0.x
npx cap doctor android
```

### 3.2 安装与初始化

```bash
# 安装 Capacitor 核心和 Android 平台
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest

# 初始化 Capacitor 配置
npx cap init \
  --name "豆你玩" \
  --appId "com.beanify.app" \
  --webDir "dist"
```

执行后自动生成 `capacitor.config.ts`：

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beanify.app',
  appName: '豆你玩',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 开发模式下可开启本地服务用于 HMR
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#F8F7F4',
    },
  },
};

export default config;
```

### 3.3 构建与同步

```bash
# 构建前端
npm run build

# 同步到 Android 原生工程
npx cap sync android
```

`cap sync` 会执行以下操作：
1. 清空 `android/app/src/main/assets/public/`
2. 复制 `dist/` 内容到此目录
3. 更新 `AndroidManifest.xml` 配置
4. 安装 / 更新 npm 插件对应的原生依赖

首次执行后生成 `android/` 目录，可用 Android Studio 打开：

```bash
npx cap open android
```

### 3.4 增量更新流程

每次前端代码变更后的发布流程：

```bash
npm run build          # 构建前端
npx cap sync android   # 同步到 Android 工程
npx cap open android   # 在 Android Studio 中打开 → 运行 / 打包
```

---

## 四、原生插件集成

### 4.1 插件清单

```bash
npm install @capacitor/camera
npm install @capacitor/filesystem
npm install @capacitor/share
npm install @capacitor/status-bar
npm install @capacitor/splash-screen
```

| 插件 | 用途 | 改动文件 |
|------|------|---------|
| `@capacitor/camera` | 直接拍照上传 | `UploadZone.tsx` 加拍照按钮 |
| `@capacitor/filesystem` | 图纸保存到本地 | `MaterialStats.tsx` 导出逻辑 |
| `@capacitor/share` | 分享图纸 | `MaterialStats.tsx` 加分享按钮 |
| `@capacitor/status-bar` | 沉浸式状态栏 | `App.tsx` 初始化 |
| `@capacitor/splash-screen` | 启动屏 | `App.tsx` 初始化 |

### 4.2 代码改动量预估

**UploadZone.tsx**——新增约 30 行：

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

// 相机拍照按钮
<button onClick={async () => {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.DataUrl,
    quality: 90,
  });
  if (photo.dataUrl) handleFileFromUrl(photo.dataUrl);
}}>
  拍照
</button>
```

**MaterialStats.tsx**——导出后追加分享，约 10 行：

```typescript
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

// 导出 PNG 后保存到相册 / 分享
const savedFile = await Filesystem.writeFile({
  path: `bead-pattern-${Date.now()}.png`,
  data: base64Data,
  directory: Directory.Documents,
});

await Share.share({
  title: '拼豆图纸',
  text: '看看我做的拼豆图纸！',
  url: savedFile.uri,
});
```

**App.tsx / main.tsx**——初始化约 5 行：

```typescript
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// 在 App 组件 mount 时
StatusBar.setOverlaysWebView({ overlay: false });
SplashScreen.hide();
```

### 4.3 Android 原生配置

**`AndroidManifest.xml`**（`android/app/src/main/`）：

```xml
<!-- 相机权限 -->
<uses-permission android:name="android.permission.CAMERA" />
<!-- 文件读写 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**`MainActivity.java`**（`android/app/src/main/java/com/beanify/app/`）：

```java
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // 注册插件（Capacitor 5+ 会自动扫描，不需要手动注册）
  }
}
```

---

## 五、潜在问题与应对

### 5.1 WebView 兼容性

| 特性 | 风险 | 应对 |
|------|------|------|
| ES Module Workers | Android 10+ 支持 | 当前已回退到同步处理，无影响 |
| `Intl` API | 全版本支持 | 无影响 |
| Shadow DOM | 全版本支持 | shadcn/ui 未使用，无影响 |
| `BigInt` | Android 8+ | 当前未使用，无影响 |

### 5.2 性能

| 场景 | 预估耗时 | 备注 |
|------|---------|------|
| 58×58 grid, 16 colors | < 50ms | k-means 在 Chrome V8 中运行，手机 CPU 降频后可能 2x |
| 导出 PNG (40×40) | < 20ms | Canvas + toDataURL，纯同步 |
| 导出 Excel | < 100ms | xlsx-js-style 在 V8 中执行 |
| 原始图片加载 | < 200ms | 取决于图片尺寸 |

**结论：** 所有计算都在前端 V8 引擎中完成，中端 Android 手机性能完全足够。

### 5.3 大图内存

Capacitor Camera 插件支持 `resultType: 'DataUrl'`（base64）和 `resultType: 'Uri'`（文件路径）两种模式。建议使用 `DataUrl` + 限制最大尺寸：

```typescript
const photo = await Camera.getPhoto({
  resultType: CameraResultType.DataUrl,
  quality: 85,
  width: 800,   // 限制宽度，减小内存
  height: 800,  // 限制高度
});
```

### 5.4 离线场景

当前 Beanify 完全离线可用（所有逻辑在浏览器中执行，无后端依赖），唯一的网络依赖是 Google Fonts。建议在 `capacitor.config.ts` 中设置：

```typescript
server: {
  // 允许 file:// 协议加载本地字体
  androidScheme: 'https',
}
```

并在 `index.html` 中准备 fallback 字体。

### 5.5 .gitignore

```gitignore
# Android 原生工程（可被 cap sync 重新生成）
android/
# Capacitor 临时文件
*.cap
```

**注意：** 团队协作时建议将 `android/` 加入 `.gitignore`，每个开发者通过 `npx cap sync` 独立生成。CI 中也需要执行同步步骤。

---

## 六、发布流程

### 6.1 签名准备

```bash
# 生成密钥
keytool -genkey -v \
  -keystore beanify-release.keystore \
  -alias beanify \
  -keyalg RSA -keysize 2048 -validity 10000

# 移动到 android/app/
mv beanify-release.keystore android/app/
```

### 6.2 配置 Gradle

**`android/app/build.gradle.kts`**：

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("beanify-release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "beanify"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### 6.3 打包 AAB（推荐 Play Store 格式）

```bash
cd android
./gradlew bundleRelease
# 输出：android/app/build/outputs/bundle/release/app-release.aab
```

### 6.4 打包 APK（直接分发）

```bash
cd android
./gradlew assembleRelease
# 输出：android/app/build/outputs/apk/release/app-release.apk
```

---

## 七、时间估算

| 阶段 | 工时 | 产出 |
|------|------|------|
| 安装 Capacitor + 初始化 | 30min | 生成 android/ 工程 |
| 配置插件（Camera/Filesystem/Share） | 1h | 插件安装完毕 |
| UI 层改动（拍照、分享按钮） | 1h | UploadZone + MaterialStats 改造 |
| 构建验证 + Android Studio 调适 | 2h | 首次完整构建成功 |
| 主题色适配（StatusBar） | 30min | 状态栏沉浸 |
| 图标 + 启动屏制作 | 1h | 正式资源 |
| Play Store 上架准备 | 2h | 截图、说明、隐私政策 |
| **总计** | **~8h** | **一个工作日内完成** |

---

## 八、参考资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Capacitor Android 配置指南](https://capacitorjs.com/docs/android)
- [@capacitor/camera API](https://capacitorjs.com/docs/apis/camera)
- [@capacitor/filesystem API](https://capacitorjs.com/docs/apis/filesystem)
- [@capacitor/share API](https://capacitorjs.com/docs/apis/share)
- [Android 上架 Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)

---

> **结论：Capacitor 方案可行性高，风险低。** 当前代码无需重写，只需在 UI 层追加少量原生交互代码。预计一个工作日内可产出可运行的 APK。
