// Depracated - No longer in Use

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  FileWarning, 
  CheckCircle2,
  Inbox,
  ArrowRight,
  FileText,
  Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { PageTransition } from '@/components/PageTransition'
import { EmptyState } from '@/components/shared/EmptyState'
import { DocumentCardPremium } from '@/components/documents/DocumentCardPremium'
import { DocumentTable } from '@/components/documents/DocumentTable'
import { UploadModal } from '@/components/documents/UploadModal'
import { EditModal } from '@/components/documents/EditModal'
import { DeleteModal } from '@/components/documents/DeleteModal'
import { VersionHistoryModal } from '@/components/documents/VersionHistoryModal'
import { DocumentSkeletonGrid, DocumentSkeletonTable } from '@/components/documents/DocumentSkeleton'
import { useAuth } from '@/lib/context/useAuth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { fetchData, file } from '@/lib/api/crud'
import type { Document, Department, DocumentVersion } from '@/types/dms'
import toast from 'react-hot-toast'

type ViewMode = 'grid' | 'list'

export default function DocumentsPremium() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // --- Core State ---
  const [documents, setDocuments] = useState<Document[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // --- View & Pagination State ---
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // --- Modal State ---
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isVersionsOpen, setIsVersionsOpen] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // --- Fetch Data ---
  const refreshData = async () => {
    try {
      setLoading(true)
      const [docsData, deptsData] = await Promise.all([
        fetchData('DOCUMENTS', 'GET'),
        fetchData('DEPARTMENTS', 'GET'),
      ])
      setDocuments(Array.isArray(docsData) ? docsData : (docsData?.items ?? []))
      setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData?.items ?? []))
    } catch (err) {
      toast.error('Failed to sync with document vault')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // --- Derived State ---
  const actionRequiredDocs = documents.filter(doc => doc.status === 'action_required')
  
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = deptFilter === 'all' || doc.department_id === deptFilter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    
    return matchesSearch && matchesDept && matchesStatus
  })

  // --- Handlers ---
  const handleUpload = async (data: any) => {
    try {
      setIsUploading(true)
      const form = new FormData()
      if (data.file) form.append('file', data.file)
      form.append('title', data.title)
      form.append('description', data.description)
      form.append('document_type', data.document_type)
      form.append('category', data.category)
      form.append('department_id', data.department_id)
      form.append('visibility_level', data.visibility_level)
      form.append('is_encrypted', String(data.is_encrypted))
      if (data.tags.length > 0) form.append('tags', JSON.stringify(data.tags))

      await fetchData('DOCUMENTS', 'POST', {}, form)
      toast.success('Document archived successfully')
      setIsUploadOpen(false)
      refreshData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      await file('DOCUMENT_DOWNLOAD', { id: doc.id })
    } catch (err) {
      toast.error('Download bridge failed')
    }
  }

  const openVersions = async (doc: Document) => {
    setSelectedDoc(doc)
    setIsVersionsOpen(true)
    setLoadingVersions(true)
    try {
      const data = await fetchData('DOCUMENT_VERSIONS', 'GET', { id: doc.id })
      setVersions(Array.isArray(data) ? data : (data?.items ?? []))
    } catch {
      toast.error('Failed to load version history')
    } finally {
      setLoadingVersions(false)
    }
  }

  // --- Permissions ---
  const canUpload = hasPermission(user, PERMISSIONS['documents.write'])
  const canEdit = hasPermission(user, PERMISSIONS['documents.manage'])
  const canDelete = hasPermission(user, PERMISSIONS['documents.manage'])

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display">
              Repository
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Securely manage and index university archives.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {canUpload && (
              <Button 
                onClick={() => setIsUploadOpen(true)}
                className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Upload Document</span>
              </Button>
            )}
          </motion.div>
        </div>

        {/* Action Required Carousel Section */}
        <AnimatePresence>
          {actionRequiredDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-4 md:px-0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    Requires Immediate Attention
                  </h2>
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  {actionRequiredDocs.length} Pending Actions <ArrowRight className="h-3 w-3" />
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-0 no-scrollbar snap-x">
                {actionRequiredDocs.map((doc) => (
                  <div key={doc.id} className="min-w-[320px] snap-start">
                    <DocumentCardPremium 
                      document={doc}
                      onView={(d) => navigate(`/admin/documents/${d.id}`)}
                      onDownload={handleDownload}
                      onEdit={(d) => { setSelectedDoc(d); setIsEditOpen(true); }}
                      onDelete={(d) => { setSelectedDoc(d); setIsDeleteOpen(true); }}
                      onVersions={openVersions}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm mx-4 md:mx-0">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search by title, tags, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 border-none bg-slate-50/50 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-200 text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-12 w-48 border-none bg-slate-50/50 rounded-2xl font-medium text-slate-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 w-40 border-none bg-slate-50/50 rounded-2xl font-medium text-slate-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="action_required">Needs Action</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />

              <div className="flex bg-slate-50/80 p-1 rounded-xl">
                <Button 
                  variant={viewMode === 'grid' ? 'white' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-9 w-9 p-0 rounded-lg ${viewMode === 'grid' ? 'shadow-sm text-slate-900' : 'text-slate-400'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'white' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-9 w-9 p-0 rounded-lg ${viewMode === 'list' ? 'shadow-sm text-slate-900' : 'text-slate-400'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        <div className="px-4 md:px-0">
          {loading ? (
            viewMode === 'grid' ? <DocumentSkeletonGrid count={8} /> : <DocumentSkeletonTable count={8} />
          ) : filteredDocuments.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Inbox className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">No documents found</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Try adjusting your search query or filters to find what you're looking for.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setDeptFilter('all'); setStatusFilter('all'); }}
                className="rounded-xl border-slate-200"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              initial="hidden"
              animate="visible"
              className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}
            >
              {filteredDocuments.map((doc) => (
                viewMode === 'grid' ? (
                  <DocumentCardPremium 
                    key={doc.id}
                    document={doc}
                    onView={(d) => navigate(`/admin/documents/${d.id}`)}
                    onDownload={handleDownload}
                    onEdit={(d) => { setSelectedDoc(d); setIsEditOpen(true); }}
                    onDelete={(d) => { setSelectedDoc(d); setIsDeleteOpen(true); }}
                    onVersions={openVersions}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ) : (
                  <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-slate-300 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                          {doc.document_type} • {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pr-2">
                       <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)} className="h-8 w-8 p-0 rounded-full"><Download className="h-4 w-4" /></Button>
                       <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/documents/${doc.id}`)} className="h-8 w-8 p-0 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )
              ))}
            </motion.div>
          )}
        </div>

        {/* Modals */}
        <UploadModal 
          open={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          departments={departments} 
          onSubmit={handleUpload}
          isLoading={isUploading}
        />

        <DeleteModal 
          open={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={async () => {
            if (!selectedDoc) return
            try {
              setIsDeleting(true)
              await fetchData('DOCUMENTS', 'DELETE', { id: selectedDoc.id })
              toast.success('Document removed from vault')
              setIsDeleteOpen(false)
              refreshData()
            } catch {
              toast.error('Deletion failed')
            } finally {
              setIsDeleting(false)
            }
          }}
          isLoading={isDeleting}
          title={selectedDoc?.title || ''}
        />

        {/* Note: VersionHistoryModal and EditModal should be implemented/updated similarly if not already premium */}
        <VersionHistoryModal 
          open={isVersionsOpen}
          onClose={() => setIsVersionsOpen(false)}
          versions={versions}
          isLoading={loadingVersions}
          documentTitle={selectedDoc?.title || ''}
        />
      </div>
    </PageTransition>
  )
}
