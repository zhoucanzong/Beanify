/**
 * Image filtering algorithms
 * - Bilateral filter for edge-preserving smoothing
 * - Small region removal (noise cleanup)
 * - Rare color merging
 */

import type { BeadColor } from './types';
import { rgbToLab, deltaE76Squared } from './color-space';

// ============================================================================
// Bilateral Filter
// ============================================================================

/**
 * Apply bilateral filter for edge-preserving smoothing.
 * Keeps edges sharp while smoothing flat color regions.
 * @param imageData Source image data
 * @param sigmaColor Color sigma (controls color similarity weight)
 * @param sigmaSpace Space sigma (controls distance weight)
 */
export function bilateralFilter(
  imageData: ImageData,
  sigmaColor: number,
  sigmaSpace: number
): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;

  // Kernel radius (3 sigma rule)
  const kernelRadius = Math.max(1, Math.ceil(sigmaSpace * 2));

  // Precompute spatial weights
  const spatialWeights: number[] = [];
  for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
    for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
      const distSq = dx * dx + dy * dy;
      spatialWeights.push(Math.exp(-distSq / (2 * sigmaSpace * sigmaSpace)));
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        wSum = 0;

      const centerIdx = (y * width + x) * 4;
      const cr = data[centerIdx];
      const cg = data[centerIdx + 1];
      const cb = data[centerIdx + 2];

      let wi = 0;
      for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
        for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny < 0 || ny >= height || nx < 0 || nx >= width) {
            wi++;
            continue;
          }

          const nIdx = (ny * width + nx) * 4;
          const nr = data[nIdx];
          const ng = data[nIdx + 1];
          const nb = data[nIdx + 2];

          // Color weight (Gaussian in RGB space)
          const dr = nr - cr;
          const dg = ng - cg;
          const db = nb - cb;
          const colorDistSq = dr * dr + dg * dg + db * db;
          const colorWeight = Math.exp(-colorDistSq / (2 * sigmaColor * sigmaColor));

          // Combined weight
          const weight = colorWeight * spatialWeights[wi];

          rSum += nr * weight;
          gSum += ng * weight;
          bSum += nb * weight;
          wSum += weight;
          wi++;
        }
      }

      const idx = (y * width + x) * 4;
      outData[idx] = Math.round(rSum / wSum);
      outData[idx + 1] = Math.round(gSum / wSum);
      outData[idx + 2] = Math.round(bSum / wSum);
      outData[idx + 3] = data[idx + 3]; // Keep alpha
    }
  }

  return output;
}

// ============================================================================
// Small Region Removal
// ============================================================================

/**
 * Remove isolated small regions (noise pixels) from the grid.
 * Uses 4-connected flood fill to find connected components.
 * @param grid Color index grid
 * @param threshold Minimum region size to keep
 */
export function removeSmallRegions(grid: number[][], threshold: number): number[][] {
  const h = grid.length;
  if (h === 0) return grid;
  const w = grid[0].length;

  // Deep copy
  const result = grid.map((row) => row.slice());
  const visited: boolean[][] = Array.from({ length: h }, () => new Array(w).fill(false));

  // Helper: get all pixels in a connected component (4-connectivity)
  function floodFill(sy: number, sx: number, colorIdx: number): [number, number][] {
    const pixels: [number, number][] = [];
    const stack: [number, number][] = [[sy, sx]];
    visited[sy][sx] = true;

    while (stack.length > 0) {
      const [y, x] = stack.pop()!;
      pixels.push([y, x]);

      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      for (const [dy, dx] of dirs) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < w && !visited[ny][nx] && result[ny][nx] === colorIdx) {
          visited[ny][nx] = true;
          stack.push([ny, nx]);
        }
      }
    }

    return pixels;
  }

  // Find all components
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (visited[y][x]) continue;
      const colorIdx = result[y][x];
      if (colorIdx < 0) {
        visited[y][x] = true;
        continue;
      }

      const component = floodFill(y, x, colorIdx);

      if (component.length < threshold) {
        // Find the most frequent neighbor color for this region
        const neighborColors: Map<number, number> = new Map();
        for (const [py, px] of component) {
          const dirs = [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
          ];
          for (const [dy, dx] of dirs) {
            const ny = py + dy;
            const nx = px + dx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < w && result[ny][nx] !== colorIdx && result[ny][nx] >= 0) {
              neighborColors.set(result[ny][nx], (neighborColors.get(result[ny][nx]) || 0) + 1);
            }
          }
        }

        let bestColor = -1;
        let bestCount = 0;
        for (const [c, count] of neighborColors) {
          if (count > bestCount) {
            bestCount = count;
            bestColor = c;
          }
        }

        // If no valid neighbor, use nearest in spatial domain
        if (bestColor < 0) {
          // Check within a small radius
          radiusSearch: for (const [py, px] of component) {
            for (let r = 1; r <= 3; r++) {
              for (const [dy, dx] of [
                [-r, 0],
                [r, 0],
                [0, -r],
                [0, r],
              ]) {
                const ny = py + dy;
                const nx = px + dx;
                if (ny >= 0 && ny < h && nx >= 0 && nx < w && result[ny][nx] >= 0) {
                  bestColor = result[ny][nx];
                  break radiusSearch;
                }
              }
            }
          }
        }

        // Replace the small region
        if (bestColor >= 0) {
          for (const [py, px] of component) {
            result[py][px] = bestColor;
          }
        }
      }
    }
  }

  return result;
}

