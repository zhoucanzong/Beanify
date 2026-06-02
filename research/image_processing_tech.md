# 拼豆图纸生成技术方案

> 调研日期: 2025年  
> 版本: v1.0  
> 适用范围: 拼豆/像素画/十字绣图案自动生成工具

---

## 1. 技术架构概述

### 1.1 系统架构

拼豆图纸生成系统的核心是一个图像处理Pipeline，从用户上传图片到最终可打印的拼豆图纸，整个流程分为以下几个阶段：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  图片上传    │───▶│  预处理阶段  │───▶│  量化与匹配  │───▶│  后处理清理  │
│  (JPG/PNG)  │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                      │
                      ┌─────────────┐    ┌─────────────▼┐   ┌─────────────┐
                      │  图纸输出    │◀───│  色号映射与  │◀──│  杂色过滤与  │
                      │ (PDF/PNG)   │    │  数量统计    │   │  边缘清理    │
                      └─────────────┘    └──────────────┘   └─────────────┘
```

### 1.2 技术选型原则

| 考量因素 | 权重 | 说明 |
|---------|------|------|
| 速度 | ★★★★☆ | 浏览器端处理，需要秒级响应 |
| 颜色准确性 | ★★★★★ | 拼豆成品效果直接依赖颜色匹配 |
| 减少杂色 | ★★★★★ | 孤立色块会影响拼豆成品质量 |
| 保留轮廓 | ★★★★☆ | 关键特征必须清晰可见 |
| 实现复杂度 | ★★★☆☆ | 考虑前端实现的可维护性 |

### 1.3 核心算法栈

- **颜色量化**: k-means++ (OpenCV) / 中位切分法 (备选)
- **颜色空间**: CIELAB (Lab) + Delta E 2000
- **降噪滤波**: 双边滤波 (Bilateral Filter) + 中值滤波
- **缩放算法**: 最近邻插值 (Nearest Neighbor)
- **杂色过滤**: 连通区域分析 + 面积阈值 + 形态学开运算
- **颜色匹配**: Lab空间最小距离映射

---

## 2. 颜色量化算法选择

### 2.1 算法对比

颜色量化是拼豆图纸生成的核心技术——将24位真彩色图像的颜色减少到20-50色（拼豆实际可用色号数量）。

#### 2.1.1 k-means 聚类

**原理**: 将图像中的每个像素视为RGB空间中的一个点，通过迭代聚类找到K个聚类中心（即调色板颜色），每个像素分配到最近的中心。

**优点**:
- 量化质量高，能很好保持图像的主要色彩分布
- 全局优化，颜色代表性较好
- 配合k-means++初始化能显著提升收敛速度和结果质量
- OpenCV有原生实现 (`cv2.kmeans`)，易于集成

**缺点**:
- 时间复杂度高：O(N*K*I)，其中N为像素数，K为聚类数，I为迭代次数
- 对初始中心点敏感（k-means++可以缓解）
- 可能收敛到局部最优
- 对图片中的渐变色处理不佳，可能产生色带

**速度优化方法**:
1. **采样优化**: 不对全部像素进行聚类，而是随机采样5-10%的像素来训练聚类中心，再对所有像素做预测分配
2. **k-means++初始化**: 智能选择初始中心点，减少迭代次数
3. **限制迭代次数**: 设置max_iter=10-20通常足够
4. **降分辨率预处理**: 先缩小图片再聚类
5. **MiniBatch K-means**: 使用小批量更新

**参考实现 (Python/OpenCV)**:
```python
import cv2
import numpy as np

def kmeans_quantize(image, k=32):
    """k-means颜色量化"""
    data = np.float32(image).reshape((-1, 3))
    # 使用k-means++初始化
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, 
                                     cv2.KMEANS_PP_CENTERS)
    quantized = np.uint8(centers)[labels.flatten()].reshape(image.shape)
    return quantized, centers
```

#### 2.1.2 中位切分法 (Median Cut)

**原理**: 递归地将RGB颜色空间中最长的轴按中位数切分，每次将颜色分成两半，直到得到所需数量的颜色盒子。每个盒子取均值作为调色板颜色。

**优点**:
- 速度快，时间复杂度为O(N log K)
- 实现相对简单
- 确定性算法（无随机性），结果可复现
- 对少量颜色（如16-64色）效果可接受

**缺点**:
- 量化误差通常比k-means大
- 切分方向只沿坐标轴，可能错过最优分割方向
- 对颜色分布不均匀的图片效果较差
- 每个颜色盒子包含的像素数量可能差异很大

**参考实现思路**:
```python
def median_cut(image, k=32):
    """中位切分法颜色量化"""
    pixels = image.reshape(-1, 3).tolist()
    
    def split_box(box, depth):
        if depth == 0 or len(box) <= 1:
            return [box]
        # 找到最长轴
        ranges = [max(c) - min(c) for c in zip(*box)]
        axis = ranges.index(max(ranges))
        # 按中位数切分
        box.sort(key=lambda p: p[axis])
        mid = len(box) // 2
        return split_box(box[:mid], depth - 1) + split_box(box[mid:], depth - 1)
    
    # 需要2^n = k个盒子，所以depth = log2(k)
    import math
    depth = int(math.log2(k))
    boxes = split_box(pixels, depth)
    # 取每个盒子的均值作为调色板颜色
    palette = [np.mean(box, axis=0).astype(np.uint8) for box in boxes if box]
    return palette
