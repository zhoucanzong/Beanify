/**
 * Main image processing pipeline
 *
 * Algorithm (improved):
 *   Resize → Denoise → Palette-guided k-means → Direct DeltaE 2000
 *   refinement → Background removal → Small region cleanup → Compact colors
 *
 * Key improvements over basic k-means:
 *   - Palette projection after each k-means iteration (centers are always
 *     valid palette colors, no two-step cluster→palette mismatch)
 *   - Weighted Lab distance emphasizing chromaticity (better for bead colors)
 *   - Direct DeltaE 2000 per-pixel refinement pass (catches edge cases
 *     where the weighted-Lab assignment was perceptually wrong)
 *   - Precomputed palette Lab values throughout (no redundant conversions)
 */

import type { ProcessOptions, ProcessResult, ColorStat, BeadColor } from './types';
import {
  rgbToLab,
  deltaE2000,
  deltaE76SquaredWeighted,
  precomputePaletteLabs,
  findClosestColorCached,
} from './color-space';
import { bilateralFilter, removeSmallRegions, detectBackground } from './filters';
import { getBrandColors, getCommonColors } from './database';

// ============================================================================
// Palette-Guided K-Means
// ============================================================================

/**
 * Initialize k-means centers by selecting palette colors that best represent
 * the image. Uses a fast histogram approach: for each non-transparent pixel,
 * find its nearest palette color; the most frequently matched palette colors
 * become the initial centers (capped at k).
 */
function initCentersFromPalette(
  pixelLabs: [number, number, number][],
  alpha: Uint8Array,
  paletteLabs: [number, number, number][],
  k: number
): number[] {
  const n = pixelLabs.length;
  const paletteSize = paletteLabs.length;

  const votes = new Int32Array(paletteSize);
  for (let i = 0; i < n; i++) {
    if (alpha[i] < 128) continue; // transparent — skip
    const px = pixelLabs[i];
    let minDist = Infinity;
    let best = 0;
    for (let j = 0; j < paletteSize; j++) {
      const d = deltaE2000(px, paletteLabs[j]);
      if (d < minDist) { minDist = d; best = j; }
    }
    votes[best]++;
  }

  // Sort palette indices by vote count descending
  const sorted = new Array(paletteSize);
  for (let i = 0; i < paletteSize; i++) sorted[i] = i;
  sorted.sort((a, b) => votes[b] - votes[a]);

  return sorted.slice(0, Math.min(k, paletteSize));
}

/**
 * Palette-guided k-means with projection step.
 *
 * Unlike standard k-means (cluster in Lab, then match to palette), this
 * version projects each cluster center to its nearest palette color after
 * every update. This ensures:
 *   1. Centers are always valid palette colors
 *   2. Clustering naturally respects the palette
 *   3. No separate cluster→palette matching step
 */
