import { motion } from 'framer-motion'
import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Document } from '@/types/dms'

interface ArchiveModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  document: Document | null
  isLoading?: boolean
}

export function ArchiveModal({
  open,
  onClose,
  onConfirm,
  document,
  isLoading = false,
}: ArchiveModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
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
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl max-w-md w-11/12 z-50"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="p-6 space-y-4">
          {/* Icon & Title */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
              <Archive className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-text-lg text-gray-900">
                Archive Document?
              </h3>
              <p className="text-text-sm font-sans text-gray-600 mt-1">
                "{document.title}" will be marked as archived and hidden from active views.
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-text-xs font-sans text-amber-700">
              This is reversible — archived documents can be restored by updating their status.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isLoading ? 'Archiving...' : 'Archive Document'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
