import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FileText, Upload, FileUp, Shield, Tag, X, CheckCircle2, Loader2, Star, Building2 } from 'lucide-react';
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
        <Button variant="tenantPrimary" className="shadow-lg hover:shadow-xl transition-all">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex h-full max-h-[90vh]">
          <div className="w-2/5 bg-slate-50 p-8 border-r border-slate-100 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-800">File Ingestion</h3>
              <p className="text-sm text-slate-500 mt-1">Upload your document to safely archive it in the vault.</p>
            </div>

            {!uploadData.file ? (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer
                  flex flex-col items-center justify-center text-center space-y-4
                  ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 hover:border-primary hover:bg-white'}
                `}
              >
                <input {...getInputProps()} />
                <div className="p-4 bg-white rounded-full shadow-sm text-primary">
                  <FileUp className="h-10 w-10" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Click or drag file</p>
                  <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, XLSX (Max 50MB)</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group">
                <button
                  onClick={() => setUploadData({ ...uploadData, file: null })}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate" title={uploadData.file?.name}>
                      {uploadData.file?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {uploadData.file && `${formatBytes(uploadData.file.size)} • ${uploadData.file.type.split('/').pop()?.toUpperCase()}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-positive text-[10px] font-bold uppercase tracking-wider bg-positive-tint px-3 py-1 rounded-full w-fit">
                  <CheckCircle2 className="h-3 w-3" /> Ready for upload
                </div>
              </div>
            )}

            <div className="mt-auto pt-8">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-3 w-3" />
                <span>Secure end-to-end encryption available</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto bg-white">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 leading-none">Metadata & Settings</DialogTitle>
              <DialogDescription>Index your document with precision for easy retrieval.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6">
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Document Title *</Label>
                  <Input
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder="e.g., Annual Financial Audit 2024"
                    className="h-11 border-slate-200 focus:ring-primary shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Description</Label>
                  <Textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Provide deep context for this record..."
                    rows={3}
                    className="resize-none border-slate-200 shadow-sm"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Document Type</Label>
                  <Select value={uploadData.document_type} onValueChange={(v) => setUploadData({ ...uploadData, document_type: v })}>
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="memo">Memo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Classification</Label>
                  <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Departments
                    <span className="text-slate-400 normal-case font-normal ml-1">— first selected is the owning department</span>
                  </Label>
                  {/* Multi-select department checkboxes */}
                  <div className="border border-slate-200 rounded-lg bg-slate-50/50 max-h-40 overflow-y-auto p-2 space-y-1">
                    {departments.filter(d => d.id?.trim()).length === 0 && (
                      <p className="text-xs text-slate-400 px-2 py-1">No departments available</p>
                    )}
                    {departments.filter(d => d.id?.trim()).map(d => {
                      const isSelected = uploadData.department_ids.includes(d.id)
                      const isPrimary = uploadData.department_ids[0] === d.id
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const current = uploadData.department_ids
                            const next = isSelected
                              ? current.filter(id => id !== d.id)
                              : [...current, d.id]
                            setUploadData({ ...uploadData, department_ids: next })
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                          }`}>
                            {isSelected && <X className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className="flex-1 text-left truncate">{d.name}</span>
                          {isPrimary && (
                            <span className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                              <Star className="h-3 w-3 fill-amber-400" /> Primary
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {uploadData.department_ids.length === 0 && (
                    <p className="text-xs text-slate-400">No department selected — document will be institution-wide</p>
                  )}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">Visibility Level</Label>
                  <Select value={uploadData.visibility_level} onValueChange={(v: any) => setUploadData({ ...uploadData, visibility_level: v })}>
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Department Internal</SelectItem>
                      <SelectItem value="public">Institution Public</SelectItem>
                      <SelectItem value="restricted">Restricted Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">Tags</Label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {uploadData.tags.map(t => (
                    <Badge key={t} variant="secondary" className="px-2 py-0.5 rounded-md flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 group">
                      {t}
                      <X className="h-3 w-3 cursor-pointer opacity-50 group-hover:opacity-100" onClick={() => removeTag(t)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="h-9 border-slate-200 text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>Add</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Zero-Trust Encryption</p>
                    <p className="text-xs text-slate-500">Encrypt this file before storing it in the persistent vault.</p>
                  </div>
                </div>
                <Switch checked={uploadData.is_encrypted} onCheckedChange={(checked) => setUploadData({ ...uploadData, is_encrypted: checked })} />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Button variant="ghost" className="flex-1 h-12 text-slate-500" onClick={() => onOpenChange(false)}>Discard</Button>
              <Button
                variant="tenantPrimary"
                className="flex-[2] h-12 shadow-md shadow-primary/20 text-lg font-bold"
                onClick={onUpload}
                disabled={isUploading || !uploadData.file}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Archiving Document...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Upload
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