```

#### 2.1.3 八叉树量化 (Octree Quantization)

**原理**: 将RGB颜色空间视为一个八叉树，每个节点代表一个颜色立方体。从叶节点开始合并，直到叶节点数量等于所需颜色数。

**优点**:
- 单次扫描完成量化，非常高效
- 内存占用稳定
- 对大量颜色减少效果好
- 可以流式处理像素

**缺点**:
- 量化质量不稳定，取决于颜色分布
- 对感知均匀性不敏感
- 某些实现可能引入明显色带
- 颜色数很少时（<32）效果明显下降

**性能数据** (Leptonica库测试，100万像素图像):
| 方法 | 时间(无dither) | 时间(有dither) |
|------|--------------|--------------|
| 八叉树4层 | 0.03s | 0.08s |
| 中位切分 | 较慢 | 较慢 |

#### 2.1.4 SLIC 超像素 + 聚类 (高级方案)

**原理**: 先将图像分割为超像素区域（每个区域内的像素颜色和位置相近），再对每个超像素区域进行颜色量化。

**优点**:
- 超像素天然保持边缘，减少颜色溢出
- 每个超像素内部颜色一致，减少杂色
- 空间一致性极好
- 适合拼豆这种需要规整区域的场景

**缺点**:
- 计算量大，需要更多处理时间
- 参数调优较复杂
- 可能过度平滑细节

**关键参数**:
- `region_size`: 超像素平均尺寸（如10-20像素）
- `ruler`/`compactness`: 紧凑度，值越大超像素越规则（推荐10-20）

#### 2.1.5 综合对比

| 算法 | 速度 | 质量 | 边缘保持 | 实现复杂度 | 推荐场景 |
|------|------|------|---------|-----------|---------|
| k-means++ | ★★☆☆☆ | ★★★★★ | ★★★☆☆ | 低 | 高质量要求 |
| 中位切分 | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | 中 | 快速预览 |
| 八叉树 | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | 高 | 超大数据量 |
| SLIC+聚类 | ★★☆☆☆ | ★★★★★ | ★★★★★ | 高 | 最佳效果 |

### 2.2 推荐方案

**主推荐: k-means++ 在 Lab 颜色空间**

理由:
1. 拼豆场景颜色数少（20-50色），k-means在这个范围内效果最好
2. 结合k-means++初始化，迭代10-20次即可收敛，速度可接受
3. 在Lab空间进行聚类更符合人眼感知
4. OpenCV有成熟实现，稳定可靠

**快速预览备选: 中位切分法**

理由:
1. 实时预览场景需要毫秒级响应
2. 中位切分法速度快3-5倍
3. 可以先给用户快速预览，后台再用k-means生成最终版

**最佳效果备选: SLIC超像素 + k-means 两级量化**

理由:
1. SLIC预处理能保持边缘，减少后续量化产生的杂色
2. 适合对质量要求极高的场景
3. 可以作为"高级模式"提供

### 2.3 实现思路与伪代码

#### 方案一: 标准 k-means 量化 (推荐)

```
输入: 原始图像 img (H x W x 3), 目标颜色数 k (默认32)
输出: 量化后图像, 调色板

1. 图像预处理
   - img_resized = resize(img, target_size)  // 先缩放到目标拼豆尺寸
   - img_filtered = bilateralFilter(img_resized)  // 边缘保留降噪

2. 转换到Lab颜色空间
   - img_lab = cvtColor(img_filtered, BGR2Lab)

3. k-means聚类
   - data = reshape(img_lab, (-1, 3))  // 展平为N x 3
   - criteria = (EPS + MAX_ITER, max_iter=20, epsilon=1.0)
   - _, labels, centers = kmeans(data, k, None, criteria, 10, KMEANS_PP_CENTERS)

4. 映射回RGB
   - quantized_lab = centers[labels].reshape(img_lab.shape)
   - quantized_rgb = cvtColor(quantized_lab, Lab2BGR)

5. 拼豆色号匹配
   - 对每个聚类中心颜色，在拼豆色号表中查找Lab空间最近的颜色
   - 替换为拼豆实际颜色
```

#### 方案二: 快速中位切分 (预览模式)

```
输入: 原始图像 img, 目标颜色数 k
输出: 量化后图像, 调色板

1. 图像预处理 (同方案一，但可省略双边滤波以加快速度)

