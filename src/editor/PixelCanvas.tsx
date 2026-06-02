/**
 * PixelCanvas - Core canvas component for the pixel editor
 * Handles rendering, mouse/touch interactions, zoom, pan, and grid display
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { EditorController } from './useEditor';

interface PixelCanvasProps {
  editor: EditorController;
}

// Canvas background color (for empty cells)
const BG_COLOR = '#2a2a3e';
const GRID_COLOR = 'rgba(255,255,255,0.08)';
const GRID_COLOR_STRONG = 'rgba(255,255,255,0.15)';
// Shape preview is handled via grid state in useEditor

export default function PixelCanvas({ editor }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);

  const { grid, width, height, colorPalette, zoom, offsetX, offsetY, showGrid } =
    editor;

  // Calculate cell size based on zoom
  const baseCellSize = 20;
  const cellSize = baseCellSize * zoom;

  // Canvas size matches container
  const canvasWidth = width * cellSize;
  const canvasHeight = height * cellSize;

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (handle DPI)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIdx = grid[y][x];
        if (colorIdx >= 0 && colorIdx < colorPalette.length) {
          const color = colorPalette[colorIdx];
          ctx.fillStyle = color.hex;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw preview for shape tools
    if (
      currentPosRef.current &&
      isDrawing &&
      (editor.activeTool === 'line' ||
        editor.activeTool === 'rect' ||
        editor.activeTool === 'circle')
    ) {
      // Preview is already in the grid from continueDrawing
      // Just draw the preview pixels with a different shade
    }

    // Draw grid lines
    if (showGrid && cellSize >= 4) {
      ctx.strokeStyle = cellSize > 8 ? GRID_COLOR : GRID_COLOR_STRONG;
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x <= width; x++) {
        const every5 = x % 5 === 0;
        ctx.strokeStyle = every5 ? 'rgba(255,255,255,0.2)' : GRID_COLOR;
        ctx.lineWidth = every5 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvasHeight);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y++) {
        const every5 = y % 5 === 0;
        ctx.strokeStyle = every5 ? 'rgba(255,255,255,0.2)' : GRID_COLOR;
        ctx.lineWidth = every5 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvasWidth, y * cellSize);
        ctx.stroke();
      }
    }

    // Draw border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
  }, [
    grid,
    width,
    height,
    colorPalette,
    cellSize,
    canvasWidth,
    canvasHeight,
    showGrid,
    isDrawing,
    editor.activeTool,
  ]);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((screenX - rect.left) / cellSize);
      const y = Math.floor((screenY - rect.top) / cellSize);
      return { x, y };
    },
    [cellSize]
  );

  // Mouse down handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2 || (e.button === 0 && e.altKey)) {
        // Right-click or Alt+left: pan
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        offsetStartRef.current = { x: editor.offsetX, y: editor.offsetY };
        return;
      }

      if (e.button !== 0) return;

      const { x, y } = screenToGrid(e.clientX, e.clientY);
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      setIsDrawing(true);
      currentPosRef.current = { x, y };
      editor.startDrawing(x, y);
    },
    [editor, screenToGrid, width, height]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        editor.setOffset(offsetStartRef.current.x + dx, offsetStartRef.current.y + dy);
        return;
      }

      if (!isDrawing) return;

      const { x, y } = screenToGrid(e.clientX, e.clientY);
      currentPosRef.current = { x, y };
      editor.continueDrawing(x, y);
    },
    [isPanning, isDrawing, editor, screenToGrid]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (isDrawing) {
      setIsDrawing(false);
      currentPosRef.current = null;
      editor.endDrawing();
    }
  }, [isPanning, isDrawing, editor]);

  // Wheel handler for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.25 : 0.25;
        editor.setZoom(editor.zoom + delta);
      }
    },
    [editor]
  );

  // Prevent context menu on right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Global mouse up to handle dragging outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPanning) setIsPanning(false);
      if (isDrawing) {
        setIsDrawing(false);
        currentPosRef.current = null;
        editor.endDrawing();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isPanning, isDrawing, editor]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden flex items-center justify-center cursor-crosshair select-none"
      style={{
        cursor: isPanning ? 'grabbing' : editor.activeTool === 'picker' ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      <div
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 bg-[#1a1a2e]/90 text-white/70 text-xs px-2 py-1 rounded-md pointer-events-none">
        {Math.round(editor.zoom * 100)}% | {editor.width} × {editor.height}
      </div>
    </div>
  );
}
