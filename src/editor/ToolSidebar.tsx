/**
 * ToolSidebar - Left side tool selection panel
 * Shows 7 tool icons, highlights active tool, brush size slider at bottom
 */

import {
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Minus,
  Square,
  Circle,
} from 'lucide-react';
import type { ToolType } from './types';

interface ToolSidebarProps {
  activeTool: ToolType;
  brushSize: number;
  onToolChange: (tool: ToolType) => void;
  onBrushSizeChange: (size: number) => void;
}

const TOOLS: { type: ToolType; icon: React.ElementType; label: string; shortcut: string }[] = [
  { type: 'brush', icon: Pencil, label: '画笔', shortcut: 'B' },
  { type: 'eraser', icon: Eraser, label: '橡皮', shortcut: 'E' },
  { type: 'fill', icon: PaintBucket, label: '填充', shortcut: 'F' },
  { type: 'picker', icon: Pipette, label: '吸管', shortcut: 'I' },
  { type: 'line', icon: Minus, label: '直线', shortcut: 'L' },
  { type: 'rect', icon: Square, label: '矩形', shortcut: 'R' },
  { type: 'circle', icon: Circle, label: '圆形', shortcut: 'C' },
];

export default function ToolSidebar({
  activeTool,
  brushSize,
  onToolChange,
  onBrushSizeChange,
}: ToolSidebarProps) {
  return (
    <div className="w-14 bg-[#1a1a2e] flex flex-col items-center py-3 gap-1 select-none">
      {/* Tool buttons */}
      <div className="flex flex-col gap-1 flex-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.type;
          return (
            <button
              key={tool.type}
              onClick={() => onToolChange(tool.type)}
              className={`
                relative w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-150 group
                ${
                  isActive
                    ? 'bg-[#FF6B6B]/20 border border-[#FF6B6B] text-[#FF6B6B]'
                    : 'border border-transparent text-white/60 hover:bg-white/5 hover:text-white/90'
                }
              `}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />

              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a3e] text-white/90 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg border border-white/10">
                {tool.label}
                <span className="ml-1 text-white/50">{tool.shortcut}</span>
                <span className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-[#2a2a3e] rotate-45 border-l border-b border-white/10" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Brush size slider */}
      <div className="mt-auto pt-2 border-t border-white/10 w-full px-1.5">
        <div className="text-[10px] text-white/40 text-center mb-1.5">{brushSize}px</div>
        <div className="flex flex-col items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((size) => (
            <button
              key={size}
              onClick={() => onBrushSizeChange(size)}
              className={`
                rounded-full transition-all duration-150
                ${
                  brushSize === size
                    ? 'bg-[#FF6B6B] shadow-[0_0_6px_rgba(255,107,107,0.5)]'
                    : 'bg-white/20 hover:bg-white/40'
                }
              `}
              style={{
                width: `${6 + size * 3}px`,
                height: `${6 + size * 3}px`,
              }}
              title={`画笔大小 ${size}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