2. 缩小采样 (可选)
   - img_small = resize(img, (img.width//4, img.height//4))

3. 中位切分
   - pixels = 提取所有像素
   - boxes = median_split(pixels, depth=log2(k))
   - palette = [mean(box) for box in boxes]

4. 最近邻映射
   - 对每个像素，找到palette中最近的颜色
```

#### 方案三: SLIC + 聚类 (高级模式)

```
输入: 原始图像 img, 目标颜色数 k, 目标尺寸 (如 48x48)
输出: 量化后图像, 调色板

1. 缩放图像到目标尺寸 x 2 (留有余量)
   - img_scaled = resize(img, (96, 96), interpolation=INTER_LINEAR)

2. SLIC超像素分割
   - slic = createSuperpixelSLIC(img_scaled, SLICO, region_size=8)
   - slic.iterate(10)
   - labels = slic.getLabels()  // 每个像素的超像素标签

3. 对每个超像素区域取平均色
   - superpixel_colors = [mean(pixels in superpixel_i) for each i]

4. 对超像素平均色进行k-means聚类到k色
   - _, sp_labels, centers = kmeans(superpixel_colors, k, ...)

5. 将每个超像素映射到最近的聚类中心
   - quantized = centers[sp_labels[labels]]

6. 再缩放到目标尺寸
   - result = resize(quantized, (48, 48), interpolation=INTER_NEAREST)
```

---

## 3. 图像预处理流程

### 3.1 降噪

拼豆图纸生成中的降噪至关重要——照片类图片往往有大量噪点，这些噪点在颜色量化后会变成大量杂散色块。

#### 3.1.1 双边滤波 (Bilateral Filter) — 首选

双边滤波是拼豆场景的首选降噪方法，因为它**保留边缘的同时平滑颜色区域**——这正是拼豆需要的特性。

**原理**: 双边滤波同时使用空间距离和颜色距离两个权重，只有空间上接近且颜色相似的像素才会被混合。因此边缘（两侧颜色差异大）不会被模糊，而平坦区域的噪点会被平滑。

**OpenCV参数**:
```python
cv2.bilateralFilter(src, d, sigmaColor, sigmaSpace)
```

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `d` | 5-9 | 滤波直径，越大越平滑但越慢 |
| `sigmaColor` | 50-100 | 颜色空间sigma，越大颜色混合范围越大 |
| `sigmaSpace` | 50-100 | 空间sigma，越大平滑范围越大 |

**拼豆场景推荐**: `bilateralFilter(img, d=7, sigmaColor=75, sigmaSpace=75)`

**优点**:
- 完美保留边缘轮廓
- 平滑同色区域的噪点
- 不会产生新的颜色

**缺点**:
- 计算较慢（比其他滤波慢3-10倍）
- 参数需要根据图片调整

#### 3.1.2 中值滤波 (Median Filter) — 辅助

中值滤波对**椒盐噪声**特别有效，可以快速去除孤立的异常像素。

```python
cv2.medianBlur(src, ksize=5)  # ksize必须是奇数
```

**使用场景**: 在双边滤波之前作为预处理步骤，去除极端噪点。

#### 3.1.3 高斯滤波 (Gaussian Filter) — 不推荐单独使用

高斯滤波虽然速度快，但会模糊边缘，不适合拼豆场景。可以作为其他算法的前置步骤。

#### 3.1.4 非局部均值滤波 (Non-Local Means) — 高质量备选

```python
cv2.fastNlMeansDenoisingColored(src, None, h=10, hColor=10, templateWindowSize=7, searchWindowSize=21)
```

**优点**: 去噪效果极佳，保持纹理  
**缺点**: 计算量极大，不适合浏览器实时处理

#### 3.1.5 预处理流程推荐

```
原始图像
    │
    ▼
┌─────────────────┐
│ 1. 中值滤波(3x3) │  ← 去除极端噪点 (可选，对干净图片可跳过)
│ medianBlur      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 2. 双边滤波      │  ← 主要降噪步骤，保留边缘
│ bilateralFilter │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 3. 轻微对比度增强 │  ← 增强颜色区分度 (可选)
│ CLAHE或简单直方图 │
└─────────────────┘
```

### 3.2 缩放

拼豆图纸需要精确控制输出尺寸（如29x29、48x48、58x58等），缩放是关键步骤。

#### 3.2.1 缩放时机选择

**推荐策略: 先降噪 → 再缩放 → 后量化**

理由:
1. 在原图上降噪效果更好（更多信息可用）
2. 缩小后再量化可以减少颜色数需求
3. 避免先量化后缩放引入中间色

#### 3.2.2 插值方法选择

| 方法 | 适用场景 | 效果 | 速度 |
|------|---------|------|------|
| **INTER_NEAREST** | **拼豆最终输出** | **硬边缘，无混色** | **最快** |
| INTER_LINEAR | 预览/预处理 | 平滑，可能引入新颜色 | 中等 |
| INTER_AREA | 缩小 | 面积平均，抗锯齿 | 中等 |
| INTER_CUBIC | 放大 | 更平滑但可能模糊 | 慢 |

**拼豆场景策略**:
- **预处理缩放**（大图缩小到中等尺寸）: 使用 `INTER_AREA` 或 `INTER_LINEAR`
- **最终缩放**（到目标拼豆尺寸）: 使用 `INTER_NEAREST` 保持硬边缘

```python
# 第一步: 原图缩小到中等尺寸 (降噪后)
step1 = cv2.resize(img, (medium_w, medium_h), interpolation=cv2.INTER_AREA)

# 第二步: 量化后缩小到目标拼豆尺寸
step2 = cv2.resize(quantized, (target_w, target_h), interpolation=cv2.INTER_NEAREST)
```

#### 3.2.3 宽高比处理

```python
def resize_to_fit(img, target_w, target_h):
    """保持宽高比缩放，居中填充或裁剪"""
    h, w = img.shape[:2]
    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # 创建目标画布，居中放置
    result = np.full((target_h, target_w, 3), 255, dtype=np.uint8)  # 白色背景
    y_off = (target_h - new_h) // 2
    x_off = (target_w - new_w) // 2
    result[y_off:y_off+new_h, x_off:x_off+new_w] = resized
    return result
```

### 3.3 对比度增强

#### 3.3.1 CLAHE (限制对比度自适应直方图均衡化)

```python
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
l, a, b = cv2.split(lab)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
l_clahe = clahe.apply(l)
lab_clahe = cv2.merge([l_clahe, a, b])
result = cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)
```

**注意事项**: 
- CLAHE可能增强噪点，建议在CLAHE之后再做双边滤波
- clipLimit不宜过大（1.0-3.0），否则会过度增强

#### 3.3.2 简单色彩饱和度增强

```python
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
h, s, v = cv2.split(hsv)
s = np.clip(s * 1.2, 0, 255).astype(np.uint8)  # 增加20%饱和度
hsv_enhanced = cv2.merge([h, s, v])
result = cv2.cvtColor(hsv_enhanced, cv2.COLOR_HSV2BGR)
```

---

## 4. 颜色匹配策略

### 4.1 颜色空间选择

#### 4.1.1 为什么选 Lab 空间？

CIELAB (Lab) 颜色空间是专门设计的**感知均匀颜色空间**，其关键特性：

| 特性 | RGB | Lab | HSV |
|------|-----|-----|-----|
| 感知均匀性 | 否 | **是** | 否 |
| 亮度分离 | 否 | **是(L通道)** | 部分(V通道) |
| 设备无关 | 否 | **是** | 否 |
| 色差计算 | 不直观 | **有标准公式** | 不直观 |

**Lab空间分量**:
- **L***: 明度 (0=黑, 100=白)
- **a***: 红绿轴 (-128=绿, +127=红)
- **b***: 黄蓝轴 (-128=蓝, +127=黄)

在Lab空间中，两个颜色的欧氏距离与人眼感知差异高度相关，这使得颜色匹配更加准确。

#### 4.1.2 拼豆颜色匹配流程

```
拼豆色号表 (RGB格式)
    │
    ▼
┌─────────────────┐
│ 预转换为Lab格式  │  ← 一次性预处理，存储Lab值
└─────────────────┘
    │
    ▼
图像聚类中心 (Lab格式)
    │
    ▼
┌─────────────────┐
│ 在Lab空间计算   │
│ 与每个色号距离  │
└─────────────────┘
    │
    ▼
选择距离最小的色号作为匹配结果
```

### 4.2 色差计算

#### 4.2.1 Delta E 公式对比

Delta E 是衡量两个颜色差异的标准指标。

**CIE76 (Delta E 1976)**:
```
Delta E = sqrt((L2-L1)^2 + (a2-a1)^2 + (b2-b1)^2)
```
- 优点: 计算简单快速
- 缺点: 在蓝色区域和高饱和度区域不准确
- **适用: 拼豆场景够用，推荐**

**CIE94**:
```
Delta E94 = sqrt((dL/Kl)^2 + (dC/(1+Kc))^2 + (dH/(1+Kh))^2)
```
- 考虑了亮度、色度和色相的不同权重
- 更准确但计算更复杂

**CIEDE2000 (Delta E 2000)**:
- 最准确的色差公式
- 考虑了人眼对不同色相差异的敏感性不同
- 计算最复杂（有权重函数、旋转项等）
- **适用: 如果性能允许，追求最高精度**

#### 4.2.2 拼豆场景推荐

| 场景 | 推荐公式 | 理由 |
|------|---------|------|
| 浏览器实时匹配 | CIE76 | 速度快，差异可接受 |
| 最终输出 | CIEDE2000 | 最准确的颜色匹配 |
| 快速预览 | CIE76 | 速度优先 |

**Python实现**:
```python
import numpy as np

def delta_e_cie76(lab1, lab2):
    """CIE76 Delta E - 简单快速"""
    return np.sqrt(np.sum((lab1 - lab2) ** 2))

def delta_e_ciede2000(lab1, lab2):
    """CIEDE2000 - 最精确但计算复杂"""
    # 此处省略完整实现，建议使用colormath库
    from colormath.color_objects import LabColor
    from colormath.color_diff import delta_e_cie2000
    c1 = LabColor(lab1[0], lab1[1], lab1[2])
    c2 = LabColor(lab2[0], lab2[1], lab2[2])
    return delta_e_cie2000(c1, c2)

def find_nearest_bead_color(lab_color, bead_palette_lab):
    """在拼豆色号表中找到最近的颜色"""
    distances = [delta_e_cie76(lab_color, bead_lab) for bead_lab in bead_palette_lab]
    return np.argmin(distances)
```

### 4.3 色号映射流程

完整色号映射包括以下步骤：

```python
def map_to_bead_colors(image, bead_palette_rgb, method='cie76'):
    """
    将图像颜色映射到拼豆色号
    
    参数:
        image: 输入图像 (BGR格式)
        bead_palette_rgb: 拼豆色号表 RGB颜色列表 [(r,g,b), ...]
        method: 色差计算方法
    
    返回:
        mapped_image: 映射后的图像
        color_counts: 每种色号的使用数量
    """
    # 1. 转换图像和色号表到Lab
    image_lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    bead_palette_lab = [rgb_to_lab(c) for c in bead_palette_rgb]
    
    # 2. 对每个像素找到最近的色号
    h, w = image_lab.shape[:2]
    mapped = np.zeros_like(image)
    color_counts = {}
    
    for y in range(h):
        for x in range(w):
            pixel_lab = image_lab[y, x]
            idx = find_nearest_bead_color(pixel_lab, bead_palette_lab)
            mapped[y, x] = bead_palette_rgb[idx]
            color_counts[idx] = color_counts.get(idx, 0) + 1
    
    return mapped, color_counts
```

**优化**: 使用NumPy矢量化操作替代逐像素循环，可以加速10-100倍：

```python
def map_to_bead_colors_fast(image_lab, bead_palette_lab):
    """矢量化版本 - 大幅提升速度"""
    # 将色号表转换为numpy数组
    palette = np.array(bead_palette_lab)  # shape: (N, 3)
    
    # 计算每个像素与每个色号的距离
    # image_lab: (H, W, 3) -> (H*W, 3)
    pixels = image_lab.reshape(-1, 3)  # (H*W, 3)
    
    # 计算距离矩阵: (H*W, N)
    distances = np.linalg.norm(pixels[:, None, :] - palette[None, :, :], axis=2)
    
    # 找到每个像素最近的色号
    nearest = np.argmin(distances, axis=1)
    
    return nearest.reshape(image_lab.shape[:2])
```

---

## 5. 杂色过滤与清理

杂色（speckle noise 或 salt-and-pepper noise）是拼豆图纸中最需要处理的问题。颜色量化后经常会产生大量孤立像素点或小块区域，这些在拼豆制作中很难处理。

### 5.1 面积阈值过滤

面积阈值过滤是最有效的杂色去除方法——移除面积小于阈值的连通区域。

#### 5.1.1 连通区域分析 (Connected Component Analysis)

```python
import cv2
import numpy as np

def remove_small_regions(image, min_area=5):
    """
    移除小于min_area像素的连通区域
    
    参数:
        image: 量化后的图像
        min_area: 最小面积阈值（像素数）
    
    返回:
        清理后的图像
    """
    h, w = image.shape[:2]
    output = image.copy()
    
    # 对每个颜色通道分别处理（或转换为整数标签图后统一处理）
    # 方法：将颜色编码为整数
    flat = image.reshape(-1, 3)
    # 找到所有唯一颜色
    unique_colors = np.unique(flat, axis=0)
    
    # 创建颜色 -> 标签的映射
    color_to_label = {tuple(c): i for i, c in enumerate(unique_colors)}
    label_to_color = {i: c for c, i in color_to_label.items()}
    
    # 创建标签图
    labels = np.array([color_to_label[tuple(c)] for c in flat]).reshape(h, w)
    
    # 对每个颜色进行连通区域分析
    for color_label, color_rgb in label_to_color.items():
        # 二值化：当前颜色的mask
        mask = (labels == color_label).astype(np.uint8) * 255
        
        # 连通区域分析
        num_labels, label_im, stats, centroids = cv2.connectedComponentsWithStats(
            mask, connectivity=8
        )
        
        # 移除小区域 (跳过背景标签0)
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area < min_area:
                # 将该区域设为特殊标记（稍后处理）
                output[label_im == i] = [255, 0, 255]  # 标记色（品红）
    
    # 处理被标记的像素：用周围像素的颜色填充
    mask_to_fill = (output == [255, 0, 255]).all(axis=2)
    # 使用中值或最邻近颜色替换
    output = fill_removed_pixels(output, mask_to_fill)
    
    return output
```

#### 5.1.2 推荐的面积阈值

| 图纸尺寸 | 最小面积阈值 | 说明 |
|---------|------------|------|
| 29x29 (小) | 2-3 | 允许2-3像素的小块 |
| 48x48 (中) | 4-6 | 过滤小于4像素的杂色 |
| 58x58 (大) | 5-8 | 过滤更小的碎片 |
| 100x100+ | 8-15 | 大图纸可以容忍更大的过滤 |

### 5.2 形态学操作

形态学操作是另一种有效去除杂色的方法，特别适用于二值化后的操作。对于彩色图像，需要对每个颜色分别处理。

#### 5.2.1 开运算 (Opening) — 去噪首选

开运算是**先腐蚀后膨胀**，能去除小的噪点并保持大区域的形状。

```python
def morphological_cleanup(image, kernel_size=3, iterations=1):
    """
    对每个颜色层分别进行开运算
    """
    kernel = np.ones((kernel_size, kernel_size), np.uint8)
    output = np.zeros_like(image)
    
    # 获取所有唯一颜色
    unique = np.unique(image.reshape(-1, 3), axis=0)
    
    for color in unique:
        # 创建该颜色的mask
        mask = np.all(image == color, axis=2).astype(np.uint8) * 255
        # 开运算
        opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=iterations)
        # 将结果写入输出
        output[opened > 0] = color
    
    return output
