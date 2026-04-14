import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
  { value: 'public' as const, label: 'Public - All Users' },
  { value: 'department' as const, label: 'Department Only' },
  { value: 'restricted' as const, label: 'Restricted (Owner Only)' },
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
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl max-w-xl w-11/12 max-h-[90vh] overflow-y-auto z-50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-display font-semibold text-text-xl text-gray-900">
            Edit Document
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-text-sm font-sans font-semibold text-gray-700 mb-2">
              Document Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-text-sm font-sans font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg font-sans text-text-sm focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Status & Visibility Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-sm font-sans font-semibold text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(value) =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
                disabled={isLoading}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-text-sm font-sans font-semibold text-gray-700 mb-2">
                Visibility
              </label>
              <Select
                value={formData.visibility_level}
                onChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    visibility_level: value as 'public' | 'department' | 'restricted',
                  }))
                }
                disabled={isLoading}
              >
                {visibilityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
