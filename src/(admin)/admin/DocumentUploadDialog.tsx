import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileText, Upload, FileUp, Shield, X, Check, CheckCircle2, Loader2, Star, Building2 } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';

import type { Department } from '@/types/dms';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export type UploadData = {
  title: string;
  description: string;
  document_type: string;
  category: string;
  /** Ordered list of department IDs. First entry is the primary (owning) department. */
  department_ids: string[];
  visibility_level: 'public' | 'department' | 'restricted';
  tags: string[];
  is_encrypted: boolean;
  file: File | null;
};

const UPLOAD_DEFAULTS: UploadData = {
  title: '',
  description: '',
  document_type: 'policy',
  category: 'administrative',
  department_ids: [],
  visibility_level: 'department',
  tags: [],
  is_encrypted: false,
  file: null,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadData: UploadData;
  setUploadData: (u: UploadData) => void;
  departments: Department[];
  isUploading: boolean;
  onUpload: () => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  addTag: () => void;
  removeTag: (t: string) => void;
};

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  uploadData,
  setUploadData,
  departments,
  isUploading,
  onUpload,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
}: Props) {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.');
      setUploadData({
        ...uploadData,
        file,
        title: uploadData.title.trim() === '' ? fileNameWithoutExt : uploadData.title,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload />
          Upload document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <div className="flex max-h-[90vh] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div className="flex shrink-0 flex-col justify-center border-b border-line bg-surface-0 p-6 md:w-2/5 md:border-b-0 md:border-r">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-text-primary">File</h3>
              <p className="mt-1 text-sm text-text-secondary">Choose the document you want to add.</p>
            </div>

            {!uploadData.file ? (
              <div
                {...getRootProps()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  isDragActive ? 'border-signal bg-signal-tint' : 'border-line-strong bg-surface-1 hover:border-signal',
                )}
              >
                <input {...getInputProps()} />
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-field text-text-secondary">
                  <FileUp size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Drop a file here or browse</p>
                  <p className="mt-1 text-xs text-text-muted">PDF, DOCX or XLSX, up to 50MB</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-surface-1 p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary" title={uploadData.file?.name}>
                      {uploadData.file?.name}
                    </p>
                    <p className="font-mono text-xs text-text-muted">
                      {uploadData.file && `${formatBytes(uploadData.file.size)} · ${uploadData.file.type.split('/').pop()?.toUpperCase()}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove file"
                    title="Remove file"
                    onClick={() => setUploadData({ ...uploadData, file: null })}
                  >
                    <X />
                  </Button>
                </div>
                <StatusBadge tone="positive" className="mt-3">Ready to upload</StatusBadge>
              </div>
            )}

            <p className="mt-6 flex items-center gap-2 text-xs text-text-muted">
              <Shield size={16} />
              You can encrypt the file before it is stored.
            </p>
          </div>

          <div className="flex-1 p-6 md:overflow-y-auto">
            <DialogHeader className="mb-5">
              <DialogTitle>Upload document</DialogTitle>
              <DialogDescription>Add the details people will use to find this document.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="upload-dialog-title">Title (required)</Label>
                  <Input
                    id="upload-dialog-title"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder="Annual financial audit 2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upload-dialog-description">Description</Label>
                  <Textarea
                    id="upload-dialog-description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Audit of the 2026 accounts, prepared for the board"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Document type</Label>
                  <Select value={uploadData.document_type} onValueChange={(v) => setUploadData({ ...uploadData, document_type: v })}>
                    <SelectTrigger aria-label="Document type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="memo">Memo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Classification</Label>
                  <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                    <SelectTrigger aria-label="Classification"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="hr">Human resources</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 size={16} /> Departments
                </Label>
                {/* Multi-select department list */}
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md bg-field p-1.5">
                  {departments.filter(d => d.id?.trim()).length === 0 && (
                    <p className="px-2 py-1 text-xs text-text-muted">No departments available</p>
                  )}
                  {departments.filter(d => d.id?.trim()).map(d => {
                    const isSelected = uploadData.department_ids.includes(d.id)
                    const isPrimary = uploadData.department_ids[0] === d.id
                    return (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          const current = uploadData.department_ids
                          const next = isSelected
                            ? current.filter(id => id !== d.id)
                            : [...current, d.id]
                          setUploadData({ ...uploadData, department_ids: next })
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                          isSelected ? 'bg-surface-1 font-medium text-text-primary' : 'text-text-secondary hover:bg-field-hover',
                        )}
                      >
                        <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-xs border', isSelected ? 'border-signal bg-signal text-on-signal' : 'border-line-strong bg-surface-1')}>
                          {isSelected && <Check size={12} />}
                        </span>
                        <span className="flex-1 truncate text-left">{d.name}</span>
                        {isPrimary && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-signal-text">
                            <Star size={14} />Primary
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-text-muted">
                  {uploadData.department_ids.length === 0
                    ? 'No department selected, so the document is shared across the organisation.'
                    : 'The first one you select is the primary department.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select value={uploadData.visibility_level} onValueChange={(v: any) => setUploadData({ ...uploadData, visibility_level: v })}>
                  <SelectTrigger aria-label="Visibility"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department only</SelectItem>
                    <SelectItem value="public">Everyone in the organisation</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upload-dialog-tag">Tags</Label>
                {uploadData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadData.tags.map(t => (
                      <StatusBadge key={t} tone="neutral">
                        {t}
                        <button type="button" aria-label={`Remove tag ${t}`} className="rounded-pill hover:text-text-primary" onClick={() => removeTag(t)}>
                          <X size={12} />
                        </button>
                      </StatusBadge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="upload-dialog-tag"
                    placeholder="renewal"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button variant="secondary" onClick={addTag} disabled={!tagInput.trim()}>Add tag</Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-4">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Encrypt this file</p>
                    <p className="text-xs text-text-muted">The file is encrypted before it is stored.</p>
                  </div>
                </div>
                <Switch aria-label="Encrypt this file" checked={uploadData.is_encrypted} onCheckedChange={(checked) => setUploadData({ ...uploadData, is_encrypted: checked })} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={onUpload}
                disabled={isUploading || !uploadData.file}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <CheckCircle2 />
                    Upload document
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