```

#### 5.2.2 闭运算 (Closing) — 填洞

闭运算是**先膨胀后腐蚀**，用于填充颜色区域内的小洞。

```python
# 对每个颜色层分别进行闭运算
closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
```

#### 5.2.3 形态学梯度

可以用来提取边界，用于后续的边界清理。

### 5.3 颜色合并策略

即使经过量化，最终使用的颜色数可能仍然超出用户拥有的色号范围。颜色合并策略用于将用量少的颜色合并到相近的常用颜色。

#### 5.3.1 基于用量的颜色合并

```python
def merge_rare_colors(image, color_counts, bead_palette, min_count=10):
    """
    将使用次数少于min_count的颜色合并到最近的常用颜色
    
    参数:
        image: 当前量化图像
        color_counts: {color_index: count} 颜色使用次数
        bead_palette: 拼豆色号表
        min_count: 最小使用次数阈值
    
    返回:
        合并后的图像
    """
    output = image.copy()
    
    for color_idx, count in color_counts.items():
        if count < min_count:
            # 找到这个颜色
            color = bead_palette[color_idx]
            # 在色号表中找到距离最近的且用量足够的颜色
            nearest_idx = find_nearest_with_min_count(
                color, bead_palette, color_counts, min_count
            )
            # 替换
            mask = np.all(image == color, axis=2)
            output[mask] = bead_palette[nearest_idx]
    
    return output