function paletteKMeans(
  pixelLabs: [number, number, number][],
  alpha: Uint8Array,
  paletteLabs: [number, number, number][],
  _paletteBrand: BeadColor[],
  k: number,
  maxIter = 15
): { labels: number[]; usedPaletteIndices: number[] } {
  const n = pixelLabs.length;

  // Select initial centers from palette colors based on image content
  const activePaletteIndices = initCentersFromPalette(pixelLabs, alpha, paletteLabs, k);
  const activeCount = activePaletteIndices.length;

  // Current centers (always palette Lab values after projection step)
  const centers: [number, number, number][] = activePaletteIndices.map(
    (idx) => [paletteLabs[idx][0], paletteLabs[idx][1], paletteLabs[idx][2]]
  );

  // Accumulators for update step
  const sumsL = new Float64Array(activeCount);
  const sumsA = new Float64Array(activeCount);
  const sumsB = new Float64Array(activeCount);
  const counts = new Int32Array(activeCount);
  const labels = new Int32Array(n);
  // Track which palette index each cluster corresponds to
  const clusterToPalIdx = [...activePaletteIndices];

  for (let iter = 0; iter < maxIter; iter++) {
    // ---- Assignment step ----
    sumsL.fill(0);
    sumsA.fill(0);
    sumsB.fill(0);
    counts.fill(0);

    let changed = false;
    for (let i = 0; i < n; i++) {
      if (alpha[i] < 128) { labels[i] = -1; continue; }

      const px = pixelLabs[i];
      let minDist = Infinity;
      let bestIdx = 0;
      for (let j = 0; j < activeCount; j++) {
        const d = deltaE76SquaredWeighted(px, centers[j]);
        if (d < minDist) { minDist = d; bestIdx = j; }
      }

      if (labels[i] !== bestIdx) { changed = true; labels[i] = bestIdx; }

      sumsL[bestIdx] += px[0];
      sumsA[bestIdx] += px[1];
      sumsB[bestIdx] += px[2];
      counts[bestIdx]++;
    }

    if (!changed) break;

    // ---- Update + Project step ----
    for (let j = 0; j < activeCount; j++) {
      if (counts[j] === 0) continue;

      const avgL = sumsL[j] / counts[j];
      const avgA = sumsA[j] / counts[j];
      const avgB = sumsB[j] / counts[j];

      // Project: find the nearest palette color to this average
      let minDist = Infinity;
      let bestPalIdx = clusterToPalIdx[j];
      for (let p = 0; p < paletteLabs.length; p++) {
        const d = deltaE2000([avgL, avgA, avgB], paletteLabs[p]);
        if (d < minDist) { minDist = d; bestPalIdx = p; }
      }

      clusterToPalIdx[j] = bestPalIdx;
      const palLab = paletteLabs[bestPalIdx];
      centers[j][0] = palLab[0];
      centers[j][1] = palLab[1];
      centers[j][2] = palLab[2];
    }
  }

  // ---- DeltaE 2000 refinement pass ----
  // For each pixel, directly compute perceptual distance to all used
  // palette colors. This fixes edge cases where weighted-Lab clustering
  // assigned a pixel to a perceptually suboptimal color.
  const usedSet = new Set(clusterToPalIdx);
  const usedPalIndices = Array.from(usedSet).sort((a, b) => a - b);
  const usedPalLabs = usedPalIndices.map((idx) => paletteLabs[idx]);

  for (let i = 0; i < n; i++) {
    if (labels[i] < 0) continue;
    const px = pixelLabs[i];

    let minDist = Infinity;
    let bestPalIdx = 0;
    for (let j = 0; j < usedPalLabs.length; j++) {
      const d = deltaE2000(px, usedPalLabs[j]);
      if (d < minDist) { minDist = d; bestPalIdx = j; }
    }

    // labels[i] now stores the DIRECT palette index
    labels[i] = usedPalIndices[bestPalIdx];
  }

  // ---- Deduplicate & compact ----
  const paletteToCompact = new Map<number, number>();
  const compactPaletteIndices: number[] = [];
  const finalLabels = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    if (labels[i] < 0) { finalLabels[i] = -1; continue; }
    const palIdx = labels[i];
    if (!paletteToCompact.has(palIdx)) {
      paletteToCompact.set(palIdx, compactPaletteIndices.length);
      compactPaletteIndices.push(palIdx);
    }
    finalLabels[i] = paletteToCompact.get(palIdx)!;
  }

  return {
    labels: Array.from(finalLabels),
    // compactPaletteIndices are already palette indices (from refinement pass)
    usedPaletteIndices: compactPaletteIndices,
  };
}

// ============================================================================
// Image Resize
// ============================================================================

function resizeToTargetImageData(
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): ImageData {
  // Direct bilinear resize via canvas, then sharpen.
  // No oversampled area-averaging — that blurs thin lines.
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  return sharpenImageData(
    ctx.getImageData(0, 0, targetWidth, targetHeight),
    0.7
  );
}

function sharpenImageData(imageData: ImageData, amount: number): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        let neighborSum = 0, neighborCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            neighborSum += data[(ny * width + nx) * 4 + channel];
            neighborCount++;
          }
        }
        const blurred = neighborCount > 0 ? neighborSum / neighborCount : data[idx + channel];
        out[idx + channel] = Math.max(0, Math.min(255,
          Math.round(data[idx + channel] + (data[idx + channel] - blurred) * amount)
        ));
      }
      out[idx + 3] = data[idx + 3];
    }
  }
  return output;
}

// ============================================================================
// Background Removal
// ============================================================================

