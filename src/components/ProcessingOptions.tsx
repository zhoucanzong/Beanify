/**
 * ProcessingOptions component - Denoise, noise filter, background removal toggles
 */

import { VolumeX, Volume1, Volume2, Volume, Sparkles, Eraser, Palette } from 'lucide-react';

interface ProcessingOptionsProps {
  denoiseStrength: number; // 0-3
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
  { value: 0, label: '\u5173\u95ed', icon: VolumeX },
  { value: 1, label: '\u5f31', icon: Volume1 },
  { value: 2, label: '\u4e2d', icon: Volume2 },
  { value: 3, label: '\u5f3a', icon: Volume },
];

export default function ProcessingOptions({
  denoiseStrength,
  noiseFilter,
  removeBackground,
  useCommonColors,
  onDenoiseChange,
  onNoiseFilterChange,
  onBackgroundRemovalChange,
  onCommonColorsChange,
  disabled,
}: ProcessingOptionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-[#2D3436] mb-3">{'\u5904\u7406\u9009\u9879'}</h3>

      {/* Denoise strength */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={14} className="text-[#FF6B6B]" />
          <label className="text-xs text-[#8A8D91]">{'\u964d\u566a\u5f3a\u5ea6'}</label>
        </div>
        <div className="flex gap-1">
          {DENOISE_LEVELS.map((level) => {
            const Icon = level.icon;
            const active = denoiseStrength === level.value;
            return (
              <button
                key={level.value}
                onClick={() => onDenoiseChange(level.value)}
                disabled={disabled}
                className={`
                  flex-1 py-1.5 px-1 rounded-lg text-xs font-medium border transition-all duration-150
                  flex items-center justify-center gap-1
                  ${
                    active
                      ? 'bg-[#4ECDC4] text-white border-[#4ECDC4] shadow-sm'
                      : 'bg-[#FAFAF8] text-[#2D3436] border-[#E8E8E8] hover:border-[#4ECDC4] hover:text-[#4ECDC4]'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon size={12} />
                {level.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle options */}
      <div className="space-y-2.5">
        {/* Noise filter toggle */}
        <label
          className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all cursor-pointer
            ${noiseFilter ? 'bg-[#FFF5F5] border-[#FF6B6B]/30' : 'bg-[#FAFAF8] border-[#E8E8E8] hover:border-[#D0D0D0]'}
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            <Eraser size={14} className="text-[#FF6B6B]" />
            <span className="text-sm text-[#2D3436]">{'\u6742\u8272\u8fc7\u6ee4'}</span>
          </div>
          <div
            className={`
              relative w-9 h-5 rounded-full transition-all duration-200
              ${noiseFilter ? 'bg-[#FF6B6B]' : 'bg-[#D0D0D0]'}
            `}
            onClick={() => !disabled && onNoiseFilterChange(!noiseFilter)}
          >
            <div
              className={`
                absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200
                ${noiseFilter ? 'left-[18px]' : 'left-[2px]'}
              `}
            />
          </div>
          <input
            type="checkbox"
            checked={noiseFilter}
            onChange={(e) => onNoiseFilterChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
        </label>

        {/* Background removal toggle */}
        <label
          className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all cursor-pointer
            ${removeBackground ? 'bg-[#FFF5F5] border-[#FF6B6B]/30' : 'bg-[#FAFAF8] border-[#E8E8E8] hover:border-[#D0D0D0]'}
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 3l18 18" />
            </svg>
            <span className="text-sm text-[#2D3436]">{'\u80cc\u666f\u79fb\u9664'}</span>
          </div>
          <div
            className={`
              relative w-9 h-5 rounded-full transition-all duration-200
              ${removeBackground ? 'bg-[#FF6B6B]' : 'bg-[#D0D0D0]'}
            `}
            onClick={() => !disabled && onBackgroundRemovalChange(!removeBackground)}
          >
            <div
              className={`
                absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200
                ${removeBackground ? 'left-[18px]' : 'left-[2px]'}
              `}
            />
          </div>
          <input
            type="checkbox"
            checked={removeBackground}
            onChange={(e) => onBackgroundRemovalChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
        </label>

        {/* Common colors priority toggle */}
        <label
          className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all cursor-pointer
            ${useCommonColors ? 'bg-[#FFF5F5] border-[#FF6B6B]/30' : 'bg-[#FAFAF8] border-[#E8E8E8] hover:border-[#D0D0D0]'}
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-[#FF6B6B]" />
            <span className="text-sm text-[#2D3436]">{'\u5e38\u7528\u8272\u4f18\u5148'}</span>
          </div>
          <div
            className={`
              relative w-9 h-5 rounded-full transition-all duration-200
              ${useCommonColors ? 'bg-[#FF6B6B]' : 'bg-[#D0D0D0]'}
            `}
            onClick={() => !disabled && onCommonColorsChange(!useCommonColors)}
          >
            <div
              className={`
                absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200
                ${useCommonColors ? 'left-[18px]' : 'left-[2px]'}
              `}
            />
          </div>
          <input
            type="checkbox"
            checked={useCommonColors}
            onChange={(e) => onCommonColorsChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
}