```

#### 5.3.2 基于Delta E的颜色合并顺序

1. 计算所有颜色对之间的Delta E
2. 找出Delta E最小且用量少的颜色对
3. 将用量少的合并到用量多的
4. 重复直到颜色数达到目标

#### 5.3.3 颜色合并的完整流程

```
┌──────────────────┐
│ 1. 统计各颜色用量  │
│    (color_counts)  │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ 2. 按用量排序     │
│    (从少到多)     │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ 3. 对每对颜色计算 │
│    Delta E        │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ 4. 优先合并:      │
│    - Delta E最小  │
│    - 用量最少     │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ 5. 迭代直到       │
│    颜色数≤目标    │
└──────────────────┘
```

### 5.4 边缘清理

#### 5.4.1 边缘噪点检测

边缘区域的孤立像素最容易产生杂色。可以检测每个颜色的边缘像素并清理。

```python
def clean_edges(image):
    """清理每个颜色区域的边缘杂散像素"""
    unique = np.unique(image.reshape(-1, 3), axis=0)
    output = image.copy()
    
    for color in unique:
        mask = np.all(image == color, axis=2).astype(np.uint8) * 255
        # 找到轮廓
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 3:  # 极小的轮廓
                # 移除这个轮廓
                cv2.drawContours(output, [cnt], -1, (0,0,0), -1)
    
    return output
