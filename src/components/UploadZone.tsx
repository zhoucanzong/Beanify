/**
 * UploadZone component - Drag & drop image upload area
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';

interface UploadZoneProps {
  imageUrl: string | null;
  onImageUpload: (url: string) => void;
  onClearImage: () => void;
}

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp';

export default function UploadZone({ imageUrl, onImageUpload, onClearImage }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        alert('\u8bf7\u4e0a\u4f20 JPG\u3001PNG \u6216 WEBP \u683c\u5f0f\u7684\u56fe\u7247');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('\u56fe\u7247\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc720MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageUpload(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // If image is uploaded, show thumbnail with re-upload option
  if (imageUrl) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#2D3436]">{'\u5df2\u4e0a\u4f20\u56fe\u7247'}</h3>
          <button
            onClick={onClearImage}
            className="p-1 rounded-md hover:bg-red-50 text-[#8A8D91] hover:text-red-500 transition-colors"
            title={'\u6e05\u9664\u56fe\u7247'}
          >
            <X size={16} />
          </button>
        </div>
        <div className="relative group" style={{ aspectRatio: '16/9' }}>
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-full object-contain rounded-lg border border-[#E8E8E8] bg-[#FAFAF8]"
          />
          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-[#2D3436] shadow-lg hover:bg-[#FAFAF8] transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              {'\u91cd\u65b0\u4e0a\u4f20'}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_TYPES}
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  // Empty upload zone
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-[#2D3436] mb-3">{'\u4e0a\u4f20\u56fe\u7247'}</h3>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          h-[160px] rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-[#FF6B6B] bg-[#FFF5F5]'
              : 'border-[#D0D0D0] bg-[#FAFAF8] hover:border-[#FF6B6B] hover:bg-[#FFF5F5]'
          }
        `}
      >
        <div
          className={`
          w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
          ${isDragging ? 'bg-[#FF6B6B]' : 'bg-[#FF6B6B]/10'}
        `}
        >
          {isDragging ? (
            <ImageIcon size={24} className="text-white" />
          ) : (
            <Upload size={24} className="text-[#FF6B6B]" />
          )}
        </div>
        <p className="text-sm text-[#2D3436] font-medium">
          {'\u70b9\u51fb\u4e0a\u4f20\u6216\u62d6\u62fd\u56fe\u7247\u5230\u6b64\u5904'}
        </p>
        <p className="text-xs text-[#8A8D91] mt-1">
          {'\u652f\u6301 JPG\u3001PNG\u3001WEBP \u683c\u5f0f\uff0c\u6700\u592720MB'}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_TYPES}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
