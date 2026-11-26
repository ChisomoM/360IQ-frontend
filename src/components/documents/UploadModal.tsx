import { useState, useCallback } from 'react'
import {
  X,
  FileText,
  Shield,
  Building,
  Lock,
  Tag,
  Check,
  CheckCircle2,
  FileUp,
  Loader2,
  Star
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { type Department } from '@/types/dms'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: UploadFormData) => Promise<void>
  departments: Department[]
  isLoading?: boolean
}

export interface UploadFormData {
  title: string
  description: string
  document_type: string
  category: string
  /** Ordered list of department IDs. First entry is the primary (owning) department. */
  department_ids: string[]
  visibility_level: 'public' | 'department' | 'restricted'
  tags: string[]
  is_encrypted: boolean
  file: File | null
}

const documentTypes = [
  'policy',
  'procedure',
  'guideline',
  'report',
  'form',
  'template',
  'manual',
  'other',
]

const categories = [
  'academic',
  'financial',
  'legal',
  'hr',
  'administrative',
  'operational',
  'technical',
  'other',
]

const optionLabel = (value: string) =>
  value === 'hr' ? 'Human resources' : value.charAt(0).toUpperCase() + value.slice(1)

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function UploadModal({
  open,
  onClose,
  onSubmit,
  departments,
  isLoading = false,
}: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    document_type: 'policy',
    category: 'administrative',
    department_ids: [],
    visibility_level: 'department',
    tags: [],
    is_encrypted: false,
    file: null,
  })
  const [tagInput, setTagInput] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const droppedFile = files[0]
      const fileNameWithoutExt = droppedFile.name.split('.').slice(0, -1).join('.')
      setFormData(prev => ({
        ...prev,
        file: droppedFile,
        title: prev.title.trim() === '' ? fileNameWithoutExt : prev.title
      }))
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const selectedFile = files[0]
      const fileNameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.')
      setFormData(prev => ({
        ...prev,
        file: selectedFile,
        title: prev.title.trim() === '' ? fileNameWithoutExt : prev.title
      }))
    }
  }

  const handleAddTag = () => {
    const val = tagInput.trim().toLowerCase()
    if (val && !formData.tags.includes(val)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, val],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.file || !formData.title.trim()) {
      toast.error('Add a title and choose a file.')
      return
    }
    try {
      await onSubmit(formData)
      setFormData({
        title: '',
        description: '',
        document_type: 'policy',
        category: 'administrative',
        department_ids: [],
        visibility_level: 'department',
        tags: [],
        is_encrypted: false,
        file: null,
      })
    } catch {
      // Error handling in parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <div className="flex max-h-[90vh] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          {/* Left Column: File Dropzone & Preview */}
          <div className="flex shrink-0 flex-col justify-center border-b border-line bg-surface-0 p-6 md:w-2/5 md:border-b-0 md:border-r">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-text-primary">File</h3>
              <p className="mt-1 text-sm text-text-secondary">Choose the document you want to add.</p>
            </div>

            {!formData.file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  dragActive ? 'border-signal bg-signal-tint' : 'border-line-strong bg-surface-1 hover:border-signal',
                )}
              >
                <input
                  type="file"
                  aria-label="Choose a file"
                  onChange={handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isLoading}
                />
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
                    <p className="truncate text-sm font-semibold text-text-primary" title={formData.file.name}>
                      {formData.file.name}
                    </p>
                    <p className="font-mono text-xs text-text-muted">
                      {formatBytes(formData.file.size)} · {formData.file.type.split('/').pop()?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove file"
                    title="Remove file"
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    disabled={isLoading}
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

          {/* Right Column: Metadata Form */}
          <div className="flex-1 p-6 md:overflow-y-auto">
            <DialogHeader className="mb-5">
              <DialogTitle>Upload document</DialogTitle>
              <DialogDescription>Add the details people will use to find this document.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="upload-modal-title">Title (required)</Label>
                  <Input
                    id="upload-modal-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Annual financial audit 2026"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upload-modal-description">Description</Label>
                  <Textarea
                    id="upload-modal-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Audit of the 2026 accounts, prepared for the board"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Separator />

              {/* Classification */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Document type</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(v) => setFormData({ ...formData, document_type: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger aria-label="Document type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(t => (
                        <SelectItem key={t} value={t}>{optionLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Classification</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger aria-label="Classification">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{optionLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Organization & Sensitivity */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building size={16} /> Departments
                </Label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md bg-field p-1.5">
                  {departments.filter(d => d.id?.trim()).length === 0 && (
                    <p className="px-2 py-1 text-xs text-text-muted">No departments available</p>
                  )}
                  {departments.filter(d => d.id?.trim()).map(d => {
                    const isSelected = formData.department_ids.includes(d.id)
                    const isPrimary = formData.department_ids[0] === d.id
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled={isLoading}
                        aria-pressed={isSelected}
                        onClick={() => {
                          const current = formData.department_ids
                          const next = isSelected
                            ? current.filter(id => id !== d.id)
                            : [...current, d.id]
                          setFormData({ ...formData, department_ids: next })
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
                  {formData.department_ids.length === 0
                    ? 'No department selected, so the document is shared across the organisation.'
                    : 'The first one you select is the primary department.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Lock size={16} /> Visibility
                </Label>
                <Select
                  value={formData.visibility_level}
                  onValueChange={(v: any) => setFormData({ ...formData, visibility_level: v })}
                  disabled={isLoading}
                >
                  <SelectTrigger aria-label="Visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department only</SelectItem>
                    <SelectItem value="public">Everyone in the organisation</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="upload-modal-tag" className="flex items-center gap-1.5">
                  <Tag size={16} /> Tags
                </Label>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(t => (
                      <StatusBadge key={t} tone="neutral">
                        {t}
                        <button
                          type="button"
                          aria-label={`Remove tag ${t}`}
                          className="rounded-pill hover:text-text-primary"
                          onClick={() => handleRemoveTag(t)}
                        >
                          <X size={12} />
                        </button>
                      </StatusBadge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="upload-modal-tag"
                    placeholder="renewal"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleAddTag}
                    disabled={isLoading || !tagInput.trim()}
                  >
                    Add tag
                  </Button>
                </div>
              </div>

              {/* Vault Encryption */}
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
                <Switch
                  aria-label="Encrypt this file"
                  checked={formData.is_encrypted}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_encrypted: checked })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.file}
              >
                {isLoading ? (
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
  )
}