```

### 5.5 完整的杂色过滤Pipeline

```python
def clean_speckles(image, min_area=4, use_morphology=True, merge_rare=True):
    """
    完整的杂色过滤流程
    
    参数:
        image: 量化后的图像
        min_area: 最小连通区域面积
        use_morphology: 是否使用形态学操作
        merge_rare: 是否合并用量少的颜色
    
    返回:
        清理后的图像
    """
    result = image.copy()
    
    # Step 1: 面积阈值过滤
    if min_area > 1:
        result = remove_small_regions(result, min_area)
    
    # Step 2: 形态学开运算（去除更小的噪点）
    if use_morphology:
        result = morphological_cleanup(result, kernel_size=3, iterations=1)
    
    # Step 3: 边缘清理
    result = clean_edges(result)
    
    # Step 4: 合并用量少的颜色
    if merge_rare:
        # 统计用量
        unique, counts = np.unique(result.reshape(-1, 3), axis=0, return_counts=True)
        color_counts = {tuple(c): n for c, n in zip(unique, counts)}
        # 合并（需要色号表参数）
        # result = merge_rare_colors(result, color_counts, palette, min_count=5)
    
    return result
```

---

## 6. 完整处理流程图

### 6.1 从上传到图纸的完整Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                         阶段一：图像输入                              │
├──────────────────────────────────────────────────────────────────────┤
│  用户上传图片 (JPG/PNG)                                               │
│       │                                                               │
│       ▼                                                               │
│  ┌──────────────────┐                                                │
│  │ 图片验证         │  ← 格式检查、尺寸限制、文件大小                  │
│  │ (宽高比分析)      │                                                │
│  └──────────────────┘                                                │
│       │                                                               │
│       ▼                                                               │
│  用户设置目标参数：                                                     │
│    - 目标尺寸 (29x29 / 48x48 / 58x58 / 自定义)                        │
│    - 颜色数量上限 (16 / 24 / 32 / 48)                                 │
│    - 拼豆品牌 (Hama / Perler / Artkal / Nabbi)                        │
│    - 过滤强度 (轻/中/重)                                               │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         阶段二：预处理                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│  │ 1. 裁剪/缩放      │───▶│ 2. 降噪滤波       │───▶│ 3. 对比度增强     │ │
│  │                  │    │                  │    │                  │ │
│  │ - 保持宽高比     │    │ - 中值滤波(3x3)  │    │ - CLAHE (可选)   │ │
│  │ - 居中裁剪       │    │ - 双边滤波(7,75,75)│   │ - 饱和度增强     │ │
│  │ - INTER_AREA缩放 │    │ - 边缘保留        │    │ - 亮度均衡       │ │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         阶段三：颜色量化                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 转换到Lab颜色空间 (cv2.COLOR_BGR2Lab)                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ k-means++ 聚类                                                   │  │
│  │                                                                  │  │
│  │ 参数设置:                                                        │  │
│  │   K = 目标颜色数 + 20%冗余                                        │  │
│  │   max_iter = 20                                                   │  │
│  │   init = KMEANS_PP_CENTERS                                        │  │
│  │   attempts = 3 (取最优)                                           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 聚类中心 → 拼豆色号映射                                          │  │
│  │                                                                  │  │
│  │ 对每个聚类中心:                                                   │  │
│  │   1. 在Lab空间计算与所有色号的Delta E                             │  │
│  │   2. 选择Delta E最小的色号                                        │  │
│  │   3. 映射所有属于该聚类的像素到选定色号                            │  │
│  │   4. 记录色号使用次数                                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       阶段四：后处理清理                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│  │ 1. 面积阈值过滤   │───▶│ 2. 形态学操作     │───▶│ 3. 颜色合并       │ │
│  │                  │    │                  │    │                  │ │
│  │ - 连通区域分析   │    │ - 开运算去噪      │    │ - 合并用量<阈值   │ │
│  │ - 移除小区域     │    │ - 闭运算填洞      │    │   的颜色          │ │
│  │ - 用邻域色填充   │    │ - 边缘清理        │    │ - Delta E最近     │ │
│  │   移除区域       │    │                  │    │   的合并目标      │ │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘ │
│                                                                       │
│  ┌──────────────────┐                                                │
│  │ 4. 缩放到目标尺寸 │  ← INTER_NEAREST, 保持硬边缘                    │
│  └──────────────────┘                                                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        阶段五：图纸生成                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│  │ 1. 生成网格图     │    │ 2. 生成色号图例   │    │ 3. 输出图纸       │ │
│  │                  │    │                  │    │                  │ │
│  │ - 在图像上绘制    │    │ - 颜色样本方块   │    │ - PNG图像        │ │
│  │   网格线         │    │ - 色号标签       │    │ - 带打印尺寸     │ │
│  │ - 每个格子标注    │    │ - 使用数量       │    │ - 颜色图例       │ │
│  │   色号字母       │    │ - 百分比         │    │ - 珠数统计       │ │
│  │                  │    │                  │    │                  │ │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 关键参数汇总

| 参数 | 默认值 | 可调范围 | 说明 |
|------|--------|---------|------|
| 目标尺寸 | 48x48 | 10x10 ~ 200x200 | 拼豆板尺寸 |
| 最大颜色数 | 32 | 8 ~ 64 | 拼豆色号数上限 |
| 双边滤波d | 7 | 3 ~ 15 | 滤波直径 |
| 双边滤波sigmaColor | 75 | 30 ~ 150 | 颜色混合度 |
| 双边滤波sigmaSpace | 75 | 30 ~ 150 | 空间混合度 |
| k-means最大迭代 | 20 | 10 ~ 50 | 收敛条件 |
| 最小区域面积 | 4 | 1 ~ 20 | 杂色过滤强度 |
| 形态学核大小 | 3x3 | 3x3 ~ 5x5 | 开运算核 |
| Delta E公式 | CIEDE2000 | CIE76/CIEDE2000 | 色差计算方法 |

---

## 7. OpenCV.js 实现建议

### 7.1 OpenCV.js 功能支持度

OpenCV.js 是 OpenCV 的 WebAssembly 编译版本，大部分核心功能都可以使用。

#### 7.1.1 确认支持的函数

以下核心函数在 OpenCV.js 4.x 中均可用：

| 功能 | OpenCV.js支持 | API | 备注 |
|------|-------------|-----|------|
| 图像读写 | ✅ | `cv.imread`, `cv.imwrite` | 从Canvas读取 |
| 颜色空间转换 | ✅ | `cv.cvtColor` | BGR↔Lab, BGR↔HSV等 |
| k-means聚类 | ✅ | `cv.kmeans` | 含KMEANS_PP_CENTERS |
| 双边滤波 | ✅ | `cv.bilateralFilter` | 参数同C++ |
| 中值滤波 | ✅ | `cv.medianBlur` | 支持 |
| 高斯滤波 | ✅ | `cv.GaussianBlur` | 支持 |
| 图像缩放 | ✅ | `cv.resize` | 含INTER_NEAREST |
| 形态学操作 | ✅ | `cv.morphologyEx` | MORPH_OPEN/CLOSE |
| 连通区域分析 | ✅ | `cv.connectedComponentsWithStats` | 支持 |
| 直方图均衡 | ✅ | `cv.equalizeHist`, `cv.createCLAHE` | 支持 |
| Mat操作 | ✅ | `cv.Mat`, `cv.matFromArray` | 核心数据结构 |

#### 7.1.2 需要注意的限制

1. **SLIC超像素**: OpenCV.js 的 `ximgproc` 模块通常不包含在内，SLIC可能需要额外编译或自行实现简化版
2. **性能**: WebAssembly 比原生C++慢2-5倍，但仍比纯JavaScript快很多
3. **内存**: 大图可能触发浏览器内存限制，建议限制输入图片最大尺寸（如2000x2000）
4. **线程**: WebAssembly目前不支持多线程（或有限支持），k-means只能单线程运行

### 7.2 性能优化建议

#### 7.2.1 针对浏览器环境的优化

1. **图片尺寸限制**
   ```javascript
   const MAX_SIZE = 1024; // 最大1024x1024输入
   function limitImageSize(img) {
       const maxDim = Math.max(img.cols, img.rows);
       if (maxDim > MAX_SIZE) {
           const scale = MAX_SIZE / maxDim;
           const newSize = new cv.Size(img.cols * scale, img.rows * scale);
           cv.resize(img, dst, newSize, 0, 0, cv.INTER_AREA);
           return dst;
       }
       return img;
   }
   ```

2. **采样加速k-means**
   ```javascript
   // 不处理全部像素，随机采样10%
   const sampleSize = Math.floor(totalPixels * 0.1);
   const sampleData = new cv.Mat(sampleSize, 3, cv.CV_32F);
   // 随机填充sampleData...
   // 先用sampleData训练聚类中心
   // 再对所有像素做分类
   ```

3. **使用Web Worker**
   ```javascript
   // 图像处理放在Web Worker中，避免阻塞UI
   const worker = new Worker('opencv-worker.js');
   worker.postMessage({ imageData: data, params: {...} });
   worker.onmessage = (e) => {
       displayResult(e.data.result);
   };
   ```

4. **分阶段处理**
   - 第一阶段: 快速预览（中位切分法，<200ms）
   - 第二阶段: 后台生成高质量版本（k-means，1-3s）

5. **缓存Lab转换后的色号表**
   - 拼豆色号表的Lab转换是一次性的，可以缓存

### 7.3 替代方案：纯Canvas API实现

如果OpenCV.js文件过大或加载太慢，可以考虑**纯Canvas API + JavaScript**的混合方案：

#### 7.3.1 Canvas API可实现的功能

| 功能 | Canvas API | 复杂度 |
|------|-----------|--------|
| 图像缩放 | `drawImage` + `imageSmoothingEnabled` | 简单 |
| 像素操作 | `getImageData` / `putImageData` | 简单 |
| 中值滤波 | 手动实现 | 中等 |
| 高斯滤波 | 手动实现卷积核 | 中等 |
| k-means聚类 | 纯JS实现 | 中等 |
| 颜色空间转换 | 手动RGB↔Lab公式 | 中等 |
| 连通区域分析 | 并查集实现 | 中等 |
| 双边滤波 | 手动实现（较慢） | 高 |

#### 7.3.2 混合方案推荐

```
方案A: OpenCV.js (推荐)
├── 优点: 功能完整，速度快，算法成熟
├── 缺点: WASM文件较大 (~8MB)，首次加载慢
└── 适用: 桌面端，对效果要求高的场景

