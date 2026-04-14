import { motion } from 'framer-motion'
import { X, Download, RotateCcw, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto z-50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-display font-semibold text-text-xl text-gray-900">
            Version History
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {versions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-sans">No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVersions.map((version, idx) => {
                const isCurrent = currentVersion?.id === version.id
                return (
                  <motion.div
                    key={version.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-sans font-semibold text-text-sm text-gray-900">
                            Version {sortedVersions.length - idx}
                          </p>
                          {isCurrent && (
                            <Badge className="bg-blue-100 text-blue-700 border-0">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-text-xs text-gray-600 mb-2">
                          Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-text-xs text-gray-500">
                          Size: {version.file_size ? formatFileSize(version.file_size) : 'Unknown'}
                          {version.change_description && ` • ${version.change_description}`}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(version.id)}
                          disabled={isLoading}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRestore(version.id)}
                            disabled={isLoading}
                            className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">Restore</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
