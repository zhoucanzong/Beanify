/**
 * Header component - Clean, minimal branding
 */

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-[#E8E8EA] sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E85D75] via-[#F0788C] to-[#F59CA8] flex items-center justify-center shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="white" fillOpacity="0.95"/>
              <circle cx="9" cy="10" r="1.5" fill="#E85D75"/>
              <circle cx="15" cy="10" r="1.5" fill="#E85D75"/>
              <path d="M8 14c1.5 2 4.5 2 6 0" stroke="#E85D75" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1C1C1E] tracking-tight">豆你玩</h1>
            <p className="text-[10px] text-[#8E8E93] leading-none -mt-0.5">拼豆图纸生成器</p>
          </div>
        </div>

        {/* Tagline - desktop only */}
        <p className="hidden md:block text-xs text-[#8E8E93]">
          图片一键转拼豆图纸 · 智能色号匹配 · 材料自动统计
        </p>
      </div>
    </header>
  );
}
