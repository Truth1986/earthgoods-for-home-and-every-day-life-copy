import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link, Loader2, X, Image } from "lucide-react";

export default function ProductImageUploader({ value, onChange }) {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
    setMode('url');
  };

  return (
    <div className="space-y-2">
      <Label>Product Image</Label>

      {/* Mode Toggle */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${mode === 'url' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Link className="w-3.5 h-3.5 inline mr-1.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${mode === 'upload' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Upload className="w-3.5 h-3.5 inline mr-1.5" />
          Upload
        </button>
      </div>

      {mode === 'url' ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
        />
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-stone-200 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
          >
            {uploading ? (
              <><Loader2 className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-2" /><p className="text-sm text-stone-500">Uploading...</p></>
            ) : (
              <><Upload className="w-6 h-6 mx-auto text-stone-400 mb-2" /><p className="text-sm text-stone-600">Click to upload an image</p><p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP</p></>
            )}
          </button>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}