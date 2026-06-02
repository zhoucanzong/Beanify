/**
 * EditorHeader - Top header with back button, title, size display, brand selector
 */

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Palette, Check, X, ChevronDown } from 'lucide-react';
import { BRAND_LIST } from '../engine/database';

interface EditorHeaderProps {
  title: string;
  width: number;
  height: number;
  brand: string;
  onBack: () => void;
  onBrandChange: (brand: string) => void;
  onSizeChange: (w: number, h: number) => void;
}

export default function EditorHeader({
  title,
  width,
  height,
  brand,
  onBack,
  onBrandChange,
  onSizeChange,
}: EditorHeaderProps) {
  const [showSizeEdit, setShowSizeEdit] = useState(false);
  const [editW, setEditW] = useState(width);
  const [editH, setEditH] = useState(height);
  const sizePopupRef = useRef<HTMLDivElement>(null);

  // Sync edit values when width/height changes externally
  useEffect(() => {
    setEditW(width);
    setEditH(height);
  }, [width, height]);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sizePopupRef.current && !sizePopupRef.current.contains(e.target as Node)) {
        setShowSizeEdit(false);
      }
    }
    if (showSizeEdit) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSizeEdit]);

  const handleSizeApply = () => {
    const w = Math.max(8, Math.min(128, editW));
    const h = Math.max(8, Math.min(128, editH));
    onSizeChange(w, h);
    setShowSizeEdit(false);
  };

  const handleSizeCancel = () => {
    setEditW(width);
    setEditH(height);
    setShowSizeEdit(false);
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 select-none z-10">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
          title="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-[#FF6B6B]" />
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        </div>
      </div>

      {/* Center: Size display + edit */}
      <div className="relative" ref={sizePopupRef}>
        <button
          onClick={() => setShowSizeEdit(!showSizeEdit)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-150 text-sm text-gray-700 border border-gray-200"
        >
          <span className="font-mono font-medium">
            {width} × {height}
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {/* Size edit popup */}
        {showSizeEdit && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-52 z-50">
            <div className="text-xs text-gray-500 mb-3">调整画布尺寸</div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 block mb-1">宽</label>
                <input
                  type="number"
                  value={editW}
                  onChange={(e) => setEditW(parseInt(e.target.value) || 0)}
                  min={8}
                  max={128}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#FF6B6B] text-center font-mono"
                />
              </div>
              <span className="text-gray-400 mt-5">×</span>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 block mb-1">高</label>
                <input
                  type="number"
                  value={editH}
                  onChange={(e) => setEditH(parseInt(e.target.value) || 0)}
                  min={8}
                  max={128}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#FF6B6B] text-center font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSizeCancel}
                className="flex-1 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all text-xs"
              >
                <X size={14} className="mr-1" />
                取消
              </button>
              <button
                onClick={handleSizeApply}
                className="flex-1 h-8 flex items-center justify-center rounded-lg bg-[#FF6B6B] text-white hover:bg-[#ff5252] transition-all text-xs"
              >
                <Check size={14} className="mr-1" />
                确定
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Brand selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">品牌</span>
        <div className="relative">
          <select
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] cursor-pointer hover:bg-gray-100 transition-all"
          >
            {BRAND_LIST.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
