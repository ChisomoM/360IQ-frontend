import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, MoreVertical, Download, Trash2, Edit2, History } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { formatDateTime } from '@/lib/format'
import type { Document } from '@/types/dms'
import { getFileTypeIcon, getFileTypeLabel } from '@/lib/utils/fileTypeMap'
import { formatDistanceToNow } from 'date-fns'

interface DocumentTableProps {
  documents: Document[]
  onView: (doc: Document) => void
  onDownload: (doc: Document) => void
  onEdit: (doc: Document) => void
  onDelete: (doc: Document) => void
  onVersions: (doc: Document) => void
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

/**
 * DocumentTable — List view table for displaying documents
 *
 * Features:
 * - Sortable columns (click header to sort)
 * - File type icon in first column
 * - Status badges
 * - Hover reveal: action menu
 * - Row hover effects
 * - Design system compliant
 */
export function DocumentTable({
  documents,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onVersions,
  sortColumn,
  sortDirection,
  onSort,
  canEdit = true,
  canDelete = true,
}: DocumentTableProps) {
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc'
      ? <ChevronUp size={14} />
      : <ChevronDown size={14} />
  }

  const sortHeader = (label: string, column: string, alignRight = false) => (
    <TableHead
      className={alignRight ? 'cursor-pointer select-none text-right' : 'cursor-pointer select-none'}
      aria-sort={sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={() => onSort?.(column)}
    >
      <button type="button" className={`flex items-center gap-1 rounded-xs text-xs font-medium hover:text-text-primary ${alignRight ? 'ml-auto' : ''}`}>
        {label}
        {renderSortIcon(column)}
      </button>
    </TableHead>
  )

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card">
      <Table>
        <TableHeader>
          <TableHeaderRow>
            {sortHeader('Document', 'title')}
            {sortHeader('Type', 'document_type')}
            {sortHeader('Size', 'file_size', true)}
            {sortHeader('Status', 'status')}
            {sortHeader('Uploaded', 'created_at')}
            <TableHead className="text-right">Actions</TableHead>
          </TableHeaderRow>
        </TableHeader>

        <TableBody>
          {documents.map((doc, idx) => {
            const fileIcon = getFileTypeIcon(doc.file_name)
            const fileTypeLabel = getFileTypeLabel(doc.file_name)
            const uploadDate = new Date(doc.created_at)
            const timeAgo = formatDistanceToNow(uploadDate, { addSuffix: true })

            return (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="group cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                onClick={() => onView(doc)}
              >
                {/* Title + File icon */}
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={fileIcon}
                      alt={fileTypeLabel}
                      className="h-5 w-5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-text-primary">
                        {doc.title}
                      </p>
                      <p className="font-mono text-xs text-text-muted">
                        {doc.file_name}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Document type */}
                <TableCell className="text-[13px] text-text-secondary">
                  {doc.document_type}
                </TableCell>

                {/* File size */}
                <TableCell className="text-right font-mono text-xs text-text-secondary">
                  {formatFileSize(doc.file_size || 0)}
                </TableCell>

                {/* Status badge */}
                <TableCell>
                  <DocumentStatusBadge status={doc.status} />
                </TableCell>

                {/* Upload date (time ago) */}
                <TableCell className="text-[13px] text-text-secondary" title={formatDateTime(doc.created_at)}>
                  {timeAgo}
                </TableCell>

                {/* Action menu */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${doc.title}`}
                        title="More actions"
                        className="h-8 w-8"
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(doc); }}>
                        <Download size={16} className="mr-2" />
                        Download
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(doc); }}>
                          <Edit2 size={16} className="mr-2" />
                          Edit details
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(doc); }}>
                        <History size={16} className="mr-2" />
                        Version history
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                          className="text-risk focus:text-risk"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Format bytes to human-readable file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
