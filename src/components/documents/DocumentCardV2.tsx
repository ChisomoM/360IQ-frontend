import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Document, Department } from '@/types/dms'
import { MoreHorizontal, Download, History, MessageSquare, Sparkles, BarChart3, Clock, Archive, Trash2 } from 'lucide-react'
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

// File type to SVG icon & light background color mapping
const fileTypeConfig: Record<string, { icon: string; lightBg: string; extLabel: string }> = {
  pdf: { icon: PDFIcon, lightBg: 'bg-red-50', extLabel: 'pdf' },
  doc: { icon: DOCIcon, lightBg: 'bg-blue-50', extLabel: 'DOC' },
  docx: { icon: DOCXIcon, lightBg: 'bg-blue-50', extLabel: 'DOCX' },
  xls: { icon: XLSIcon, lightBg: 'bg-green-50', extLabel: 'XLS' },
  xlsx: { icon: XLSIcon, lightBg: 'bg-green-50', extLabel: 'XLSX' },
  csv: { icon: CSVIcon, lightBg: 'bg-green-50', extLabel: 'CSV' },
  ppt: { icon: PPTIcon, lightBg: 'bg-orange-50', extLabel: 'PPT' },
  pptx: { icon: PPTIcon, lightBg: 'bg-orange-50', extLabel: 'PPTX' },
  png: { icon: PNGIcon, lightBg: 'bg-purple-50', extLabel: 'PNG' },
  jpg: { icon: JPGIcon, lightBg: 'bg-purple-50', extLabel: 'JPG' },
  jpeg: { icon: JPGIcon, lightBg: 'bg-purple-50', extLabel: 'JPEG' },
  txt: { icon: TXTIcon, lightBg: 'bg-slate-50', extLabel: 'TXT' },
  tiff: { icon: TIFFIcon, lightBg: 'bg-slate-50', extLabel: 'TIFF' },
  default: { icon: TXTIcon, lightBg: 'bg-gray-50', extLabel: 'FILE' },
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
memo: 'MEMO',
  circular: 'CIRCULAR',
  minutes: 'MINUTES',
  report: 'REPORT',
  policy: 'POLICY',
  contract: 'CONTRACT',
  invoice: 'INVOICE',
  bid_document: 'BID / TENDER',
  appointment_letter: 'APPOINTMENT',
  permit: 'PERMIT / LICENCE',
  }
  return categoryMap[docType || ''] || 'DOCUMENT'
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
      whileHover={{ y: -3 }}
      className="h-full w-full flex flex-col rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 ease-out border border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
    >
      {/* TOP SECTION — Centered file icon only, no text, no badge */}
      <div className={`${config.lightBg}/50 flex items-center justify-center py-8`}>
        <img
          src={config.icon}
          alt={config.extLabel}
          className="w-14 h-14 object-contain"
        />
      </div>

      {/* DIVIDER */}
      <div className="h-px bg-slate-200"></div>

      {/* BOTTOM SECTION — White background */}
      <div className="bg-white px-4 py-2 flex flex-col">
        {/* Row 1: Document title + three-dot menu */}
        <div className="flex items-start pt-2 justify-between">
          <p
            className="font-sans font-semibold text-sm text-gray-900 line-clamp-2 leading-snug flex-1"
            title={document.title}
          >
            {document.title}
          </p>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 hover:bg-gray-100 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <DropdownMenuContent align="end" className="w-52">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0, duration: 0.2 }}
                >
                  <DropdownMenuItem onClick={() => { onDownload(document); setIsOpen(false) }} className="text-sm cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                </motion.div>
                <DropdownMenuSeparator className="my-1" />
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, duration: 0.2 }}
                >
                  <DropdownMenuItem onClick={() => { onVersions(document); setIsOpen(false) }} className="text-sm cursor-pointer">
                    <History className="h-4 w-4 mr-2" />
                    Version History
                  </DropdownMenuItem>
                </motion.div>
                {(onChat || onSummarize || onAnalysis || onChartAnalysis) && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    {onChat && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                      >
                        <DropdownMenuItem onClick={() => { onChat?.(document); setIsOpen(false) }} className="text-sm cursor-pointer">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          AI Chat
                        </DropdownMenuItem>
                      </motion.div>
                    )}
                    {onSummarize && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                      >
                        <DropdownMenuItem onClick={() => { onSummarize?.(document); setIsOpen(false) }} className="text-sm cursor-pointer">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Summarize
                        </DropdownMenuItem>
                      </motion.div>
                    )}
                    {onAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                      >
                        <DropdownMenuItem onClick={() => { onAnalysis?.(document); setIsOpen(false) }} className="text-sm cursor-pointer">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analysis
                        </DropdownMenuItem>
                      </motion.div>
                    )}
                    {isSpreadsheet(document.title) && onChartAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.2 }}
                      >
                        <DropdownMenuItem onClick={() => { onChartAnalysis?.(document); setIsOpen(false) }} className="text-sm cursor-pointer">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Chart Analysis
                        </DropdownMenuItem>
                      </motion.div>
                    )}
                  </>
                )}
                {(onArchive || onDelete) && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    {onArchive && document.status !== 'archived' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.2 }}
                      >
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onArchive(document); setIsOpen(false) }}
                          className="text-sm cursor-pointer text-amber-600 focus:text-amber-700"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </motion.div>
                    )}
                    {onDelete && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                      >
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onDelete(document); setIsOpen(false) }}
                          className="text-sm cursor-pointer text-red-600 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </motion.div>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </motion.div>
          </DropdownMenu>
        </div>

        {/* Row 2: Category label + version with clock icon */}
        <div className="flex items-center  justify-between">
          <span className="font-sans text-[11px] font-medium tracking-wider text-gray-400">
            {getCategoryLabel(document.document_type)}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
            <Clock className="h-3 w-3" />
            v{(document as any).version_number || '1.0'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
