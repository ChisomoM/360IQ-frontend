/**
 * File Type Icon Mapping
 * Maps file extensions to SVG icons from assets/file_types/
 */

// Import all file type SVG paths (available in Frontend/src/assets/file_types/)
import PDFIcon from '@/assets/file_types/PDF.svg'
import DOCXIcon from '@/assets/file_types/DOCX.svg'
import DOCIcon from '@/assets/file_types/DOC.svg'
import JPGIcon from '@/assets/file_types/JPG.svg'
import PNGIcon from '@/assets/file_types/PNG.svg'
import PPTIcon from '@/assets/file_types/PPT.svg'
import TIFFIcon from '@/assets/file_types/TIFF.svg'
import TXTIcon from '@/assets/file_types/TXT.svg'
import CSVIcon from '@/assets/file_types/CSV.svg'
import XLSIcon from '@/assets/file_types/XSL.svg'

/**
 * Format bytes to human-readable file size
 * e.g., 1024 → "1 KB", 1048576 → "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * File type mapping: extension → SVG path
 * Updates to this map when adding new file types
 */
export const FILE_TYPE_MAP: Record<string, string> = {
  // Documents
  'pdf': PDFIcon,
  'docx': DOCXIcon,
  'doc': DOCIcon,
  'txt': TXTIcon,
  
  // Images
  'jpg': JPGIcon,
  'jpeg': JPGIcon,
  'png': PNGIcon,
  'tiff': TIFFIcon,
  'tif': TIFFIcon,
  
  // Presentations
  'ppt': PPTIcon,
  'pptx': PPTIcon,
  
  // Data
  'csv': CSVIcon,
  'xls': XLSIcon,
  'xlsx': XLSIcon,
}

/**
 * Get file extension from filename
 * e.g., "document.pdf" → "pdf"
 */
export function getFileExtension(filename: string): string {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Get icon path for a file
 * Falls back to a generic document icon if type is unknown
 * 
 * @param filename - The filename with extension
 * @returns SVG path for the file type icon
 */
export function getFileTypeIcon(filename: string): string {
  const ext = getFileExtension(filename)
  return FILE_TYPE_MAP[ext] || PDFIcon // Default to PDF icon for unknown types
}

/**
 * Get human-readable file type label
 * e.g., "pdf" → "PDF" or "docx" → "Word Document"
 */
export function getFileTypeLabel(filename: string): string {
  const ext = getFileExtension(filename).toUpperCase()
  
  const labels: Record<string, string> = {
    'PDF': 'PDF',
    'DOCX': 'Word',
    'DOC': 'Word',
    'TXT': 'Text',
    'JPG': 'Image',
    'JPEG': 'Image',
    'PNG': 'Image',
    'TIFF': 'Image',
    'TIF': 'Image',
    'PPT': 'PowerPoint',
    'PPTX': 'PowerPoint',
    'CSV': 'Spreadsheet',
    'XLS': 'Excel',
    'XLSX': 'Excel',
  }

  return labels[ext] || ext || 'Unknown'
}
