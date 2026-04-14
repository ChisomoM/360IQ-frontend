import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  X, 
  FileText, 
  Shield, 
  Building, 
  Lock, 
  Tag, 
  CheckCircle2, 
  FileUp,
  Loader2
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
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
  department_id: string
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
    department_id: '',
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
      toast.error('Please provide a title and select a file')
      return
    }
    try {
      await onSubmit(formData)
      setFormData({
        title: '',
        description: '',
        document_type: 'policy',
        category: 'administrative',
        department_id: '',
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
      <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex h-full max-h-[90vh]">
          {/* Left Column: File Dropzone & Preview */}
          <div className="w-2/5 bg-slate-50 p-8 border-r border-slate-100 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-800">File Ingestion</h3>
              <p className="text-sm text-slate-500 mt-1">Upload your document to safely archive it in the DIMS vault.</p>
            </div>

            {!formData.file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer
                  flex flex-col items-center justify-center text-center space-y-4
                  ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 hover:border-primary hover:bg-white'}
                `}
              >
                <input 
                  type="file"
                  onChange={handleFileInput}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
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
                  onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate" title={formData.file.name}>
                      {formData.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(formData.file.size)} • {formData.file.type.split('/').pop()?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full w-fit">
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

          {/* Right Column: Metadata Form */}
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 leading-none">Metadata & Settings</DialogTitle>
              <DialogDescription>Index your document with precision for easy retrieval.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6">
              {/* Basic Info */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Document Title *</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="e.g., Annual Financial Audit 2024"
                    disabled={isLoading}
                    className="h-11 border-slate-200 focus:ring-primary shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Provide deep context for this record..." 
                    rows={3}
                    disabled={isLoading}
                    className="resize-none border-slate-200 shadow-sm"
                  />
                </div>
              </div>

              <Separator />

              {/* Classification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Document Type</Label>
                  <Select 
                    value={formData.document_type} 
                    onValueChange={(v) => setFormData({ ...formData, document_type: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Classification</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Organization & Sensitivity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1">
                    <Building className="h-3 w-3" /> Owning Department
                  </Label>
                  <Select 
                    value={formData.department_id} 
                    onValueChange={(v) => setFormData({ ...formData, department_id: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Global / Central" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.filter(d => d.id?.trim()).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Visibility Level
                  </Label>
                  <Select 
                    value={formData.visibility_level} 
                    onValueChange={(v: any) => setFormData({ ...formData, visibility_level: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Department Internal</SelectItem>
                      <SelectItem value="public">Tenant Public</SelectItem>
                      <SelectItem value="restricted">Restricted Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </Label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {formData.tags.map(t => (
                    <Badge key={t} variant="secondary" className="px-2 py-0.5 rounded-md flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 group">
                      {t}
                      <X 
                        className="h-3 w-3 cursor-pointer opacity-50 group-hover:opacity-100" 
                        onClick={() => handleRemoveTag(t)} 
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add tag and press Enter..." 
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    disabled={isLoading}
                    className="h-9 border-slate-200 text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddTag} 
                    disabled={isLoading || !tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Vault Encryption */}
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
                <Switch 
                  checked={formData.is_encrypted} 
                  onCheckedChange={(checked) => setFormData({ ...formData, is_encrypted: checked })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1 h-12 text-slate-500" 
                onClick={onClose}
                disabled={isLoading}
              >
                Discard
              </Button>
              <Button 
                className="flex-[2] h-12 shadow-md shadow-primary/20 text-lg font-bold" 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.file}
              >
                {isLoading ? (
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
  )
}
