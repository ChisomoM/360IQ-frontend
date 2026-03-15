import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { fetchData } from '@/lib/api/crud';
import type { Document, Department, DocumentVersion, DocumentUpdatePayload } from '@/types/dms';
import type { AdminLayoutContext } from '@/layouts/AdminLayout';
import { toast } from 'sonner';
import dayjs from 'dayjs';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  ArrowLeft,
  FileText,
  Download,
  Pencil,
  Trash2,
  History,
  Sparkles,
  Loader2,
  Building,
  Globe,
  Lock,
  Shield,
  XCircle,
  Plus,
  X,
  CalendarDays,
  Clock,
  Tag,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const visibilityConfig = (level: string) => {
  if (level === 'public') return { icon: <Globe className="h-3.5 w-3.5" />, label: 'Public', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (level === 'restricted') return { icon: <Lock className="h-3.5 w-3.5" />, label: 'Restricted', cls: 'bg-red-50 text-red-700 border-red-200' };
  return { icon: <Shield className="h-3.5 w-3.5" />, label: 'Department', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
};

const statusConfig = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    active:   { cls: 'bg-green-50 text-green-700 border-green-200',  label: 'Active' },
    archived: { cls: 'bg-gray-100 text-gray-600 border-gray-200',    label: 'Archived' },
    approved: { cls: 'bg-blue-50 text-blue-700 border-blue-200',     label: 'Approved' },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-200',        label: 'Rejected' },
    pending:  { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
  };
  return map[status] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: status };
};

