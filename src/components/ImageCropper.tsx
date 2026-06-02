/**
 * ImageCropper - Pixel-coordinate based, reliable image cropping
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const SIZE_PRESETS = [
  { label: '29×29', w: 29, h: 29, category: '方形' },
  { label: '40×40', w: 40, h: 40, category: '方形' },
  { label: '48×48', w: 48, h: 48, category: '方形' },
  { label: '58×58', w: 58, h: 58, category: '方形' },
  { label: '80×80', w: 80, h: 80, category: '方形' },
  { label: '100×100', w: 100, h: 100, category: '方形' },
  { label: '120×120', w: 120, h: 120, category: '方形' },
  { label: '20×29', w: 20, h: 29, category: '竖版' },
  { label: '29×48', w: 29, h: 48, category: '竖版' },
  { label: '40×58', w: 40, h: 58, category: '竖版' },
  { label: '48×80', w: 48, h: 80, category: '竖版' },
  { label: '58×100', w: 58, h: 100, category: '竖版' },
  { label: '64×120', w: 64, h: 120, category: '竖版' },
  { label: '29×20', w: 29, h: 20, category: '横版' },
  { label: '48×29', w: 48, h: 29, category: '横版' },
  { label: '58×40', w: 58, h: 40, category: '横版' },
  { label: '80×48', w: 80, h: 48, category: '横版' },
  { label: '100×58', w: 100, h: 58, category: '横版' },
  { label: '120×64', w: 120, h: 64, category: '横版' },
  { label: '29×48', w: 29, h: 48, category: '手机壁纸' },
  { label: '36×64', w: 36, h: 64, category: '手机壁纸' },
  { label: '48×29', w: 48, h: 29, category: '宽屏' },
  { label: '64×36', w: 64, h: 36, category: '宽屏' },
];

const CATEGORIES = ['方形', '竖版', '横版', '手机壁纸', '宽屏'];

interface CropPixelRect {
  x: number;      // 像素坐标，相对于wrapper
  y: number;
  w: number;
  h: number;
}

interface ImageCropperProps {
  imageUrl: string;
  initialWidth: number;
  initialHeight: number;
  onConfirm: (croppedUrl: string, width: number, height: number) => void;
  onCancel: () => void;
}

function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max); }

export default function ImageCropper({ imageUrl, initialWidth, initialHeight, onConfirm, onCancel }: ImageCropperProps) {
  const [gridW, setGridW] = useState(initialWidth);
  const [gridH, setGridH] = useState(initialHeight);

  // All in pixel coordinates relative to the wrapper
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 0, h: 0 });  // where the image is displayed
  const [crop, setCrop] = useState<CropPixelRect>({ x: 0, y: 0, w: 100, h: 100 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['方形']));

  // Drag state in ref for performance
  const dragRef = useRef<{
    active: boolean;
    mode: 'move' | 'resize';
    handle: string;
    startX: number; startY: number;
    cropStart: CropPixelRect;
  }>({ active: false, mode: 'move', handle: '', startX: 0, startY: 0, cropStart: crop });

  const aspect = gridW / gridH;

  // Measure wrapper
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

  // Calculate image display rect (letterboxed, centered)
  // This runs when wrapSize or image loads
  useEffect(() => {
    if (!imgLoaded || imgNatural.w === 0 || wrapSize.w === 0) return;

    const iAsp = imgNatural.w / imgNatural.h;
    const cAsp = wrapSize.w / wrapSize.h;

    let w: number, h: number, x: number, y: number;
    if (iAsp > cAsp) {
      // Image is wider than container - fit to width
      w = wrapSize.w;
      h = wrapSize.w / iAsp;
      x = 0;
      y = (wrapSize.h - h) / 2;
    } else {
      // Image is taller than container - fit to height
      h = wrapSize.h;
      w = wrapSize.h * iAsp;
      x = (wrapSize.w - w) / 2;
      y = 0;
    }

    setImgRect({ x, y, w, h });

    // Initialize crop to cover 90% of the image
    const margin = 0.05;
    setCrop({
      x: x + w * margin,
      y: y + h * margin,
      w: w * (1 - margin * 2),
      h: h * (1 - margin * 2),
    });
  }, [imgLoaded, imgNatural.w, imgNatural.h, wrapSize.w, wrapSize.h]);

  // Get mouse pos relative to wrapper
  const getPos = useCallback((clientX: number, clientY: number) => {
    if (!wrapRef.current) return { x: 0, y: 0 };
    const r = wrapRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }, []);

  // Check what is at position
  const checkPos = useCallback((px: number, py: number): string => {
    const handleSize = 10;
    const { x: cx, y: cy, w: cw, h: ch } = crop;

    // Check handles first (corners and edges)
    const corners = [
      ['nw', cx, cy], ['ne', cx + cw, cy], ['sw', cx, cy + ch], ['se', cx + cw, cy + ch],
      ['n', cx + cw / 2, cy], ['s', cx + cw / 2, cy + ch], ['w', cx, cy + ch / 2], ['e', cx + cw, cy + ch / 2],
    ];
    for (const [name, hx, hy] of corners) {
      if (Math.abs(px - (hx as number)) < handleSize && Math.abs(py - (hy as number)) < handleSize) return name as string;
    }
    // Inside crop?
    if (px >= cx && px <= cx + cw && py >= cy && py <= cy + ch) return 'move';
    return '';
  }, [crop]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    const hit = checkPos(pos.x, pos.y);
    if (!hit) return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    dragRef.current = {
      active: true,
      mode: hit === 'move' ? 'move' : 'resize',
      handle: hit,
      startX: pos.x, startY: pos.y,
      cropStart: { ...crop },
    };
  }, [getPos, checkPos, crop]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    e.preventDefault();

    const pos = getPos(e.clientX, e.clientY);
    const d = dragRef.current;
    const dx = pos.x - d.startX;
    const dy = pos.y - d.startY;
    const cs = d.cropStart;

    setCrop(() => {
      let nc: CropPixelRect;

      if (d.mode === 'move') {
        nc = {
          x: clamp(cs.x + dx, imgRect.x, imgRect.x + imgRect.w - cs.w),
          y: clamp(cs.y + dy, imgRect.y, imgRect.y + imgRect.h - cs.h),
          w: cs.w, h: cs.h,
        };
      } else {
        // Resize
        nc = { ...cs };
        const minSize = 15;

        if (d.handle.includes('e')) nc.w = clamp(cs.w + dx, minSize, imgRect.x + imgRect.w - cs.x);
        if (d.handle.includes('w')) {
          const maxDelta = cs.w - minSize;
          const delta = clamp(dx, -(cs.x - imgRect.x), maxDelta);
          nc.x = cs.x + delta;
          nc.w = cs.w - delta;
        }
        if (d.handle.includes('s')) nc.h = clamp(cs.h + dy, minSize, imgRect.y + imgRect.h - cs.y);
        if (d.handle.includes('n')) {
          const maxDelta = cs.h - minSize;
          const delta = clamp(dy, -(cs.y - imgRect.y), maxDelta);
          nc.y = cs.y + delta;
          nc.h = cs.h - delta;
        }

        // Enforce aspect ratio
        const targetW = nc.h * aspect;
        const targetH = nc.w / aspect;

        // Choose the change that keeps more of the user's intent
        if (Math.abs(targetW - nc.w) < Math.abs(targetH - nc.h)) {
          nc.w = targetW;
        } else {
          nc.h = targetH;
        }

        // Re-clamp
        nc.x = clamp(nc.x, imgRect.x, imgRect.x + imgRect.w - 20);
        nc.y = clamp(nc.y, imgRect.y, imgRect.y + imgRect.h - 20);
        nc.w = clamp(nc.w, 20, imgRect.x + imgRect.w - nc.x);
        nc.h = clamp(nc.h, 20, imgRect.y + imgRect.h - nc.y);
      }

      return nc;
    });
  }, [getPos, imgRect, aspect]);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  // Hover cursor
  const [hoverCursor, setHoverCursor] = useState('default');
  const onHover = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.active) return;
    const pos = getPos(e.clientX, e.clientY);
    const hit = checkPos(pos.x, pos.y);
    if (hit === 'move') setHoverCursor('move');
    else if (hit) setHoverCursor('crosshair');
    else setHoverCursor('default');
  }, [getPos, checkPos]);

  // Handle size change - keep area constant
  const handleSize = useCallback((w: number, h: number) => {
    const newAspect = w / h;
    setGridW(w);
    setGridH(h);

    setCrop(prev => {
      // Keep the center point, adjust to new aspect ratio
      // Maintain area as much as possible
      const centerX = prev.x + prev.w / 2;
      const centerY = prev.y + prev.h / 2;
      const area = prev.w * prev.h;

      let newW = Math.sqrt(area * newAspect);
      let newH = newW / newAspect;

      let nc: CropPixelRect = {
        x: centerX - newW / 2,
        y: centerY - newH / 2,
        w: newW,
        h: newH,
      };

      // Clamp to image rect
      if (nc.x < imgRect.x) { nc.x = imgRect.x; }
      if (nc.y < imgRect.y) { nc.y = imgRect.y; }
      if (nc.x + nc.w > imgRect.x + imgRect.w) { nc.w = imgRect.x + imgRect.w - nc.x; nc.h = nc.w / newAspect; }
      if (nc.y + nc.h > imgRect.y + imgRect.h) { nc.h = imgRect.y + imgRect.h - nc.y; nc.w = nc.h * newAspect; }

      nc.w = clamp(nc.w, 20, imgRect.w);
      nc.h = clamp(nc.h, 20, imgRect.h);

      return nc;
    });
  }, [imgRect]);

  // Zoom
  const zoomIn = useCallback(() => {
    setCrop(p => {
      const s = 0.9;
      const nc = { ...p };
      nc.w *= s;
      nc.h *= s;
      nc.x += (p.w - nc.w) / 2;
      nc.y += (p.h - nc.h) / 2;
      nc.x = clamp(nc.x, imgRect.x, imgRect.x + imgRect.w - nc.w);
      nc.y = clamp(nc.y, imgRect.y, imgRect.y + imgRect.h - nc.h);
      nc.w = clamp(nc.w, 20, imgRect.w);
      nc.h = clamp(nc.h, 20, imgRect.h);
      return nc;
    });
  }, [imgRect]);

  const zoomOut = useCallback(() => {
    setCrop(p => {
      const s = 1.1;
      const nc = { ...p };
      nc.w = Math.min(p.w * s, imgRect.w);
      nc.h = nc.w / aspect;
      nc.x -= (nc.w - p.w) / 2;
      nc.y -= (nc.h - p.h) / 2;
      nc.x = clamp(nc.x, imgRect.x, imgRect.x + imgRect.w - nc.w);
      nc.y = clamp(nc.y, imgRect.y, imgRect.y + imgRect.h - nc.h);
      nc.w = clamp(nc.w, 20, imgRect.w);
      nc.h = clamp(nc.h, 20, imgRect.h);
      return nc;
    });
  }, [imgRect, aspect]);

  const resetCrop = useCallback(() => {
    const m = 0.05;
    setCrop({
      x: imgRect.x + imgRect.w * m,
      y: imgRect.y + imgRect.h * m,
      w: imgRect.w * (1 - m * 2),
      h: imgRect.h * (1 - m * 2),
    });
  }, [imgRect]);

  // Confirm
  const confirmCrop = useCallback(() => {
    if (imgNatural.w === 0) return;

    // Map crop pixels to image natural coordinates
    const relX = (crop.x - imgRect.x) / imgRect.w;
    const relY = (crop.y - imgRect.y) / imgRect.h;
    const relW = crop.w / imgRect.w;
    const relH = crop.h / imgRect.h;

    const sx = Math.round(clamp(relX, 0, 1) * imgNatural.w);
    const sy = Math.round(clamp(relY, 0, 1) * imgNatural.h);
    const sw = Math.round(clamp(relW, 0, 1 - relX) * imgNatural.w);
    const sh = Math.round(clamp(relH, 0, 1 - relY) * imgNatural.h);

    const cvs = document.createElement('canvas');
    cvs.width = gridW * 10;
    cvs.height = gridH * 10;
    const ctx = cvs.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cvs.width, cvs.height);
      onConfirm(cvs.toDataURL('image/jpeg', 0.92), gridW, gridH);
    };
    img.src = imageUrl;
  }, [crop, imgRect, imgNatural, gridW, gridH, imageUrl, onConfirm]);

  // Toggle category
  const toggleCat = (cat: string) => setExpandedCats(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  const presetsByCat = useMemo(() => {
    const m = new Map<string, typeof SIZE_PRESETS>();
    CATEGORIES.forEach(c => m.set(c, SIZE_PRESETS.filter(p => p.category === c)));
    return m;
  }, []);

  // Overlay divs (top, bottom, left, right of crop)
  const overlays = useMemo(() => {
    if (imgRect.w === 0) return null;
    return {
      top: { x: 0, y: 0, w: wrapSize.w, h: Math.max(0, crop.y) },
      bottom: { x: 0, y: crop.y + crop.h, w: wrapSize.w, h: Math.max(0, wrapSize.h - crop.y - crop.h) },
      left: { x: 0, y: crop.y, w: Math.max(0, crop.x), h: crop.h },
      right: { x: crop.x + crop.w, y: crop.y, w: Math.max(0, wrapSize.w - crop.x - crop.w), h: crop.h },
    };
  }, [crop, imgRect, wrapSize]);

  // Compute cursor style
  const cursorStyle = dragRef.current.active
    ? (dragRef.current.mode === 'move' ? 'move' : 'crosshair')
    : hoverCursor;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0d1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#16162a] border-b border-[#2a2a4a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">裁剪图片</span>
          <span className="text-[#888] text-xs">网格: {gridW} × {gridH}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a6a] text-white"><ZoomOut size={16}/></button>
          <button onClick={zoomIn} className="p-2 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a6a] text-white"><ZoomIn size={16}/></button>
          <button onClick={resetCrop} className="p-2 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a6a] text-white"><Maximize2 size={16}/></button>
          <div className="w-px h-6 bg-[#2a2a4a] mx-1" />
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a6a] text-white text-sm">取消</button>
          <button onClick={confirmCrop} className="px-4 py-2 rounded-lg bg-[#FF6B6B] hover:bg-[#ff5252] text-white text-sm font-medium">确认裁剪</button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image wrapper */}
        <div
          ref={wrapRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: cursorStyle, touchAction: 'none' }}
          onPointerMove={(e) => { onHover(e); if (dragRef.current.active) onPointerMove(e); }}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* The actual image */}
          <img
            src={imageUrl}
            alt="Crop"
            className="absolute select-none pointer-events-none"
            style={{
              left: imgRect.x, top: imgRect.y,
              width: imgRect.w, height: imgRect.h,
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
              setImgLoaded(true);
            }}
            draggable={false}
          />

          {/* Dark overlays around crop area */}
          {overlays && (
            <>
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: overlays.top.x, top: overlays.top.y, width: overlays.top.w, height: overlays.top.h }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: overlays.bottom.x, top: overlays.bottom.y, width: overlays.bottom.w, height: overlays.bottom.h }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: overlays.left.x, top: overlays.left.y, width: overlays.left.w, height: overlays.left.h }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: overlays.right.x, top: overlays.right.y, width: overlays.right.w, height: overlays.right.h }} />
            </>
          )}

          {/* Crop frame + interaction area */}
          {imgRect.w > 0 && (
            <div
              className="absolute"
              style={{
                left: crop.x, top: crop.y,
                width: crop.w, height: crop.h,
                touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
            >
              {/* Border */}
              <div className="absolute inset-0 border-2 border-dashed border-white pointer-events-none" />

              {/* Crosshair */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40 -translate-x-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40 -translate-y-1/2 pointer-events-none" />

              {/* Rule of thirds */}
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20 pointer-events-none" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20 pointer-events-none" />

              {/* Handles - 8 directions */}
              {(['nw','n','ne','w','e','sw','s','se'] as const).map(h => {
                const pos: Record<string, React.CSSProperties> = {
                  nw: { left: -6, top: -6 }, n: { left: '50%', top: -6, transform: 'translateX(-50%)' },
                  ne: { right: -6, top: -6 }, w: { left: -6, top: '50%', transform: 'translateY(-50%)' },
                  e: { right: -6, top: '50%', transform: 'translateY(-50%)' },
                  sw: { left: -6, bottom: -6 }, s: { left: '50%', bottom: -6, transform: 'translateX(-50%)' },
                  se: { right: -6, bottom: -6 },
                };
                return (
                  <div
                    key={h}
                    className="absolute w-3 h-3 bg-white border-2 border-[#FF6B6B] rounded-sm z-20"
                    style={pos[h]}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                      const p = getPos(e.clientX, e.clientY);
                      dragRef.current = { active: true, mode: 'resize', handle: h, startX: p.x, startY: p.y, cropStart: { ...crop } };
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel - Size presets */}
        <div className="w-[200px] bg-[#16162a] border-l border-[#2a2a4a] flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-3 border-b border-[#2a2a4a]">
            <h3 className="text-white font-medium text-sm">尺寸预设</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CATEGORIES.map(cat => (
              <div key={cat}>
                <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#2a2a4a] text-left">
                  <span className="text-white/80 text-xs">{cat}</span>
                  <span className="text-white/40 text-xs">{expandedCats.has(cat) ? '−' : '+'}</span>
                </button>
                {expandedCats.has(cat) && (
                  <div className="grid grid-cols-2 gap-1 pl-2 mt-1">
                    {presetsByCat.get(cat)?.map(p => {
                      const active = gridW === p.w && gridH === p.h;
                      return (
                        <button key={p.label} onClick={() => handleSize(p.w, p.h)}
                          className={`py-1 px-0.5 rounded text-xs border transition-all text-center ${active ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-[#2a2a4a] text-white/70 border-[#3a3a6a] hover:border-[#FF6B6B]'}`}>
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
