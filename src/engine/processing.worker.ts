/**
 * Web Worker for image-to-bead processing.
 * Handles the CPU-intensive parts (Lab conversion, k-means, refinement)
 * while the main thread handles I/O (resize, denoise, grid building).
 */

import {
  rgbToLab,
  deltaE2000,
  deltaE76SquaredWeighted,
} from './color-space';

// ============================================================================
// Palette-Guided K-Means (same algorithm as quantize.ts)
// ============================================================================

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
    if (alpha[i] < 128) continue;
    const px = pixelLabs[i];
    let minDist = Infinity, best = 0;
    for (let j = 0; j < paletteSize; j++) {
      const d = deltaE76SquaredWeighted(px, paletteLabs[j]);
      if (d < minDist) { minDist = d; best = j; }
    }
    votes[best]++;
  }

  const sorted = new Array(paletteSize);
  for (let i = 0; i < paletteSize; i++) sorted[i] = i;
  sorted.sort((a, b) => votes[b] - votes[a]);
  return sorted.slice(0, Math.min(k, paletteSize));
}

function paletteKMeans(
  pixelLabs: [number, number, number][],
  alpha: Uint8Array,
  paletteLabs: [number, number, number][],
  k: number,
  maxIter = 15
): { labels: number[]; usedPaletteIndices: number[] } {
  const n = pixelLabs.length;
  const activePaletteIndices = initCentersFromPalette(pixelLabs, alpha, paletteLabs, k);
  const activeCount = activePaletteIndices.length;

  const centers: [number, number, number][] = activePaletteIndices.map(
    (idx) => [paletteLabs[idx][0], paletteLabs[idx][1], paletteLabs[idx][2]]
  );

  const sumsL = new Float64Array(activeCount);
  const sumsA = new Float64Array(activeCount);
  const sumsB = new Float64Array(activeCount);
  const counts = new Int32Array(activeCount);
  const labels = new Int32Array(n);
  const clusterToPalIdx = [...activePaletteIndices];

  for (let iter = 0; iter < maxIter; iter++) {
    sumsL.fill(0); sumsA.fill(0); sumsB.fill(0); counts.fill(0);
    let changed = false;

    for (let i = 0; i < n; i++) {
      if (alpha[i] < 128) { labels[i] = -1; continue; }
      const px = pixelLabs[i];
      let minDist = Infinity, bestIdx = 0;
      for (let j = 0; j < activeCount; j++) {
        const d = deltaE76SquaredWeighted(px, centers[j]);
        if (d < minDist) { minDist = d; bestIdx = j; }
      }
      if (labels[i] !== bestIdx) { changed = true; labels[i] = bestIdx; }
      sumsL[bestIdx] += px[0]; sumsA[bestIdx] += px[1]; sumsB[bestIdx] += px[2];
      counts[bestIdx]++;
    }

    if (!changed) break;

    for (let j = 0; j < activeCount; j++) {
      if (counts[j] === 0) continue;
      const avgL = sumsL[j] / counts[j], avgA = sumsA[j] / counts[j], avgB = sumsB[j] / counts[j];
      let minDist = Infinity, bestPalIdx = clusterToPalIdx[j];
      for (let p = 0; p < paletteLabs.length; p++) {
        const d = deltaE2000([avgL, avgA, avgB], paletteLabs[p]);
        if (d < minDist) { minDist = d; bestPalIdx = p; }
      }
      clusterToPalIdx[j] = bestPalIdx;
      const pl = paletteLabs[bestPalIdx];
      centers[j][0] = pl[0]; centers[j][1] = pl[1]; centers[j][2] = pl[2];
    }
  }

  // ---- DeltaE 2000 refinement pass ----
  const usedSet = new Set(clusterToPalIdx);
  const usedPalIndices = Array.from(usedSet).sort((a, b) => a - b);
  const usedPalLabs = usedPalIndices.map((idx) => paletteLabs[idx]);

  for (let i = 0; i < n; i++) {
    if (labels[i] < 0) continue;
    const px = pixelLabs[i];
    let minDist = Infinity, bestPalIdx = 0;
    for (let j = 0; j < usedPalLabs.length; j++) {
      const d = deltaE2000(px, usedPalLabs[j]);
      if (d < minDist) { minDist = d; bestPalIdx = j; }
    }
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
    usedPaletteIndices: compactPaletteIndices,
  };
}

// ============================================================================
// Message Handler
// ============================================================================

self.onmessage = (e: MessageEvent) => {
  const { data, width, height, maxColors, paletteLabs } = e.data;
  // data is a transferable Uint8ClampedArray or regular array

  try {
    const totalPixels = width * height;
    const pixelLabs: [number, number, number][] = new Array(totalPixels);
    const alpha = new Uint8Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      alpha[i] = a;
      pixelLabs[i] = a < 128 ? [0, 0, 0] : rgbToLab(r, g, b);
    }

    const k = Math.min(maxColors, totalPixels);
    if (k === 0) {
      self.postMessage({ labels: new Array(totalPixels).fill(-1), usedPaletteIndices: [] });
      return;
    }

    const result = paletteKMeans(pixelLabs, alpha, paletteLabs, k);

    self.postMessage({
      labels: result.labels,
      usedPaletteIndices: result.usedPaletteIndices,
    });
  } catch (err) {
    self.postMessage({
      error: err instanceof Error ? err.message : 'Worker processing failed',
    });
  }
};
