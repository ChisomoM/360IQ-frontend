import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      alert(`Unsupported file format. Supported: ${supportedFormats.join(', ')}`);
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
      alert('Please select a file and department');
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
      <div className="w-full bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">

        <h3 className="text-lg font-semibold text-green-900 mb-1">Upload Successful!</h3>
        <p className="text-sm text-green-700 mb-2">{selectedFile?.name} uploaded</p>
        <p className="text-xs text-green-600">🤖 AI is analyzing your document...</p>
      </div>
    );
  }

  if (selectedFile && !isUploading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg p-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <div className="flex items-start gap-3">
            <Upload className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">{selectedFile.name}</p>
              <p className="text-sm text-blue-700 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-blue-600 hover:text-blue-900"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <Select value={metadata.department} onValueChange={(value) => setMetadata({ ...metadata, department: value })}>
              <SelectTrigger>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Select value={metadata.category || ''} onValueChange={(value) => setMetadata({ ...metadata, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              placeholder="Add tags (comma-separated, optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRemoveFile}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadClick}
            className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm font-medium text-gray-900 mb-3">Uploading {selectedFile?.name}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept={supportedFormats.map(f => `.${f}`).join(',')}
        className="hidden"
      />

      <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {isDragging ? '✨ Drop files to upload them ✨' : '📤 Upload Document'}
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        {isDragging ? 'Release to upload' : 'Drag & drop files here or click to browse'}
      </p>

      <p className="text-xs text-gray-500 mb-6">
        Supports: Word, Excel, PDF, Images
      </p>

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Browse Files
      </Button>
    </div>
  );
}