function removeBackground(
  imageData: ImageData,
  grid: number[][]
): { processedGrid: number[][]; bgRemoved: boolean } {
  const bgMask = detectBackground(imageData);
  const h = grid.length;
  const w = grid[0].length;

  let bgCount = 0;
  for (let y = 0; y < h; y++) {
    const row = bgMask[y];
    for (let x = 0; x < w; x++) {
      if (row[x] < 0) bgCount++;
    }
  }

  if (bgCount < h * w * 0.1) {
    return { processedGrid: grid, bgRemoved: false };
  }

  const result: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row = new Array(w);
    const maskRow = bgMask[y];
    const gridRow = grid[y];
    for (let x = 0; x < w; x++) {
      row[x] = maskRow[x] < 0 ? -1 : gridRow[x];
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
  const {
    targetWidth, targetHeight, maxColors, brand,
    denoiseStrength, noiseFilter,
    removeBackground: doRemoveBg, useCommonColors,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // ---- Precompute palette Lab values once ----
      const brandPalette = getBrandColors(brand);
      const commonPalette = getCommonColors();
      const brandPaletteLabs = precomputePaletteLabs(brandPalette);

      // ---- Step 1: Resize ----
      let imageData = resizeToTargetImageData(image, targetWidth, targetHeight);

      // ---- Step 2: Bilateral filter (optional) ----
      if (denoiseStrength > 0) {
        const sigmaSpace = 1 + denoiseStrength;
        const sigmaColor = 20 + denoiseStrength * 15;
        imageData = bilateralFilter(imageData, sigmaColor, sigmaSpace);
      }

      // ---- Step 3: Convert to Lab ----
      const { data, width, height } = imageData;
      const totalPixels = width * height;

      const pixelLabs: [number, number, number][] = new Array(totalPixels);
      const alpha = new Uint8Array(totalPixels);

      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        alpha[i] = a;
        pixelLabs[i] = a < 128 ? [0, 0, 0] : rgbToLab(r, g, b);
      }

      // ---- Step 4: Palette-guided k-means ----
      const k = Math.min(maxColors, totalPixels);
      if (k === 0) {
        resolve({
          grid: Array.from({ length: targetHeight }, () => Array(targetWidth).fill(-1)),
          colorMap: [],
          stats: [],
          width: targetWidth,
          height: targetHeight,
          originalImage: image.src,
        });
        return;
      }

      const { labels, usedPaletteIndices } = paletteKMeans(
        pixelLabs, alpha, brandPaletteLabs, brandPalette, k
      );

      // ---- Step 5: Build grid from labels ----
      const colorMap: BeadColor[] = usedPaletteIndices.map((i) => ({
        ...brandPalette[i],
      }));

      let grid: number[][] = [];
      for (let y = 0; y < height; y++) {
        const row = new Array(width);
        for (let x = 0; x < width; x++) {
          const pixelIdx = y * width + x;
          if (alpha[pixelIdx] < 128) {
            row[x] = -1;
          } else {
            row[x] = labels[pixelIdx];
          }
        }
        grid.push(row);
      }

      // ---- Step 6: Remove background (optional) ----
      if (doRemoveBg) {
        const bgResult = removeBackground(imageData, grid);
        grid = bgResult.processedGrid;
      }

      // ---- Step 7: Remove small regions ----
      if (noiseFilter) {
        grid = removeSmallRegions(grid, 4);
      }

      // ---- Step 8: Merge rare colors ----
      if (useCommonColors) {
        // Prefer common brand colors: for each used palette color, check if a
        // perceptually close common color exists (DeltaE < 8) and switch to it.
        // This avoids removing colors (unlike mergeRareColors), just shifts
        // them to more commonly available shades.
        const commonPrefLabs = precomputePaletteLabs(commonPalette);
        for (let ci = 0; ci < usedPaletteIndices.length; ci++) {
          const brandLab = brandPaletteLabs[usedPaletteIndices[ci]];
          const bestCmn = findClosestColorCached(brandLab, commonPrefLabs);
          if (deltaE2000(brandLab, commonPrefLabs[bestCmn]) < 8) {
            let bestBrand = usedPaletteIndices[ci];
            let bestDist = Infinity;
            for (let bj = 0; bj < brandPaletteLabs.length; bj++) {
              const bd = deltaE2000(commonPrefLabs[bestCmn], brandPaletteLabs[bj]);
              if (bd < bestDist) { bestDist = bd; bestBrand = bj; }
            }
            usedPaletteIndices[ci] = bestBrand;
          }
        }
      }

      // ---- Step 9: Compact colorMap ----
      const usedIndices = new Set<number>();
      for (let y = 0; y < height; y++) {
        const row = grid[y];
        for (let x = 0; x < width; x++) {
          if (row[x] >= 0) usedIndices.add(row[x]);
        }
      }

      const usedArray = Array.from(usedIndices).sort((a, b) => a - b);
      const finalColorMap = usedArray.map((oldIdx) => colorMap[oldIdx] || brandPalette[0]);

      const oldToNew = new Map<number, number>();
      usedArray.forEach((oldIdx, i) => oldToNew.set(oldIdx, i));
      const finalGrid = grid.map((row) => {
        const newRow = new Array(width);
        for (let x = 0; x < width; x++) {
          newRow[x] = row[x] < 0 ? -1 : (oldToNew.get(row[x]) ?? row[x]);
        }
        return newRow;
      });

      // ---- Step 10: Statistics ----
      const stats: ColorStat[] = [];
      const finalCounts = new Array(finalColorMap.length).fill(0);
      let totalNonTransparent = 0;

      for (let y = 0; y < height; y++) {
        const row = finalGrid[y];
        for (let x = 0; x < width; x++) {
          const idx = row[x];
          if (idx >= 0) { finalCounts[idx]++; totalNonTransparent++; }
        }
      }

      for (let i = 0; i < finalColorMap.length; i++) {
        stats.push({
          colorIndex: i,
          count: finalCounts[i],
          percentage: totalNonTransparent > 0 ? (finalCounts[i] / totalNonTransparent) * 100 : 0,
        });
      }
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
