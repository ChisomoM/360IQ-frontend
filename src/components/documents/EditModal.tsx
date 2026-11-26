import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getStatus } from '@/lib/status'
import type { Document } from '@/types/dms'

interface EditModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EditFormData) => Promise<void>
  document: Document | null
  isLoading?: boolean
}

export interface EditFormData {
  title: string
  description: string
  visibility_level: 'public' | 'department' | 'restricted'
  status: string
}

const visibilityLevels = [
  { value: 'public' as const, label: 'Public, all users' },
  { value: 'department' as const, label: 'Department only' },
  { value: 'restricted' as const, label: 'Restricted, owner only' },
]

const statusOptions = [
  'active',
  'archived',
  'pending',
  'approved',
  'rejected',
  'action_required',
]

export function EditModal({
  open,
  onClose,
  onSubmit,
  document,
  isLoading = false,
}: EditModalProps) {
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    description: '',
    visibility_level: 'department',
    status: 'active',
  })

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        description: document.description || '',
        visibility_level: (document.visibility_level || 'department') as 'public' | 'department' | 'restricted',
        status: document.status || 'active',
      })
    }
  }, [document, open])

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      return
    }
    try {
      await onSubmit(formData)
      onClose()
    } catch {
      // Error handling in parent
    }
  }

  if (!open || !document) return null

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit document</DialogTitle>
          <DialogDescription>Update the document details. The file itself is not changed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title (required)</Label>
            <Input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              rows={4}
            />
          </div>

          {/* Status & Visibility Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatus(status).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select
                value={formData.visibility_level}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    visibility_level: value as 'public' | 'department' | 'restricted',
                  }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="edit-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.title.trim()}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
