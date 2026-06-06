/**
 * Color space conversions and color difference calculations
 * Supports RGB, Lab, and XYZ color spaces with DeltaE 2000
 */

// D65 reference white
const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

/**
 * Convert sRGB [0-255] to linear RGB [0-1]
 */
function srgbToLinear(v: number): number {
  v = v / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB [0-1] to sRGB [0-255]
 */

/**
 * Convert RGB [0-255] to XYZ
 */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) * 100;
  const y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) * 100;
  const z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) * 100;

  return [x, y, z];
}

/**
 * Convert XYZ to Lab
 */
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  x = x / REF_X;
  y = y / REF_Y;
  z = z / REF_Z;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return [l, a, b];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Convert RGB [0-255] to Lab [L:0-100, a:-128~127, b:-128~127]
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

/**
 * Hex string to RGB tuple
 */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * RGB to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Convert hex to Lab
 */
export function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

/**
 * Fast squared color distance in Lab (CIE76) - for k-means clustering
 */
export function deltaE76Squared(lab1: [number, number, number], lab2: [number, number, number]): number {
  const dl = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return dl * dl + da * da + db * db;
}

/**
 * DeltaE 2000 - perceptually uniform color distance
 */
export function deltaE2000(lab1: [number, number, number], lab2: [number, number, number]): number {
  const L1 = lab1[0], a1 = lab1[1], b1 = lab1[2];
  const L2 = lab2[0], a2 = lab2[1], b2 = lab2[2];

  const kL = 1, kC = 1, kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cbar = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p);
  const h2p = Math.atan2(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else {
    dhp = h2p - h1p;
    if (dhp > Math.PI) dhp -= 2 * Math.PI;
    if (dhp < -Math.PI) dhp += 2 * Math.PI;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else {
    hbarp = (h1p + h2p) / 2;
    if (Math.abs(h1p - h2p) > Math.PI) {
      hbarp += h1p + h2p < 2 * Math.PI ? Math.PI : -Math.PI;
    }
  }

  const T =
    1 -
    0.17 * Math.cos(hbarp - Math.PI / 6) +
    0.24 * Math.cos(2 * hbarp) +
    0.32 * Math.cos(3 * hbarp + Math.PI / 30) -
    0.2 * Math.cos(4 * hbarp - (21 * Math.PI) / 20);

  const dtheta = (Math.PI / 6) * Math.exp(-Math.pow((hbarp * 180) / Math.PI - 275, 2) / Math.pow(25, 2));

  const RC = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));

  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const RT = -Math.sin(2 * dtheta) * RC;

  const dE = Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
      Math.pow(dCp / (kC * SC), 2) +
      Math.pow(dHp / (kH * SH), 2) +
      RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );

  return dE;
}

// ============================================================================
// Palette Lab cache utilities
// ============================================================================

/**
 * Precompute Lab values for a palette. Call once and reuse across hot loops.
 * Reduces rgbToLab calls from O(N×palette) to O(palette).
 */
export function precomputePaletteLabs(
  palette: { rgb: [number, number, number] }[]
): [number, number, number][] {
  const labs: [number, number, number][] = new Array(palette.length);
  for (let i = 0; i < palette.length; i++) {
    labs[i] = rgbToLab(palette[i].rgb[0], palette[i].rgb[1], palette[i].rgb[2]);
  }
  return labs;
}

/**
 * Find the closest bead color from a palette using Lab DeltaE2000.
 * Accepts optional precomputed paletteLabs for performance.
 */
export function findClosestColor(
  lab: [number, number, number],
  palette: { rgb: [number, number, number] }[],
  paletteLabs?: [number, number, number][]
): number {
  const labs = paletteLabs ?? precomputePaletteLabs(palette);
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < labs.length; i++) {
    const d = deltaE2000(lab, labs[i]);
    if (d < minDist) { minDist = d; minIdx = i; }
  }
  return minIdx;
}

/**
 * Find the closest bead color from a precomputed Lab palette (fast path).
 */
export function findClosestColorCached(
  lab: [number, number, number],
  paletteLabs: [number, number, number][]
): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < paletteLabs.length; i++) {
    const d = deltaE2000(lab, paletteLabs[i]);
    if (d < minDist) { minDist = d; minIdx = i; }
  }
  return minIdx;
}

// ============================================================================
// Weighted Lab distance for clustering (emphasizes chromaticity over lightness)
// ============================================================================

/**
 * Weighted CIE76 squared distance. Emphasizes chromaticity (a, b) over
 * lightness (L), since hue/saturation differences matter more than brightness
 * differences in bead pattern perception.
 *
 * Default weights: L=1.0, a=1.5, b=1.5 (30% more weight on chromaticity)
 */
export function deltaE76SquaredWeighted(
  lab1: [number, number, number],
  lab2: [number, number, number],
  wL = 1.0,
  wAB = 1.5
): number {
  const dl = (lab1[0] - lab2[0]) * wL;
  const da = (lab1[1] - lab2[1]) * wAB;
  const db = (lab1[2] - lab2[2]) * wAB;
  return dl * dl + da * da + db * db;
}
