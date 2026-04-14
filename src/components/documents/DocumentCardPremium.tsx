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
  User,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

  // Status color mapping for a cleaner look
  const statusConfig: Record<string, { color: string; label: string }> = {
    'active': { color: 'bg-emerald-500', label: 'Active' },
    'archived': { color: 'bg-gray-400', label: 'Archived' },
    'pending': { color: 'bg-amber-500', label: 'Pending' },
    'approved': { color: 'bg-blue-500', label: 'Approved' },
    'rejected': { color: 'bg-red-500', label: 'Rejected' },
    'action_required': { color: 'bg-rose-500', label: 'Action Required' },
  }

  const status = statusConfig[document.status] || { color: 'bg-gray-400', label: document.status }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
        }
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => onView(document)}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-slate-100/80 transition-colors duration-300" />

      {/* Top Row: File Icon & Action Menu */}
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
          <FileText className="h-6 w-6 text-slate-600 group-hover:text-primary transition-colors" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-slate-100">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(document); }} className="rounded-lg gap-2 cursor-pointer">
              <Eye className="h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(document); }} className="rounded-lg gap-2 cursor-pointer">
              <Download className="h-4 w-4" /> Download
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(document); }} className="rounded-lg gap-2 cursor-pointer text-blue-600 focus:text-blue-700">
                <Edit2 className="h-4 w-4" /> Edit Metadata
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(document); }} className="rounded-lg gap-2 cursor-pointer">
              <History className="h-4 w-4" /> Versions
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(document); }}
                className="rounded-lg gap-2 cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Delete Record
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2">
           <div className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
             {status.label}
           </span>
        </div>
        
        <h3 className="font-display font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {document.title}
        </h3>
        
        {document.description && (
          <p className="text-slate-500 text-sm line-clamp-2 font-sans font-normal leading-relaxed">
            {document.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-between text-[11px] font-medium text-slate-400 border-t border-slate-50 pt-4 relative z-10">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded uppercase font-mono tracking-tighter">
            {document.file_name?.split('.').pop()?.toUpperCase() || 'FILE'}
          </span>
        </div>
      </div>
      
      {/* Hover Preview Link (Visual only) */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
         <ExternalLink className="h-4 w-4 text-primary" />
      </div>
    </motion.div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
