/**
 * Main image processing pipeline:
 * Resize → Denoise → Quantize → Color Match → De-noise → Merge rare colors
 */

import type { ProcessOptions, ProcessResult, ColorStat, BeadColor } from './types';
import { rgbToLab, deltaE76Squared, deltaE2000, findClosestColor } from './color-space';
import { bilateralFilter, removeSmallRegions, mergeRareColors, detectBackground } from './filters';
import { getBrandColors, getCommonColors } from './database';

// ============================================================================
// K-Means++ Clustering
// ============================================================================

function kmeansPlusPlus(samples: [number, number, number][], k: number): [number, number, number][] {
  const n = samples.length;
  const centers: [number, number, number][] = [];
  const used = new Set<number>();

  // First center: random
  const firstIdx = Math.floor(Math.random() * n);
  centers.push([...samples[firstIdx]]);
  used.add(firstIdx);

  // Remaining centers
  for (let i = 1; i < k; i++) {
    // Calculate squared distances to nearest center for each sample
    const distances: number[] = [];
    for (let j = 0; j < n; j++) {
      let minDist = Infinity;
      for (const center of centers) {
        const d = deltaE76Squared(samples[j], center);
        if (d < minDist) minDist = d;
      }
      distances.push(minDist);
    }

    // Probability proportional to distance squared
    const totalDist = distances.reduce((a, b) => a + b, 0);
    if (totalDist === 0) {
      // All samples are the same, pick randomly
      let idx = Math.floor(Math.random() * n);
      while (used.has(idx)) idx = (idx + 1) % n;
      centers.push([...samples[idx]]);
      used.add(idx);
      continue;
    }

    let target = Math.random() * totalDist;
    let cumsum = 0;
    let chosenIdx = 0;
    for (let j = 0; j < n; j++) {
      cumsum += distances[j];
      if (cumsum >= target) {
        chosenIdx = j;
        break;
      }
    }

    if (used.has(chosenIdx)) {
      // Fallback: find first unused
      for (let j = 0; j < n; j++) {
        if (!used.has(j)) {
          chosenIdx = j;
          break;
        }
      }
    }

    centers.push([...samples[chosenIdx]]);
    used.add(chosenIdx);
  }

  return centers;
}

interface KMeansResult {
  labels: number[];
  centers: [number, number, number][];
}

function kmeans(
  samples: [number, number, number][],
  k: number,
  maxIter = 15
): KMeansResult {
  const centers = kmeansPlusPlus(samples, k);
  const n = samples.length;
  const labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assignment step
    let changed = false;
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let j = 0; j < k; j++) {
        const d = deltaE76Squared(samples[i], centers[j]);
        if (d < minDist) {
          minDist = d;
          bestCluster = j;
        }
      }
      if (labels[i] !== bestCluster) changed = true;
      labels[i] = bestCluster;
    }

    if (!changed) break;

    // Update step: recompute centers
    const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);

    for (let i = 0; i < n; i++) {
      const cluster = labels[i];
      sums[cluster][0] += samples[i][0];
      sums[cluster][1] += samples[i][1];
      sums[cluster][2] += samples[i][2];
      counts[cluster]++;
    }

    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        centers[j][0] = sums[j][0] / counts[j];
        centers[j][1] = sums[j][1] / counts[j];
        centers[j][2] = sums[j][2] / counts[j];
      }
    }
  }

  return { labels, centers };
}

// ============================================================================
// Background Removal Helpers
// ============================================================================

function removeBackground(
  imageData: ImageData,
  grid: number[][],
  _brandPalette: BeadColor[]
): { processedGrid: number[][]; bgRemoved: boolean } {
  const bgMask = detectBackground(imageData);
  const h = grid.length;
  const w = grid[0].length;

  // If background mask is small, probably not a clean background
  let bgCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (bgMask[y][x] < 0) bgCount++;
    }
  }

  if (bgCount < h * w * 0.1) {
    return { processedGrid: grid, bgRemoved: false };
  }

  // For each background pixel, set to -1 in grid
  const result: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      if (bgMask[y][x] < 0) {
        row.push(-1); // Transparent
      } else {
        row.push(grid[y][x]);
      }
    }
    result.push(row);
  }

  return { processedGrid: result, bgRemoved: true };
}