const docTypeColor = (type: string) => {
  const map: Record<string, string> = {
    policy: 'bg-indigo-50 text-indigo-700',
    minutes: 'bg-teal-50 text-teal-700',
    report: 'bg-orange-50 text-orange-700',
    form: 'bg-pink-50 text-pink-700',
    memo: 'bg-cyan-50 text-cyan-700',
  };
  return map[type] ?? 'bg-gray-100 text-gray-600';
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { analyzeDocument } = useOutletContext<AdminLayoutContext>();

  const [doc, setDoc] = useState<Document | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<DocumentUpdatePayload>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Version history
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // ── data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchData('DOCUMENT_DETAIL', 'GET', { id }),
      fetchData('DEPARTMENTS', 'GET'),
    ])
      .then(([docData, deptsData]) => {
        setDoc(docData);
        setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData?.items ?? []));
      })
      .catch(() => {
        setNotFound(true);
        toast.error('Document not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── actions ──────────────────────────────────────────────────────────────

  const handleAnalyzeWithAI = () => {
    if (doc) analyzeDocument(doc);
  };

  const handleDownload = () => {
    if (!doc?.file_url) { toast.error('No download URL available'); return; }
    const a = window.document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.file_name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const openEdit = () => {
    if (!doc) return;
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
    if (!doc) return;
    try {
      setIsUpdating(true);
      const updated = await fetchData('DOCUMENT_UPDATE', 'PATCH', { id: doc.id }, editData);
      setDoc({ ...doc, ...updated });
      toast.success('Document updated');
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    try {
      setIsDeleting(true);
      await fetchData('DOCUMENT_DELETE', 'DELETE', { id: doc.id });
      toast.success('Document deleted');
      navigate('/admin/documents');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const openVersions = async () => {
    if (!doc) return;
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
    if (!doc || !newVersionFile) { toast.error('Please select a file'); return; }
    try {
      setIsUploadingVersion(true);
      const form = new FormData();
      form.append('file', newVersionFile);
      form.append('change_notes', newVersionNotes);
      await fetchData('DOCUMENT_VERSIONS', 'POST', { id: doc.id }, form);
      toast.success('New version uploaded');
      setIsNewVersionOpen(false);
      setNewVersionFile(null);
      setNewVersionNotes('');
      const data = await fetchData('DOCUMENT_VERSIONS', 'GET', { id: doc.id });
      setVersions(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload version');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────

  const deptName = (deptId?: string) =>
    departments.find(d => d.id === deptId)?.name ?? 'Global';

  // ── loading / error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#1e5631]" />
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-500">Document Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/admin/documents')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Documents
        </Button>
      </div>
    );
  }

  const vis = visibilityConfig(doc.visibility_level);
  const stat = statusConfig(doc.status);

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/documents')}
            className="mt-1 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Documents
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{doc.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {doc.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1.5" /> Download
          </Button>
          <Button variant="outline" size="sm" onClick={openVersions}>
            <History className="h-4 w-4 mr-1.5" /> Versions
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyzeWithAI}
            className="bg-gradient-to-r from-[#1e3c21] to-[#2a5230] text-white hover:opacity-90 gap-1.5 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Analyze with AI
          </Button>
        </div>
      </div>

      {/* ── Status strip ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={cn('border text-xs font-medium', stat.cls)}>{stat.label}</Badge>
        <Badge className={cn('border text-xs font-medium flex items-center gap-1', vis.cls)}>
          {vis.icon}{vis.label}
        </Badge>
        {doc.document_type && (
          <Badge className={cn('text-xs font-medium border-0', docTypeColor(doc.document_type))}>
            {doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1)}
          </Badge>
        )}
        {doc.is_encrypted && (
          <Badge className="text-xs font-medium bg-slate-100 text-slate-600 border-0">
            🔒 Encrypted
          </Badge>
        )}
        <span className="text-xs text-gray-400 ml-1">v{doc.version}</span>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: main content ──────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Document Details */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  {
                    icon: <FileText className="h-4 w-4 text-gray-400" />,
                    label: 'Document Type',
                    value: doc.document_type
                      ? doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1)
                      : '—',
                  },
                  {
                    icon: <Tag className="h-4 w-4 text-gray-400" />,
                    label: 'Category',
                    value: doc.category
                      ? doc.category.charAt(0).toUpperCase() + doc.category.slice(1)
                      : '—',
                  },
                  {
                    icon: <Building className="h-4 w-4 text-gray-400" />,
                    label: 'Department',
                    value: deptName(doc.department_id),
                  },
                  {
                    icon: vis.icon,
                    label: 'Visibility',
                    value: vis.label,
                  },
                  {
                    icon: <CalendarDays className="h-4 w-4 text-gray-400" />,
                    label: 'Uploaded',
                    value: dayjs(doc.created_at).format('DD MMM YYYY, HH:mm'),
                  },
                  {
                    icon: <Clock className="h-4 w-4 text-gray-400" />,
                    label: 'Last Modified',
                    value: dayjs(doc.updated_at).format('DD MMM YYYY, HH:mm'),
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{icon}</div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity — Coming Soon */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <Activity className="h-4 w-4" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">Activity log coming soon</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  A full audit trail of changes, views, and approvals for this document will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: sidebar ───────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">

          {/* File Info */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4" />
                File Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: 'File Name',
                  value: doc.file_name,
                  mono: true,
                },
                {
                  label: 'File Type',
                  value: doc.file_type || doc.document_type || '—',
                },
                {
                  label: 'File Size',
                  value: formatBytes(doc.file_size),
                },
                {
                  label: 'Version',
                  value: `v${doc.version}`,
                },
                ...(doc.file_hash
                  ? [{ label: 'Hash', value: doc.file_hash.slice(0, 16) + '…', mono: true }]
                  : []),
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{label}</span>
                  <span className={cn('text-xs text-right text-gray-700 font-medium max-w-[160px] truncate', mono && 'font-mono')}>
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2 text-gray-500" />
                Download File
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={openVersions}>
                <History className="h-4 w-4 mr-2 text-gray-500" />
                Version History
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-2 text-gray-500" />
                Edit Metadata
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Document
              </Button>
            </CardContent>
          </Card>

          {/* AI Card */}
          <Card className="border-none shadow-md bg-gradient-to-br from-[#1e3c21]/5 to-[#2a5230]/10">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1e3c21] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1e3c21]">AI Analysis</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Extract summaries, key insights, themes, and action items from this document.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-[#1e3c21] hover:bg-[#2a5230] text-white text-xs"
                    onClick={handleAnalyzeWithAI}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Analyze with AI
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
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
            <Button onClick={handleUpdate} disabled={isUpdating} className="bg-[#febb00] text-[#1e3c21] hover:bg-[#e8a900] font-bold">
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{doc.title}"</strong>? This action will soft-delete the document and preserve the audit trail, but it will no longer appear in the explorer.
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

      {/* ── Version History Dialog ────────────────────────────────────────── */}
      <Dialog open={isVersionsOpen} onOpenChange={(open) => { setIsVersionsOpen(open); if (!open) setIsNewVersionOpen(false); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History — {doc.title}
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
                    {v.file_url && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(v.file_url, '_blank')}>
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

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
                <Button
                  className="flex-1 bg-[#febb00] text-[#1e3c21] hover:bg-[#e8a900] font-bold"
                  onClick={handleUploadVersion}
                  disabled={isUploadingVersion}
                >
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
