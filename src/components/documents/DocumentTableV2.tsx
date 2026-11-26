import { useState } from 'react'
import type { Document, Department } from '@/types/dms'
import { MoreVertical, Download, History, Sparkles, BarChart3, ChevronUp, ChevronDown, Archive, Trash2, Eye } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatDateTime } from '@/lib/format'
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

interface DocumentTableV2Props {
  documents: Document[]
  departments: Department[]
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

const fileTypeConfig: Record<string, { icon: string; extLabel: string }> = {
  pdf: { icon: PDFIcon, extLabel: 'PDF' },
  doc: { icon: DOCIcon, extLabel: 'DOC' },
  docx: { icon: DOCXIcon, extLabel: 'DOCX' },
  xls: { icon: XLSIcon, extLabel: 'XLS' },
  xlsx: { icon: XLSIcon, extLabel: 'XLSX' },
  csv: { icon: CSVIcon, extLabel: 'CSV' },
  ppt: { icon: PPTIcon, extLabel: 'PPT' },
  pptx: { icon: PPTIcon, extLabel: 'PPTX' },
  png: { icon: PNGIcon, extLabel: 'PNG' },
  jpg: { icon: JPGIcon, extLabel: 'JPG' },
  jpeg: { icon: JPGIcon, extLabel: 'JPEG' },
  txt: { icon: TXTIcon, extLabel: 'TXT' },
  tiff: { icon: TIFFIcon, extLabel: 'TIFF' },
  default: { icon: TXTIcon, extLabel: 'File' },
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'default'
}

const getFileTypeConfig = (filename: string) => {
  const ext = getFileExtension(filename)
  return fileTypeConfig[ext] || fileTypeConfig.default
}

const getCategoryLabel = (docType?: string): string => {
  const categoryMap: Record<string, string> = {
    policy: 'Policy',
    procedure: 'Procedure',
    minutes: 'Minutes',
    report: 'Report',
    form: 'Form',
    memo: 'Memo',
    contract: 'Contract',
  }
  return categoryMap[docType || ''] || 'Document'
}

const isSpreadsheet = (filename: string): boolean => {
  const ext = getFileExtension(filename)
  return ['xls', 'xlsx', 'csv'].includes(ext)
}

export function DocumentTableV2({
  documents,
  departments,
  onDownload,
  onView,
  onVersions,
  onChat,
  onSummarize,
  onAnalysis,
  onChartAnalysis,
  onArchive,
  onDelete,
}: DocumentTableV2Props) {
  const [sortColumn, setSortColumn] = useState<'name' | 'date' | 'category'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const sorted = [...documents].sort((a, b) => {
    let aVal: string | number = ''
    let bVal: string | number = ''

    if (sortColumn === 'name') {
      aVal = a.title.toLowerCase()
      bVal = b.title.toLowerCase()
    } else if (sortColumn === 'category') {
      aVal = (a.document_type || '').toLowerCase()
      bVal = (b.document_type || '').toLowerCase()
    } else {
      aVal = new Date(a.created_at || 0).getTime()
      bVal = new Date(b.created_at || 0).getTime()
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
    }
    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const toggleSort = (column: 'name' | 'date' | 'category') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const getDeptName = (deptId?: string) => {
    return departments.find(d => d.id === deptId)?.name || 'Global'
  }

  const sortHeader = (label: string, column: 'name' | 'date' | 'category') => (
    <TableHead aria-sort={sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="flex items-center gap-1 rounded-xs text-xs font-medium hover:text-text-primary"
      >
        {label}
        {sortColumn === column && (
          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </button>
    </TableHead>
  )

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card">
      <Table>
        <TableHeader>
          <TableHeaderRow>
            {sortHeader('Document', 'name')}
            {sortHeader('Category', 'category')}
            <TableHead>Department</TableHead>
            {sortHeader('Modified', 'date')}
            <TableHead>Version</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {sorted.map((doc) => {
            const config = getFileTypeConfig(doc.title)
            return (
              <TableRow key={doc.id}>
                {/* Document Name */}
                <TableCell className="max-w-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={config.icon} alt={config.extLabel} className="h-8 w-8 shrink-0 object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-text-primary">{doc.title}</p>
                      <p className="font-mono text-xs text-text-muted">{getFileExtension(doc.file_type).toUpperCase()}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell className="text-[13px] text-text-secondary">
                  {getCategoryLabel(doc.document_type)}
                </TableCell>

                {/* Department */}
                <TableCell className="text-[13px] text-text-secondary">
                  {getDeptName(doc.document_departments?.find(dd => dd.is_primary)?.department_id ?? doc.department_id)}
                </TableCell>

                {/* Modified Date */}
                <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary" title={formatDateTime(doc.updated_at)}>
                  {formatDate(doc.updated_at) || 'Not recorded'}
                </TableCell>

                {/* Version */}
                <TableCell className="font-mono text-xs text-text-secondary">
                  v{(doc as any).version_number || '1.0'}
                </TableCell>

                {/* Actions Menu */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${doc.title}`} title="More actions" className="h-8 w-8">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => onDownload(doc)} className="cursor-pointer text-sm">
                        <Download size={16} className="mr-2" />
                        Download
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onVersions(doc)} className="cursor-pointer text-sm">
                        <History size={16} className="mr-2" />
                        Version history
                      </DropdownMenuItem>

                      {(onChat || onSummarize || onAnalysis || onChartAnalysis) && (
                        <>
                          <DropdownMenuSeparator />
                          {onChat && (
                            <DropdownMenuItem onClick={() => onChat?.(doc)} className="cursor-pointer text-sm">
                              <Sparkles size={16} className="mr-2 text-signal-text" />
                              Ask about this file
                            </DropdownMenuItem>
                          )}
                          {onSummarize && (
                            <DropdownMenuItem onClick={() => onSummarize?.(doc)} className="cursor-pointer text-sm">
                              <Sparkles size={16} className="mr-2 text-signal-text" />
                              Summarise
                            </DropdownMenuItem>
                          )}
                          {onAnalysis && (
                            <DropdownMenuItem onClick={() => onAnalysis?.(doc)} className="cursor-pointer text-sm">
                              <Sparkles size={16} className="mr-2 text-signal-text" />
                              Analyse
                            </DropdownMenuItem>
                          )}
                          {isSpreadsheet(doc.title) && onChartAnalysis && (
                            <DropdownMenuItem onClick={() => onChartAnalysis?.(doc)} className="cursor-pointer text-sm">
                              <BarChart3 size={16} className="mr-2" />
                              Analyse charts
                            </DropdownMenuItem>
                          )}
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(doc)} className="cursor-pointer text-sm">
                        <Eye size={16} className="mr-2" />
                        View details
                      </DropdownMenuItem>

                      {(onArchive || onDelete) && (
                        <>
                          <DropdownMenuSeparator />
                          {onArchive && doc.status !== 'archived' && (
                            <DropdownMenuItem
                              onClick={() => onArchive(doc)}
                              className="cursor-pointer text-sm"
                            >
                              <Archive size={16} className="mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(doc)}
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
