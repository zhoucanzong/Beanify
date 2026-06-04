/**
 * GridPreview — Canvas-based bead grid preview with zoom, hover, and demo mode.
 *
 * States:
 *   isProcessing → loading spinner
 *   !result      → demo 40×40 pattern + "新建画板" button
 *   result       → actual bead grid canvas
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { ProcessResult, BeadColor, ColorStat } from '../engine/types';
import { ZoomIn, ZoomOut, Grid3X3, PenLine } from 'lucide-react';

interface GridPreviewProps {
  result: ProcessResult | null;
  isProcessing: boolean;
  error?: string | null;
  showGrid: boolean;
  onToggleGrid: () => void;
  onNewCanvas?: () => void;
}

// ============================================================================
// Demo pattern (shows when no result yet)
// ============================================================================

const DEMO_COLORS: { hex: string; name: string; code: string }[] = [
  { hex: '#E85D75', name: '玫瑰红', code: 'R01' },
  { hex: '#E8A87C', name: '沙棕色', code: 'B02' },
  { hex: '#F4B860', name: '金黄色', code: 'Y03' },
  { hex: '#7EB356', name: '草绿色', code: 'G04' },
  { hex: '#4A9E8E', name: '墨绿色', code: 'G05' },
  { hex: '#5B9BD5', name: '天蓝色', code: 'B06' },
  { hex: '#9B72CF', name: '淡紫色', code: 'P07' },
  { hex: '#D96C9E', name: '梅红色', code: 'R08' },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function generateDemoResult(): ProcessResult {
  const size = 58;
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  const grid: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const angle = Math.atan2(dy, dx);
      // Radial rings with sine-wave variation for visual interest
      const idx = (Math.floor(((dist * 0.7 + 0.3 * Math.sin(angle * 5 + dist * 3)) * 8)) + 64) % 8;
      row.push(idx);
    }
    grid.push(row);
  }

  const colorMap: BeadColor[] = DEMO_COLORS.map((c, i) => ({
    id: `demo-${i}`,
    name: c.name,
    nameEn: c.name,
    hex: c.hex,
    rgb: hexToRgb(c.hex),
    brand: 'demo',
    code: c.code,
    isCommon: true,
  }));

  const flat = grid.flat();
  const stats: ColorStat[] = colorMap.map((_, i) => {
    const count = flat.filter((v) => v === i).length;
    return { colorIndex: i, count, percentage: (count / (size * size)) * 100 };
  });

  return { grid, colorMap, stats, width: size, height: size, originalImage: '' };
}

// ============================================================================
// Canvas render helpers
// ============================================================================

function drawCheckerboard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const sq = size / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(x, y, sq, sq);
  ctx.fillRect(x + sq, y + sq, sq, sq);
}

// ============================================================================
// Component
// ============================================================================

export default function GridPreview({ result, isProcessing, error, showGrid, onToggleGrid, onNewCanvas }: GridPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const demoResult = useMemo(() => generateDemoResult(), []);
  const BASE_CELL = 16;

  // ---- Draw demo canvas ----
  useEffect(() => {
    if (result || isProcessing || !demoCanvasRef.current) return;

    const canvas = demoCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { grid, colorMap, width, height } = demoResult;
    const cellSize = 12;
    const gridLineWidth = 1;

    canvas.width = width * (cellSize + gridLineWidth) + gridLineWidth;
    canvas.height = height * (cellSize + gridLineWidth) + gridLineWidth;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIdx = grid[y][x];
        const px = gridLineWidth + x * (cellSize + gridLineWidth);
        const py = gridLineWidth + y * (cellSize + gridLineWidth);
        ctx.fillStyle = colorMap[colorIdx].hex;
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }

    // Grid lines
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = 0; y <= height; y++) {
      const py = y * (cellSize + gridLineWidth);
      ctx.fillRect(0, py, canvas.width, gridLineWidth);
    }
    for (let x = 0; x <= width; x++) {
      const px = x * (cellSize + gridLineWidth);
      ctx.fillRect(px, 0, gridLineWidth, canvas.height);
    }
  }, [result, isProcessing, demoResult]);

  // ---- Draw result canvas ----
  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { grid, colorMap, width, height } = result;
    const cellSize = Math.max(4, Math.floor(BASE_CELL * zoom));
    const gridLineWidth = showGrid ? 1 : 0;

    canvas.width = width * (cellSize + gridLineWidth) + gridLineWidth;
    canvas.height = height * (cellSize + gridLineWidth) + gridLineWidth;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIdx = grid[y][x];
        const px = gridLineWidth + x * (cellSize + gridLineWidth);
        const py = gridLineWidth + y * (cellSize + gridLineWidth);

        if (colorIdx < 0) {
          drawCheckerboard(ctx, px, py, cellSize);
        } else {
          ctx.fillStyle = colorMap[colorIdx].hex;
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      }
    }

    if (showGrid) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y <= height; y++) {
        const py = y * (cellSize + gridLineWidth);
        ctx.fillRect(0, py, canvas.width, gridLineWidth);
      }
      for (let x = 0; x <= width; x++) {
        const px = x * (cellSize + gridLineWidth);
        ctx.fillRect(px, 0, gridLineWidth, canvas.height);
      }
    }

    if (hoveredCell && hoveredCell.x >= 0 && hoveredCell.x < width && hoveredCell.y >= 0 && hoveredCell.y < height) {
      const px = gridLineWidth + hoveredCell.x * (cellSize + gridLineWidth);
      const py = gridLineWidth + hoveredCell.y * (cellSize + gridLineWidth);
      ctx.strokeStyle = '#E85D75';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }, [result, zoom, showGrid, hoveredCell]);

  // ---- Mouse handlers for result canvas ----
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
            text: `${color.name} ${color.code}${stat ? ` | ${stat.count}粒` : ''}`,
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

  // ==================================================================
  // Loading state
  // ==================================================================
  if (isProcessing) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 border-[3px] border-[#E8E8EA] rounded-full" />
            <div className="absolute inset-0 border-[3px] border-t-[#E85D75] rounded-full animate-spin" />
          </div>
          <p className="text-sm text-[#8E8E93]">正在生成拼豆图纸...</p>
        </div>
      </div>
    );
  }

  // ==================================================================
  // Demo state (no result yet) — 40×40 demo pattern + new canvas button
  // ==================================================================
  // Show error if processing failed
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
          <div className="w-14 h-14 rounded-xl bg-red-50 border-2 border-red-200 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-sm font-medium text-[#E85D75]">处理失败</p>
          <p className="text-xs text-[#8E8E93] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-5 px-4">
        {/* Demo canvas */}
        <div className="bg-white rounded-xl border border-[#E8E8EA]/80 shadow-sm p-3 overflow-auto">
          <canvas
            ref={demoCanvasRef}
            className="mx-auto"
            style={{ imageRendering: 'pixelated', maxWidth: '100%' }}
          />
        </div>

        {/* Info + button */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h3 className="text-sm font-semibold text-[#1C1C1E]">
            从零开始设计你的拼豆图纸
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-xs leading-relaxed">
            使用画板工具，自由绘制像素图案，支持多种品牌色号
          </p>
          <button
            onClick={onNewCanvas}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            <PenLine size={16} />
            新建画板
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================
  // Result state — actual bead grid
  // ==================================================================
  return (
    <div className="flex-1 flex flex-col min-h-[400px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-[#8E8E93]">
          {result.width} × {result.height} 格 · {result.colorMap.length} 色
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="btn-ghost p-1.5" title="缩小">
            <ZoomOut size={15} />
          </button>
          <span className="text-xs text-[#8E8E93] w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="btn-ghost p-1.5" title="放大">
            <ZoomIn size={15} />
          </button>
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded-lg border transition-all ${showGrid ? 'bg-[#E85D75] text-white border-[#E85D75]' : 'bg-white text-[#8E8E93] border-[#E8E8EA] hover:border-[#E85D75]'}`}
            title={showGrid ? '隐藏网格' : '显示网格'}
          >
            <Grid3X3 size={15} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-xl border border-[#E8E8EA]/80 shadow-sm overflow-auto flex items-center justify-center p-4 relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="max-w-full max-h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-[#1C1C1E] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
