/**
 * SampleCases - Two pre-loaded test images for instant trial
 * Images are served from public/samples/ by Vite dev server.
 */

import { useCallback, useState } from 'react';

interface SampleCasesProps {
  onSelectImage: (url: string) => void;
}

const SAMPLES = [
  {
    id: 'sample-1',
    label: '示例图片 1',
    sublabel: '测试色彩匹配与渐变',
    url: '/samples/sample-1.jpg',
  },
  {
    id: 'sample-2',
    label: '示例图片 2',
    sublabel: '测试边缘识别与细节',
    url: '/samples/sample-2.jpg',
  },
];

export default function SampleCases({ onSelectImage }: SampleCasesProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSample = useCallback((id: string, url: string) => {
    setLoadingId(id);
    // We pass the URL directly — handleSampleSelect in ConvertPage
    // will create an Image and load it from this URL.
    onSelectImage(url);
  }, [onSelectImage]);

  return (
    <div className="card-bean p-3">
      <h3 className="section-heading">快速试用</h3>
      <p className="text-xs text-[#8E8E93] mb-3 leading-relaxed">
        点击示例图片，无需上传即可体验
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SAMPLES.map(({ id, label, sublabel, url }) => (
          <button
            key={id}
            onClick={() => handleSample(id, url)}
            disabled={loadingId === id}
            className="flex flex-col items-center gap-1.5 py-2 px-2 rounded-lg border border-[#E8E8EA] bg-[#F2F2F7] hover:border-[#E85D75] hover:bg-[#FFF0F2] transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#E8E8EA] shadow-sm">
              <img
                src={url}
                alt={label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-xs font-semibold text-[#1C1C1E]">{label}</span>
            <span className="text-[10px] text-[#8E8E93] leading-none">{sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
