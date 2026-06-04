/**
 * ImageCropper - Pixel-coordinate based, reliable image cropping
 * Redesigned to match the main app's light theme
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, Wand2 } from 'lucide-react';
import { SIZE_PRESETS } from './size-presets';

const CATEGORIES = ['方形', '竖版', '横版', '手机壁纸', '宽屏'];

interface CropPixelRect {
  x: number; y: number; w: number; h: number;
}

type CropMode = 'fixed' | 'free';

interface ImageCropperProps {
  imageUrl: string;
  initialWidth: number;
  initialHeight: number;
  onConfirm: (croppedUrl: string, width: number, height: number) => void;
  onCancel: () => void;
}

function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max); }

function getFittedCrop(imgRect: CropPixelRect, aspect: number, margin = 0.05): CropPixelRect {
  const availableW = imgRect.w * (1 - margin * 2);
  const availableH = imgRect.h * (1 - margin * 2);
  let w = availableW, h = w / aspect;
  if (h > availableH) { h = availableH; w = h * aspect; }
  return { x: imgRect.x + (imgRect.w - w) / 2, y: imgRect.y + (imgRect.h - h) / 2, w, h };
}

function fitCropAroundCenter(crop: CropPixelRect, imgRect: CropPixelRect, aspect: number): CropPixelRect {
  const centerX = crop.x + crop.w / 2, centerY = crop.y + crop.h / 2;
  const area = crop.w * crop.h;
  let w = Math.sqrt(area * aspect), h = w / aspect;
  if (w > imgRect.w) { w = imgRect.w; h = w / aspect; }
  if (h > imgRect.h) { h = imgRect.h; w = h * aspect; }
  return {
    x: clamp(centerX - w / 2, imgRect.x, imgRect.x + imgRect.w - w),
    y: clamp(centerY - h / 2, imgRect.y, imgRect.y + imgRect.h - h), w, h,
  };
}

export default function ImageCropper({ imageUrl, initialWidth, initialHeight, onConfirm, onCancel }: ImageCropperProps) {
  const [gridW, setGridW] = useState(initialWidth);
  const [gridH, setGridH] = useState(initialHeight);
  const [cropMode, setCropMode] = useState<CropMode>('fixed');
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [crop, setCrop] = useState<CropPixelRect>({ x: 0, y: 0, w: 100, h: 100 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['方形']));
  const [isDragging, setIsDragging] = useState(false);
  const [dragCursor, setDragCursor] = useState<'move' | 'crosshair'>('move');

  const dragRef = useRef<{
    active: boolean; mode: 'move' | 'resize'; handle: string;
    startX: number; startY: number; cropStart: CropPixelRect;
  }>({ active: false, mode: 'move', handle: '', startX: 0, startY: 0, cropStart: crop });

  const aspect = gridW / gridH;

  useEffect(() => {
    const m = () => {
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect();
        setWrapSize({ w: r.width, h: r.height });
      }
    };
    m();
    const ro = new ResizeObserver(m);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', m);
    return () => { ro.disconnect(); window.removeEventListener('resize', m); };
  }, []);

  useEffect(() => {
    if (!imgLoaded || imgNatural.w === 0 || wrapSize.w === 0) return;
    const iAsp = imgNatural.w / imgNatural.h;
    const cAsp = wrapSize.w / wrapSize.h;
    let w: number, h: number, x: number, y: number;
    if (iAsp > cAsp) {
      w = wrapSize.w; h = wrapSize.w / iAsp; x = 0; y = (wrapSize.h - h) / 2;
    } else {
      h = wrapSize.h; w = wrapSize.h * iAsp; x = (wrapSize.w - w) / 2; y = 0;
    }
    const nextImgRect = { x, y, w, h };
    const frame = window.requestAnimationFrame(() => {
      setImgRect(nextImgRect);
      setCrop(getFittedCrop(nextImgRect, aspect));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [imgLoaded, imgNatural.w, imgNatural.h, wrapSize.w, wrapSize.h, aspect]);

  const getPos = useCallback((clientX: number, clientY: number) => {
    if (!wrapRef.current) return { x: 0, y: 0 };
    const r = wrapRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }, []);

  const checkPos = useCallback((px: number, py: number): string => {
    const handleSize = 10;
    const { x: cx, y: cy, w: cw, h: ch } = crop;
    const corners: [string, number, number][] = [
      ['nw', cx, cy], ['ne', cx + cw, cy], ['sw', cx, cy + ch], ['se', cx + cw, cy + ch],
      ['n', cx + cw / 2, cy], ['s', cx + cw / 2, cy + ch], ['w', cx, cy + ch / 2], ['e', cx + cw, cy + ch / 2],
    ];
    for (const [name, hx, hy] of corners) {
      if (Math.abs(px - (hx as number)) < handleSize && Math.abs(py - (hy as number)) < handleSize) return name as string;
    }
    if (px >= cx && px <= cx + cw && py >= cy && py <= cy + ch) return 'move';
    return '';
  }, [crop]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    const hit = checkPos(pos.x, pos.y);
    if (!hit) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, mode: hit === 'move' ? 'move' : 'resize', handle: hit, startX: pos.x, startY: pos.y, cropStart: { ...crop } };
    setIsDragging(true);
    setDragCursor(hit === 'move' ? 'move' : 'crosshair');
  }, [getPos, checkPos, crop]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    const d = dragRef.current;
    const dx = pos.x - d.startX, dy = pos.y - d.startY;
    const cs = d.cropStart;

    setCrop(() => {
      let nc: CropPixelRect;
      if (d.mode === 'move') {
        nc = { x: clamp(cs.x + dx, imgRect.x, imgRect.x + imgRect.w - cs.w), y: clamp(cs.y + dy, imgRect.y, imgRect.y + imgRect.h - cs.h), w: cs.w, h: cs.h };
      } else {
        nc = { ...cs };
        const minSize = 15;
        if (d.handle.includes('e')) nc.w = clamp(cs.w + dx, minSize, imgRect.x + imgRect.w - cs.x);
        if (d.handle.includes('w')) { const md = cs.w - minSize; const delta = clamp(dx, -(cs.x - imgRect.x), md); nc.x = cs.x + delta; nc.w = cs.w - delta; }
        if (d.handle.includes('s')) nc.h = clamp(cs.h + dy, minSize, imgRect.y + imgRect.h - cs.y);
        if (d.handle.includes('n')) { const md = cs.h - minSize; const delta = clamp(dy, -(cs.y - imgRect.y), md); nc.y = cs.y + delta; nc.h = cs.h - delta; }
        if (cropMode === 'fixed') {
          const targetW = nc.h * aspect, targetH = nc.w / aspect;
          if (Math.abs(targetW - nc.w) < Math.abs(targetH - nc.h)) nc.w = targetW; else nc.h = targetH;
        }
        nc.x = clamp(nc.x, imgRect.x, imgRect.x + imgRect.w - 20);
        nc.y = clamp(nc.y, imgRect.y, imgRect.y + imgRect.h - 20);
        nc.w = clamp(nc.w, 20, imgRect.x + imgRect.w - nc.x);
        nc.h = clamp(nc.h, 20, imgRect.y + imgRect.h - nc.y);
      }
      return nc;
    });
  }, [getPos, imgRect, aspect, cropMode]);

  const onPointerUp = useCallback(() => { dragRef.current.active = false; setIsDragging(false); }, []);

  const [hoverCursor, setHoverCursor] = useState('default');
  const onHover = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.active) return;
    const pos = getPos(e.clientX, e.clientY);
    const hit = checkPos(pos.x, pos.y);
    if (hit === 'move') setHoverCursor('move');
    else if (hit) setHoverCursor('crosshair');
    else setHoverCursor('default');
  }, [getPos, checkPos]);

  const handleSize = useCallback((w: number, h: number) => {
    setGridW(w); setGridH(h);
    setCrop(prev => cropMode === 'free' ? prev : fitCropAroundCenter(prev, imgRect, w / h));
  }, [imgRect, cropMode]);

  const zoomIn = useCallback(() => {
    setCrop(p => {
      const s = 0.9; const nc = { ...p };
      nc.w *= s; nc.h *= s; nc.x += (p.w - nc.w) / 2; nc.y += (p.h - nc.h) / 2;
      nc.x = clamp(nc.x, imgRect.x, imgRect.x + imgRect.w - nc.w);
      nc.y = clamp(nc.y, imgRect.y, imgRect.y + imgRect.h - nc.h);
      nc.w = clamp(nc.w, 20, imgRect.w); nc.h = clamp(nc.h, 20, imgRect.h);
      return nc;
    });
  }, [imgRect]);

  const zoomOut = useCallback(() => {
    setCrop(p => {
      const s = 1.1; const ca = cropMode === 'fixed' ? aspect : p.w / p.h;
      let nc = { ...p };
      nc.w = Math.min(p.w * s, imgRect.w);
      nc.h = nc.w / ca;
      if (nc.h > imgRect.h) { nc.h = imgRect.h; nc.w = nc.h * ca; }
      nc.x -= (nc.w - p.w) / 2; nc.y -= (nc.h - p.h) / 2;
      nc.x = clamp(nc.x, imgRect.x, imgRect.x + imgRect.w - nc.w);
      nc.y = clamp(nc.y, imgRect.y, imgRect.y + imgRect.h - nc.h);
      nc.w = clamp(nc.w, 20, imgRect.w); nc.h = clamp(nc.h, 20, imgRect.h);
      return nc;
    });
  }, [imgRect, aspect, cropMode]);

  const resetCrop = useCallback(() => {
    setCrop(cropMode === 'fixed'
      ? getFittedCrop(imgRect, aspect)
      : { x: imgRect.x + imgRect.w * 0.05, y: imgRect.y + imgRect.h * 0.05, w: imgRect.w * 0.9, h: imgRect.h * 0.9 }
    );
  }, [imgRect, aspect, cropMode]);

  const handleCropModeChange = useCallback((mode: CropMode) => {
    setCropMode(mode);
    if (mode === 'fixed') setCrop(prev => fitCropAroundCenter(prev, imgRect, gridW / gridH));
  }, [imgRect, gridW, gridH]);

  const handleCustomSize = useCallback((axis: 'w' | 'h', value: string) => {
    const next = Math.max(5, Math.min(160, Number.parseInt(value, 10) || 29));
    if (axis === 'w') handleSize(next, gridH); else handleSize(gridW, next);
  }, [gridW, gridH, handleSize]);

  const matchSizeToCrop = useCallback(() => {
    if (crop.h <= 0) return;
    const targetArea = gridW * gridH;
    const cropAspect = crop.w / crop.h;
    const nextW = Math.max(5, Math.min(160, Math.round(Math.sqrt(targetArea * cropAspect))));
    const nextH = Math.max(5, Math.min(160, Math.round(nextW / cropAspect)));
    setGridW(nextW); setGridH(nextH);
  }, [crop, gridW, gridH]);

  const confirmCrop = useCallback(() => {
    if (imgNatural.w === 0) return;
    const relX = (crop.x - imgRect.x) / imgRect.w;
    const relY = (crop.y - imgRect.y) / imgRect.h;
    const relW = crop.w / imgRect.w;
    const relH = crop.h / imgRect.h;
    const sx = Math.round(clamp(relX, 0, 1) * imgNatural.w);
    const sy = Math.round(clamp(relY, 0, 1) * imgNatural.h);
    const sw = Math.round(clamp(relW, 0, 1 - relX) * imgNatural.w);
    const sh = Math.round(clamp(relH, 0, 1 - relY) * imgNatural.h);
    const cvs = document.createElement('canvas');
    cvs.width = gridW * 10; cvs.height = gridH * 10;
    const ctx = cvs.getContext('2d')!;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cvs.width, cvs.height);
      onConfirm(cvs.toDataURL('image/jpeg', 0.92), gridW, gridH);
    };
    img.src = imageUrl;
  }, [crop, imgRect, imgNatural, gridW, gridH, imageUrl, onConfirm]);

  const toggleCat = (cat: string) => setExpandedCats(p => {
    const n = new Set(p); if (n.has(cat)) n.delete(cat); else n.add(cat); return n;
  });

  const presetsByCat = useMemo(() => {
    const m = new Map<string, typeof SIZE_PRESETS>();
    CATEGORIES.forEach(c => m.set(c, SIZE_PRESETS.filter(p => p.category === c)));
    return m;
  }, []);

  const overlays = useMemo(() => {
    if (imgRect.w === 0) return null;
    return {
      top: { x: 0, y: 0, w: wrapSize.w, h: Math.max(0, crop.y) },
      bottom: { x: 0, y: crop.y + crop.h, w: wrapSize.w, h: Math.max(0, wrapSize.h - crop.y - crop.h) },
      left: { x: 0, y: crop.y, w: Math.max(0, crop.x), h: crop.h },
      right: { x: crop.x + crop.w, y: crop.y, w: Math.max(0, wrapSize.w - crop.x - crop.w), h: crop.h },
    };
  }, [crop, imgRect, wrapSize]);

  const cursorStyle = isDragging ? dragCursor : hoverCursor;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F7F4]">
      {/* Header bar - light theme */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-[#E8E8EA] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#1C1C1E] font-semibold text-sm">裁剪图片</span>
          <span className="text-[#8E8E93] text-xs">网格: {gridW} × {gridH}</span>
          <span className="text-[#8E8E93] text-xs">{cropMode === 'fixed' ? '固定比例' : '自由裁剪'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="btn-ghost p-1.5" title="缩小"><ZoomOut size={15} /></button>
          <button onClick={zoomIn} className="btn-ghost p-1.5" title="放大"><ZoomIn size={15} /></button>
          <button onClick={resetCrop} className="btn-ghost p-1.5" title="重置"><Maximize2 size={15} /></button>
          <div className="w-px h-5 bg-[#E8E8EA] mx-0.5" />
          <button onClick={onCancel} className="btn-ghost px-4 py-1.5 text-sm">取消</button>
          <button onClick={confirmCrop} className="btn-primary px-5 py-1.5 text-sm">确认裁剪</button>
        </div>
      </div>

      {/* Main crop area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image wrapper */}
        <div
          ref={wrapRef}
          className="flex-1 relative overflow-hidden bg-[#F2F2F7]"
          style={{ cursor: cursorStyle, touchAction: 'none' }}
          onPointerMove={(e) => { onHover(e); if (dragRef.current.active) onPointerMove(e); }}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            src={imageUrl} alt="Crop"
            className="absolute select-none pointer-events-none"
            style={{ left: imgRect.x, top: imgRect.y, width: imgRect.w, height: imgRect.h }}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
              setImgLoaded(true);
            }}
            draggable={false}
          />

          {/* Dark overlays */}
          {overlays && (
            <>
              <div className="absolute bg-black/50 pointer-events-none" style={{ left: overlays.top.x, top: overlays.top.y, width: overlays.top.w, height: overlays.top.h }} />
              <div className="absolute bg-black/50 pointer-events-none" style={{ left: overlays.bottom.x, top: overlays.bottom.y, width: overlays.bottom.w, height: overlays.bottom.h }} />
              <div className="absolute bg-black/50 pointer-events-none" style={{ left: overlays.left.x, top: overlays.left.y, width: overlays.left.w, height: overlays.left.h }} />
              <div className="absolute bg-black/50 pointer-events-none" style={{ left: overlays.right.x, top: overlays.right.y, width: overlays.right.w, height: overlays.right.h }} />
            </>
          )}

          {/* Crop frame */}
          {imgRect.w > 0 && (
            <div
              className="absolute"
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, touchAction: 'none' }}
              onPointerDown={onPointerDown}
            >
              <div className="absolute inset-0 border-2 border-dashed border-white pointer-events-none" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40 -translate-x-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40 -translate-y-1/2 pointer-events-none" />
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20 pointer-events-none" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20 pointer-events-none" />

              {(['nw','n','ne','w','e','sw','s','se'] as const).map(h => {
                const pos: Record<string, React.CSSProperties> = {
                  nw: { left: -6, top: -6 }, n: { left: '50%', top: -6, transform: 'translateX(-50%)' },
                  ne: { right: -6, top: -6 }, w: { left: -6, top: '50%', transform: 'translateY(-50%)' },
                  e: { right: -6, top: '50%', transform: 'translateY(-50%)' },
                  sw: { left: -6, bottom: -6 }, s: { left: '50%', bottom: -6, transform: 'translateX(-50%)' },
                  se: { right: -6, bottom: -6 },
                };
                return (
                  <div key={h} className="absolute w-3 h-3 bg-white border-2 border-[#E85D75] rounded-sm z-20" style={pos[h]}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                      const p = getPos(e.clientX, e.clientY);
                      dragRef.current = { active: true, mode: 'resize', handle: h, startX: p.x, startY: p.y, cropStart: { ...crop } };
                      setIsDragging(true);
                      setDragCursor('crosshair');
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel - light theme */}
        <div className="w-[200px] bg-white border-l border-[#E8E8EA] flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-3 border-b border-[#E8E8EA]">
            <h3 className="text-[#1C1C1E] font-semibold text-sm">尺寸预设</h3>
          </div>
          <div className="p-2.5 border-b border-[#E8E8EA] space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => handleCropModeChange('fixed')}
                className={`h-8 rounded-lg text-xs flex items-center justify-center gap-1 border transition-all ${cropMode === 'fixed' ? 'bg-[#E85D75] text-white border-[#E85D75]' : 'bg-[#F2F2F7] text-[#8E8E93] border-[#E8E8EA] hover:border-[#E85D75]'}`}>
                <Lock size={12} /> 固定
              </button>
              <button onClick={() => handleCropModeChange('free')}
                className={`h-8 rounded-lg text-xs flex items-center justify-center gap-1 border transition-all ${cropMode === 'free' ? 'bg-[#4A9E8E] text-white border-[#4A9E8E]' : 'bg-[#F2F2F7] text-[#8E8E93] border-[#E8E8EA] hover:border-[#4A9E8E]'}`}>
                <Unlock size={12} /> 自由
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-1 items-end">
              <label className="text-[10px] text-[#8E8E93]">
                宽
                <input type="number" min={5} max={160} value={gridW}
                  onChange={(e) => handleCustomSize('w', e.target.value)}
                  className="mt-1 w-full h-8 rounded-md bg-[#F2F2F7] border border-[#E8E8EA] text-[#1C1C1E] text-xs px-2 outline-none focus:border-[#E85D75]"
                />
              </label>
              <span className="pb-2 text-[#8E8E93] text-xs">×</span>
              <label className="text-[10px] text-[#8E8E93]">
                高
                <input type="number" min={5} max={160} value={gridH}
                  onChange={(e) => handleCustomSize('h', e.target.value)}
                  className="mt-1 w-full h-8 rounded-md bg-[#F2F2F7] border border-[#E8E8EA] text-[#1C1C1E] text-xs px-2 outline-none focus:border-[#E85D75]"
                />
              </label>
            </div>
            {cropMode === 'free' && (
              <button onClick={matchSizeToCrop}
                className="w-full h-8 rounded-lg bg-[#F2F2F7] hover:bg-[#E8E8EA] text-[#1C1C1E] text-xs flex items-center justify-center gap-1 transition-all">
                <Wand2 size={12} /> 匹配裁剪比例
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {CATEGORIES.map(cat => (
              <div key={cat}>
                <button onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#F2F2F7] text-left transition-colors">
                  <span className="text-[#1C1C1E] text-xs">{cat}</span>
                  <span className="text-[#8E8E93] text-xs">{expandedCats.has(cat) ? '−' : '+'}</span>
                </button>
                {expandedCats.has(cat) && (
                  <div className="grid grid-cols-2 gap-1 pl-2 mt-1">
                    {presetsByCat.get(cat)?.map(p => {
                      const active = gridW === p.w && gridH === p.h;
                      return (
                        <button key={p.label} onClick={() => handleSize(p.w, p.h)}
                          className={`py-1 px-0.5 rounded text-xs border transition-all text-center ${active ? 'bg-[#E85D75] text-white border-[#E85D75]' : 'bg-[#F2F2F7] text-[#1C1C1E] border-[#E8E8EA] hover:border-[#E85D75]'}`}>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
