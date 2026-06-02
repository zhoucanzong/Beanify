/**
 * Core type definitions for the bead pattern generator engine
 */

/** A single bead color from a specific brand */
export interface BeadColor {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  rgb: [number, number, number];
  brand: string;
  code: string;
  isCommon: boolean;
}

/** Statistics for a single color usage in the pattern */
export interface ColorStat {
  colorIndex: number;
  count: number;
  percentage: number;
}

/** Process options for image-to-bead conversion */
export interface ProcessOptions {
  targetWidth: number;
  targetHeight: number;
  maxColors: number;
  brand: string;
  denoiseStrength: number; // 0=off, 1=weak, 2=medium, 3=strong
  noiseFilter: boolean;
  removeBackground: boolean;
  useCommonColors: boolean;
}

/** Result of processing an image into a bead pattern */
export interface ProcessResult {
  grid: number[][]; // 2D array of indices into colorMap, -1 = transparent
  colorMap: BeadColor[]; // Colors used in the pattern
  stats: ColorStat[]; // Usage statistics per color
  width: number;
  height: number;
  originalImage: string; // DataURL of original image
}

/** Brand definition */
export interface BrandInfo {
  id: string;
  name: string;
  colors: number;
}
