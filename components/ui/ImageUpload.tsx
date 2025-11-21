'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  bucket?: string;
  required?: boolean;
  error?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Image',
  accept = 'image/*',
  maxSize = 5,
  bucket = 'public',
  required = false,
  error
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setUploadError(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Create immediate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start upload
    uploadFile(file);
  }, [maxSize]);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const imageUrl = data.url;
          onChange(imageUrl);
          setPreview(imageUrl); // Update to final URL
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image');
      // Revert preview if upload failed
      setPreview(value || null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [bucket, onChange, value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-red-500">*</span>}</Label>

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleRemove}
            disabled={uploading}
          >
            ×
          </Button>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-gray-600">
            {uploading ? 'Uploading...' : 'Drag & drop an image here, or click to select'}
          </div>
          {uploading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {(uploadError || error) && (
        <p className="text-red-500 text-sm">{uploadError || error}</p>
      )}

      <p className="text-sm text-gray-500">
        Max file size: {maxSize}MB. Supported formats: JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}