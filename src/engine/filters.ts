/**
 * Image filtering algorithms
 * - Bilateral filter for edge-preserving smoothing
 * - Small region removal (noise cleanup)
 * - Rare color merging
 *
 * Optimizations:
 * - Precomputed spatial weights for bilateral filter
 * - Cached direction arrays & pre-allocated arrays for flood fill
 * - Precomputed palette Lab values for mergeRareColors
 */

import type { BeadColor } from './types';
import { rgbToLab, deltaE76Squared, deltaE2000 } from './color-space';

// Pre-allocated direction arrays (4-connected, 8-connected)
const DIRS_4 = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const DIRS_8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

// ============================================================================
// Bilateral Filter (optimized with precomputed spatial weights)
// ============================================================================

/**
 * Apply bilateral filter for edge-preserving smoothing.
 * Uses precomputed spatial Gaussian kernel for speed.
 */
export function bilateralFilter(
  imageData: ImageData,
  sigmaColor: number,
  sigmaSpace: number
): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;

  const kernelRadius = Math.max(1, Math.ceil(sigmaSpace * 2));
  const kernelSize = 2 * kernelRadius + 1;

  // Precompute spatial weights (1D array indexed by dx + dy * kernelSize)
  const spatialWeights = new Float64Array(kernelSize * kernelSize);
  for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
    for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
      const distSq = dx * dx + dy * dy;
      spatialWeights[(dy + kernelRadius) * kernelSize + (dx + kernelRadius)] =
        Math.exp(-distSq / (2 * sigmaSpace * sigmaSpace));
    }
  }

  // Precompute inverse of color sigma squared
  const invColorSigmaSq = 1 / (2 * sigmaColor * sigmaColor);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIdx = (y * width + x) * 4;
      const cr = data[centerIdx];
      const cg = data[centerIdx + 1];
      const cb = data[centerIdx + 2];

      let rSum = 0, gSum = 0, bSum = 0, wSum = 0;

      for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;

        for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const nIdx = (ny * width + nx) * 4;
          const nr = data[nIdx];
          const ng = data[nIdx + 1];
          const nb = data[nIdx + 2];

          // Color weight (Gaussian in RGB space)
          const dr = nr - cr, dg = ng - cg, db = nb - cb;
          const colorWeight = Math.exp(-(dr * dr + dg * dg + db * db) * invColorSigmaSq);

          const weight = colorWeight * spatialWeights[(dy + kernelRadius) * kernelSize + (dx + kernelRadius)];
          rSum += nr * weight;
          gSum += ng * weight;
          bSum += nb * weight;
          wSum += weight;
        }
      }

      const invW = 1 / wSum;
      const idx = (y * width + x) * 4;
      outData[idx] = Math.round(rSum * invW);
      outData[idx + 1] = Math.round(gSum * invW);
      outData[idx + 2] = Math.round(bSum * invW);
      outData[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

// ============================================================================
// Small Region Removal (optimized with pre-allocated arrays)
// ============================================================================

/**
 * Remove isolated small regions from the grid using 4-connected flood fill.
 */
export function removeSmallRegions(grid: number[][], threshold: number): number[][] {
  const h = grid.length;
  if (h === 0) return grid;
  const w = grid[0].length;

  const result = grid.map((row) => row.slice());
  const visited: Uint8Array[] = [];
  for (let y = 0; y < h; y++) {
    visited.push(new Uint8Array(w));
  }

  // Reusable stack
  const stack: [number, number][] = [];
  const component: [number, number][] = [];

  for (let y = 0; y < h; y++) {
    const visitRow = visited[y];
    const resultRow = result[y];
    for (let x = 0; x < w; x++) {
      if (visitRow[x]) continue;
      const colorIdx = resultRow[x];
      if (colorIdx < 0) { visitRow[x] = 1; continue; }

      // Flood fill this component
      component.length = 0;
      stack.length = 0;
      stack.push([y, x]);
      visitRow[x] = 1;

      while (stack.length > 0) {
        const [cy, cx] = stack.pop()!;
        component.push([cy, cx]);

        for (let d = 0; d < 4; d++) {
          const ny = cy + DIRS_4[d][0];
          const nx = cx + DIRS_4[d][1];
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && !visited[ny][nx] && result[ny][nx] === colorIdx) {
            visited[ny][nx] = 1;
            stack.push([ny, nx]);
          }
        }
      }

      if (component.length < threshold) {
        // Find most frequent neighbor color
        const neighborCounts = new Map<number, number>();
        for (const [py, px] of component) {
          for (let d = 0; d < 4; d++) {
            const ny = py + DIRS_4[d][0];
            const nx = px + DIRS_4[d][1];
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              const nc = result[ny][nx];
              if (nc !== colorIdx && nc >= 0) {
                neighborCounts.set(nc, (neighborCounts.get(nc) || 0) + 1);
              }
            }
          }
        }

        let bestColor = -1;
        let bestCount = 0;
        for (const [c, count] of neighborCounts) {
          if (count > bestCount) { bestCount = count; bestColor = c; }
        }

        // Fallback: radial search
        if (bestColor < 0) {
          radial: for (const [py, px] of component) {
            for (let r = 1; r <= 3; r++) {
              for (const [dy, dx] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
                const ny = py + dy, nx = px + dx;
                if (ny >= 0 && ny < h && nx >= 0 && nx < w && result[ny][nx] >= 0) {
                  bestColor = result[ny][nx];
                  break radial;
                }
              }
            }
          }
        }

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
// Rare Color Merging (optimized with precomputed Lab)
// ============================================================================

/**
 * Merge colors below minCount into nearest common color.
 * Accepts precomputed common palette Lab values.
 */
export function mergeRareColors(
  grid: number[][],
  colorMap: BeadColor[],
  minCount: number,
  _commonColors: BeadColor[],
  _commonPaletteLabs?: [number, number, number][]
): { grid: number[][]; colorMap: BeadColor[] } {
  const h = grid.length;
  if (h === 0) return { grid, colorMap };
  const w = grid[0].length;

  const counts = new Array(colorMap.length).fill(0);
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < w; x++) {
      const idx = row[x];
      if (idx >= 0) counts[idx]++;
    }
  }

  const remap = new Map<number, number>();

  // Precompute Lab values for colors in the colorMap
  const colorLabs: [number, number, number][] = colorMap.map((c) =>
    rgbToLab(c.rgb[0], c.rgb[1], c.rgb[2])
  );

  for (let i = 0; i < colorMap.length; i++) {
    if (counts[i] < minCount) {
      // Merge rare colors to the nearest established color in the palette.
      let minDist = Infinity;
      let nearestIdx = -1;
      for (let j = 0; j < colorMap.length; j++) {
        if (counts[j] < minCount || j === i) continue;
        const d = deltaE2000(colorLabs[i], colorLabs[j]);
        if (d < minDist) { minDist = d; nearestIdx = j; }
      }
      if (nearestIdx >= 0) {
        // Only merge if perceptually close (DeltaE <= 20)
        // Prevents brown from being merged to white when the palette
        // doesn't have a good brown match.
        const de = deltaE2000(colorLabs[i], colorLabs[nearestIdx]);
        if (de <= 20) {
          remap.set(i, nearestIdx);
        }
      }
    }
  }

  if (remap.size === 0) return { grid, colorMap };

  const newGrid = grid.map((row) => {
    const newRow = new Array(w);
    for (let x = 0; x < w; x++) {
      const idx = row[x];
      newRow[x] = idx < 0 ? idx : (remap.has(idx) ? (remap.get(idx) ?? idx) : idx);
    }
    return newRow;
  });

  // Compact colorMap
  const usedColors = new Set<number>();
  for (let y = 0; y < h; y++) {
    const row = newGrid[y];
    for (let x = 0; x < w; x++) {
      if (row[x] >= 0) usedColors.add(row[x]);
    }
  }

  const sortedUsed = Array.from(usedColors).sort((a, b) => a - b);
  const oldToNew = new Map<number, number>();
  sortedUsed.forEach((oldIdx, newIdx) => oldToNew.set(oldIdx, newIdx));

  const finalGrid = newGrid.map((row) => {
    const newRow = new Array(w);
    for (let x = 0; x < w; x++) {
      newRow[x] = row[x] < 0 ? row[x] : (oldToNew.get(row[x]) ?? row[x]);
    }
    return newRow;
  });

  return { grid: finalGrid, colorMap: sortedUsed.map((oldIdx) => colorMap[oldIdx]) };
}

// ============================================================================
// Background Detection
// ============================================================================

/**
 * Detect background by finding dominant corner color.
 */
export function detectBackground(imageData: ImageData): number[][] {
  const { width, height, data } = imageData;
  const mask: number[][] = [];

  // Sample corner pixels
  const sampleSize = Math.min(5, height, width);
  let bgR = 0, bgG = 0, bgB = 0;
  let cornerCount = 0;

  for (let y = 0; y < sampleSize; y++) {
    const baseRow = y * width;
    for (let x = 0; x < sampleSize; x++) {
      const idx = (baseRow + x) * 4;
      bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
      cornerCount++;
    }
    for (let x = Math.max(0, width - sampleSize); x < width; x++) {
      const idx = (baseRow + x) * 4;
      bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
      cornerCount++;
    }
  }

  bgR = Math.round(bgR / cornerCount);
  bgG = Math.round(bgG / cornerCount);
  bgB = Math.round(bgB / cornerCount);

  const toleranceSq = 30 * 30;

  for (let y = 0; y < height; y++) {
    const row: number[] = new Array(width);
    const rowBase = y * width * 4;
    for (let x = 0; x < width; x++) {
      const idx = rowBase + x * 4;
      const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
      row[x] = dr * dr + dg * dg + db * db < toleranceSq ? -1 : 0;
    }
    mask.push(row);
  }

  return mask;
}
