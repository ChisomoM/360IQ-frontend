import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImageUpload } from '../hooks/useImageUpload';
import { Upload } from '@/components/icons';

interface FileUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
  pages?: number;
}

interface FileUploadProps {
  onUpload: (result: FileUploadResult) => void;
  acceptImages?: boolean;
  acceptPDFs?: boolean;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  acceptImages = true,
  acceptPDFs = false,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  className = '',
  label = 'Drop files here or browse'
}) => {
  const { uploadFile, uploadMultiple, uploading, progress, error } = useImageUpload();

  const acceptedTypes: Record<string, string[]> = {};
  if (acceptImages) {
    acceptedTypes['image/*'] = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
  }
  if (acceptPDFs) {
    acceptedTypes['application/pdf'] = ['.pdf'];
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (acceptedFiles.length === 1) {
        const result = await uploadFile(acceptedFiles[0]);
        onUpload(result);
      } else {
        const results = await uploadMultiple(acceptedFiles);
        results.forEach(result => onUpload(result));
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Error handled by hook
    }
  }, [uploadFile, uploadMultiple, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles,
    disabled: uploading,
    multiple: maxFiles > 1
  });

  const getSupportedFormats = () => {
    const formats = [];
    if (acceptImages) formats.push('JPG, PNG, WebP, GIF');
    if (acceptPDFs) formats.push('PDF');
    return formats.join(', ');
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-signal bg-signal-tint' : 'border-line-strong bg-surface-1 hover:border-signal'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-2">
            <div className="text-sm text-text-secondary">Uploading</div>
            <div className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
              <div
                className="h-full rounded-pill bg-signal transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : isDragActive ? (
          <p className="text-sm text-signal-text">Drop the files to upload them</p>
        ) : (
          <div>
            <Upload size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="mb-1 text-sm font-medium text-text-primary">
              {label}
            </p>
            <p className="text-xs text-text-muted">
              {getSupportedFormats()}, up to {maxSize / 1024 / 1024}MB each
            </p>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-2 text-xs text-risk">{error}</div>
      )}
    </div>
  );
};