// ============================================================================
// Rare Color Merging
// ============================================================================

/**
 * Merge colors that appear fewer than minCount pixels into the nearest common color.
 * @param grid Color index grid
 * @param colorMap Current color palette
 * @param minCount Minimum pixel count to keep a color
 * @param commonColors List of common colors to merge into
 */
export function mergeRareColors(
  grid: number[][],
  colorMap: BeadColor[],
  minCount: number,
  commonColors: BeadColor[]
): { grid: number[][]; colorMap: BeadColor[] } {
  const h = grid.length;
  if (h === 0) return { grid, colorMap };
  const w = grid[0].length;

  // Count occurrences
  const counts = new Array(colorMap.length).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = grid[y][x];
      if (idx >= 0) counts[idx]++;
    }
  }

  // Map rare colors to their nearest common color
  const remap = new Map<number, number>();
  const commonLabs = commonColors.map((c) => rgbToLab(c.rgb[0], c.rgb[1], c.rgb[2]));

  for (let i = 0; i < colorMap.length; i++) {
    if (counts[i] < minCount) {
      // Find nearest common color
      const colorLab = rgbToLab(colorMap[i].rgb[0], colorMap[i].rgb[1], colorMap[i].rgb[2]);
      let minDist = Infinity;
      let nearestIdx = -1;
      for (let j = 0; j < commonLabs.length; j++) {
        const d = deltaE76Squared(colorLab, commonLabs[j]);
        if (d < minDist) {
          minDist = d;
          nearestIdx = j;
        }
      }

      // Find this common color in our colorMap, or use closest existing
      if (nearestIdx >= 0) {
        const targetHex = commonColors[nearestIdx].hex;
        // Find in current colorMap
        let foundInMap = colorMap.findIndex((c) => c.hex === targetHex);
        if (foundInMap < 0) {
          // Add the common color to palette
          const commonColor = commonColors[nearestIdx];
          foundInMap = colorMap.length;
          colorMap = [...colorMap, { ...commonColor, id: `${commonColor.id}_merged_${i}` }];
        }
        remap.set(i, foundInMap);
      }
    }
  }

  // If nothing to remap, return as-is
  if (remap.size === 0) return { grid, colorMap };

  // Apply remap to grid
  const newGrid = grid.map((row) =>
    row.map((idx) => {
      if (idx < 0) return idx;
      return remap.has(idx) ? (remap.get(idx) ?? idx) : idx;
    })
  );

  // Compact the colorMap (remove unused colors)
  const usedColors = new Set<number>();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (newGrid[y][x] >= 0) usedColors.add(newGrid[y][x]);
    }
  }

  const sortedUsed = Array.from(usedColors).sort((a, b) => a - b);
  const oldToNew = new Map<number, number>();
  sortedUsed.forEach((oldIdx, newIdx) => oldToNew.set(oldIdx, newIdx));

  const finalGrid = newGrid.map((row) =>
    row.map((idx) => {
      if (idx < 0) return idx;
      return oldToNew.get(idx) ?? idx;
    })
  );

  const finalColorMap = sortedUsed.map((oldIdx) => colorMap[oldIdx]);

  return { grid: finalGrid, colorMap: finalColorMap };
}

// ============================================================================
// Background Removal
// ============================================================================

/**
 * Detect and remove background by finding the most frequent corner color.
 * @param imageData Source image data
 * @returns Mask where -1 indicates background pixels
 */
export function detectBackground(imageData: ImageData): number[][] {
  const { width, height, data } = imageData;
  const mask: number[][] = [];

  // Sample corner pixels to find background color
  const cornerPixels: [number, number, number][] = [];
  const sampleSize = 5;

  for (let y = 0; y < Math.min(sampleSize, height); y++) {
    for (let x = 0; x < Math.min(sampleSize, width); x++) {
      const idx = (y * width + x) * 4;
      cornerPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }
  for (let y = 0; y < Math.min(sampleSize, height); y++) {
    for (let x = Math.max(0, width - sampleSize); x < width; x++) {
      const idx = (y * width + x) * 4;
      cornerPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  // Average corner color as background
  let bgR = 0,
    bgG = 0,
    bgB = 0;
  for (const [r, g, b] of cornerPixels) {
    bgR += r;
    bgG += g;
    bgB += b;
  }
  bgR = Math.round(bgR / cornerPixels.length);
  bgG = Math.round(bgG / cornerPixels.length);
  bgB = Math.round(bgB / cornerPixels.length);

  // Create mask with tolerance
  const tolerance = 30; // RGB tolerance for background detection
  const toleranceSq = tolerance * tolerance;

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dr = data[idx] - bgR;
      const dg = data[idx + 1] - bgG;
      const db = data[idx + 2] - bgB;
      const distSq = dr * dr + dg * dg + db * db;
      row.push(distSq < toleranceSq ? -1 : 0);
    }
    mask.push(row);
  }

  return mask;
}
