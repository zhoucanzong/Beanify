/**
 * EditorToolbar - Bottom toolbar with undo/redo, zoom, grid toggle, export buttons
 */

import {
  Undo2,
  Redo2,
  Trash2,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  showGrid: boolean;
  gridSize: string;
  colorCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleGrid: () => void;
  onExportPNG: () => void;
  onExportExcel: () => void;
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
  variant = 'default',
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative h-8 px-2 rounded-lg flex items-center justify-center
        transition-all duration-150 group
        ${
          disabled
            ? 'opacity-30 cursor-not-allowed text-gray-500'
            : variant === 'danger'
            ? 'text-gray-600 hover:bg-red-50 hover:text-red-500 cursor-pointer'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
        }
      `}
      title={title}
    >
      {children}
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#1a1a2e] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
        {title}
      </span>
    </button>
  );
}

export default function EditorToolbar({
  canUndo,
  canRedo,
  zoom,
  showGrid,
  gridSize,
  colorCount,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleGrid,
  onExportPNG,
  onExportExcel,
}: EditorToolbarProps) {
  return (
    <div className="h-12 bg-white border-t border-gray-200 flex items-center justify-between px-4 select-none z-10">
      {/* Left: Undo / Redo / Clear */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
          <Undo2 size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
          <Redo2 size={18} />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={onClear} title="清空画布" variant="danger">
          <Trash2 size={18} />
        </ToolbarButton>
      </div>

      {/* Center: Zoom + Grid */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onZoomOut} title="缩小">
          <ZoomOut size={18} />
        </ToolbarButton>
        <button
          onClick={onZoomReset}
          className="h-8 px-2 rounded-lg text-xs font-mono text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 min-w-[48px] text-center"
          title="重置缩放"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolbarButton onClick={onZoomIn} title="放大">
          <ZoomIn size={18} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          onClick={onToggleGrid}
          title={showGrid ? '隐藏网格' : '显示网格'}
        >
          <Grid3x3
            size={18}
            className={showGrid ? 'text-[#FF6B6B]' : 'text-gray-400'}
          />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <span className="text-xs text-gray-400">
          {gridSize} · {colorCount}色
        </span>
      </div>

      {/* Right: Export */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onExportPNG} title="导出 PNG 图片">
          <FileImage size={18} />
          <span className="ml-1 text-xs">PNG</span>
        </ToolbarButton>
        <ToolbarButton onClick={onExportExcel} title="导出 Excel 图纸">
          <FileSpreadsheet size={18} />
          <span className="ml-1 text-xs">Excel</span>
        </ToolbarButton>
      </div>
    </div>
  );
}
