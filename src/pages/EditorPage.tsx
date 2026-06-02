/**
 * EditorPage - Main editor page that assembles all editor components
 * Layout: Header | (ToolSidebar + PixelCanvas + ColorPanel) | Toolbar
 * Supports URL params for loading initial state from result page
 */

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useEditor } from '../editor/useEditor';
import EditorHeader from '../editor/EditorHeader';
import ToolSidebar from '../editor/ToolSidebar';
import PixelCanvas from '../editor/PixelCanvas';
import ColorPanel from '../editor/ColorPanel';
import EditorToolbar from '../editor/EditorToolbar';
import type { BeadColor } from '../engine/types';

// Parse grid data from base64 string
function parseGridFromBase64(data: string): number[][] | null {
  try {
    const json = atob(decodeURIComponent(data));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Parse color palette from base64 string
function parsePaletteFromBase64(data: string): BeadColor[] | null {
  try {
    const json = atob(decodeURIComponent(data));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function EditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse URL params for initial state
  const initialOptions = useMemo(() => {
    const from = searchParams.get('from');
    const gridData = searchParams.get('grid');
    const paletteData = searchParams.get('palette');
    const w = parseInt(searchParams.get('w') || '29', 10);
    const h = parseInt(searchParams.get('h') || '29', 10);
    const brand = searchParams.get('brand') || 'mard';

    const options: Parameters<typeof useEditor>[0] = {
      width: w,
      height: h,
      brand,
    };

    if (from === 'result' && gridData) {
      const grid = parseGridFromBase64(gridData);
      if (grid) {
        options.grid = grid;
        options.width = grid[0]?.length || w;
        options.height = grid.length || h;
      }
    }

    if (paletteData) {
      const palette = parsePaletteFromBase64(paletteData);
      if (palette) {
        options.colorPalette = palette;
      }
    }

    return options;
  }, [searchParams]);

  const editor = useEditor(initialOptions);

  // Recently used colors state (max 8)
  const [recentColors, setRecentColors] = useState<number[]>([]);

  // Handle color select with recent tracking
  const handleColorSelect = useCallback(
    (index: number) => {
      editor.setColor(index);
      setRecentColors((prev) => {
        const next = [index, ...prev.filter((i) => i !== index)].slice(0, 8);
        return next;
      });
    },
    [editor]
  );

  // Export handlers
  const handleExportPNG = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `bead-pattern-${editor.width}x${editor.height}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [editor.width, editor.height]);

  const handleExportExcel = useCallback(() => {
    // Placeholder - will be implemented with actual Excel export logic
    alert('Excel导出功能即将上线');
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        editor.undo();
        return;
      }

      // Redo: Ctrl+Shift+Z
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        editor.redo();
        return;
      }

      // Tool shortcuts
      const toolMap: Record<string, import('../editor/types').ToolType> = {
        b: 'brush',
        e: 'eraser',
        f: 'fill',
        i: 'picker',
        l: 'line',
        r: 'rect',
        c: 'circle',
      };

      const tool = toolMap[e.key.toLowerCase()];
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
      {/* Top header */}
      <EditorHeader
        title="豆你玩画板"
        width={editor.width}
        height={editor.height}
        brand={editor.brand}
        onBack={handleBack}
        onBrandChange={editor.setBrand}
        onSizeChange={editor.setCanvasSize}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left tool sidebar */}
        <ToolSidebar
          activeTool={editor.activeTool}
          brushSize={editor.brushSize}
          onToolChange={editor.setTool}
          onBrushSizeChange={editor.setBrushSize}
        />

        {/* Center canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <PixelCanvas editor={editor} />
        </div>

        {/* Right color panel */}
        <ColorPanel
          colorPalette={editor.colorPalette}
          activeColorIndex={editor.activeColorIndex}
          recentColors={recentColors}
          brand={editor.brand}
          onColorSelect={handleColorSelect}
          onBrandChange={editor.setBrand}
        />
      </div>

      {/* Bottom toolbar */}
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
