'use client';

import { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onUpload?: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
}

export default function ImageUploader({ 
  onUpload,
  maxFiles = 5,
  accept = 'image/*'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    // Create preview URLs
    const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles));

    // In a real app, you would upload to S3 or similar
    // For now, we'll just pass the previews
    onUpload?.(newPreviews);
    setUploading(false);
  }, [maxFiles, onUpload]);

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={preview} 
              alt={`Preview ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePreview(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
        
        {previews.length < maxFiles && (
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-hipa-primary transition-colors">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs text-gray-500 mt-1">Upload</span>
            <input
              type="file"
              accept={accept}
              multiple={maxFiles - previews.length > 1}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      
      {uploading && (
        <p className="text-sm text-gray-500">Uploading...</p>
      )}
    </div>
  );
}
