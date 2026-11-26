import React from 'react';
import { getPDFThumbnail } from '../lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Trash2, X } from '@/components/icons';

interface FileItem {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
  pages?: number;
}

interface FileGalleryProps {
  files: FileItem[];
  onRemove: (index: number) => void;
  className?: string;
}

export const FileGallery: React.FC<FileGalleryProps> = ({
  files,
  onRemove,
  className = ''
}) => {
  if (files.length === 0) return null;

  const images = files.filter(file => file.format !== 'pdf');
  const pdfs = files.filter(file => file.format === 'pdf');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Images Gallery */}
      {images.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Images <span className="font-mono text-text-muted">{images.length}</span></h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {images.map((file) => {
              const actualIndex = files.indexOf(file);
              return (
                <div key={file.publicId} className="group relative">
                  <img
                    src={file.url}
                    alt={`Uploaded ${file.format}`}
                    className="h-20 w-full rounded-md border border-line object-cover sm:h-24 md:h-28 lg:h-32"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(actualIndex)}
                    className="absolute -right-2 -top-2 rounded-pill border border-risk bg-surface-1 p-1 text-risk opacity-0 shadow-raised transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-1 left-1 rounded-xs bg-surface-1 px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                    {file.format.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PDFs Gallery */}
      {pdfs.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Documents <span className="font-mono text-text-muted">{pdfs.length}</span></h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {pdfs.map((file, index) => {
              const actualIndex = files.indexOf(file);
              return (
                <div key={file.publicId} className="rounded-md border border-line bg-surface-1 p-3 sm:p-4">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="shrink-0">
                      <img
                        src={getPDFThumbnail(file.publicId)}
                        alt={`PDF ${index + 1} thumbnail`}
                        className="h-16 w-12 rounded-xs border border-line object-cover sm:h-20 sm:w-16"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-sm font-medium text-text-primary">
                            Document {index + 1}
                          </h5>
                          <p className="mt-1 font-mono text-xs text-text-muted">
                            {file.pages || 1} page{(file.pages || 1) !== 1 ? 's' : ''} · {(file.bytes / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(actualIndex)}
                          className="ml-2 h-8 w-8 shrink-0 hover:text-risk"
                          title="Remove document"
                          aria-label="Remove document"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-signal-text hover:underline"
                        >
                          View PDF
                        </a>
                        <span className="font-mono text-xs uppercase text-text-muted">{file.format}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
