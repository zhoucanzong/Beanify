/**
 * Editor type definitions
 */

import type { BeadColor } from '../engine/types';

/** Available drawing tools */
export type ToolType = 'brush' | 'eraser' | 'fill' | 'picker' | 'line' | 'rect' | 'circle';

/** A single history entry for undo/redo */
export interface HistoryEntry {
  grid: number[][];
  timestamp: number;
  action: string;
}

/** Complete editor state */
export interface EditorState {
  // Canvas data
  grid: number[][];
  width: number;
  height: number;

  // Color palette
  colorPalette: BeadColor[];

  // Tool state
  activeTool: ToolType;
  activeColorIndex: number;
  brushSize: number;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // View state
  zoom: number;
  offsetX: number;
  offsetY: number;
  showGrid: boolean;

  // Brand
  brand: string;
}

/** Editor initialization options */
export interface EditorOptions {
  width?: number;
  height?: number;
  brand?: string;
  grid?: number[][];
  colorPalette?: BeadColor[];
}

/** Point on the canvas grid */
export interface GridPoint {
  x: number;
  y: number;
}
