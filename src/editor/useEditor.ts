/**
 * Editor state management hook
 * Manages grid, tools, colors, history (undo/redo), and view state
 */

import { useState, useCallback, useRef } from 'react';
import type { EditorState, EditorOptions, HistoryEntry, ToolType } from './types';
import { getBrandColors } from '../engine/database';
import {
  drawLine,
  drawRect,
  drawCircle,
  floodFill,
  drawBrush,
  getPixel,
} from './actions';

const MAX_HISTORY = 50;

const DEFAULT_WIDTH = 29;
const DEFAULT_HEIGHT = 29;
const DEFAULT_BRAND = 'mard';

function createEmptyGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(-1));
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

export function useEditor(options: EditorOptions = {}) {
  const width = options.width || DEFAULT_WIDTH;
  const height = options.height || DEFAULT_HEIGHT;
  const brand = options.brand || DEFAULT_BRAND;

  const initialPalette = options.colorPalette || getBrandColors(brand);
  const initialGrid = options.grid
    ? cloneGrid(options.grid)
    : createEmptyGrid(width, height);

  // Ensure grid dimensions match
  const actualHeight = initialGrid.length;
  const actualWidth = initialGrid[0]?.length || width;

  const initialHistory: HistoryEntry = {
    grid: cloneGrid(initialGrid),
    timestamp: Date.now(),
    action: '初始化',
  };

  const [state, setState] = useState<EditorState>({
    grid: initialGrid,
    width: actualWidth,
    height: actualHeight,
    colorPalette: initialPalette,
    activeTool: 'brush',
    activeColorIndex: 0,
    brushSize: 1,
    history: [initialHistory],
    historyIndex: 0,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    showGrid: true,
    brand,
  });

  // Refs for drag drawing
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Push a new history entry
  const pushHistory = useCallback(
    (newGrid: number[][], action: string, currentState: EditorState) => {
      const newEntry: HistoryEntry = {
        grid: cloneGrid(newGrid),
        timestamp: Date.now(),
        action,
      };

      const newHistory = currentState.history.slice(0, currentState.historyIndex + 1);
      newHistory.push(newEntry);

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      const newIndex = newHistory.length - 1;

      return { history: newHistory, historyIndex: newIndex };
    },
    []
  );

  // Set active tool
  const setTool = useCallback((tool: ToolType) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  // Set brush size
  const setBrushSize = useCallback((size: number) => {
    setState((prev) => ({ ...prev, brushSize: Math.max(1, Math.min(5, size)) }));
  }, []);

  // Set active color
  const setColor = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      activeColorIndex: Math.max(0, Math.min(prev.colorPalette.length - 1, index)),
    }));
  }, []);

  // Set zoom
  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: Math.max(0.5, Math.min(5, zoom)) }));
  }, []);

  // Zoom in/out
  const zoomIn = useCallback(() => {
    setState((prev) => ({ ...prev, zoom: Math.min(5, prev.zoom + 0.25) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.25) }));
  }, []);

  const zoomReset = useCallback(() => {
    setState((prev) => ({ ...prev, zoom: 1, offsetX: 0, offsetY: 0 }));
  }, []);

  // Toggle grid
  const toggleGrid = useCallback(() => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  // Set offset (pan)
  const setOffset = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, offsetX: x, offsetY: y }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        grid: cloneGrid(prev.history[newIndex].grid),
        historyIndex: newIndex,
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        grid: cloneGrid(prev.history[newIndex].grid),
        historyIndex: newIndex,
      };
    });
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setState((prev) => {
      const newGrid = createEmptyGrid(prev.width, prev.height);
      const { history, historyIndex } = pushHistory(newGrid, '清空画布', prev);
      return {
        ...prev,
        grid: newGrid,
        history,
        historyIndex,
      };
    });
  }, [pushHistory]);

  // Change brand (update palette)
  const setBrand = useCallback((newBrand: string) => {
    setState((prev) => {
      const newPalette = getBrandColors(newBrand);
      return {
        ...prev,
        brand: newBrand,
        colorPalette: newPalette,
        activeColorIndex: 0,
      };
    });
  }, []);

  // Change canvas size
  const setCanvasSize = useCallback((w: number, h: number) => {
    setState((prev) => {
      const newW = Math.max(8, Math.min(128, w));
      const newH = Math.max(8, Math.min(128, h));
      const newGrid = createEmptyGrid(newW, newH);

      // Copy existing data
      for (let y = 0; y < Math.min(prev.height, newH); y++) {
        for (let x = 0; x < Math.min(prev.width, newW); x++) {
          newGrid[y][x] = prev.grid[y][x];
        }
      }

      const { history, historyIndex } = pushHistory(newGrid, `调整尺寸 ${newW}×${newH}`, prev);
      return {
        ...prev,
        grid: newGrid,
        width: newW,
        height: newH,
        history,
        historyIndex,
      };
    });
  }, [pushHistory]);

  // Start drawing (mouse down)
  const startDrawing = useCallback(
    (x: number, y: number) => {
      isDraggingRef.current = true;
      dragStartRef.current = { x, y };
      lastPosRef.current = { x, y };

      if (state.activeTool === 'picker') {
        const picked = getPixel(state.grid, x, y);
        if (picked >= 0) {
          // Find in palette
          const idx = state.colorPalette.findIndex(
            (_, i) => i === picked
          );
          if (idx >= 0) {
            setState((prev) => ({ ...prev, activeColorIndex: idx }));
          }
        }
        isDraggingRef.current = false;
        return;
      }

      if (state.activeTool === 'fill') {
        setState((prev) => {
          const newGrid = cloneGrid(prev.grid);
          floodFill(newGrid, x, y, prev.activeColorIndex);
          const { history, historyIndex } = pushHistory(newGrid, '填充', prev);
          return { ...prev, grid: newGrid, history, historyIndex };
        });
        isDraggingRef.current = false;
        return;
      }

      if (
        state.activeTool === 'brush' ||
        state.activeTool === 'eraser'
      ) {
        setState((prev) => {
          const newGrid = cloneGrid(prev.grid);
          const color = prev.activeTool === 'eraser' ? -1 : prev.activeColorIndex;
          drawBrush(newGrid, x, y, color, prev.brushSize);
          return { ...prev, grid: newGrid };
        });
      }
    },
    [state.activeTool, state.colorPalette, pushHistory]
  );

  // Continue drawing (mouse move while dragging)
  const continueDrawing = useCallback(
    (x: number, y: number) => {
      if (!isDraggingRef.current) return;

      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;

      if (state.activeTool === 'brush' || state.activeTool === 'eraser') {
        setState((prev) => {
          const newGrid = cloneGrid(prev.grid);
          const color = prev.activeTool === 'eraser' ? -1 : prev.activeColorIndex;
          drawLine(newGrid, lastPosRef.current.x, lastPosRef.current.y, x, y, color, prev.brushSize);
          return { ...prev, grid: newGrid };
        });
        lastPosRef.current = { x, y };
        return;
      }

      // For shape tools, we preview by restoring from history and redrawing
      if (state.activeTool === 'line') {
        setState((prev) => {
          const baseGrid = cloneGrid(prev.history[prev.historyIndex].grid);
          const color = prev.activeColorIndex;
          drawLine(baseGrid, startX, startY, x, y, color, prev.brushSize);
          return { ...prev, grid: baseGrid };
        });
        return;
      }

      if (state.activeTool === 'rect') {
        setState((prev) => {
          const baseGrid = cloneGrid(prev.history[prev.historyIndex].grid);
          const color = prev.activeColorIndex;
          drawRect(baseGrid, startX, startY, x, y, color);
          return { ...prev, grid: baseGrid };
        });
        return;
      }

      if (state.activeTool === 'circle') {
        setState((prev) => {
          const baseGrid = cloneGrid(prev.history[prev.historyIndex].grid);
          const color = prev.activeColorIndex;
          const dx = x - startX;
          const dy = y - startY;
          const r = Math.round(Math.sqrt(dx * dx + dy * dy));
          drawCircle(baseGrid, startX, startY, r, color);
          return { ...prev, grid: baseGrid };
        });
        return;
      }
    },
    [state.activeTool, pushHistory]
  );

  // End drawing (mouse up)
  const endDrawing = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (
      state.activeTool === 'brush' ||
      state.activeTool === 'eraser' ||
      state.activeTool === 'line' ||
      state.activeTool === 'rect' ||
      state.activeTool === 'circle'
    ) {
      setState((prev) => {
        const actionName =
          prev.activeTool === 'brush'
            ? '画笔'
            : prev.activeTool === 'eraser'
            ? '橡皮'
            : prev.activeTool === 'line'
            ? '直线'
            : prev.activeTool === 'rect'
            ? '矩形'
            : '圆形';
        const { history, historyIndex } = pushHistory(prev.grid, actionName, prev);
        return { ...prev, history, historyIndex };
      });
    }
  }, [state.activeTool, pushHistory]);

  // Computed values
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return {
    // State
    ...state,

    // Computed
    canUndo,
    canRedo,

    // Actions
    setTool,
    setBrushSize,
    setColor,
    setZoom,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleGrid,
    setOffset,
    undo,
    redo,
    clearCanvas,
    setBrand,
    setCanvasSize,

    // Drawing
    startDrawing,
    continueDrawing,
    endDrawing,
  };
}

export type EditorController = ReturnType<typeof useEditor>;
