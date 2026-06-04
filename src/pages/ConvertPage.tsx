/**
 * ConvertPage - Image to bead pattern conversion
 * Upload → Crop → Process → Preview → Export
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Palette } from 'lucide-react';
import type { ProcessOptions } from '../engine/types';
import Header from '../components/Header';
import UploadZone from '../components/UploadZone';
import SampleCases from '../components/SampleCases';
import SizeSettings from '../components/SizeSettings';
import ColorSettings from '../components/ColorSettings';
import ProcessingOptions from '../components/ProcessingOptions';
import GridPreview from '../components/GridPreview';
import MaterialStats from '../components/MaterialStats';
import ColorPaletteBar from '../components/ColorPaletteBar';
import ImageCropper from '../components/ImageCropper';
import { useImageProcessor } from '../hooks/useImageProcessor';

const DEFAULT_OPTIONS: ProcessOptions = {
  targetWidth: 58,
  targetHeight: 58,
  maxColors: 16,
  brand: 'mard',
  denoiseStrength: 0,
  noiseFilter: false,
  removeBackground: false,
  useCommonColors: false,
};

type Phase = 'upload' | 'crop' | 'result';

export default function ConvertPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('upload');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<ProcessOptions>({ ...DEFAULT_OPTIONS });
  const [showGrid, setShowGrid] = useState(true);
  const prevOptionsRef = useRef<ProcessOptions>(options);
  const { result, isProcessing, error, process, reprocess, clear } = useImageProcessor();

  // Auto-reprocess on options change
  useEffect(() => {
    if (phase !== 'result' || !imageUrl || !result) return;
    const prev = prevOptionsRef.current;
    const changed =
      prev.targetWidth !== options.targetWidth ||
      prev.targetHeight !== options.targetHeight ||
      prev.maxColors !== options.maxColors ||
      prev.brand !== options.brand ||
      prev.denoiseStrength !== options.denoiseStrength ||
      prev.noiseFilter !== options.noiseFilter ||
      prev.removeBackground !== options.removeBackground ||
      prev.useCommonColors !== options.useCommonColors;

    if (changed) {
      prevOptionsRef.current = { ...options };
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { reprocess(options); };
      img.src = imageUrl;
    }
  }, [options, imageUrl, result, reprocess, phase]);

  // Normal upload flow
  const handleImageUpload = useCallback((url: string) => {
    setCropImageUrl(url);
    setPhase('crop');
  }, []);

  // Sample case: same as normal upload — goes through crop phase
  const handleSampleSelect = useCallback((url: string) => {
    handleImageUpload(url);
  }, [handleImageUpload]);

  const handleCropConfirm = useCallback((croppedUrl: string, w: number, h: number) => {
    setImageUrl(croppedUrl);
    const newOptions = { ...options, targetWidth: w, targetHeight: h };
    setOptions(newOptions);
    prevOptionsRef.current = { ...newOptions };
    setPhase('result');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { process(img, newOptions); };
    img.onerror = () => { alert('图片加载失败，请尝试上传其他图片'); };
    img.src = croppedUrl;
  }, [options, process]);

  const handleCropCancel = useCallback(() => {
    setPhase('upload');
    setCropImageUrl(null);
    setImageUrl(null);
    clear();
  }, [clear]);

  const handleClearImage = useCallback(() => {
    setImageUrl(null);
    setCropImageUrl(null);
    setPhase('upload');
    clear();
  }, [clear]);

  const handleSizeChange = useCallback((w: number, h: number) => {
    setOptions((prev) => ({ ...prev, targetWidth: w, targetHeight: h }));
  }, []);

  const handleColorCountChange = useCallback((count: number) => {
    setOptions((prev) => ({ ...prev, maxColors: count }));
  }, []);

  const handleBrandChange = useCallback((brand: string) => {
    setOptions((prev) => ({ ...prev, brand }));
  }, []);

  const handleDenoiseChange = useCallback((strength: number) => {
    setOptions((prev) => ({ ...prev, denoiseStrength: strength }));
  }, []);

  const handleNoiseFilterChange = useCallback((enabled: boolean) => {
    setOptions((prev) => ({ ...prev, noiseFilter: enabled }));
  }, []);

  const handleBackgroundRemovalChange = useCallback((enabled: boolean) => {
    setOptions((prev) => ({ ...prev, removeBackground: enabled }));
  }, []);

  const handleCommonColorsChange = useCallback((enabled: boolean) => {
    setOptions((prev) => ({ ...prev, useCommonColors: enabled }));
  }, []);

  const actualColorCount = result?.colorMap.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      <Header />

      {phase === 'crop' && cropImageUrl ? (
        <ImageCropper
          imageUrl={cropImageUrl}
          initialWidth={options.targetWidth}
          initialHeight={options.targetHeight}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-5">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left panel */}
            <aside className="w-full lg:w-[270px] flex-shrink-0 space-y-3">
              {/* Quick try — sample cases (only visible on upload phase) */}
              {phase !== 'result' && (
                <SampleCases onSelectImage={handleSampleSelect} />
              )}

              <UploadZone
                imageUrl={imageUrl}
                onImageUpload={handleImageUpload}
                onClearImage={handleClearImage}
              />



              {phase === 'result' && (
                <>
                  <SizeSettings
                    width={options.targetWidth}
                    height={options.targetHeight}
                    onChange={handleSizeChange}
                    disabled={!imageUrl}
                  />
                  <ColorSettings
                    maxColors={options.maxColors}
                    brand={options.brand}
                    onColorCountChange={handleColorCountChange}
                    onBrandChange={handleBrandChange}
                    actualColorCount={actualColorCount}
                    disabled={!imageUrl}
                  />
                  <ProcessingOptions
                    denoiseStrength={options.denoiseStrength}
                    noiseFilter={options.noiseFilter}
                    removeBackground={options.removeBackground}
                    useCommonColors={options.useCommonColors}
                    onDenoiseChange={handleDenoiseChange}
                    onNoiseFilterChange={handleNoiseFilterChange}
                    onBackgroundRemovalChange={handleBackgroundRemovalChange}
                    onCommonColorsChange={handleCommonColorsChange}
                    disabled={!imageUrl}
                  />

                  {/* Divider + Editor */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E8E8EA]" /></div>
                    <div className="relative flex justify-center"><span className="bg-[#F8F7F4] px-3 text-xs text-[#8E8E93]">或者</span></div>
                  </div>

                  <button
                    onClick={() => {
                      if (!result) return;
                      const params = new URLSearchParams();
                      params.set('grid', JSON.stringify(result.grid));
                      params.set('palette', JSON.stringify(result.colorMap.map(c => ({
                        id: c.id, name: c.name, hex: c.hex,
                        rgb: c.rgb, brand: c.brand, code: c.code,
                      }))));
                      params.set('w', String(result.width));
                      params.set('h', String(result.height));
                      params.set('brand', options.brand);
                      navigate('/editor?' + params.toString());
                    }}
                    disabled={!result}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all bg-gradient-to-r from-[#E85D75] to-[#F0788C] hover:shadow-lg hover:shadow-[#E85D75]/25 active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Palette size={16} />
                    进入画板编辑
                  </button>
                </>
              )}
            </aside>

            {/* Center — Preview */}
            <section className="flex-1 min-w-0">
              <GridPreview
                result={result}
                isProcessing={isProcessing}
                error={error}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid((v) => !v)}
                onNewCanvas={() => navigate('/editor')}
              />
            </section>

            {/* Right — Stats */}
            <aside className="w-full lg:w-[250px] flex-shrink-0 space-y-3">
              <MaterialStats result={result} />
            </aside>
          </div>
        </main>
      )}

      {phase === 'result' && <ColorPaletteBar result={result} />}
    </div>
  );
}
