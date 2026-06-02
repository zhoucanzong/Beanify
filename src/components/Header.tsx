/**
 * Header component - Logo + App name + description
 * "豆你玩" branding with premium bead-style logo
 */

export default function Header() {
  return (
    <header className="bg-white border-b border-[#E8E8E8] sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center gap-3">
        {/* Upgraded Logo -精致的拼豆风格图标 */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8E8E] to-[#FFB4B4] flex items-center justify-center shadow-md shadow-[#FF6B6B]/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" fill="white" fillOpacity="0.95"/>
            <circle cx="9" cy="10" r="1.5" fill="#FF6B6B"/>
            <circle cx="15" cy="10" r="1.5" fill="#FF6B6B"/>
            <path d="M8 14c1.5 2 4.5 2 6 0" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        {/* Title area */}
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-extrabold text-[#2D3436] tracking-tight">豆你玩</h1>
          <span className="text-[11px] text-[#8A8D91] font-medium tracking-wide">DOUBEAN - 拼豆图纸生成器</span>
        </div>

        {/* Right side description */}
        <div className="hidden md:block ml-auto">
          <p className="text-xs text-[#8A8D91]">
            照片一键转拼豆图纸 · 智能减少色号 · 材料自动统计
          </p>
        </div>
      </div>
    </header>
  );
}
