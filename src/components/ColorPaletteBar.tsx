/**
 * ColorPaletteBar - Horizontal scrolling color strip at bottom
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
    <div className="bg-white/80 backdrop-blur-sm border-t border-[#E8E8EA] h-[72px] flex items-center px-4 gap-3 overflow-hidden">
      <div className="text-xs text-[#8E8E93] flex-shrink-0">
        <span className="font-semibold text-[#1C1C1E]">{colorMap.length}</span> 种颜色
      </div>

      <div className="flex-1 overflow-x-auto flex items-center gap-1.5 h-full py-2 scrollbar-thin">
        {sortedStats.map((stat) => {
          const color = colorMap[stat.colorIndex];
          if (!color) return null;
          return (
            <div
              key={color.id}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-[#F2F2F7] transition-colors cursor-pointer min-w-[48px]"
              title={`${color.name} ${color.code}: ${stat.count}粒 (${stat.percentage.toFixed(1)}%)`}
            >
              <div className="w-7 h-7 rounded-md border border-black/10 shadow-sm" style={{ backgroundColor: color.hex }} />
              <div className="text-[10px] text-[#8E8E93] tabular-nums truncate max-w-full">{color.code}</div>
              <div className="text-[9px] text-[#8E8E93]/70 tabular-nums">{stat.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
