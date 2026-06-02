/**
 * GridPreview component - Canvas-based bead grid preview with hover tooltip
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ProcessResult } from '../engine/types';
import { ZoomIn, ZoomOut, Grid3X3 } from 'lucide-react';

interface GridPreviewProps {
  result: ProcessResult | null;
  isProcessing: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
}

export default function GridPreview({ result, isProcessing, showGrid, onToggleGrid }: GridPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Base cell size
  const BASE_CELL = 16;

  // Draw the grid
  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { grid, colorMap, width, height } = result;
    const cellSize = Math.max(4, Math.floor(BASE_CELL * zoom));
    const gridLineWidth = showGrid ? 1 : 0;

    canvas.width = width * (cellSize + gridLineWidth) + gridLineWidth;
    canvas.height = height * (cellSize + gridLineWidth) + gridLineWidth;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIdx = grid[y][x];
        const px = gridLineWidth + x * (cellSize + gridLineWidth);
        const py = gridLineWidth + y * (cellSize + gridLineWidth);

        if (colorIdx < 0) {
          // Transparent: checkerboard
          drawCheckerboard(ctx, px, py, cellSize);
        } else {
          const color = colorMap[colorIdx];
          ctx.fillStyle = color.hex;
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      }
    }

    // Grid lines
    if (showGrid) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let y = 0; y <= height; y++) {
        const py = y * (cellSize + gridLineWidth);
        ctx.fillRect(0, py, canvas.width, gridLineWidth);
      }
      for (let x = 0; x <= width; x++) {
        const px = x * (cellSize + gridLineWidth);
        ctx.fillRect(px, 0, gridLineWidth, canvas.height);
      }
    }

    // Highlight hovered cell
    if (hoveredCell && hoveredCell.x >= 0 && hoveredCell.x < width && hoveredCell.y >= 0 && hoveredCell.y < height) {
      const px = gridLineWidth + hoveredCell.x * (cellSize + gridLineWidth);
      const py = gridLineWidth + hoveredCell.y * (cellSize + gridLineWidth);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }, [result, zoom, showGrid, hoveredCell]);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!result || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const cellSize = Math.max(4, Math.floor(BASE_CELL * zoom));
      const gridLineWidth = showGrid ? 1 : 0;
      const x = Math.floor((mx - gridLineWidth) / (cellSize + gridLineWidth));
      const y = Math.floor((my - gridLineWidth) / (cellSize + gridLineWidth));

      if (x >= 0 && x < result.width && y >= 0 && y < result.height) {
        setHoveredCell({ x, y });
        const colorIdx = result.grid[y][x];
        if (colorIdx >= 0) {
          const color = result.colorMap[colorIdx];
          const stat = result.stats.find((s) => s.colorIndex === colorIdx);
          setTooltip({
            x: e.clientX - rect.left + 12,
            y: e.clientY - rect.top - 12,
            text: `${color.name} ${color.code}${stat ? ` | ${stat.count}\u7c92` : ''}`,
          });
        } else {
          setTooltip(null);
        }
      } else {
        setHoveredCell(null);
        setTooltip(null);
      }
    },
    [result, zoom, showGrid]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setTooltip(null);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.25)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.25)), []);

  // Loading state
  if (isProcessing) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#E8E8E8] rounded-full" />
            <div className="absolute inset-0 border-4 border-t-[#FF6B6B] rounded-full animate-spin" />
          </div>
          <p className="text-sm text-[#8A8D91]">{'\u6b63\u5728\u751f\u6210\u62fc\u8c46\u56fe\u7eb8...'}</p>
        </div>
      </div>
    );
  }

  // No result yet
  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FAFAF8] border-2 border-dashed border-[#E8E8E8] flex items-center justify-center">
            <Grid3X3 size={28} className="text-[#D0D0D0]" />
          </div>
          <p className="text-sm text-[#8A8D91]">{'\u4e0a\u4f20\u56fe\u7247\u540e\u5c06\u5728\u6b64\u5904\u663e\u793a\u62fc\u8c46\u9884\u89c8'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[400px]" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-[#8A8D91]">
          {result.width} {'\u00d7'} {result.height} {'\u683c'} {'\u00b7'} {result.colorMap.length} {'\u8272'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-white border border-[#E8E8E8] hover:border-[#FF6B6B] hover:text-[#FF6B6B] transition-colors"
            title={'\u7f29\u5c0f'}
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-[#8A8D91] w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-white border border-[#E8E8E8] hover:border-[#FF6B6B] hover:text-[#FF6B6B] transition-colors"
            title={'\u653e\u5927'}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={onToggleGrid}
            className={`
              p-1.5 rounded-lg border transition-colors
              ${showGrid ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-[#8A8D91] border-[#E8E8E8] hover:border-[#FF6B6B]'}
            `}
            title={showGrid ? '\u9690\u85cf\u7f51\u683c' : '\u663e\u793a\u7f51\u683c'}
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] overflow-auto flex items-center justify-center p-4 relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="max-w-full max-h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-[#2D3436] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const sq = size / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(x, y, sq, sq);
  ctx.fillRect(x + sq, y + sq, sq, sq);
}
