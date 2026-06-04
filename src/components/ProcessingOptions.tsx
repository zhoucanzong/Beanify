/**
 * ProcessingOptions - Denoise, noise filter, background removal, common colors
 */

import { Sparkles, Eraser, Palette } from 'lucide-react';

interface ProcessingOptionsProps {
  denoiseStrength: number;
  noiseFilter: boolean;
  removeBackground: boolean;
  useCommonColors: boolean;
  onDenoiseChange: (strength: number) => void;
  onNoiseFilterChange: (enabled: boolean) => void;
  onBackgroundRemovalChange: (enabled: boolean) => void;
  onCommonColorsChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const DENOISE_LEVELS = [
  { value: 0, label: '关闭' },
  { value: 1, label: '弱' },
  { value: 2, label: '中' },
  { value: 3, label: '强' },
];

export default function ProcessingOptions({
  denoiseStrength, noiseFilter, removeBackground, useCommonColors,
  onDenoiseChange, onNoiseFilterChange, onBackgroundRemovalChange, onCommonColorsChange, disabled,
}: ProcessingOptionsProps) {
  return (
    <div className="card-bean p-3">
      <h3 className="section-heading">处理选项</h3>

      {/* Denoise */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-[#E85D75]" />
          <label className="text-xs text-[#8E8E93]">降噪强度</label>
        </div>
        <div className="flex gap-1">
          {DENOISE_LEVELS.map((level) => {
            const active = denoiseStrength === level.value;
            return (
              <button
                key={level.value}
                onClick={() => onDenoiseChange(level.value)} disabled={disabled}
                className={`option-btn ${active ? 'active-secondary' : 'inactive'}`}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {[
          { label: '杂色过滤', icon: Eraser, value: noiseFilter, onChange: onNoiseFilterChange },
          { label: '背景移除', icon: null, value: removeBackground, onChange: onBackgroundRemovalChange },
          { label: '常用色优先', icon: Palette, value: useCommonColors, onChange: onCommonColorsChange },
        ].map(({ label, icon: Icon, value, onChange }) => (
          <label
            key={label}
            className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all cursor-pointer
              ${value ? 'bg-[#FFF0F2] border-[#E85D75]/20' : 'bg-[#F2F2F7] border-[#E8E8EA] hover:border-[#D1D1D6]'}
              ${disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon size={13} className="text-[#E85D75]" />}
              {!Icon && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 3l18 18" />
                </svg>
              )}
              <span className="text-sm text-[#1C1C1E]">{label}</span>
            </div>
            <div
              className={`toggle-bg ${value ? 'active' : 'inactive'}`}
              onClick={() => !disabled && onChange(!value)}
            >
              <div className={`toggle-knob ${value ? 'active' : 'inactive'}`} />
            </div>
            <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="sr-only" />
          </label>
        ))}
      </div>
    </div>
  );
}
