import { motion } from 'framer-motion'
import { MoreVertical, Download, Eye, Trash2, Edit2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  // Status color mapping (design system semantic colors)
  const statusColorMap: Record<string, string> = {
    'active': 'bg-emerald-100 text-emerald-800',
    'archived': 'bg-gray-100 text-gray-800',
    'pending': 'bg-amber-100 text-amber-800',
    'approved': 'bg-blue-100 text-blue-800',
    'rejected': 'bg-red-100 text-red-800',
    'action_required': 'bg-purple-100 text-purple-800',
  }

  const statusColor = statusColorMap[document.status] || 'bg-gray-100 text-gray-800'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
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
          <Badge variant="outline" className="text-text-xs font-mono flex-shrink-0">
            {fileTypeLabel}
          </Badge>
        </div>

        {/* Action menu (hidden by default, reveal on hover) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(document); }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(document); }}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Metadata
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(document); }}>
              <History className="h-4 w-4 mr-2" />
              Version History
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(document); }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title (truncated to 2 lines) */}
      <h3 className="font-display font-semibold text-text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-tenant-primary transition-colors">
        {document.title}
      </h3>

      {/* Description snippet (1 line) */}
      {document.description && (
        <p className="font-sans text-text-sm text-gray-500 line-clamp-1 mb-3">
          {document.description}
        </p>
      )}

      {/* Tags (if any) */}
      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {document.tags.slice(0, 2).map((tag, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-text-xs bg-blue-50 text-blue-700"
            >
              {tag}
            </Badge>
          ))}
          {document.tags.length > 2 && (
            <Badge
              variant="secondary"
              className="text-text-xs"
            >
              +{document.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="mb-3">
        <Badge className={`text-text-xs font-medium ${statusColor}`}>
          {document.status}
        </Badge>
      </div>

      {/* Metadata row: size, date */}
      <div className="flex items-center justify-between text-text-xs text-gray-500 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono">
            {formatFileSize(document.file_size || 0)}
          </span>
        </div>
        <span className="font-sans">{timeAgo}</span>
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
