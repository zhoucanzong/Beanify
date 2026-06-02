/**
 * SizeSettings component - Preset sizes + custom width/height inputs
 * Uses shared SIZE_PRESETS from ImageCropper for consistency
 */

import { useCallback, useState } from 'react';
import { SIZE_PRESETS } from './ImageCropper';

interface SizeSettingsProps {
  width: number;
  height: number;
  onChange: (w: number, h: number) => void;
  disabled?: boolean;
}

const CATEGORIES = ['方形', '竖版', '横版', '手机壁纸', '宽屏'];

export default function SizeSettings({ width, height, onChange, disabled }: SizeSettingsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['方形']));

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handlePreset = useCallback(
    (w: number, h: number) => {
      onChange(w, h);
    },
    [onChange]
  );

  const handleWidth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const w = Math.max(5, Math.min(100, parseInt(e.target.value) || 29));
      onChange(w, height);
    },
    [height, onChange]
  );

  const handleHeight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const h = Math.max(5, Math.min(100, parseInt(e.target.value) || 29));
      onChange(width, h);
    },
    [width, onChange]
  );

  const presetsByCategory = CATEGORIES.map((cat) => ({
    cat,
    presets: SIZE_PRESETS.filter((p) => p.category === cat),
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-[#2D3436] mb-3">{'尺寸设置'}</h3>

      {/* Preset buttons by category */}
      <div className="space-y-1 mb-4">
        {presetsByCategory.map(({ cat, presets }) => (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              disabled={disabled}
              className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#FAFAF8] transition-colors text-left disabled:opacity-50"
            >
              <span className="text-xs font-medium text-[#2D3436]">{cat}</span>
              <span className="text-[#8A8D91] text-xs">{expandedCategories.has(cat) ? '−' : '+'}</span>
            </button>
            {expandedCategories.has(cat) && (
              <div className="grid grid-cols-3 gap-1.5 pl-2 mt-1">
                {presets.map((p) => {
                  const active = width === p.w && height === p.h;
                  return (
                    <button
                      key={`${p.label}-${cat}`}
                      onClick={() => handlePreset(p.w, p.h)}
                      disabled={disabled}
                      className={`
                        py-1.5 px-1 rounded-lg text-xs font-medium border transition-all duration-150
                        ${
                          active
                            ? 'bg-[#FF6B6B] text-white border-[#FF6B6B] shadow-sm'
                            : 'bg-[#FAFAF8] text-[#2D3436] border-[#E8E8E8] hover:border-[#FF6B6B] hover:text-[#FF6B6B]'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-[#8A8D91] mb-1 block">{'宽度'}</label>
          <input
            type="number"
            value={width}
            onChange={handleWidth}
            disabled={disabled}
            min={5}
            max={100}
            className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E8E8E8] rounded-lg text-sm text-[#2D3436] outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="text-[#8A8D91] mt-5">{'×'}</div>
        <div className="flex-1">
          <label className="text-xs text-[#8A8D91] mb-1 block">{'高度'}</label>
          <input
            type="number"
            value={height}
            onChange={handleHeight}
            disabled={disabled}
            min={5}
            max={100}
            className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E8E8E8] rounded-lg text-sm text-[#2D3436] outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
}