// ============================================================================
// Main Pipeline
// ============================================================================

export async function processImage(
  image: HTMLImageElement,
  options: ProcessOptions
): Promise<ProcessResult> {
  const { targetWidth, targetHeight, maxColors, brand, denoiseStrength, noiseFilter, removeBackground: doRemoveBg, useCommonColors } = options;

  return new Promise((resolve, reject) => {
    try {
      // Step 1: Create canvas and resize image
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      // Use INTER_AREA-like downsampling (bilinear is Canvas default)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

      // Step 2: Bilateral filter denoising
      if (denoiseStrength > 0) {
        const sigmaSpace = 1 + denoiseStrength;
        const sigmaColor = 20 + denoiseStrength * 15;
        imageData = bilateralFilter(imageData, sigmaColor, sigmaSpace);
      }

      // Step 3: Convert to Lab and collect samples
      const { data, width, height } = imageData;
      const totalPixels = width * height;

      // Collect all pixels with their Lab values
      const allLabs: [number, number, number][] = [];
      const allPixels: { r: number; g: number; b: number; a: number }[] = [];

      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Skip near-transparent pixels
        if (a < 128) {
          allLabs.push([0, 0, 0]); // placeholder
          allPixels.push({ r, g, b, a });
          continue;
        }

        const lab = rgbToLab(r, g, b);
        allLabs.push(lab);
        allPixels.push({ r, g, b, a });
      }

      // Step 4: Sample for k-means (max 5000 samples for performance)
      const sampleIndices: number[] = [];
      const maxSamples = Math.min(5000, totalPixels);
      if (totalPixels <= maxSamples) {
        for (let i = 0; i < totalPixels; i++) sampleIndices.push(i);
      } else {
        // Stratified sampling
        const step = totalPixels / maxSamples;
        for (let i = 0; i < maxSamples; i++) {
          sampleIndices.push(Math.floor(i * step));
        }
      }

      const samples: [number, number, number][] = sampleIndices
        .map((i) => allLabs[i])
        .filter((lab) => lab[0] > 0 || allPixels[sampleIndices[samples.length]].a >= 128);

      // Step 5: K-means++ clustering
      const k = Math.min(maxColors, samples.length);
      const kmeansResult = kmeans(samples, k, 15);

      // Step 6: Match cluster centers to brand colors
      const brandPalette = getBrandColors(brand);
      const commonPalette = getCommonColors();
      const colorMap: BeadColor[] = [];
      const centerToBrandIdx: number[] = [];

      for (const center of kmeansResult.centers) {
        let bestIdx: number;
        if (useCommonColors) {
          // First try common colors
          let bestCommonIdx = findClosestColor(center, commonPalette);
          let commonDist = deltaE2000(center, rgbToLab(commonPalette[bestCommonIdx].rgb[0], commonPalette[bestCommonIdx].rgb[1], commonPalette[bestCommonIdx].rgb[2]));

          // Then try brand colors
          let bestBrandIdx = findClosestColor(center, brandPalette);
          let brandDist = deltaE2000(center, rgbToLab(brandPalette[bestBrandIdx].rgb[0], brandPalette[bestBrandIdx].rgb[1], brandPalette[bestBrandIdx].rgb[2]));

          // If common color is close enough, prefer it (within 5 deltaE)
          if (commonDist <= brandDist + 5) {
            bestIdx = bestCommonIdx;
            const commonColor = commonPalette[bestIdx];
            // Map to brand equivalent if available
            const brandEquiv = brandPalette.findIndex(
              (b) => deltaE2000(rgbToLab(b.rgb[0], b.rgb[1], b.rgb[2]), rgbToLab(commonColor.rgb[0], commonColor.rgb[1], commonColor.rgb[2])) < 8
            );
            if (brandEquiv >= 0) bestIdx = brandEquiv;
            else bestIdx = bestBrandIdx;
          } else {
            bestIdx = bestBrandIdx;
          }
        } else {
          bestIdx = findClosestColor(center, brandPalette);
        }

        // Check if this brand color is already in colorMap
        const brandColor = brandPalette[bestIdx];
        const existingIdx = colorMap.findIndex((c) => c.hex === brandColor.hex);
        if (existingIdx >= 0) {
          centerToBrandIdx.push(existingIdx);
        } else {
          centerToBrandIdx.push(colorMap.length);
          colorMap.push({ ...brandColor });
        }
      }

      // Step 7: Assign each pixel to nearest cluster center, then map to brand color
      let grid: number[][] = [];
      for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
          const pixelIdx = y * width + x;
          if (allPixels[pixelIdx].a < 128) {
            row.push(-1); // Transparent
            continue;
          }

          // Find nearest cluster center
          let minDist = Infinity;
          let bestCluster = 0;
          for (let c = 0; c < kmeansResult.centers.length; c++) {
            const d = deltaE76Squared(allLabs[pixelIdx], kmeansResult.centers[c]);
            if (d < minDist) {
              minDist = d;
              bestCluster = c;
            }
          }

          row.push(centerToBrandIdx[bestCluster]);
        }
        grid.push(row);
      }

      // Step 8: Remove background if requested
      if (doRemoveBg) {
        const bgResult = removeBackground(imageData, grid, brandPalette);
        grid = bgResult.processedGrid;
      }

      // Step 9: Remove small isolated regions
      if (noiseFilter) {
        grid = removeSmallRegions(grid, 4);
      }

      // Step 10: Merge rare colors (below 1% of non-transparent pixels)
      if (useCommonColors) {
        let nonTransparentCount = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (grid[y][x] >= 0) nonTransparentCount++;
          }
        }
        const minCount = Math.max(1, Math.floor(nonTransparentCount * 0.01));
        const merged = mergeRareColors(grid, colorMap, minCount, commonPalette);
        grid = merged.grid;
        // Update colorMap with merged result (need to re-lookup brand colors)
        // colorMap stays as merged.colorMap
      }

      // Step 11: Recompact colorMap after all operations
      const usedIndices = new Set<number>();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[y][x] >= 0) usedIndices.add(grid[y][x]);
        }
      }

      // Get actual used colors
      const usedArray = Array.from(usedIndices).sort((a, b) => a - b);
      const finalColorMap = usedArray.map((oldIdx) => {
        // Find the color from brand palette
        return colorMap[oldIdx] || brandPalette[0];
      });

      // Remap grid indices
      const oldToNew = new Map<number, number>();
      usedArray.forEach((oldIdx, i) => oldToNew.set(oldIdx, i));
      const finalGrid = grid.map((row) =>
        row.map((idx) => {
          if (idx < 0) return -1;
          return oldToNew.get(idx) ?? idx;
        })
      );

      // Step 12: Compute statistics
      const stats: ColorStat[] = [];
      const finalCounts = new Array(finalColorMap.length).fill(0);
      let totalNonTransparent = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = finalGrid[y][x];
          if (idx >= 0) {
            finalCounts[idx]++;
            totalNonTransparent++;
          }
        }
      }

      for (let i = 0; i < finalColorMap.length; i++) {
        stats.push({
          colorIndex: i,
          count: finalCounts[i],
          percentage: totalNonTransparent > 0 ? (finalCounts[i] / totalNonTransparent) * 100 : 0,
        });
      }

      // Sort by count descending
      stats.sort((a, b) => b.count - a.count);

      resolve({
        grid: finalGrid,
        colorMap: finalColorMap,
        stats,
        width: targetWidth,
        height: targetHeight,
        originalImage: image.src,
      });
    } catch (error) {
      reject(error);
    }
  });
}
