/**
 * SizeSettings - Preset sizes + custom width/height inputs
 */

import { useCallback, useState } from 'react';
import { SIZE_PRESETS } from './size-presets';

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
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

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
    <div className="card-bean p-3">
      <h3 className="section-heading">尺寸设置</h3>

      {/* Presets */}
      <div className="space-y-0.5 mb-4">
        {presetsByCategory.map(({ cat, presets }) => (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              disabled={disabled}
              className="flex items-center justify-between w-full py-1.5 px-2 rounded-md hover:bg-[#F2F2F7] transition-colors text-left disabled:opacity-50"
            >
              <span className="text-xs font-medium text-[#1C1C1E]">{cat}</span>
              <span className="text-[#8E8E93] text-xs">{expandedCategories.has(cat) ? '−' : '+'}</span>
            </button>
            {expandedCategories.has(cat) && (
              <div className="grid grid-cols-3 gap-1.5 pl-2 mt-1">
                {presets.map((p) => {
                  const active = width === p.w && height === p.h;
                  return (
                    <button
                      key={p.label}
                      onClick={() => onChange(p.w, p.h)}
                      disabled={disabled}
                      className={`option-btn ${active ? 'active-primary' : 'inactive'}`}
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
          <label className="text-[10px] text-[#8E8E93] mb-1 block">宽度</label>
          <input
            type="number" value={width} onChange={handleWidth}
            disabled={disabled} min={5} max={100}
            className="w-full px-3 py-2 bg-[#F2F2F7] border border-[#E8E8EA] rounded-lg text-sm text-[#1C1C1E] outline-none focus:border-[#E85D75] focus:ring-1 focus:ring-[#E85D75]/20 transition-all"
          />
        </div>
        <div className="text-[#8E8E93] mt-5">×</div>
        <div className="flex-1">
          <label className="text-[10px] text-[#8E8E93] mb-1 block">高度</label>
          <input
            type="number" value={height} onChange={handleHeight}
            disabled={disabled} min={5} max={100}
            className="w-full px-3 py-2 bg-[#F2F2F7] border border-[#E8E8EA] rounded-lg text-sm text-[#1C1C1E] outline-none focus:border-[#E85D75] focus:ring-1 focus:ring-[#E85D75]/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
