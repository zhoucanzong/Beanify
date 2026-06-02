/**
 * ColorPanel - Right side color palette panel
 * Shows search, current color preview, recently used, and all colors grid
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { BeadColor } from '../engine/types';
import { BRAND_LIST } from '../engine/database';

interface ColorPanelProps {
  colorPalette: BeadColor[];
  activeColorIndex: number;
  recentColors: number[];
  brand: string;
  onColorSelect: (index: number) => void;
  onBrandChange?: (brand: string) => void;
}

export default function ColorPanel({
  colorPalette,
  activeColorIndex,
  recentColors,
  brand,
  onColorSelect,
  onBrandChange,
}: ColorPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const activeColor = colorPalette[activeColorIndex];

  // Filter colors by search query
  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) return colorPalette;
    const q = searchQuery.toLowerCase().trim();
    return colorPalette.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q)
    );
  }, [colorPalette, searchQuery]);

  // Group colors by hue family for display
  const groupedColors = useMemo(() => {
    const groups: { label: string; colors: { color: BeadColor; index: number }[] }[] = [];
    const misc: { color: BeadColor; index: number }[] = [];

    // Track which palette indices we've grouped
    const usedIndices = new Set<number>();

    // Define color families by hue ranges
    const families = [
      { label: '红色', minHue: 330, maxHue: 15 },
      { label: '橙色', minHue: 15, maxHue: 45 },
      { label: '黄色', minHue: 45, maxHue: 65 },
      { label: '绿色', minHue: 65, maxHue: 160 },
      { label: '青色', minHue: 160, maxHue: 200 },
      { label: '蓝色', minHue: 200, maxHue: 260 },
      { label: '紫色', minHue: 260, maxHue: 330 },
    ];

    // Get hue from RGB
    function getHue(r: number, g: number, b: number): number {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max === min) return -1; // grayscale

      let hue = 0;
      const d = max - min;
      if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) hue = ((b - r) / d + 2) * 60;
      else hue = ((r - g) / d + 4) * 60;
      return hue;
    }

    // For filtered results, don't group - just show flat list
    if (searchQuery.trim()) {
      return [
        {
          label: `搜索结果 (${filteredColors.length})`,
          colors: filteredColors.map((c) => ({
            color: c,
            index: colorPalette.indexOf(c),
          })),
        },
      ];
    }

    // Group by hue family
    for (const family of families) {
      const group: { color: BeadColor; index: number }[] = [];
      filteredColors.forEach((color, idx) => {
        if (usedIndices.has(idx)) return;
        const [r, g, b] = color.rgb;
        const hue = getHue(r, g, b);
        if (hue < 0) return; // skip grayscale for now

        const inRange =
          family.minHue > family.maxHue
            ? hue >= family.minHue || hue < family.maxHue
            : hue >= family.minHue && hue < family.maxHue;

        if (inRange) {
          group.push({ color, index: colorPalette.indexOf(color) });
          usedIndices.add(idx);
        }
      });

      if (group.length > 0) {
        groups.push({ label: family.label, colors: group });
      }
    }

    // Remaining colors go to misc
    filteredColors.forEach((color, idx) => {
      if (!usedIndices.has(idx)) {
        misc.push({ color, index: colorPalette.indexOf(color) });
      }
    });
    if (misc.length > 0) {
      groups.push({ label: '其他', colors: misc });
    }

    return groups;
  }, [filteredColors, colorPalette, searchQuery]);

  return (
    <div className="w-60 bg-white flex flex-col h-full select-none border-l border-white/10">
      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索色号或颜色..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]/20 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Current color preview */}
      {activeColor && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.3)] flex-shrink-0"
              style={{ backgroundColor: activeColor.hex }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {activeColor.name}
              </div>
              <div className="text-xs text-gray-500">{activeColor.code}</div>
              <div className="text-[10px] text-gray-400 font-mono">{activeColor.hex}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">最近使用</div>
          <div className="flex gap-1 flex-wrap">
            {recentColors.map((colorIdx, i) => {
              const color = colorPalette[colorIdx];
              if (!color) return null;
              return (
                <button
                  key={`${colorIdx}-${i}`}
                  onClick={() => onColorSelect(colorIdx)}
                  className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} ${color.code}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Color groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {groupedColors.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="px-3 py-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              {group.label}
            </div>
            <div className="px-3 grid grid-cols-6 gap-1">
              {group.colors.map(({ color, index }) => {
                const isActive = index === activeColorIndex;
                return (
                  <button
                    key={color.id}
                    onClick={() => onColorSelect(index)}
                    className={`
                      w-8 h-8 rounded-md transition-all duration-150 group relative
                      ${
                        isActive
                          ? 'ring-2 ring-[#FF6B6B] ring-offset-1 shadow-[0_0_8px_rgba(255,107,107,0.4)] scale-110 z-10'
                          : 'hover:scale-110 hover:z-10 border border-gray-200/50'
                      }
                    `}
                    style={{ backgroundColor: color.hex }}
                  >
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#1a1a2e] text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                      {color.name} {color.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Brand selector */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">品牌色板</span>
          <select
            value={brand}
            onChange={(e) => onBrandChange?.(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-[#FF6B6B] cursor-pointer"
          >
            {BRAND_LIST.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
