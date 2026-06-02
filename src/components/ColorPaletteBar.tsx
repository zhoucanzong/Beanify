/**
 * ColorPaletteBar component - Horizontal scrolling bar of all used colors
 */

import type { ProcessResult } from '../engine/types';

interface ColorPaletteBarProps {
  result: ProcessResult | null;
}

export default function ColorPaletteBar({ result }: ColorPaletteBarProps) {
  if (!result) return null;

  const { colorMap, stats } = result;
  const sortedStats = [...stats].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white border-t border-[#E8E8E8] h-[80px] flex items-center px-4 gap-3 overflow-hidden">
      <div className="text-xs text-[#8A8D91] flex-shrink-0">
        <span className="font-semibold text-[#2D3436]">{colorMap.length}</span>
        {' \u79cd\u989c\u8272'}
      </div>

      {/* Scrollable color strip */}
      <div className="flex-1 overflow-x-auto flex items-center gap-1.5 h-full py-2 scrollbar-thin">
        {sortedStats.map((stat) => {
          const color = colorMap[stat.colorIndex];
          if (!color) return null;
          return (
            <div
              key={color.id}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-[#FAFAF8] transition-colors cursor-pointer min-w-[52px]"
              title={`${color.name} ${color.code}: ${stat.count}\u7c92 (${stat.percentage.toFixed(1)}%)`}
            >
              <div
                className="w-8 h-8 rounded-lg border border-black/10 shadow-sm"
                style={{ backgroundColor: color.hex }}
              />
              <div className="text-[10px] text-[#8A8D91] tabular-nums truncate max-w-full">{color.code}</div>
              <div className="text-[9px] text-[#8A8D91] tabular-nums">{stat.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