方案B: 纯Canvas API
├── 优点: 零依赖，加载快
├── 缺点: 实现复杂，性能较低，部分算法效果差
└── 适用: 移动端，简单预览功能

方案C: 服务端处理 (备选)
├── 优点: 不受浏览器限制，可用Python全功能OpenCV
├── 缺点: 需要服务器，有网络延迟
└── 适用: 批量处理，超高质量需求
```

### 7.4 OpenCV.js 核心代码示例

```javascript
// ========== OpenCV.js 拼豆转换示例 ==========

function convertToBeadPattern(imageSrc, targetSize, maxColors) {
    // 1. 读取图像
    let src = cv.imread(imageSrc);
    
    // 2. 限制输入尺寸
    src = limitImageSize(src);
    
    // 3. 降噪 - 双边滤波
    let filtered = new cv.Mat();
    cv.bilateralFilter(src, filtered, 7, 75, 75, cv.BORDER_DEFAULT);
    
    // 4. 转换到Lab空间
    let lab = new cv.Mat();
    cv.cvtColor(filtered, lab, cv.COLOR_BGR2Lab);
    
    // 5. 准备k-means数据
    let data = lab.reshape(1, lab.cols * lab.rows);
    let data32f = new cv.Mat();
    data.convertTo(data32f, cv.CV_32F, 1.0 / 255.0);
    
    // 6. k-means聚类
    let labels = new cv.Mat();
    let centers = new cv.Mat();
    let criteria = new cv.TermCriteria(
        cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 
        20, 0.0001
    );
    cv.kmeans(data32f, maxColors, labels, criteria, 10, 
              cv.KMEANS_PP_CENTERS, centers);
    
    // 7. 构建量化图像
    let quantized = new cv.Mat(src.rows, src.cols, cv.CV_8UC3);
    // ... 根据labels和centers构建图像 ...
    
    // 8. 色号匹配（在Lab空间的Delta E计算）
    // ... 对每个center找到最近的拼豆色号 ...
    
    // 9. 杂色过滤
    // ... 连通区域分析 + 面积阈值 ...
    
    // 10. 缩放到目标尺寸
    let result = new cv.Mat();
    let dsize = new cv.Size(targetSize.width, targetSize.height);
    cv.resize(quantized, result, dsize, 0, 0, cv.INTER_NEAREST);
    
    // 11. 显示结果
    cv.imshow('outputCanvas', result);
    
    // 12. 释放内存
    src.delete(); filtered.delete(); lab.delete();
    data.delete(); data32f.delete(); labels.delete();
    centers.delete(); quantized.delete(); result.delete();
}
```

---

## 8. 性能优化建议

### 8.1 全流程性能优化

| 优化点 | 方法 | 预期加速 |
|--------|------|---------|
| k-means采样 | 只处理10%像素训练中心 | 5-10x |
| 降低迭代次数 | max_iter=10 | 2x |
| 输入尺寸限制 | 最大1024x1024 | 4x+ |
| Web Worker | 非阻塞处理 | UI不卡顿 |
| 渐进式处理 | 先快速预览再精细处理 | 感知速度提升 |
| 缓存色号Lab值 | 预计算拼豆色号Lab | 省略重复转换 |

### 8.2 各步骤预期耗时 (以48x48图纸为例)

| 步骤 | OpenCV Python | OpenCV.js | 优化后js |
|------|-------------|-----------|---------|
| 图像加载 | <10ms | <50ms | <50ms |
| 双边滤波 | 50ms | 200-500ms | 200-500ms |
| Lab转换 | <5ms | <20ms | <20ms |
| k-means聚类 | 200-500ms | 1000-3000ms | 200-500ms* |
| 色号匹配 | <10ms | <50ms | <30ms |
| 杂色过滤 | 50ms | 200-400ms | 200-400ms |
| 最终缩放 | <5ms | <20ms | <20ms |
| **总计** | **~400ms** | **~2000ms** | **~800ms** |

*注: k-means通过10%采样优化后可大幅降低*

### 8.3 用户体验优化

1. **渐进式加载**
   - 0-200ms: 显示原图缩略图
   - 200-500ms: 显示快速预览（中位切分法）
   - 500ms+: 替换为高质量版本

2. **实时参数调整**
   - 滑块调整颜色数、过滤强度时实时更新
   - 使用debounce避免频繁重算

3. **预览对比**
   - 左右滑块对比原图和效果图
   - 支持放大查看细节

---

## 附录 A: 推荐技术栈总结

### 最终推荐方案

```
前端框架: 任意 (React/Vue/Vanilla JS)
图像处理: OpenCV.js 4.x + Canvas API (混合使用)
颜色量化: k-means++ (Lab空间, 10%采样加速)
色差计算: CIEDE2000 (最终输出), CIE76 (快速预览)
降噪: 双边滤波 (d=7, sigmaColor=75, sigmaSpace=75)
缩放: 预处理INTER_AREA → 最终INTER_NEAREST
杂色过滤: 连通区域分析(面积阈值=4) + 形态学开运算
色号匹配: Lab空间最近邻
```

### 代码依赖

```
必需: opencv.js (WASM, ~8MB gzip后~2MB)
可选: colormath.js (CIEDE2000计算)
可选: jsPDF (PDF输出)
可选: html2canvas (截图下载)
```

### 关键指标目标

| 指标 | 目标值 |
|------|--------|
| 首次有意义渲染 | < 300ms |
| 完整处理时间 | < 2s (48x48图纸) |
| 颜色匹配精度 | Delta E < 3 (人眼不可辨) |
| 输出图纸DPI | 适合打印 (300 DPI) |
| 最大输入图片 | 2000x2000px |
| 支持最大尺寸 | 200x200 拼豆板 |
