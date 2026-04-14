import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Document } from '@/types/dms'

interface DeleteModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  document: Document | null
  isLoading?: boolean
}

export function DeleteModal({
  open,
  onClose,
  onConfirm,
  document,
  isLoading = false,
}: DeleteModalProps) {
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="p-6 space-y-4">
          {/* Icon & Title */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-text-lg text-gray-900">
                Delete Document?
              </h3>
              <p className="text-text-sm text-gray-600 mt-1">
                This action cannot be undone. The document "{document.title}"
                will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-text-xs font-sans text-red-700">
              ⚠️ All versions and access records will also be deleted.
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Deleting...' : 'Delete Document'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
