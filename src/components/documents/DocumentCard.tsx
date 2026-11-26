import { motion } from 'framer-motion'
import { MoreVertical, Download, Trash2, Edit2, History } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {type Document } from '@/types/dms'
import { getFileTypeIcon, getFileTypeLabel } from '@/lib/utils/fileTypeMap'
import { formatDistanceToNow } from 'date-fns'

interface DocumentCardProps {
  document: Document
  onView: (doc: Document) => void
  onDownload: (doc: Document) => void
  onEdit: (doc: Document) => void
  onDelete: (doc: Document) => void
  onVersions: (doc: Document) => void
  canEdit?: boolean
  canDelete?: boolean
}

/**
 * DocumentCard — Grid view card for displaying a single document
 * 
 * Features:
 * - File type icon (SVG, 24px)
 * - Title + description snippet
 * - Status badge (color-coded)
 * - Metadata: file size, upload date, owner
 * - Tags display
 * - Hover reveal: action menu
 * - Design system compliant
 */
export function DocumentCard({
  document,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onVersions,
  canEdit = true,
  canDelete = true,
}: DocumentCardProps) {
  const fileIcon = getFileTypeIcon(document.file_name)
  const fileTypeLabel = getFileTypeLabel(document.file_name)
  const uploadDate = new Date(document.created_at)
  const timeAgo = formatDistanceToNow(uploadDate, { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer rounded-lg border border-line bg-surface-1 p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
      onClick={() => onView(document)}
    >
      {/* Top row: Icon + Status + Menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* File type icon */}
          <img
            src={fileIcon}
            alt={fileTypeLabel}
            className="h-6 w-6 flex-shrink-0"
          />

          {/* File type badge */}
          <StatusBadge tone="neutral" className="shrink-0">
            {fileTypeLabel}
          </StatusBadge>
        </div>

        {/* Action menu (hidden by default, reveal on hover) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="More actions"
              title="More actions"
              className="h-8 w-8 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(document); }}>
              <Download size={16} className="mr-2" />
              Download
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(document); }}>
                <Edit2 size={16} className="mr-2" />
                Edit details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(document); }}>
              <History size={16} className="mr-2" />
              Version history
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(document); }}
                className="text-risk focus:text-risk"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title (truncated to 2 lines) */}
      <h3 className="mb-2 line-clamp-2 text-base font-semibold text-text-primary">
        {document.title}
      </h3>

      {/* Description snippet (1 line) */}
      {document.description && (
        <p className="mb-3 line-clamp-1 text-sm text-text-secondary">
          {document.description}
        </p>
      )}

      {/* Tags (if any) */}
      {document.tags && document.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {document.tags.slice(0, 2).map((tag, idx) => (
            <StatusBadge key={idx} tone="neutral">
              {tag}
            </StatusBadge>
          ))}
          {document.tags.length > 2 && (
            <StatusBadge tone="neutral">
              +{document.tags.length - 2}
            </StatusBadge>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="mb-3">
        <DocumentStatusBadge status={document.status} />
      </div>

      {/* Metadata row: size, date */}
      <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="font-mono">
            {formatFileSize(document.file_size || 0)}
          </span>
        </div>
        <span>{timeAgo}</span>
      </div>
    </motion.div>
  )
}

/**
 * Format bytes to human-readable file size
 * e.g., 1024 → "1 KB", 1048576 → "1 MB"
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
