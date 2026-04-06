import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Plus,
  Loader2,
  Filter,
  Upload,
  Eye,
  Download,
  History,
  Pencil,
  Trash2,
  X,
  FileArchive,
  Clock,
  User,
  Building,
  Lock,
  Globe,
  Shield,
  FileUp,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Switch } from '@/components/ui/switch';
import { fetchData, file } from '@/lib/api/crud';
import type { Document, Department, DocumentVersion, DocumentUpdatePayload } from '@/types/dms';
import dayjs from 'dayjs';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const visibilityIcon = (level: string) => {
  if (level === 'public') return <Globe className="h-3 w-3" />;
  if (level === 'restricted') return <Lock className="h-3 w-3" />;
  return <Shield className="h-3 w-3" />;
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-primary/10 text-primary border-primary/20',
    archived: 'bg-gray-100 text-gray-700',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-secondary/20 text-secondary-foreground border-secondary/20',
  };
  return <Badge variant="outline" className={map[status] ?? ''}>{status}</Badge>;
};

// ─── Upload form defaults ────────────────────────────────────────────────────

const UPLOAD_DEFAULTS = {
  title: '',
  description: '',
  document_type: 'policy',
  category: 'administrative',
  department_id: '',
  visibility_level: 'department' as 'public' | 'department' | 'restricted',
  tags: [] as string[],
  is_encrypted: false,
  file: null as File | null,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Selected document (shared across dialogs)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Dialog / sheet open states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  // Upload form
  const [uploadData, setUploadData] = useState({ ...UPLOAD_DEFAULTS });
  const [isUploading, setIsUploading] = useState(false);

  // Edit form
  const [editData, setEditData] = useState<DocumentUpdatePayload>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete
  const [isDeleting, setIsDeleting] = useState(false);

  // Versions
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // ── data fetching ────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [docsData, deptsData] = await Promise.all([
        fetchData('DOCUMENTS', 'GET'),
        fetchData('DEPARTMENTS', 'GET'),
      ]);
      setDocuments(Array.isArray(docsData) ? docsData : (docsData?.items ?? []));
      setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData?.items ?? []));
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── upload ───────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title.trim()) {
      toast.error('Please provide a title and select a file');
      return;
    }
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', uploadData.file);
      form.append('title', uploadData.title);
      form.append('description', uploadData.description);
      form.append('document_type', uploadData.document_type);
      form.append('category', uploadData.category);
      form.append('department_id', uploadData.department_id);
      form.append('visibility_level', uploadData.visibility_level);
      form.append('is_encrypted', String(uploadData.is_encrypted));
      
      if (uploadData.tags.length > 0) {
        form.append('tags', JSON.stringify(uploadData.tags));
      }

      await fetchData('DOCUMENTS', 'POST', {}, form);
      toast.success('Document uploaded successfully');
      setIsUploadOpen(false);
      setUploadData({ ...UPLOAD_DEFAULTS });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  // ── dropzone logic ────────────────────────────────────────────────────────

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Auto-fill title if empty
      const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.');
      setUploadData(prev => ({
        ...prev,
        file,
        title: prev.title.trim() === '' ? fileNameWithoutExt : prev.title
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // ── download ─────────────────────────────────────────────────────────────
 
  const handleDownload = async (doc: Document) => {
    try {
      await file('DOCUMENT_DOWNLOAD', { id: doc.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleVersionDownload = async (docId: string, version: DocumentVersion) => {
    try {
      await file('DOCUMENT_DOWNLOAD', { id: docId }, { version_id: version.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Version download failed');
    }
  };

  // ── tags logic ───────────────────────────────────────────────────────────

  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    const val = tagInput.trim().toLowerCase();
    if (val && !uploadData.tags.includes(val)) {
      setUploadData(prev => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setUploadData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }));
  };

  // ── view detail ──────────────────────────────────────────────────────────

  const openView = (doc: Document) => {
    navigate(`/admin/documents/${doc.id}`);
  };



  // ── edit ─────────────────────────────────────────────────────────────────

  const openEdit = (doc: Document) => {
    setSelectedDoc(doc);
    setEditData({
      title: doc.title,
      description: doc.description ?? '',
      visibility_level: doc.visibility_level as any,
      status: doc.status as any,
      category: doc.category ?? '',
      document_type: doc.document_type,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedDoc) return;
    try {
      setIsUpdating(true);
      await fetchData(
        'DOCUMENT_UPDATE',
        'PATCH',
        { id: selectedDoc.id },
        editData
      );
      toast.success('Document updated');
      setIsEditOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────

  const openDelete = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      setIsDeleting(true);
      await fetchData('DOCUMENT_DELETE', 'DELETE', { id: selectedDoc.id });
      toast.success('Document deleted');
      setIsDeleteOpen(false);
      setSelectedDoc(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── versions ─────────────────────────────────────────────────────────────

  const openVersions = async (doc: Document) => {
    setSelectedDoc(doc);
    setVersions([]);
    setIsVersionsOpen(true);
    try {
      setLoadingVersions(true);
      const data = await fetchData('DOCUMENT_VERSIONS', 'GET', { id: doc.id });
      setVersions(Array.isArray(data) ? data : (data?.items ?? []));
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleUploadVersion = async () => {
    if (!selectedDoc || !newVersionFile) {
      toast.error('Please select a file');
      return;
    }
    try {
      setIsUploadingVersion(true);
      const form = new FormData();
      form.append('file', newVersionFile);
      form.append('change_notes', newVersionNotes);
      await fetchData('DOCUMENT_VERSIONS', 'POST', { id: selectedDoc.id }, form);
      toast.success('New version uploaded');
      setIsNewVersionOpen(false);
      setNewVersionFile(null);
      setNewVersionNotes('');
      // Refresh versions list
      const data = await fetchData('DOCUMENT_VERSIONS', 'GET', { id: selectedDoc.id });
      setVersions(Array.isArray(data) ? data : (data?.items ?? []));
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload version');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  // ── filter ───────────────────────────────────────────────────────────────

  const filtered = documents.filter(doc => {
    const q = searchQuery.toLowerCase();
    const matchSearch = doc.title.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q);
    const matchDept = deptFilter === 'all' || doc.department_id === deptFilter;
    return matchSearch && matchDept;
  });

  const deptName = (id?: string) =>
    departments.find(d => d.id === id)?.name ?? 'Global';

  const deptCode = (id?: string) =>
    departments.find(d => d.id === id)?.code ?? 'GLB';

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Explorer</h1>
          <p className="text-gray-600 mt-1">Manage university archives and official records</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="tenantPrimary" className="shadow-lg hover:shadow-xl transition-all">
              <Upload className="h-4 w-4 mr-2" />
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
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer
                      flex flex-col items-center justify-center text-center space-y-4
                      ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 hover:border-primary hover:bg-white'}
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="p-4 bg-white rounded-full shadow-sm text-primary">
                      <FileUp className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Click or drag file</p>
                      <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, XLSX (Max 50MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group">
                    <button 
                      onClick={() => setUploadData(prev => ({ ...prev, file: null }))}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate" title={uploadData.file.name}>
                          {uploadData.file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(uploadData.file.size)} • {uploadData.file.type.split('/').pop()?.toUpperCase()}
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
                  <DialogTitle className="text-2xl font-black text-slate-900 leading-none">Metadata & Settings</DialogTitle>
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
                          <SelectItem value="policy">Policy</SelectItem>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="memo">Memo</SelectItem>
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
                        <Building className="h-3 w-3" /> Owning Department
                      </Label>
                      <Select value={uploadData.department_id} onValueChange={(v) => setUploadData({ ...uploadData, department_id: v })}>
                        <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue placeholder="Global / Central" /></SelectTrigger>
                        <SelectContent>
                          {departments.filter(d => d.id?.trim()).map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Visibility Level
                      </Label>
                      <Select value={uploadData.visibility_level} onValueChange={(v: any) => setUploadData({ ...uploadData, visibility_level: v })}>
                        <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="department">Department Internal</SelectItem>
                          <SelectItem value="public">Tenant Public</SelectItem>
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
                        Finalize & Archive
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="md:col-span-1 border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input placeholder="Title or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.filter(d => d.id?.trim()).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <p className="text-xs text-gray-400">{filtered.length} document{filtered.length !== 1 ? 's' : ''} shown</p>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="md:col-span-3 border-none shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow>
                  <TableHead className="text-white">Document</TableHead>
                  <TableHead className="text-white">Department</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Modified</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      No documents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 max-w-[220px] truncate">{doc.title}</p>
                            <p className="text-xs text-gray-500 uppercase font-mono">
                              {doc.file_type?.split('/').pop() ?? 'file'} • {formatBytes(doc.file_size)} • v{doc.version}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-200 text-gray-600">
                          {deptCode(doc.department_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {dayjs(doc.updated_at).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" title="View Details" onClick={() => openView(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Version History" onClick={() => openVersions(doc)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Metadata" onClick={() => openEdit(doc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete Document" className="text-red-500 hover:text-red-700" onClick={() => openDelete(doc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── View Detail Sheet — hidden, replaced by dedicated page ──── */}
      {/* Sheet removed: Eye/View button now navigates to /admin/documents/:id */}

      {/* ── Edit Metadata Dialog ───────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Edit Document Metadata</DialogTitle>
            <DialogDescription>Update the document's information. The file itself is not changed.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editData.title ?? ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editData.description ?? ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editData.document_type ?? ''} onValueChange={(v) => setEditData({ ...editData, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="memo">Memo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editData.category ?? ''} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={editData.visibility_level ?? ''} onValueChange={(v: any) => setEditData({ ...editData, visibility_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editData.status ?? ''} onValueChange={(v: any) => setEditData({ ...editData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="tenantPrimary" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{selectedDoc?.title}"</strong>? This action will soft-delete the document and preserve the audit trail, but it will no longer appear in the explorer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Version History Dialog ─────────────────────────────────────────── */}
      <Dialog open={isVersionsOpen} onOpenChange={(open) => { setIsVersionsOpen(open); if (!open) setIsNewVersionOpen(false); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History — {selectedDoc?.title}
            </DialogTitle>
            <DialogDescription>All versions of this document, newest first.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto py-2">
            {loadingVersions ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No version history found.</p>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border text-gray-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Version {v.version_number}</p>
                      <p className="text-xs text-gray-500">{v.file_name} • {formatBytes(v.file_size)}</p>
                      {v.change_notes && <p className="text-xs text-gray-400 italic mt-0.5">{v.change_notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{dayjs(v.created_at).format('MMM DD, YYYY')}</span>
                    <Button variant="ghost" size="sm" onClick={() => selectedDoc && handleVersionDownload(selectedDoc.id, v)}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upload new version */}
          {!isNewVersionOpen ? (
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" onClick={() => setIsNewVersionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Upload New Version
              </Button>
            </DialogFooter>
          ) : (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Upload New Version</p>
              <Input type="file" onChange={(e) => setNewVersionFile(e.target.files?.[0] ?? null)} />
              <Textarea
                placeholder="Change notes (optional)..."
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsNewVersionOpen(false)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button variant="tenantPrimary" className="flex-1" onClick={handleUploadVersion} disabled={isUploadingVersion}>
                  {isUploadingVersion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
