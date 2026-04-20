import { useState } from 'react'
import type { Document, Department } from '@/types/dms'
import { MoreVertical, Download, History, MessageSquare, Sparkles, BarChart3, ChevronUp, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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
}

const fileTypeConfig: Record<string, { icon: string; lightBg: string; textColor: string; extLabel: string }> = {
  pdf: { icon: PDFIcon, lightBg: 'bg-red-50', textColor: 'text-red-700', extLabel: 'PDF' },
  doc: { icon: DOCIcon, lightBg: 'bg-blue-50', textColor: 'text-blue-700', extLabel: 'DOC' },
  docx: { icon: DOCXIcon, lightBg: 'bg-blue-50', textColor: 'text-blue-700', extLabel: 'DOCX' },
  xls: { icon: XLSIcon, lightBg: 'bg-green-50', textColor: 'text-green-700', extLabel: 'XLS' },
  xlsx: { icon: XLSIcon, lightBg: 'bg-green-50', textColor: 'text-green-700', extLabel: 'XLSX' },
  csv: { icon: CSVIcon, lightBg: 'bg-green-50', textColor: 'text-green-700', extLabel: 'CSV' },
  ppt: { icon: PPTIcon, lightBg: 'bg-orange-50', textColor: 'text-orange-700', extLabel: 'PPT' },
  pptx: { icon: PPTIcon, lightBg: 'bg-orange-50', textColor: 'text-orange-700', extLabel: 'PPTX' },
  png: { icon: PNGIcon, lightBg: 'bg-purple-50', textColor: 'text-purple-700', extLabel: 'PNG' },
  jpg: { icon: JPGIcon, lightBg: 'bg-purple-50', textColor: 'text-purple-700', extLabel: 'JPG' },
  jpeg: { icon: JPGIcon, lightBg: 'bg-purple-50', textColor: 'text-purple-700', extLabel: 'JPEG' },
  txt: { icon: TXTIcon, lightBg: 'bg-slate-50', textColor: 'text-slate-700', extLabel: 'TXT' },
  tiff: { icon: TIFFIcon, lightBg: 'bg-slate-50', textColor: 'text-slate-700', extLabel: 'TIFF' },
  default: { icon: TXTIcon, lightBg: 'bg-gray-50', textColor: 'text-gray-700', extLabel: 'FILE' },
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

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => toggleSort('name')}
                className="flex items-center gap-2 font-semibold text-xs text-gray-700 uppercase tracking-wider hover:text-gray-900"
              >
                Document
                {sortColumn === 'name' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => toggleSort('category')}
                className="flex items-center gap-2 font-semibold text-xs text-gray-700 uppercase tracking-wider hover:text-gray-900"
              >
                Category
                {sortColumn === 'category' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-3 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => toggleSort('date')}
                className="flex items-center gap-2 font-semibold text-xs text-gray-700 uppercase tracking-wider hover:text-gray-900"
              >
                Modified
                {sortColumn === 'date' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-3 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider">Version</th>
            <th className="px-6 py-3 text-right font-semibold text-xs text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((doc, idx) => {
            const config = getFileTypeConfig(doc.title)
            return (
              <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                {/* Document Name */}
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={config.icon} alt={config.extLabel} className="w-8 h-8 object-contain flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-semibold text-sm text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500">{getFileExtension(doc.file_type).toUpperCase()}</p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {getCategoryLabel(doc.document_type)}
                  </span>
                </td>

                {/* Department */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{getDeptName(doc.document_departments?.find(dd => dd.is_primary)?.department_id ?? doc.department_id)}</p>
                </td>

                {/* Modified Date */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">
                    {doc.updated_at ? formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true }) : 'N/A'}
                  </p>
                </td>

                {/* Version */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 font-sans">v{(doc as any).version_number || '1.0'}</p>
                </td>

                {/* Actions Menu */}
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => onDownload(doc)} className="text-sm cursor-pointer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem onClick={() => onVersions(doc)} className="text-sm cursor-pointer">
                        <History className="h-4 w-4 mr-2" />
                        Version History
                      </DropdownMenuItem>

                      {(onChat || onSummarize || onAnalysis || onChartAnalysis) && (
                        <>
                          <DropdownMenuSeparator className="my-1" />
                          {onChat && (
                            <DropdownMenuItem onClick={() => onChat?.(doc)} className="text-sm cursor-pointer">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              AI Chat
                            </DropdownMenuItem>
                          )}
                          {onSummarize && (
                            <DropdownMenuItem onClick={() => onSummarize?.(doc)} className="text-sm cursor-pointer">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Summarize
                            </DropdownMenuItem>
                          )}
                          {onAnalysis && (
                            <DropdownMenuItem onClick={() => onAnalysis?.(doc)} className="text-sm cursor-pointer">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Analysis
                            </DropdownMenuItem>
                          )}
                          {isSpreadsheet(doc.title) && onChartAnalysis && (
                            <DropdownMenuItem onClick={() => onChartAnalysis?.(doc)} className="text-sm cursor-pointer">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Chart Analysis
                            </DropdownMenuItem>
                          )}
                        </>
                      )}

                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem onClick={() => onView(doc)} className="text-sm text-tenant-primary cursor-pointer">
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
