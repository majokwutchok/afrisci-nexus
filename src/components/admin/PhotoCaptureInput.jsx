import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';

const MAX_DIMENSION = 300;
const JPEG_QUALITY = 0.6;

function resizeToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round(height * (MAX_DIMENSION / width));
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round(width * (MAX_DIMENSION / height));
        height = MAX_DIMENSION;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Credit-free photo capture: resizes/compresses the image client-side into a small
 * JPEG thumbnail data URL (no file storage integration required).
 */
export default function PhotoCaptureInput({ value, onChange }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const dataUrl = await resizeToDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError('Could not process image. Try a different photo.');
    }
  };

  return (
    <div className="md:col-span-2 space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <Camera className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
            <Camera className="w-3.5 h-3.5 mr-1.5" /> Take Photo
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-400">Photo is compressed and stored directly on the profile — no file storage service required.</p>
    </div>
  );
}