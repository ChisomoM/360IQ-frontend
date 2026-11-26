import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Document, Department } from '@/types/dms'
import { MoreHorizontal, Download, History, Sparkles, BarChart3, Clock, Archive, Trash2 } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import PDFIcon from '@/assets/file_types/PDF.svg'
import DOCIcon from '@/assets/file_types/DOC.svg'
import DOCXIcon from '@/assets/file_types/DOCX.svg'
import XLSIcon from '@/assets/file_types/XSL.svg'
import CSVIcon from '@/assets/file_types/CSV.svg'
import PPTIcon from '@/assets/file_types/PPT.svg'
import PNGIcon from '@/assets/file_types/PNG.svg'
import JPGIcon from '@/assets/file_types/JPG.svg'
import TXTIcon from '@/assets/file_types/TXT.svg'
import TIFFIcon from '@/assets/file_types/TIFF.svg'

interface DocumentCardV2Props {
  document: Document
  department?: Department
  onDownload: (doc: Document) => void
  onView: (doc: Document) => void
  onVersions: (doc: Document) => void
  onChat?: (doc: Document) => void
  onSummarize?: (doc: Document) => void
  onAnalysis?: (doc: Document) => void
  onChartAnalysis?: (doc: Document) => void
  onArchive?: (doc: Document) => void
  onDelete?: (doc: Document) => void
}

// File type to SVG icon and a translucent file-type tint (reads on paper and ink)
const fileTypeConfig: Record<string, { icon: string; lightBg: string; extLabel: string }> = {
  pdf: { icon: PDFIcon, lightBg: 'bg-red-500/10', extLabel: 'PDF' },
  doc: { icon: DOCIcon, lightBg: 'bg-blue-500/10', extLabel: 'DOC' },
  docx: { icon: DOCXIcon, lightBg: 'bg-blue-500/10', extLabel: 'DOCX' },
  xls: { icon: XLSIcon, lightBg: 'bg-green-500/10', extLabel: 'XLS' },
  xlsx: { icon: XLSIcon, lightBg: 'bg-green-500/10', extLabel: 'XLSX' },
  csv: { icon: CSVIcon, lightBg: 'bg-green-500/10', extLabel: 'CSV' },
  ppt: { icon: PPTIcon, lightBg: 'bg-orange-500/10', extLabel: 'PPT' },
  pptx: { icon: PPTIcon, lightBg: 'bg-orange-500/10', extLabel: 'PPTX' },
  png: { icon: PNGIcon, lightBg: 'bg-purple-500/10', extLabel: 'PNG' },
  jpg: { icon: JPGIcon, lightBg: 'bg-purple-500/10', extLabel: 'JPG' },
  jpeg: { icon: JPGIcon, lightBg: 'bg-purple-500/10', extLabel: 'JPEG' },
  txt: { icon: TXTIcon, lightBg: 'bg-field', extLabel: 'TXT' },
  tiff: { icon: TIFFIcon, lightBg: 'bg-field', extLabel: 'TIFF' },
  default: { icon: TXTIcon, lightBg: 'bg-field', extLabel: 'File' },
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'default'
}

const getFileTypeConfig = (filename: string) => {
  const ext = getFileExtension(filename)
  return fileTypeConfig[ext] || fileTypeConfig.default
}

// Document type to category label mapping
const getCategoryLabel = (docType?: string): string => {
  const categoryMap: Record<string, string> = {
    memo: 'Memo',
    circular: 'Circular',
    minutes: 'Minutes',
    report: 'Report',
    policy: 'Policy',
    contract: 'Contract',
    invoice: 'Invoice',
    bid_document: 'Bid or tender',
    appointment_letter: 'Appointment',
    permit: 'Permit or licence',
  }
  return categoryMap[docType || ''] || 'Document'
}

const isSpreadsheet = (filename: string): boolean => {
  const ext = getFileExtension(filename)
  return ['xls', 'xlsx', 'csv'].includes(ext)
}

export function DocumentCardV2({
  document,
  onDownload,
  onView,
  onVersions,
  onChat,
  onSummarize,
  onAnalysis,
  onChartAnalysis,
  onArchive,
  onDelete,
}: DocumentCardV2Props) {
  const [isOpen, setIsOpen] = useState(false)
  const config = getFileTypeConfig(document.file_name)

  return (
    <motion.div
      onClick={() => onView(document)}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* TOP SECTION: file type icon */}
      <div className={`${config.lightBg} flex items-center justify-center py-8`}>
        <img
          src={config.icon}
          alt={config.extLabel}
          className="h-14 w-14 object-contain"
        />
      </div>

      {/* BOTTOM SECTION */}
      <div className="flex flex-col gap-2 border-t border-line px-4 py-3">
        {/* Row 1: Document title + three-dot menu */}
        <div className="flex items-start justify-between gap-2">
          <p
            className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-text-primary"
            title={document.title}
          >
            {document.title}
          </p>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions" title="More actions" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => { onDownload(document); setIsOpen(false) }} className="cursor-pointer text-sm">
                <Download size={16} className="mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { onVersions(document); setIsOpen(false) }} className="cursor-pointer text-sm">
                <History size={16} className="mr-2" />
                Version history
              </DropdownMenuItem>
              {(onChat || onSummarize || onAnalysis || onChartAnalysis) && (
                <>
                  <DropdownMenuSeparator />
                  {onChat && (
                    <DropdownMenuItem onClick={() => { onChat?.(document); setIsOpen(false) }} className="cursor-pointer text-sm">
                      <Sparkles size={16} className="mr-2 text-signal-text" />
                      Ask about this file
                    </DropdownMenuItem>
                  )}
                  {onSummarize && (
                    <DropdownMenuItem onClick={() => { onSummarize?.(document); setIsOpen(false) }} className="cursor-pointer text-sm">
                      <Sparkles size={16} className="mr-2 text-signal-text" />
                      Summarise
                    </DropdownMenuItem>
                  )}
                  {onAnalysis && (
                    <DropdownMenuItem onClick={() => { onAnalysis?.(document); setIsOpen(false) }} className="cursor-pointer text-sm">
                      <Sparkles size={16} className="mr-2 text-signal-text" />
                      Analyse
                    </DropdownMenuItem>
                  )}
                  {isSpreadsheet(document.title) && onChartAnalysis && (
                    <DropdownMenuItem onClick={() => { onChartAnalysis?.(document); setIsOpen(false) }} className="cursor-pointer text-sm">
                      <BarChart3 size={16} className="mr-2" />
                      Analyse charts
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {(onArchive || onDelete) && (
                <>
                  <DropdownMenuSeparator />
                  {onArchive && document.status !== 'archived' && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onArchive(document); setIsOpen(false) }}
                      className="cursor-pointer text-sm"
                    >
                      <Archive size={16} className="mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(document); setIsOpen(false) }}
                      className="cursor-pointer text-sm text-risk focus:text-risk"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: Category label + version with clock icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-text-muted">
            {getCategoryLabel(document.document_type)}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
            <Clock size={14} />
            v{(document as any).version_number || '1.0'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
