import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Sparkles } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface UploadMetadata {
  department: string;
  category?: string;
  tags?: string[];
}

export interface UploadWidgetProps {
  onUpload: (file: File, metadata: UploadMetadata) => Promise<void>;
  departments?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  error?: string;
  onSuccess?: () => void;
}

export function QuickUploadWidget({
  onUpload,
  departments = [],
  categories = [],
  isLoading = false,
  error,
  onSuccess,
}: UploadWidgetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [metadata, setMetadata] = useState<UploadMetadata>({
    department: departments[0]?.id || '',
    category: '',
    tags: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const supportedFormats = ['docx', 'xlsx', 'pdf', 'txt', 'jpg', 'jpeg', 'png', 'doc', 'xls'];

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension && supportedFormats.includes(fileExtension)) {
      setSelectedFile(file);
      setUploadSuccess(false);
    } else {
      alert(`This file format is not supported. Choose one of: ${supportedFormats.join(', ')}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !metadata.department) {
      alert('Select a file and a department');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 30;
        });
      }, 200);

      await onUpload(selectedFile, metadata);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      setMetadata({
        department: departments[0]?.id || '',
        category: '',
        tags: [],
      });

      // Reset after 2 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Upload error:', err);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (uploadSuccess) {
    return (
      <div role="status" className="w-full rounded-lg bg-positive-tint p-6 text-center">
        <h3 className="mb-1 flex items-center justify-center gap-2 text-base font-semibold text-positive">
          <CheckCircle size={18} />
          Document uploaded
        </h3>
        <p className="mb-2 text-sm text-text-primary">{selectedFile?.name} uploaded</p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-signal-text">
          <Sparkles size={14} />
          360IQ is reading your document…
        </p>
      </div>
    );
  }

  if (selectedFile && !isUploading) {
    return (
      <div className="w-full rounded-lg border border-line bg-surface-1 p-6">
        <div className="mb-4 rounded-md bg-field p-4">
          <div className="flex items-start gap-3">
            <Upload size={18} className="mt-0.5 flex-shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{selectedFile.name}</p>
              <p className="mt-1 font-mono text-xs text-text-muted">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              aria-label="Remove file"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex gap-2 rounded-md bg-risk-tint p-3 text-risk">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="upload-department">Department (required)</Label>
            <Select value={metadata.department} onValueChange={(value) => setMetadata({ ...metadata, department: value })}>
              <SelectTrigger id="upload-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="upload-category">Category (optional)</Label>
              <Select value={metadata.category || ''} onValueChange={(value) => setMetadata({ ...metadata, category: value })}>
                <SelectTrigger id="upload-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="upload-tags">Tags (optional, separated by commas)</Label>
            <Input
              id="upload-tags"
              type="text"
              placeholder="budget, Q3"
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleRemoveFile}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleUploadClick}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading' : 'Upload file'}
          </Button>
        </div>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="w-full rounded-lg border border-line bg-surface-1 p-6">
        <p className="mb-3 text-sm font-semibold text-text-primary">Uploading {selectedFile?.name}</p>
        <div className="mb-2 h-2 w-full overflow-hidden rounded-pill bg-surface-2">
          <div
            className="h-2 rounded-pill bg-signal transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-xs text-text-muted">{Math.round(uploadProgress)}% complete</p>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'w-full rounded-lg border border-dashed p-8 text-center transition-colors',
        isDragging ? 'border-signal bg-surface-2' : 'border-line-strong bg-surface-1',
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept={supportedFormats.map(f => `.${f}`).join(',')}
        aria-label="Upload file"
        className="hidden"
      />

      <Upload size={32} className={cn('mx-auto mb-4', isDragging ? 'text-signal-text' : 'text-text-muted')} />

      <h3 className="mb-1 text-base font-semibold text-text-primary">
        {isDragging ? 'Drop the file to upload it' : 'Upload a document'}
      </h3>

      <p className="mb-4 text-sm text-text-secondary">
        {isDragging ? 'Release to upload' : 'Drag a file here or browse for one'}
      </p>

      <p className="mb-6 text-xs text-text-muted">
        Word, Excel, PDF, text and image files
      </p>

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="secondary"
      >
        <Upload size={16} />
        Browse files
      </Button>
    </div>
  );
}
