/**
 * UploadZone component - Drag & drop with cleaner design
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

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
        alert('请上传 JPG、PNG 或 WEBP 格式的图片');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('图片大小不能超过20MB');
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
      if (files.length > 0) handleFile(files[0]);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFile(files[0]);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Uploaded state
  if (imageUrl) {
    return (
      <div className="card-bean p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-heading mb-0">已上传图片</h3>
          <button
            onClick={onClearImage}
            className="p-1 rounded-md hover:bg-[#FFF0F2] text-[#8E8E93] hover:text-[#E85D75] transition-colors"
            title="清除图片"
          >
            <X size={15} />
          </button>
        </div>
        <div className="relative group rounded-lg overflow-hidden bg-[#F2F2F7]" style={{ aspectRatio: '16/9' }}>
          <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handleClick}
              className="px-3.5 py-2 bg-white rounded-lg text-xs font-medium text-[#1C1C1E] shadow-lg hover:bg-[#F8F8F8] transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} />
              重新上传
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} className="hidden" onChange={handleChange} />
      </div>
    );
  }

  // Empty upload zone
  return (
    <div className="card-bean p-3">
      <h3 className="section-heading mb-3">上传图片</h3>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center h-[140px] rounded-lg border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-[#E85D75] bg-[#FFF0F2]'
            : 'border-[#D1D1D6] bg-[#F2F2F7] hover:border-[#E85D75] hover:bg-[#FFF0F2]'
          }
        `}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isDragging ? 'bg-[#E85D75]' : 'bg-[#E85D75]/10'}`}>
          {isDragging ? <Upload size={20} className="text-white" /> : <Upload size={20} className="text-[#E85D75]" />}
        </div>
        <p className="text-sm text-[#1C1C1E] font-medium">点击上传或拖拽图片到此</p>
        <p className="text-xs text-[#8E8E93] mt-0.5">支持 JPG、PNG、WEBP，最大20MB</p>
      </div>
      <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} className="hidden" onChange={handleChange} />
    </div>
  );
}
