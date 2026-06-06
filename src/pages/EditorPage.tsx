/**
 * EditorPage - Main editor page that assembles all editor components.
 * Supports blank drawing, editing converted patterns, keyboard shortcuts, and exports.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useEditor } from '../editor/useEditor';
import EditorHeader from '../editor/EditorHeader';
import ToolSidebar from '../editor/ToolSidebar';
import PixelCanvas from '../editor/PixelCanvas';
import ColorPanel from '../editor/ColorPanel';
import EditorToolbar from '../editor/EditorToolbar';
import { downloadBlob, exportToExcel, exportToPNG } from '../engine/export';
import type { BeadColor, ColorStat, ProcessResult } from '../engine/types';
import type { ToolType } from '../editor/types';

function parseParamJSON<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch {
    try {
      return JSON.parse(atob(decodeURIComponent(data))) as T;
    } catch {
      return null;
    }
  }
}

function parseSize(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseGridParam(data: string): number[][] | null {
  const grid = parseParamJSON<number[][]>(data);
  if (!Array.isArray(grid) || !Array.isArray(grid[0])) return null;
  return grid;
}

function normalizePalette(palette: Partial<BeadColor>[], brand: string): BeadColor[] {
  return palette
    .filter((color): color is Partial<BeadColor> & {
      hex: string;
      rgb: [number, number, number];
      code: string;
    } => Boolean(color.hex && color.rgb && color.code))
    .map((color, index) => ({
      id: color.id || `${brand}-${color.code}-${index}`,
      name: color.name || color.nameEn || color.code,
      nameEn: color.nameEn || color.name || color.code,
      hex: color.hex,
      rgb: color.rgb,
      brand: color.brand || brand,
      code: color.code,
      isCommon: color.isCommon ?? true,
    }));
}

function parsePaletteParam(data: string, brand: string): BeadColor[] | null {
  const palette = parseParamJSON<Partial<BeadColor>[]>(data);
  if (!Array.isArray(palette)) return null;
  const normalized = normalizePalette(palette, brand);
  return normalized.length > 0 ? normalized : null;
}

function useInitialEditorOptions(searchParams: URLSearchParams) {
  return useMemo(() => {
    const gridData = searchParams.get('grid');
    const paletteData = searchParams.get('palette');
    const brand = searchParams.get('brand') || 'mard';
    const fallbackWidth = parseSize(searchParams.get('w'), 29);
    const fallbackHeight = parseSize(searchParams.get('h'), 29);
    const options: Parameters<typeof useEditor>[0] = {
      width: fallbackWidth,
      height: fallbackHeight,
      brand,
    };

    if (gridData) {
      const grid = parseGridParam(gridData);
      if (grid) {
        options.grid = grid;
        options.width = grid[0]?.length || fallbackWidth;
        options.height = grid.length || fallbackHeight;
      }
    }

    if (paletteData) {
      const palette = parsePaletteParam(paletteData, brand);
      if (palette) options.colorPalette = palette;
    }

    return options;
  }, [searchParams]);
}

function buildExportResult(
  grid: number[][],
  palette: BeadColor[],
  width: number,
  height: number
): ProcessResult {
  const usedPaletteIndices = Array.from(
    new Set(grid.flat().filter((index) => index >= 0 && index < palette.length))
  ).sort((a, b) => a - b);

  const paletteIndexMap = new Map<number, number>();
  usedPaletteIndices.forEach((paletteIndex, compactIndex) => {
    paletteIndexMap.set(paletteIndex, compactIndex);
  });

  const compactGrid = grid.map((row) =>
    row.map((paletteIndex) => paletteIndexMap.get(paletteIndex) ?? -1)
  );
  const colorMap = usedPaletteIndices.map((paletteIndex) => palette[paletteIndex]);
  const counts = new Array(colorMap.length).fill(0) as number[];
  let total = 0;

  compactGrid.forEach((row) => {
    row.forEach((colorIndex) => {
      if (colorIndex >= 0) {
        counts[colorIndex] += 1;
        total += 1;
      }
    });
  });

  const stats: ColorStat[] = counts
    .map((count, colorIndex) => ({
      colorIndex,
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
    }))
    .filter((stat) => stat.count > 0);

  return {
    grid: compactGrid,
    colorMap,
    stats,
    width,
    height,
    originalImage: '',
  };
}

function makeFilename(width: number, height: number, extension: string) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `bead-pattern-${width}x${height}-${timestamp}.${extension}`;
}

function confirmEmptyExport(grid: number[][]) {
  const hasPaintedCells = grid.some((row) => row.some((colorIndex) => colorIndex >= 0));
  return hasPaintedCells || window.confirm('画布还是空的，仍然导出吗？');
}

export default function EditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialOptions = useInitialEditorOptions(searchParams);
  const editor = useEditor(initialOptions);
  const [recentColors, setRecentColors] = useState<number[]>([]);

  const handleColorSelect = useCallback(
    (index: number) => {
      editor.setColor(index);
      setRecentColors((prev) => [index, ...prev.filter((i) => i !== index)].slice(0, 8));
    },
    [editor]
  );

  const handleExportPNG = useCallback(async () => {
    if (!confirmEmptyExport(editor.grid)) return;
    const result = buildExportResult(editor.grid, editor.colorPalette, editor.width, editor.height);
    const cellSize = editor.width > 80 || editor.height > 80 ? 20 : 32;
    const blob = exportToPNG(result, {
      cellSize,
      showGrid: editor.showGrid,
      showLabels: cellSize >= 28,
    });
    downloadBlob(blob, makeFilename(editor.width, editor.height, 'png'));
  }, [editor]);

  const handleExportExcel = useCallback(async () => {
    if (!confirmEmptyExport(editor.grid)) return;
    const result = buildExportResult(editor.grid, editor.colorPalette, editor.width, editor.height);
    const blob = exportToExcel(result, { brand: editor.brand });
    downloadBlob(blob, makeFilename(editor.width, editor.height, 'xlsx'));
  }, [editor]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === 'z') {
        e.preventDefault();
        editor.undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'z') {
        e.preventDefault();
        editor.redo();
        return;
      }

      const toolMap: Record<string, ToolType> = {
        b: 'brush',
        e: 'eraser',
        f: 'fill',
        i: 'picker',
        l: 'line',
        r: 'rect',
        c: 'circle',
      };
      const tool = toolMap[key];
      if (tool) {
        e.preventDefault();
        editor.setTool(tool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  return (
    <div className="h-screen flex flex-col bg-[#0d0d1a] overflow-hidden">
      <EditorHeader
        title="豆你玩画板"
        width={editor.width}
        height={editor.height}
        brand={editor.brand}
        onBack={handleBack}
        onBrandChange={editor.setBrand}
        onSizeChange={editor.setCanvasSize}
      />

      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar
          activeTool={editor.activeTool}
          brushSize={editor.brushSize}
          onToolChange={editor.setTool}
          onBrushSizeChange={editor.setBrushSize}
        />

        <div className="flex-1 relative overflow-hidden">
          <PixelCanvas editor={editor} />
        </div>

        <ColorPanel
          colorPalette={editor.colorPalette}
          activeColorIndex={editor.activeColorIndex}
          recentColors={recentColors}
          brand={editor.brand}
          onColorSelect={handleColorSelect}
          onBrandChange={editor.setBrand}
        />
      </div>

      <EditorToolbar
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        zoom={editor.zoom}
        showGrid={editor.showGrid}
        gridSize={`${editor.width} × ${editor.height}`}
        colorCount={editor.colorPalette.length}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onClear={editor.clearCanvas}
        onZoomIn={editor.zoomIn}
        onZoomOut={editor.zoomOut}
        onZoomReset={editor.zoomReset}
        onToggleGrid={editor.toggleGrid}
        onExportPNG={handleExportPNG}
        onExportExcel={handleExportExcel}
      />
    </div>
  );
}
