import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { Loader2, Upload, FileUp, X, Check, CheckCircle2, Shield, Building, Lock, Tag, Star } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { PageTransition } from '@/components/PageTransition'
import { StandardSearchBar } from '@/components/SearchBar/StandardSearchBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTablePagination } from '@/components/shared/DataTablePagination'
import { cn } from '@/lib/utils'
import { DocumentCardV2 } from '@/components/documents/DocumentCardV2'
import { DocumentTableV2 } from '@/components/documents/DocumentTableV2'
import type { AdminLayoutContext } from '@/layouts/AdminLayout'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { EditModal, type EditFormData } from '@/components/documents/EditModal'
import { DeleteModal } from '@/components/documents/DeleteModal'
import { ArchiveModal } from '@/components/documents/ArchiveModal'
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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
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

  // ─── State: Archive ───────────────────────────────────────────────────
  const [isArchiving, setIsArchiving] = useState(false)

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
      toast.error('Add a title and choose a file.')
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
      toast.success('Document uploaded')
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

  const openArchive = (doc: Document) => {
    setSelectedDoc(doc)
    setIsArchiveOpen(true)
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
      toast.success('Document updated')
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
      await fetchData('DOCUMENT_DELETE', 'DELETE', { id: selectedDoc.id })
      toast.success('Document deleted')
      setIsDeleteOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Handlers: Archive ────────────────────────────────────────────

  const handleArchiveSubmit = async () => {
    if (!selectedDoc) return
    try {
      setIsArchiving(true)
      await fetchData('DOCUMENTS', 'PATCH', { id: selectedDoc.id }, { status: 'archived' })
      toast.success('Document archived')
      setIsArchiveOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive document')
    } finally {
      setIsArchiving(false)
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
  const canEdit = hasPermission(user, PERMISSIONS['documents.update'])
  const canDelete = hasPermission(user, PERMISSIONS['documents.delete'])
  const canReorder = hasPermission(user, PERMISSIONS['documents.update'])

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <div className="flex w-full flex-col gap-5 pb-12">
        {/* Header */}
        <PageHeader
          title="Documents"
          description="Search, upload and manage your organisation's documents."
          actions={canUpload && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload size={18} />
                  Upload document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
                <div className="flex max-h-[90vh] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
                  {/* Left Column: File Dropzone & Preview */}
                  <div className="flex shrink-0 flex-col justify-center border-b border-line bg-surface-0 p-6 md:w-2/5 md:border-b-0 md:border-r">
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-text-primary">File</h3>
                      <p className="mt-1 text-sm text-text-secondary">Choose the document you want to add.</p>
                    </div>

                    {!uploadData.file ? (
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                          'relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                          dragActive ? 'border-signal bg-signal-tint' : 'border-line-strong bg-surface-1 hover:border-signal',
                        )}
                      >
                        <input
                          type="file"
                          aria-label="Choose a file"
                          onChange={handleFileInputChange}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-field text-text-secondary">
                          <FileUp size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Drop a file here or browse</p>
                          <p className="mt-1 text-xs text-text-muted">PDF, DOCX or XLSX, up to 50MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-full rounded-lg border border-line bg-surface-1 p-4 shadow-card">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                            <FileUp size={24} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-text-primary" title={uploadData.file.name}>
                              {uploadData.file.name}
                            </p>
                            <p className="truncate font-mono text-xs text-text-muted">
                              {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB · {uploadData.file.type.split('/').pop()?.toUpperCase()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove file"
                            title="Remove file"
                            onClick={() => setUploadData(prev => ({ ...prev, file: null }))}
                          >
                            <X size={18} />
                          </Button>
                        </div>
                        <StatusBadge tone="positive" className="mt-3">Ready to upload</StatusBadge>
                      </div>
                    )}

                    <p className="mt-6 flex items-center gap-2 text-xs text-text-muted">
                      <Shield size={16} />
                      You can encrypt the file before it is stored.
                    </p>
                  </div>

                  {/* Right Column: Metadata Form */}
                  <div className="flex-1 p-6 md:overflow-y-auto">
                    <DialogHeader className="mb-5">
                      <DialogTitle>Upload document</DialogTitle>
                      <DialogDescription>Add the details people will use to find this document.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="upload-title">Title (required)</Label>
                          <Input
                            id="upload-title"
                            value={uploadData.title}
                            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                            placeholder="Annual financial audit 2026"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="upload-description">Description</Label>
                          <Textarea
                            id="upload-description"
                            value={uploadData.description}
                            onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                            placeholder="Audit of the 2026 accounts, prepared for the board"
                            rows={3}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Classification */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Document type</Label>
                          <Select value={uploadData.document_type} onValueChange={(v) => setUploadData({ ...uploadData, document_type: v })}>
                            <SelectTrigger aria-label="Document type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="memo">Memo</SelectItem>
                              <SelectItem value="circular">Circular</SelectItem>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="policy">Policy</SelectItem>
                              <SelectItem value="bid_document">Bid or tender document</SelectItem>
                              <SelectItem value="contract">Contract or agreement</SelectItem>
                              <SelectItem value="invoice">Invoice</SelectItem>
                              <SelectItem value="appointment_letter">Appointment letter</SelectItem>
                              <SelectItem value="permit">Permit or licence</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Classification</Label>
                          <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                            <SelectTrigger aria-label="Classification"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="hr">Human resources</SelectItem>
                              <SelectItem value="administrative">Administrative</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Organization & Sensitivity */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5">
                            <Building size={16} /> Departments
                          </Label>
                          <div className="max-h-36 space-y-1 overflow-y-auto rounded-md bg-field p-1.5">
                            {departments.filter(d => d.id?.trim()).map(d => {
                              const isSelected = uploadData.department_ids.includes(d.id)
                              const isPrimary = uploadData.department_ids[0] === d.id
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => {
                                    const current = uploadData.department_ids
                                    const next = isSelected ? current.filter(id => id !== d.id) : [...current, d.id]
                                    setUploadData(prev => ({ ...prev, department_ids: next }))
                                  }}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                                    isSelected ? 'bg-surface-1 font-medium text-text-primary' : 'text-text-secondary hover:bg-field-hover',
                                  )}
                                >
                                  <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-xs border', isSelected ? 'border-signal bg-signal text-on-signal' : 'border-line-strong bg-surface-1')}>
                                    {isSelected && <Check size={12} />}
                                  </span>
                                  <span className="flex-1 truncate text-left">{d.name}</span>
                                  {isPrimary && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-signal-text">
                                      <Star size={14} />Primary
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                          <p className="text-xs text-text-muted">The first one you select is the primary department.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5">
                            <Lock size={16} /> Visibility
                          </Label>
                          <Select value={uploadData.visibility_level} onValueChange={(v: any) => setUploadData({ ...uploadData, visibility_level: v })}>
                            <SelectTrigger aria-label="Visibility"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="department">Department only</SelectItem>
                              <SelectItem value="public">Everyone in the organisation</SelectItem>
                              <SelectItem value="restricted">Restricted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="space-y-1.5">
                        <Label htmlFor="upload-tag" className="flex items-center gap-1.5">
                          <Tag size={16} /> Tags
                        </Label>
                        {uploadData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {uploadData.tags.map(t => (
                              <StatusBadge key={t} tone="neutral">
                                {t}
                                <button type="button" aria-label={`Remove tag ${t}`} className="rounded-pill hover:text-text-primary" onClick={() => removeTag(t)}>
                                  <X size={12} />
                                </button>
                              </StatusBadge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Input
                            id="upload-tag"
                            placeholder="renewal"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button variant="secondary" onClick={addTag} disabled={!tagInput.trim()}>Add tag</Button>
                        </div>
                      </div>

                      {/* Vault Encryption */}
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-4">
                        <div className="flex gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                            <Shield size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Encrypt this file</p>
                            <p className="text-xs text-text-muted">The file is encrypted before it is stored.</p>
                          </div>
                        </div>
                        <Switch
                          aria-label="Encrypt this file"
                          checked={uploadData.is_encrypted}
                          onCheckedChange={(checked) => setUploadData({ ...uploadData, is_encrypted: checked })}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || !uploadData.file}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="animate-spin" />
                            Uploading
                          </>
                        ) : (
                          <>
                            <CheckCircle2 />
                            Upload document
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        />

        {/* Attention Required Section */}
        {featuredDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SectionCard
              title="Needs your action"
              eyebrow={`${featuredDocs.length} document${featuredDocs.length > 1 ? 's' : ''}`}
            >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                  onArchive={canEdit ? openArchive : undefined}
                  onDelete={canDelete ? openDelete : undefined}
                />
              ))}
            </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="space-y-4">
          {/* Standard Search Bar with View Toggle and Filter Button */}
          <StandardSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            placeholder="Search by title, tags or description"
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
              className="rounded-lg border border-line bg-surface-1 p-4 shadow-card"
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
          <div className="rounded-lg border border-line bg-surface-1 shadow-card">
            <EmptyState
              title="No documents found"
              description="Change your search or filters, or upload a document."
              action={canUpload ? { label: 'Upload document', onAction: () => setIsUploadOpen(true) } : undefined}
            />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            {viewMode === 'grid' ? (
              <Droppable droppableId="documents-grid">
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-colors ${snapshot.isDraggingOver ? 'bg-surface-2 rounded-lg p-4' : ''
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
                              onArchive={canEdit ? openArchive : undefined}
                              onDelete={canDelete ? openDelete : undefined}
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
                onArchive={canEdit ? openArchive : undefined}
                onDelete={canDelete ? openDelete : undefined}
              />
            )}
          </DragDropContext>
        )}

        {/* Pagination */}
        {!loading && sorted.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card sm:flex-row sm:items-stretch">
            <div className="min-w-0 flex-1">
              <DataTablePagination
                page={currentPage}
                pageSize={pageSize}
                total={sorted.length}
                onPageChange={(page) => setCurrentPage(Math.max(1, Math.min(totalPages, page)))}
              />
            </div>
            <div className="flex items-center gap-2 border-t border-line px-4 py-3">
              <span className="whitespace-nowrap text-xs text-text-muted">Per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger aria-label="Documents per page" className="h-8 w-20 font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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

        {/* Archive Modal */}
        <ArchiveModal
          open={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
          onConfirm={handleArchiveSubmit}
          document={selectedDoc}
          isLoading={isArchiving}
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
