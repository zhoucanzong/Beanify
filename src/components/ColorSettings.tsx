/**
 * ColorSettings component - Color count slider + brand selection
 */

import { useCallback } from 'react';
import { BRAND_LIST } from '../engine/database';

interface ColorSettingsProps {
  maxColors: number;
  brand: string;
  onColorCountChange: (count: number) => void;
  onBrandChange: (brand: string) => void;
  actualColorCount?: number;
  disabled?: boolean;
}

export default function ColorSettings({
  maxColors,
  brand,
  onColorCountChange,
  onBrandChange,
  actualColorCount,
  disabled,
}: ColorSettingsProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onColorCountChange(parseInt(e.target.value));
    },
    [onColorCountChange]
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-[#2D3436] mb-3">{'\u989c\u8272\u8bbe\u7f6e'}</h3>

      {/* Color count slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#8A8D91]">{'\u989c\u8272\u6570\u91cf'}</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#FF6B6B] tabular-nums">{maxColors}</span>
            {actualColorCount !== undefined && actualColorCount !== maxColors && (
              <span className="text-xs text-[#8A8D91]">
                ({'\u5b9e\u9645\u4f7f\u7528'} {actualColorCount} {'\u8272'})
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="range"
            min={8}
            max={64}
            value={maxColors}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-[#E8E8E8] rounded-full appearance-none cursor-pointer accent-[#FF6B6B] disabled:opacity-50"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#8A8D91]">8</span>
            <span className="text-[10px] text-[#8A8D91]">64</span>
          </div>
        </div>
      </div>

      {/* Brand selection */}
      <div>
        <label className="text-xs text-[#8A8D91] mb-2 block">{'\u54c1\u724c\u8272\u677f'}</label>
        <div className="grid grid-cols-2 gap-2">
          {BRAND_LIST.map((b) => {
            const active = brand === b.id;
            return (
              <button
                key={b.id}
                onClick={() => onBrandChange(b.id)}
                disabled={disabled}
                className={`
                  py-2 px-3 rounded-lg text-xs font-medium border transition-all duration-150 text-left
                  ${
                    active
                      ? 'bg-[#FF6B6B] text-white border-[#FF6B6B] shadow-sm'
                      : 'bg-[#FAFAF8] text-[#2D3436] border-[#E8E8E8] hover:border-[#FF6B6B] hover:text-[#FF6B6B]'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="font-semibold">{b.name}</div>
                <div className={`text-[10px] mt-0.5 ${active ? 'text-white/70' : 'text-[#8A8D91]'}`}>
                  {b.colors} {'\u8272'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
