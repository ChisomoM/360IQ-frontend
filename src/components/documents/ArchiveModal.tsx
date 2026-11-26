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
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Archive this document?</DialogTitle>
          <DialogDescription>
            "{document.title}" will be marked as archived and hidden from active views. You can restore it later by changing its status.
          </DialogDescription>
        </DialogHeader>

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
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Archiving' : 'Archive document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
