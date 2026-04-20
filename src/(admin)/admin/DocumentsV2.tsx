import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { Loader2, Plus, ListFilter, Search, Settings, Upload, FileUp, X, CheckCircle2, Shield, Building, Lock, Tag, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { PageTransition } from '@/components/PageTransition'
import { StandardSearchBar } from '@/components/SearchBar/StandardSearchBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { DocumentCardV2 } from '@/components/documents/DocumentCardV2'
import { DocumentTableV2 } from '@/components/documents/DocumentTableV2'
import type { AdminLayoutContext } from '@/layouts/AdminLayout'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { EditModal, type EditFormData } from '@/components/documents/EditModal'
import { DeleteModal } from '@/components/documents/DeleteModal'
import { VersionHistoryModal } from '@/components/documents/VersionHistoryModal'
import { DocumentSkeletonGrid, DocumentSkeletonTable } from '@/components/documents/DocumentSkeleton'
import { useAuth } from '@/lib/context/useAuth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { fetchData, file } from '@/lib/api/crud'
import { parseAdvancedSearch } from '@/lib/utils/searchParser'
import { handleDocumentReorder } from '@/lib/hooks/useDragDropDocuments'
import type { Document, Department, DocumentVersion } from '@/types/dms'
import toast from 'react-hot-toast'

// Document display view mode
type ViewMode = 'grid' | 'list'

// Search filter state
interface FilterState {
  department_id?: string
  status?: string
  document_type?: string
  date_from?: string
  date_to?: string
}

/**
 * DocumentsV2 — Premium Core Document Management
 * 
 * Features:
 * - Featured docs section (action required)
 * - Grid/List view toggle
 * - Search with advanced modifiers (type:pdf, status:pending, since:2024-01)
 * - Filter panel (department, status, type, date range)
 * - Pagination (10 per page default)
 * - Drag-drop reordering (within same dept)
 * - Smart collections (AI grouping)
 * - Upload, edit, delete, version history modals
 */
export default function DocumentsV2() {
  const navigate = useNavigate()
  // Pull openChat and openAnalysis from outlet context
  const { analyzeDocument, openChat, openAnalysis } = useOutletContext<AdminLayoutContext>()
  const { user } = useAuth()

  // ─── State: Core data ───────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Document[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // ─── State: View & display ─────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof Document | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // ─── State: Search & filters ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // ─── State: Selected document ──────────────────────────────────────────
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  // ─── State: Modal open states ──────────────────────────────────────────
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isVersionsOpen, setIsVersionsOpen] = useState(false)

  // ─── State: Upload form ────────────────────────────────────────────────
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    document_type: 'policy',
    category: 'administrative',
    department_ids: [] as string[],
    visibility_level: 'department' as 'public' | 'department' | 'restricted',
    tags: [] as string[],
    is_encrypted: false,
    file: null as File | null,
  })
  const [isUploading, setIsUploading] = useState(false)

  // ─── State: Edit form ──────────────────────────────────────────────────
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    visibility_level: 'department' as 'public' | 'department' | 'restricted',
    status: 'active',
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // ─── State: Delete ────────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false)

  // ─── State: Versions ──────────────────────────────────────────────────
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // ─── State: Drag-drop reorder ─────────────────────────────────────────
  const [dragState, setDragState] = useState({
    isDragging: false,
    sourceDoc: null as Document | null,
  })

  // ─── State: Backend search ───────────────────────────────────────────
  // Holds the ordered IDs returned by the server; null = no active search
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)


  // ─── Fetch all data ──────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true)
      const [docsData, deptsData] = await Promise.all([
        fetchData('DOCUMENTS', 'GET'),
        fetchData('DEPARTMENTS', 'GET'),
      ])
      setDocuments(Array.isArray(docsData) ? docsData : (docsData?.items ?? []))
      setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData?.items ?? []))
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
      if (msg.includes('no tenant context') || msg.includes('missing tenant')) {
        toast.error('Session expired. Please log in again.')
        // Optionally: navigate('/admin/login') to force immediate redirect
      } else {
        toast.error('Failed to load documents')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ─── Backend search: debounced call to /chat/search ──────────────────
  const parsedSearch = parseAdvancedSearch(searchQuery)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    const text = parsedSearch.text
    if (!text) {
      setSearchResultIds(null)
      return
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const result = await fetchData('DOCUMENT_SEARCH', 'POST', {}, { query: text, limit: 50 })
        const ids: string[] = (result?.results ?? []).map((r: { id: string }) => r.id)
        setSearchResultIds(ids)
      } catch {
        // On error fall back to showing all (no crash)
        setSearchResultIds(null)
      } finally {
        setIsSearching(false)
      }
    }, 350)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [parsedSearch.text])

  // ─── Check if any manual filters are applied
  const hasManualFilters = Object.values(filters).some(v => v)

  // ─── Computed: filtered & paginated documents ────────────────────────
  // When backend search is active AND no manual filters, use server results
  // Otherwise, filter from all documents with combined criteria
  const searchBase = (searchResultIds !== null && !hasManualFilters)
    ? searchResultIds.map(id => documents.find(d => d.id === id)).filter((d): d is Document => !!d)
    : documents

  const filtered = searchBase.filter(doc => {
    // Text search is now handled server-side (searchResultIds); skip client-side

    // Manual department filter — check primary department_id or any in document_departments
    if (filters.department_id) {
      const inDepts = doc.document_departments?.some(dd => dd.department_id === filters.department_id)
      const matchesPrimary = doc.department_id === filters.department_id
      if (!inDepts && !matchesPrimary) return false
    }

    // Manual status filter + parsed status filters (AND logic for both)
    if (filters.status && doc.status !== filters.status) {
      return false
    }
    if (parsedSearch.statuses && parsedSearch.statuses.length > 0) {
      if (!parsedSearch.statuses.includes(doc.status)) {
        return false
      }
    }

    // Manual document type filter + parsed type filters (AND logic for both)
    if (filters.document_type && doc.document_type !== filters.document_type) {
      return false
    }
    if (parsedSearch.types && parsedSearch.types.length > 0) {
      if (!parsedSearch.types.includes(doc.document_type)) {
        return false
      }
    }

    // Tag filter (OR logic - if any parsed tags match document tags)
    if (parsedSearch.tags && parsedSearch.tags.length > 0) {
      const docTags = doc.tags || []
      if (!parsedSearch.tags.some(tag => docTags.includes(tag))) {
        return false
      }
    }

    // Date range filter (parsed or manual) — use the more restrictive (later from, earlier until)
    const dateFrom = parsedSearch.dateFrom || filters.date_from
    const dateUntil = parsedSearch.dateUntil || filters.date_to

    if (dateFrom) {
      const docDate = new Date(doc.created_at).getTime()
      const fromDate = new Date(dateFrom + 'T00:00:00Z').getTime()
      if (docDate < fromDate) return false
    }
    if (dateUntil) {
      const docDate = new Date(doc.created_at).getTime()
      const toDate = new Date(dateUntil + 'T23:59:59Z').getTime()
      if (docDate > toDate) return false
    }

    return true
  })

  // Sort if column selected
  let sorted = [...filtered]
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(String(bVal))
          : String(bVal).localeCompare(aVal)
      }
      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const paginatedDocs = sorted.slice(startIdx, endIdx)

  // Featured docs (action_required status or similar)
  const featuredDocs = documents.filter(doc => doc.status === 'action_required').slice(0, 6)

  // ─── Handlers: Filters ────────────────────────────────────────────

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    setSearchResultIds(null) // Invalidate search results when manual filters change
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when search changes
  }

  const handleResetFilters = () => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
    setSearchResultIds(null)
  }

  // ─── Handlers: Upload ─────────────────────────────────────────────────

  const [dragActive, setDragActive] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const droppedFile = files[0]
      const fileNameWithoutExt = droppedFile.name.split('.').slice(0, -1).join('.')
      setUploadData(prev => ({
        ...prev,
        file: droppedFile,
        title: prev.title.trim() === '' ? fileNameWithoutExt : prev.title
      }))
    }
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const selectedFile = files[0]
      const fileNameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.')
      setUploadData(prev => ({
        ...prev,
        file: selectedFile,
        title: prev.title.trim() === '' ? fileNameWithoutExt : prev.title
      }))
    }
  }, [])

  const addTag = () => {
    const val = tagInput.trim().toLowerCase()
    if (val && !uploadData.tags.includes(val)) {
      setUploadData(prev => ({ ...prev, tags: [...prev.tags, val] }))
      setTagInput('')
    }
  }

  const removeTag = (t: string) => {
    setUploadData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }))
  }

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title.trim()) {
      toast.error('Please provide a title and select a file')
      return
    }
    try {
      setIsUploading(true)
      const form = new FormData()
      form.append('file', uploadData.file)
      form.append('title', uploadData.title)
      form.append('description', uploadData.description)
      form.append('document_type', uploadData.document_type)
      form.append('category', uploadData.category)
      // Send each department as a separate department_ids[] form field
      uploadData.department_ids.forEach(id => form.append('department_ids[]', id))
      form.append('visibility_level', uploadData.visibility_level)
      form.append('is_encrypted', String(uploadData.is_encrypted))

      if (uploadData.tags.length > 0) {
        form.append('tags', JSON.stringify(uploadData.tags))
      }

      await fetchData('DOCUMENTS', 'POST', {}, form)
      toast.success('Document uploaded successfully')
      setIsUploadOpen(false)
      setUploadData({
        title: '',
        description: '',
        document_type: 'policy',
        category: 'administrative',
        department_ids: [],
        visibility_level: 'department',
        tags: [],
        is_encrypted: false,
        file: null,
      })
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  // ─── Handlers: Open modals ────────────────────────────────────────────

  const openEdit = (doc: Document) => {
    setSelectedDoc(doc)
    setIsEditOpen(true)
  }

  const openDelete = (doc: Document) => {
    setSelectedDoc(doc)
    setIsDeleteOpen(true)
  }

  const openVersions = (doc: Document) => {
    setSelectedDoc(doc)
    setVersions([])
    setIsVersionsOpen(true)
    loadVersionHistory(doc)
  }

  const loadVersionHistory = async (doc: Document) => {
    try {
      setLoadingVersions(true)
      const data = await fetchData('DOCUMENT_VERSIONS', 'GET', { id: doc.id })
      setVersions(Array.isArray(data) ? data : (data?.items ?? []))
    } catch {
      toast.error('Failed to load version history')
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDoc) return
    try {
      setIsDeleting(true)
      await fetchData('DOCUMENT_DELETE', 'DELETE', { id: selectedDoc.id })
      toast.success('Document deleted')
      setIsDeleteOpen(false)
      setSelectedDoc(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Handlers: Version history ────────────────────────────────────

  // ─── Handlers: Download ──────────────────────────────────────────────

  const handleDownload = async (doc: Document) => {
    try {
      await file('DOCUMENT_DOWNLOAD', { id: doc.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    }
  }

  // ─── Handlers: Edit ────────────────────────────────────────────────

  const handleEditSubmit = async (data: EditFormData) => {
    if (!selectedDoc) return
    try {
      setIsUpdating(true)
      await fetchData('DOCUMENTS', 'PATCH', { id: selectedDoc.id }, data)
      toast.success('Document updated successfully')
      setIsEditOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document')
    } finally {
      setIsUpdating(false)
    }
  }

  // ─── Handlers: Delete ──────────────────────────────────────────────

  const handleDeleteSubmit = async () => {
    if (!selectedDoc) return
    try {
      setIsDeleting(true)
      await fetchData('DOCUMENTS', 'DELETE', { id: selectedDoc.id })
      toast.success('Document deleted successfully')
      setIsDeleteOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Handlers: Version History ────────────────────────────────────

  const handleDownloadVersion = async (versionId: string) => {
    try {
      await file('DOCUMENT_VERSION_DOWNLOAD', { id: versionId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedDoc) return
    try {
      setLoadingVersions(true)
      await fetchData('DOCUMENTS', 'PATCH',
        { id: selectedDoc.id },
        { version_id: versionId }
      )
      toast.success('Document restored to this version')
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore version')
    } finally {
      setLoadingVersions(false)
    }
  }

  // ─── Handlers: AI Features ───────────────────────────────────────

  const handleChat = (doc: Document) => {
    openChat(doc)
  }

  const handleSummarize = (doc: Document) => {
    analyzeDocument(doc)
  }

  const handleAnalysis = (doc: Document) => {
    openAnalysis(doc)
  }

  const handleChartAnalysis = (doc: Document) => {
    analyzeDocument(doc)
  }

  // ─── Handlers: Navigation ────────────────────────────────────────────

  const openDetail = (doc: Document) => {
    navigate(`/admin/documents/${doc.id}`)
  }

  // ─── Handlers: Drag-drop reordering ────────────────────────────────

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    // No change if dropped in same position
    if (!destination || (source.index === destination.index && source.droppableId === destination.droppableId)) {
      return
    }

    // Find source and destination documents
    const sourceDoc = paginatedDocs[source.index]
    const destDoc = paginatedDocs[destination.index]

    if (!sourceDoc || !destDoc) {
      return
    }

    // Perform reorder with optimistic update
    await handleDocumentReorder(
      sourceDoc,
      destDoc,
      documents,
      (reorderedDocs) => {
        setDocuments(reorderedDocs)
      },
      () => {
        // Revert on error - documents already reset in handler, just refresh
        fetchAll()
      }
    )
  }

  // ─── Permissions check ───────────────────────────────────────────────

  const canUpload = hasPermission(user, PERMISSIONS['documents.write'])
  const canEdit = hasPermission(user, PERMISSIONS['documents.manage'])
  const canDelete = hasPermission(user, PERMISSIONS['documents.manage'])
  const canReorder = hasPermission(user, PERMISSIONS['documents.manage'])

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <div className="w-full space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-display-sm text-gray-900">
              Document Repository
            </h1>
            <p className="text-gray-600 mt-1 font-sans text-text-md">
              Manage and organize your institutional documents
            </p>
          </div>

          {/* Upload Button */}
          {canUpload && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" variant="tenantPrimary">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden border-none shadow-2xl">
                <div className="flex h-full max-h-[90vh]">
                  {/* Left Column: File Dropzone & Preview */}
                  <div className="w-2/5 bg-slate-50 p-8 border-r border-slate-100 flex flex-col justify-center">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-slate-800">File Ingestion</h3>
                      <p className="text-sm text-slate-500 mt-1">Upload your document to safely archive it in the DIMS vault.</p>
                    </div>

                    {!uploadData.file ? (
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`
                          relative border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer
                          flex flex-col items-center justify-center text-center space-y-4
                          ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 hover:border-primary hover:bg-white'}
                        `}
                      >
                        <input
                          type="file"
                          onChange={handleFileInputChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="p-4 bg-white rounded-full shadow-sm text-primary">
                          <FileUp className="h-10 w-10" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Click or drag file</p>
                          <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, XLSX (Max 50MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group max-w-full">
                        <button
                          onClick={() => setUploadData(prev => ({ ...prev, file: null }))}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                            <FileUp className="h-8 w-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate" title={uploadData.file.name}>
                              {uploadData.file.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB • {uploadData.file.type.split('/').pop()?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full w-fit">
                          <CheckCircle2 className="h-3 w-3" /> Ready for upload
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-8">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Shield className="h-3 w-3" />
                        <span>Secure end-to-end encryption available</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Metadata Form */}
                  <div className="flex-1 p-8 overflow-y-auto bg-white">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-bold text-slate-900">Metadata & Settings</DialogTitle>
                      <DialogDescription>Index your document with precision for easy retrieval.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6">
                      {/* Basic Info */}
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold">Document Title *</Label>
                          <Input
                            value={uploadData.title}
                            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                            placeholder="e.g., Annual Financial Audit 2024"
                            className="h-11 border-slate-200 focus:ring-primary shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold">Description</Label>
                          <Textarea
                            value={uploadData.description}
                            onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                            placeholder="Provide deep context for this record..."
                            rows={3}
                            className="resize-none border-slate-200 shadow-sm"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Classification */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Document Type</Label>
                          <Select value={uploadData.document_type} onValueChange={(v) => setUploadData({ ...uploadData, document_type: v })}>
                            <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="memo">Memo</SelectItem>
                              <SelectItem value="circular">Circular</SelectItem>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="policy">Policy</SelectItem>
                              <SelectItem value="bid_document">Bid / Tender Document</SelectItem>
                              <SelectItem value="contract">Contract / Agreement</SelectItem>
                              <SelectItem value="invoice">Invoice</SelectItem>
                              <SelectItem value="appointment_letter">Appointment Letter</SelectItem>
                              <SelectItem value="permit">Permit / Licence</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Classification</Label>
                          <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                            <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="hr">Human Resources</SelectItem>
                              <SelectItem value="administrative">Administrative</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Organization & Sensitivity */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1">
                            <Building className="h-3 w-3" /> Departments
                            <span className="text-slate-400 normal-case font-normal ml-1">— first is primary</span>
                          </Label>
                          <div className="border border-slate-200 rounded-lg bg-slate-50/50 max-h-36 overflow-y-auto p-2 space-y-1">
                            {departments.filter(d => d.id?.trim()).map(d => {
                              const isSelected = uploadData.department_ids.includes(d.id)
                              const isPrimary = uploadData.department_ids[0] === d.id
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    const current = uploadData.department_ids
                                    const next = isSelected ? current.filter(id => id !== d.id) : [...current, d.id]
                                    setUploadData(prev => ({ ...prev, department_ids: next }))
                                  }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
                                >
                                  <div className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                    {isSelected && <X className="h-2.5 w-2.5 text-white" />}
                                  </div>
                                  <span className="flex-1 text-left truncate">{d.name}</span>
                                  {isPrimary && <span className="text-amber-500 text-xs font-semibold">★ Primary</span>}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Visibility Level
                          </Label>
                          <Select value={uploadData.visibility_level} onValueChange={(v: any) => setUploadData({ ...uploadData, visibility_level: v })}>
                            <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="department">Department Internal</SelectItem>
                              <SelectItem value="public">Institution Public</SelectItem>
                              <SelectItem value="restricted">Restricted Access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                          <Tag className="h-3 w-3" /> Tags
                        </Label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {uploadData.tags.map(t => (
                            <Badge key={t} variant="secondary" className="px-2 py-0.5 rounded-md flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 group">
                              {t}
                              <X className="h-3 w-3 cursor-pointer opacity-50 group-hover:opacity-100" onClick={() => removeTag(t)} />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add tag and press Enter..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            className="h-9 border-slate-200 text-sm"
                          />
                          <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>Add</Button>
                        </div>
                      </div>

                      {/* Vault Encryption */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                        <div className="flex gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Zero-Trust Encryption</p>
                            <p className="text-xs text-slate-500">Encrypt this file before storing it in the persistent vault.</p>
                          </div>
                        </div>
                        <Switch
                          checked={uploadData.is_encrypted}
                          onCheckedChange={(checked) => setUploadData({ ...uploadData, is_encrypted: checked })}
                        />
                      </div>
                    </div>

                    <div className="mt-10 flex gap-3">
                      <Button variant="ghost" className="flex-1 h-12 text-slate-500" onClick={() => setIsUploadOpen(false)}>Discard</Button>
                      <Button
                        variant="tenantPrimary"
                        className="flex-[2] h-12 shadow-md shadow-primary/20 text-lg font-bold"
                        onClick={handleUpload}
                        disabled={isUploading || !uploadData.file}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Archiving Document...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Attention Required Section */}
        {featuredDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/50 rounded-xl p-6"
          >
            <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">
              Attention Required
            </h2>
            <p className="text-gray-600 text-sm mb-5">
              {featuredDocs.length} document{featuredDocs.length > 1 ? 's' : ''} pending review or action
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredDocs.map((doc) => (
                <DocumentCardV2
                  key={doc.id}
                  document={doc}
                  department={departments.find(d => d.id === (doc.document_departments?.find(dd => dd.is_primary)?.department_id ?? doc.department_id))}
                  onDownload={handleDownload}
                  onView={openDetail}
                  onVersions={openVersions}
                  onChat={() => handleChat(doc)}
                  onSummarize={() => handleSummarize(doc)}
                  onAnalysis={() => handleAnalysis(doc)}
                  onChartAnalysis={() => handleChartAnalysis(doc)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="space-y-4">
          {/* Standard Search Bar with View Toggle and Filter Button */}
          <StandardSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            placeholder="Search by title, tags, or description..."
            onFilterClick={() => setShowFilterPanel(!showFilterPanel)}
            showFilterPanel={showFilterPanel}
            filterCount={Object.keys(filters).length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSearching={isSearching}
          />

          {/* Filter Panel (collapsible) */}
          {showFilterPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <DocumentFilters
                departments={departments}
                filters={filters}
                searchQuery={searchQuery}
                parsedSearchFilters={parsedSearch}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
                onReset={handleResetFilters}
              />
            </motion.div>
          )}
        </div>

        {/* Documents Grid/List View */}
        {loading ? (
          viewMode === 'grid' ? (
            <DocumentSkeletonGrid count={pageSize} />
          ) : (
            <DocumentSkeletonTable count={pageSize} />
          )
        ) : paginatedDocs.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="Try adjusting your search or filters"
            action={canUpload ? { label: 'Upload Document', onAction: () => setIsUploadOpen(true) } : undefined}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            {viewMode === 'grid' ? (
              <Droppable droppableId="documents-grid">
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-4' : ''
                      }`}
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.06 } },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    {paginatedDocs.map((doc, index) => (
                      <Draggable key={doc.id} draggableId={doc.id} index={index} isDragDisabled={!canReorder}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <DocumentCardV2
                              document={doc}
                              department={departments.find(d => d.id === (doc.document_departments?.find(dd => dd.is_primary)?.department_id ?? doc.department_id))}
                              onDownload={handleDownload}
                              onView={openDetail}
                              onVersions={openVersions}
                              onChat={() => handleChat(doc)}
                              onSummarize={() => handleSummarize(doc)}
                              onAnalysis={() => handleAnalysis(doc)}
                              onChartAnalysis={() => handleChartAnalysis(doc)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </motion.div>
                )}
              </Droppable>
            ) : (
              <DocumentTableV2
                documents={paginatedDocs}
                departments={departments}
                onDownload={handleDownload}
                onView={openDetail}
                onVersions={openVersions}
                onChat={handleChat}
                onSummarize={handleSummarize}
                onAnalysis={handleAnalysis}
                onChartAnalysis={handleChartAnalysis}
              />
            )}
          </DragDropContext>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm mt-6">
          <span className="text-gray-600">
            Showing {startIdx + 1}–{Math.min(endIdx, sorted.length)} of {sorted.length} documents
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Per page:</span>
              <select
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            <span className="text-gray-600 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Edit Modal */}
        <EditModal
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditSubmit}
          document={selectedDoc}
          isLoading={isUpdating}
        />

        {/* Delete Modal */}
        <DeleteModal
          open={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteSubmit}
          document={selectedDoc}
          isLoading={isDeleting}
        />

        {/* Version History Modal */}
        <VersionHistoryModal
          open={isVersionsOpen}
          onClose={() => setIsVersionsOpen(false)}
          versions={versions}
          currentVersion={selectedDoc ? { ...selectedDoc, id: selectedDoc.id, created_at: selectedDoc.created_at, updated_at: selectedDoc.updated_at, file_size: 0 } as any : undefined}
          onDownload={handleDownloadVersion}
          onRestore={handleRestoreVersion}
          isLoading={loadingVersions}
        />
      </div>
    </PageTransition>
  )
}
