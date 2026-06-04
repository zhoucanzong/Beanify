/**
 * ColorSettings - Color count slider + brand selection
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
  maxColors, brand, onColorCountChange, onBrandChange, actualColorCount, disabled,
}: ColorSettingsProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onColorCountChange(parseInt(e.target.value)),
    [onColorCountChange]
  );

  return (
    <div className="card-bean p-3">
      <h3 className="section-heading">颜色设置</h3>

      {/* Color count slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#8E8E93]">颜色数量</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#E85D75] tabular-nums">{maxColors}</span>
            {actualColorCount !== undefined && actualColorCount !== maxColors && (
              <span className="text-xs text-[#8E8E93]">(实际 {actualColorCount} 色)</span>
            )}
          </div>
        </div>
        <input
          type="range" min={8} max={64} value={maxColors}
          onChange={handleSliderChange} disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#8E8E93]">8</span>
          <span className="text-[10px] text-[#8E8E93]">64</span>
        </div>
      </div>

      {/* Brand selection */}
      <div>
        <label className="text-xs text-[#8E8E93] mb-2 block">品牌色板</label>
        <div className="grid grid-cols-2 gap-1.5">
          {BRAND_LIST.map((b) => {
            const active = brand === b.id;
            return (
              <button
                key={b.id} onClick={() => onBrandChange(b.id)} disabled={disabled}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left
                  ${active ? 'bg-[#E85D75] text-white border-[#E85D75] shadow-sm' : 'bg-[#F2F2F7] text-[#1C1C1E] border-[#E8E8EA] hover:border-[#E85D75] hover:text-[#E85D75]'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="font-semibold">{b.name}</div>
                <div className={`text-[10px] mt-0.5 ${active ? 'text-white/70' : 'text-[#8E8E93]'}`}>{b.colors} 色</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
