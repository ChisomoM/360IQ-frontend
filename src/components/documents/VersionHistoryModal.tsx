import { Download, RotateCcw, Clock } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DocumentVersion } from '@/types/dms'
import { formatFileSize } from '@/lib/utils/fileTypeMap'

interface VersionHistoryModalProps {
  open: boolean
  onClose: () => void
  versions: DocumentVersion[]
  currentVersion?: DocumentVersion
  onDownload: (versionId: string) => Promise<void>
  onRestore: (versionId: string) => Promise<void>
  isLoading?: boolean
}

export function VersionHistoryModal({
  open,
  onClose,
  versions,
  currentVersion,
  onDownload,
  onRestore,
  isLoading = false,
}: VersionHistoryModalProps) {
  if (!open) return null

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>Saved versions of this document, newest first.</DialogDescription>
        </DialogHeader>

        {versions.length === 0 ? (
          isLoading ? (
            <TableSkeleton rows={3} columns={3} />
          ) : (
            <EmptyState
              icon={<Clock size={24} />}
              title="No versions yet"
              description="New versions of this document will be listed here."
            />
          )
        ) : (
          <ul className="space-y-3">
            {sortedVersions.map((version, idx) => {
              const isCurrent = currentVersion?.id === version.id
              return (
                <li
                  key={version.id}
                  className={cn('rounded-md border border-line p-4', isCurrent && 'bg-surface-2')}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">
                          Version <span className="font-mono">{sortedVersions.length - idx}</span>
                        </p>
                        {isCurrent && <StatusBadge tone="neutral">Current</StatusBadge>}
                      </div>
                      <p className="font-mono text-xs text-text-secondary">
                        {formatDateTime(version.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        <span className="font-mono">{version.file_size ? formatFileSize(version.file_size) : 'Size unknown'}</span>
                        {(version as any).change_description && ` · ${(version as any).change_description}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDownload(version.id)}
                        disabled={isLoading}
                        aria-label="Download version"
                      >
                        <Download />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestore(version.id)}
                          disabled={isLoading}
                          aria-label="Restore version"
                        >
                          <RotateCcw />
                          <span className="hidden sm:inline">Restore</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
