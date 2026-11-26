import { AlertTriangle } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Delete this document?</DialogTitle>
          <DialogDescription>
            This cannot be undone. "{document.title}" will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <p className="flex items-center gap-2 rounded-md bg-risk-tint px-3 py-2 text-xs text-risk">
          <AlertTriangle size={16} className="shrink-0" />
          All versions and access records will also be deleted.
        </p>

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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting' : 'Delete document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
