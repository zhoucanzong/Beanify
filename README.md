# 🫘 豆你玩 Beanify — 拼豆图纸生成器

> 一个免费、无需注册、纯本地处理的拼豆图纸生成工具。上传图片，自动转换为拼豆图纸，支持多品牌色号匹配、材料统计、手动编辑和多种格式导出。

## ✨ 功能特性

### 核心功能
- 🖼️ **图片转拼豆图纸** — 上传 JPG/PNG 图片，自动转换为像素级拼豆图纸
- 🎨 **多品牌色号匹配** — 支持 MARD、Perler、Hama、Artkal、Nabbi、Yant 等主流品牌色板
- 🔬 **CIEDE2000 色差算法** — 专业级色彩管理，精准匹配真实拼豆颜色
- 🧹 **智能颜色合并** — 基于 BFS 连通区域检测 + 主导色算法，自动清理杂色和灰色毛边
- 🎯 **背景智能移除** — 自动识别并剥离背景，专注主体图案
- 📊 **材料统计清单** — 自动统计每种颜色用量，生成精确采购清单
- 📄 **多格式导出** — 支持 PNG、PDF、Excel、CSV、JSON 等格式

### 编辑功能
- ✏️ **手动像素编辑** — 画笔、橡皮擦、填充、吸管、颜色替换
- ↩️ **撤销/重做** — 完整的操作历史管理
- 🎚️ **亮度/对比度/饱和度调整** — 生成后整体色调微调
- 🔄 **镜像翻转** — 水平翻转适配不同需求

### 品质保障
- 🔒 **纯本地处理** — 图片不上传服务器，保护你的隐私
- 🆓 **完全免费** — 无需注册、无需登录、无功能限制
- 📱 **移动端适配** — 手机竖屏快速生成，桌面端精细编辑
- 🌐 **中文本土化** — 完整中文界面，适配国内拼豆品牌和用户习惯

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:3000`。

## 📱 Android App

Beanify 使用 [Capacitor](https://capacitorjs.com) 将 Web App 打包为 Android 原生应用。

### 前提条件

- [Android Studio](https://developer.android.com/studio)（含 Android SDK 34+）
- JDK 17+
- Android SDK 命令行工具（`sdkmanager`）

### 构建 APK

```bash
# 1. 安装 Capacitor 依赖（已完成）
npm install

# 2. 构建前端
npm run build

# 3. 同步到 Android 项目
npx cap sync android

# 4. 构建 APK
cd android
ANDROID_HOME=$HOME/Library/Android/sdk \
  JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew assembleDebug

# APK 路径：android/app/build/outputs/apk/debug/app-debug.apk
```

### 在手机上运行

```bash
# 连接手机（开启 USB 调试），直接安装
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

或在 Android Studio 中打开 `android/` 目录，点击 ▶ Run。

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Vite 7 | 构建工具 |
| Tailwind CSS 3 | 样式方案 |
| shadcn/ui | 组件库（40+ 组件） |
| React Router 7 | 路由管理 |
| xlsx | Excel 导出 |
| CIEDE2000 | 颜色匹配算法 |

## 📁 项目结构

```
Beanify/
├── src/
│   ├── components/       # 通用 UI 组件
│   │   └── ui/           # shadcn/ui 组件库
│   ├── editor/           # 拼豆编辑器模块
│   ├── engine/           # 核心引擎
│   │   ├── color-space.ts  # 颜色空间转换与 CIEDE2000
│   │   ├── database.ts     # 色号数据库管理
│   │   ├── quantize.ts     # 颜色量化算法
│   │   ├── filters.ts      # 图像滤镜处理
│   │   ├── export.ts       # 多格式导出
│   │   └── types.ts        # 类型定义
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具函数
│   └── pages/            # 页面组件
│       ├── Home.tsx         # 首页
│       ├── ConvertPage.tsx  # 图片转图纸页
│       └── EditorPage.tsx   # 编辑器页
├── research/             # 调研资料
│   ├── *.csv             # 品牌色号数据库
│   └── *.md              # 用户需求分析、竞品分析、制作规范等
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🎯 页面路由

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | ConvertPage | 图片上传 → 拼豆图纸转换 |
| `/editor` | EditorPage | 像素级手动编辑 |

## 📚 参考资源

`research/` 目录包含项目的完整调研资料：
- **用户需求分析** — 用户画像、痛点汇总、功能优先级
- **竞品分析报告** — 7 款主流工具的详细对比
- **色号数据库** — MARD、Perler、Hama、Artkal、Nabbi、Yant 等品牌 CSV
- **拼豆制作规范** — 尺寸标准、颜色建议、图纸导出规范

## 📄 License

MIT

---

**豆你玩 Beanify** — 把时间留给拼豆本身，快乐多很多 🫘
