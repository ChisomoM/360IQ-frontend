import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, MoreVertical, Download, Eye, Trash2, Edit2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const statusColorMap: Record<string, string> = {
    'active': 'bg-emerald-100 text-emerald-800',
    'archived': 'bg-gray-100 text-gray-800',
    'pending': 'bg-amber-100 text-amber-800',
    'approved': 'bg-blue-100 text-blue-800',
    'rejected': 'bg-red-100 text-red-800',
    'action_required': 'bg-purple-100 text-purple-800',
  }

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc'
      ? <ChevronUp className="h-3 w-3 inline ml-1" />
      : <ChevronDown className="h-3 w-3 inline ml-1" />
  }

  const SortHeader = ({ label, column }: { label: string; column: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-100 transition-colors user-select-none"
      onClick={() => onSort?.(column)}
    >
      <div className="flex items-center gap-1 font-sans font-medium text-text-sm text-gray-700">
        {label}
        {renderSortIcon(column)}
      </div>
    </TableHead>
  )

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow>
            <SortHeader label="Document" column="title" />
            <SortHeader label="Type" column="document_type" />
            <SortHeader label="Size" column="file_size" />
            <SortHeader label="Status" column="status" />
            <SortHeader label="Uploaded" column="created_at" />
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {documents.map((doc, idx) => {
            const fileIcon = getFileTypeIcon(doc.file_name)
            const fileTypeLabel = getFileTypeLabel(doc.file_name)
            const statusColor = statusColorMap[doc.status] || 'bg-gray-100 text-gray-800'
            const uploadDate = new Date(doc.created_at)
            const timeAgo = formatDistanceToNow(uploadDate, { addSuffix: true })

            return (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => onView(doc)}
              >
                {/* Title + File icon */}
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={fileIcon}
                      alt={fileTypeLabel}
                      className="h-5 w-5 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-medium text-text-sm text-gray-900 truncate group-hover:text-tenant-primary transition-colors">
                        {doc.title}
                      </p>
                      <p className="font-mono text-text-xs text-gray-400">
                        {doc.file_name}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Document type */}
                <TableCell className="py-3 px-4">
                  <span className="font-sans text-text-sm text-gray-700">
                    {doc.document_type}
                  </span>
                </TableCell>

                {/* File size */}
                <TableCell className="py-3 px-4">
                  <span className="font-mono text-text-sm text-gray-600">
                    {formatFileSize(doc.file_size || 0)}
                  </span>
                </TableCell>

                {/* Status badge */}
                <TableCell className="py-3 px-4">
                  <Badge className={`text-text-xs font-medium ${statusColor}`}>
                    {doc.status}
                  </Badge>
                </TableCell>

                {/* Upload date (time ago) */}
                <TableCell className="py-3 px-4">
                  <span className="font-sans text-text-sm text-gray-600">
                    {timeAgo}
                  </span>
                </TableCell>

                {/* Action menu */}
                <TableCell className="py-3 px-4 text-right">
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
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(doc); }}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(doc); }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Metadata
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(doc); }}>
                        <History className="h-4 w-4 mr-2" />
                        Version History
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
