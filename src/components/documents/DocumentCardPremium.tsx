import { motion } from 'framer-motion'
import {
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Edit2,
  History,
  FileText,
  Clock,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { formatDateTime } from '@/lib/format'
import { type Document } from '@/types/dms'
import { formatDistanceToNow } from 'date-fns'

interface DocumentCardPremiumProps {
  document: Document
  onView: (doc: Document) => void
  onDownload: (doc: Document) => void
  onEdit: (doc: Document) => void
  onDelete: (doc: Document) => void
  onVersions: (doc: Document) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function DocumentCardPremium({
  document,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onVersions,
  canEdit = true,
  canDelete = true,
}: DocumentCardPremiumProps) {
  const uploadDate = new Date(document.created_at)
  const timeAgo = formatDistanceToNow(uploadDate, { addSuffix: true })

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
        }
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative cursor-pointer rounded-lg border border-line bg-surface-1 p-5 shadow-card transition-shadow hover:shadow-card-hover"
      onClick={() => onView(document)}
    >
      {/* Top Row: File Icon & Action Menu */}
      <div className="mb-5 flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-sm bg-field text-text-secondary">
          <FileText size={24} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="More actions"
              title="More actions"
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(document); }} className="cursor-pointer gap-2">
              <Eye size={16} /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(document); }} className="cursor-pointer gap-2">
              <Download size={16} /> Download
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(document); }} className="cursor-pointer gap-2">
                <Edit2 size={16} /> Edit details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(document); }} className="cursor-pointer gap-2">
              <History size={16} /> Versions
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(document); }}
                className="cursor-pointer gap-2 text-risk focus:text-risk"
              >
                <Trash2 size={16} /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <DocumentStatusBadge status={document.status} />

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-text-primary">
          {document.title}
        </h3>

        {document.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {document.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5" title={formatDateTime(document.created_at)}>
          <Clock size={14} />
          <span>{timeAgo}</span>
        </div>

        <span className="rounded-pill bg-field px-2 py-0.5 font-mono uppercase text-text-secondary">
          {document.file_name?.split('.').pop()?.toUpperCase() || 'FILE'}
        </span>
      </div>
    </motion.div>
  )
}
