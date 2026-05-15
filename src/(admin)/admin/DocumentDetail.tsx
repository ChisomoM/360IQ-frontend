// src/(admin)/admin/DocumentDetail.tsx
// Document detail page — shows preview, metadata, comments, audit trail,
// workflow stage, related documents, print/share controls, and owner info.

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchData, file as downloadFile, fetchFileBuffer } from '@/lib/api/crud';
import type { Document, Department, DocumentVersion, DocumentUpdatePayload } from '@/types/dms';
import type { AdminLayoutContext } from '@/layouts/AdminLayout';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  PenLine,
  CheckCircle,
  Printer,
  Share2,
  Copy,
  Check,
  MessageSquare,
  CornerDownRight,
  Send,
  User,
  GitBranch,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RequestSignatureModal from '@/components/signature/RequestSignatureModal';
import DocumentPreview from '@/components/signature/DocumentPreview';
import { getDocumentSignatureRequests } from '@/lib/api/signatures';
import type { SignatureRequest } from '@/types/signatures';

// ─── Types for mock data ───────────────────────────────────────────────────────

interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  user: { id: string; first_name: string; last_name: string; avatar_url?: string };
  content: string;
  parent_id: string | null; // null = top-level, string = reply to another comment
  created_at: string;
  updated_at: string;
}

interface DocumentAccessLog {
  id: string;
  document_id: string;
  user_id: string;
  user: { id: string; first_name: string; last_name: string };
  action: string; // 'viewed' | 'downloaded' | 'edited' | 'approved' | 'rejected'
  created_at: string;
  details: string | null;
}

interface WorkflowStep {
  id: string;
  step_number: number;
  approver_user?: { id: string; first_name: string; last_name: string } | null;
  approver_role?: { id: string; name: string; slug: string };
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  comments: string | null;
}

interface DocumentWorkflow {
  id: string;
  document_id: string;
  status: string;
  current_step_index: number;
  total_steps: number;
  steps: WorkflowStep[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    active: { cls: 'bg-green-50 text-green-700 border-green-200', label: 'Active' },
    archived: { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Archived' },
    approved: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Approved' },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
    pending: { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
    in_review: { cls: 'bg-orange-50 text-orange-700 border-orange-200', label: 'In Review' },
    changes_requested: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Changes Requested' },
    signed: { cls: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Signed' },
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

// Color + icon for each audit action type
const actionConfig = (action: string) => {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    viewed: { cls: 'bg-blue-50 text-blue-600', icon: <Eye className="h-3 w-3" />, label: 'Viewed' },
    downloaded: { cls: 'bg-purple-50 text-purple-600', icon: <Download className="h-3 w-3" />, label: 'Downloaded' },
    edited: { cls: 'bg-amber-50 text-amber-600', icon: <Pencil className="h-3 w-3" />, label: 'Edited' },
    approved: { cls: 'bg-green-50 text-green-600', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
    rejected: { cls: 'bg-red-50 text-red-600', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
  };
  return map[action] ?? { cls: 'bg-gray-50 text-gray-500', icon: <Activity className="h-3 w-3" />, label: action };
};

// Initials from first + last name for avatar fallbacks
const initials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { analyzeDocument } = useOutletContext<AdminLayoutContext>();

  const [doc, setDoc] = useState<Document | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Separate from notFound — shown when the server returns 403/forbidden
  const [accessDenied, setAccessDenied] = useState(false);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<DocumentUpdatePayload>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Version history dialog
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // Signatures
  const [sigRequests, setSigRequests] = useState<SignatureRequest[]>([]);
  const [loadingSigs, setLoadingSigs] = useState(false);
  const [isRequestSigOpen, setIsRequestSigOpen] = useState(false);

  // Share modal
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Owner ID copy
  const [ownerIdCopied, setOwnerIdCopied] = useState(false);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // comment ID being replied to
  const [replyText, setReplyText] = useState('');

  // Audit log
  const [auditLogs, setAuditLogs] = useState<DocumentAccessLog[]>([]);

  // Workflow
  const [workflow, setWorkflow] = useState<DocumentWorkflow | null>(null);

  // Related documents
  const [relatedDocs, setRelatedDocs] = useState<Partial<Document>[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────────

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
        setRelatedDocs([]);
      })
      .catch((err) => {
        // Check if the backend said "forbidden" / "unauthorized" vs just not found
        const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        
        // Missing tenant context = session expired, force re-login
        if (msg.includes('no tenant context') || msg.includes('missing tenant')) {
          toast.error('Session expired. Please log in again.');
          navigate('/admin/login');
          return;
        }
        
        if (msg.includes('403') || msg.includes('forbidden') || msg.includes('unauthorized')) {
          setAccessDenied(true);
        } else {
          setNotFound(true);
          toast.error('Document not found');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    setLoadingSigs(true);
    getDocumentSignatureRequests(id)
      .then(setSigRequests)
      .catch(() => {/* signatures are optional — silent fail is fine */ })
      .finally(() => setLoadingSigs(false));
  }, [id, loading]);

  // Load access logs and workflow once the document is available
  useEffect(() => {
    if (loading || !id) return;
    // Access logs
    fetchData('DOCUMENT_ACCESS_LOGS', 'GET', { id })
      .then((data) => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => setAuditLogs([]));
    // Workflow(s) for this document — take the most recent one
    fetchData('DOCUMENT_WORKFLOWS', 'GET', { id })
      .then((data: DocumentWorkflow[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setWorkflow(data[0]);
        } else {
          setWorkflow(null);
        }
      })
      .catch(() => setWorkflow(null));
  }, [id, loading]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAnalyzeWithAI = () => {
    if (doc) analyzeDocument(doc);
  };

  const handleDownload = async () => {
    if (!doc) { toast.error('No document available'); return; }
    try {
      await downloadFile('DOCUMENT_DOWNLOAD', { id: doc.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  };

  // Print the document file itself, not the whole page UI.
  // We use fetchFileBuffer (which sends auth headers) to get the file as a blob,
  // then create a temporary object URL and open it in a new tab.
  // The browser's PDF viewer has a built-in print button the user can use.
  const handlePrint = async () => {
    if (!doc) { toast.error('No document available'); return; }
    try {
      toast.info('Opening document for printing...');
      // fetchFileBuffer handles auth — returns an ArrayBuffer
      const { buffer } = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: doc.id });
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        toast.error('Popup blocked — please allow popups for this site.');
      }
      // Clean up the blob URL after the tab has had time to load it
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open document for printing');
    }
  };

  // Copies the full current URL so the recipient can paste it directly in their browser.
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Copies the owner_id string to clipboard
  const handleCopyOwnerId = async () => {
    if (!doc?.owner_id) return;
    try {
      await navigator.clipboard.writeText(doc.owner_id);
      setOwnerIdCopied(true);
      setTimeout(() => setOwnerIdCopied(false), 2000);
    } catch {
      toast.error('Could not copy ID');
    }
  };

  const handleVersionDownload = async (version: DocumentVersion) => {
    if (!doc) { toast.error('No document available'); return; }
    try {
      await downloadFile('DOCUMENT_DOWNLOAD', { id: doc.id }, { version_id: version.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Version download failed');
    }
  };

  const openEdit = () => {
    if (!doc) return;
    setEditData({
      title: doc.title,
      description: doc.description ?? '',
      visibility_level: doc.visibility_level,
      status: doc.status === 'active' || doc.status === 'archived' ? doc.status : undefined,
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
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update document'));
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
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete document'));
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
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload version'));
    } finally {
      setIsUploadingVersion(false);
    }
  };

  // Post a new top-level comment (mock — adds to local state)
  const handlePostComment = () => {
    if (!newComment.trim() || !id) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      document_id: id,
      user_id: 'current-user',
      user: { id: 'current-user', first_name: 'You', last_name: '' },
      content: newComment.trim(),
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  // Post a reply to a comment (mock — adds to local state)
  const handlePostReply = (parentId: string) => {
    if (!replyText.trim() || !id) return;
    const reply: Comment = {
      id: `c-${Date.now()}`,
      document_id: id,
      user_id: 'current-user',
      user: { id: 'current-user', first_name: 'You', last_name: '' },
      content: replyText.trim(),
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setComments(prev => [...prev, reply]);
    setReplyText('');
    setReplyingTo(null);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const deptName = (deptId?: string) =>
    departments.find(d => d.id === deptId)?.name ?? 'Global';

  /** Returns a human-readable label for the document's department associations. */
  const deptLabel = (doc: Document) => {
    if (doc.document_departments && doc.document_departments.length > 0) {
      const primary = doc.document_departments.find(dd => dd.is_primary);
      const primaryName = primary?.department?.name ?? deptName(primary?.department_id);
      const extra = doc.document_departments.length - 1;
      return extra > 0 ? `${primaryName} +${extra} more` : primaryName;
    }
    return deptName(doc.department_id);
  };

  // Groups replies under their parent comment
  const topLevelComments = comments.filter(c => c.parent_id === null);
  const repliesFor = (commentId: string) => comments.filter(c => c.parent_id === commentId);

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-ch-primary" />
      </div>
    );
  }

  // Shown when the backend returns 403 — the user is logged in but lacks permission
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Shield className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 font-sans text-sm mt-1 max-w-sm">
            You don't have permission to view this document.
            If you think this is a mistake, contact your administrator.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/documents')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Documents
        </Button>
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">

      {/* ── Page Header ── */}
      {/* Two-row layout: top row has back button + actions, bottom row has title + description.
          This prevents long titles from fighting the buttons for horizontal space. */}
      <div className="space-y-3">
        {/* Row 1: Navigation + Actions */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/documents')}
            className="text-gray-500 hover:text-gray-900 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Documents
          </Button>

          {/* Action buttons — Print removed per Chisomo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {[
              { label: 'Download', icon: <Download className="h-4 w-4 mr-1.5" />, onClick: handleDownload },
              { label: 'Share', icon: <Share2 className="h-4 w-4 mr-1.5" />, onClick: () => setIsShareOpen(true) },
              { label: 'Versions', icon: <History className="h-4 w-4 mr-1.5" />, onClick: openVersions },
              { label: 'Edit', icon: <Pencil className="h-4 w-4 mr-1.5" />, onClick: openEdit },
            ].map(({ label, icon, onClick }) => (
              <motion.div key={label}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <Button variant="outline" size="sm" onClick={onClick} className="border-gray-200">
                  {icon}{label}
                </Button>
              </motion.div>
            ))}
            <motion.div
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
              <Button size="sm" onClick={handleAnalyzeWithAI}
                className="bg-gradient-to-r from-primary to-primary-hover text-white hover:opacity-90 gap-1.5 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Row 2: Title + description — full width, wraps freely */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight">
            {doc.title}
          </h1>
          {/* No truncation here — description can wrap to as many lines as needed */}
          <p className="text-gray-500 font-sans text-sm mt-1 max-w-2xl">
            {doc.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* ── Status strip ── */}
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

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left column: main content ── */}
        <div className="lg:col-span-8 space-y-6">

          <DocumentPreview
            document={doc}
            signatureRequests={sigRequests}
            loadingSignatures={loadingSigs}
          />

          {/* Document Details card — includes owner */}
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
                    value: deptLabel(doc),
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

                {/* Owner — displayed as a truncated ID with a copy button
                    since owner_id is a raw UUID string with no nested user object */}
                {doc.owner_id && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Owner</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-sm font-mono text-gray-600 truncate max-w-[120px]">
                          {doc.owner_id.slice(0, 8)}…
                        </p>
                        {/* Copy button lets users grab the full UUID */}
                        <button
                          onClick={handleCopyOwnerId}
                          title="Copy owner ID"
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {ownerIdCopied
                            ? <Check className="h-3.5 w-3.5 text-green-500" />
                            : <Copy className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Approval History / Audit Trail ── */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <Activity className="h-4 w-4" />
                Approval History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Activity className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No activity recorded yet.</p>
                </div>
              ) : (
                // Timeline — each log entry is a row with a coloured action badge
                <div className="relative space-y-0">
                  {auditLogs.map((log, idx) => {
                    const ac = actionConfig(log.action);
                    const isLast = idx === auditLogs.length - 1;
                    return (
                      <div key={log.id} className="flex gap-3">
                        {/* Vertical line connecting entries */}
                        <div className="flex flex-col items-center">
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', ac.cls)}>
                            {ac.icon}
                          </div>
                          {/* Line below icon — hidden for the last item */}
                          {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1" />}
                        </div>
                        <div className={cn('pb-4 flex-1', isLast && 'pb-0')}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800">
                              {log.user.first_name} {log.user.last_name}
                              <span className="text-gray-400 font-normal ml-1">{ac.label.toLowerCase()} this document</span>
                            </p>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                              {dayjs(log.created_at).fromNow()}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{log.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Comments / Notes ── */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <MessageSquare className="h-4 w-4" />
                Comments
                {comments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-ch-primary/10 text-ch-primary text-xs font-semibold">
                    {comments.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Comment list */}
              {topLevelComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <MessageSquare className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No comments yet. Be the first to leave a note.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topLevelComments.map(comment => (
                    <div key={comment.id}>
                      {/* Top-level comment */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-ch-primary/10 text-ch-primary font-semibold">
                            {initials(comment.user.first_name, comment.user.last_name || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {comment.user.first_name} {comment.user.last_name}
                            </span>
                            <span className="text-xs text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{comment.content}</p>
                          {/* Reply toggle */}
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs text-gray-400 hover:text-ch-primary mt-1 transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      {/* Replies — indented under parent */}
                      {repliesFor(comment.id).length > 0 && (
                        <div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4">
                          {repliesFor(comment.id).map(reply => (
                            <div key={reply.id} className="flex gap-3">
                              <CornerDownRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-1" />
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-gray-100 text-gray-500 font-semibold">
                                  {initials(reply.user.first_name, reply.user.last_name || '?')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-sm font-semibold text-gray-800">
                                    {reply.user.first_name} {reply.user.last_name}
                                  </span>
                                  <span className="text-xs text-gray-400">{dayjs(reply.created_at).fromNow()}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline reply box — shown when user clicks "Reply" on this comment */}
                      {replyingTo === comment.id && (
                        <div className="ml-11 mt-3 flex gap-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostReply(comment.id); } }}
                            className="flex-1 text-sm h-9"
                          />
                          <Button size="sm" onClick={() => handlePostReply(comment.id)} className="h-9 bg-ch-primary hover:bg-ch-primary-700 text-white">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)} className="h-9">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New comment input */}
              <Separator />
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-ch-primary/10 text-ch-primary font-semibold">
                    ME
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Leave a comment or note..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    // Enter submits, Shift+Enter would add a newline if it were a textarea
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handlePostComment}
                    disabled={!newComment.trim()}
                    className="bg-ch-primary hover:bg-ch-primary-700 text-white"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Post
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Related Documents ── */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4" />
                Related Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <FileText className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No related documents found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedDocs.map(related => {
                    const relStat = statusConfig(related.status ?? '');
                    return (
                      <motion.div
                        key={related.id}
                        whileHover={{ x: 2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={() => navigate(`/admin/documents/${related.id}`)}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 hover:bg-slate-50/60 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Document type colour dot */}
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', docTypeColor(related.document_type ?? ''))}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-ch-primary transition-colors">
                              {related.title}
                            </p>
                            <p className="text-xs text-gray-400 font-mono truncate">{related.file_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cn('border text-xs', relStat.cls)}>{relStat.label}</Badge>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Workflow Stage card */}
          {workflow && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                  <GitBranch className="h-4 w-4" />
                  Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progress bar showing how far through the workflow we are */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Step {workflow.current_step_index + 1} of {workflow.total_steps}</span>
                    <span className="capitalize font-medium text-gray-600">{workflow.status.replace('_', ' ')}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ch-primary rounded-full transition-all duration-500"
                      style={{ width: `${((workflow.current_step_index) / workflow.total_steps) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step list */}
                <div className="space-y-2 pt-1">
                  {workflow.steps.map((step, idx) => {
                    // Determine visual state: done, active, or upcoming
                    const isDone = step.status === 'approved';
                    const isActive = idx === workflow.current_step_index;
                    const isRejected = step.status === 'rejected';

                    return (
                      <div key={step.id} className="flex items-start gap-2.5">
                        {/* Step status icon */}
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold',
                          isDone && 'bg-emerald-500',
                          isActive && 'bg-ch-primary',
                          isRejected && 'bg-red-500',
                          !isDone && !isActive && !isRejected && 'bg-muted border border-border text-muted-foreground',
                        )}>
                          {isDone ? <Check className="h-3 w-3" /> :
                            isRejected ? <X className="h-3 w-3" /> :
                              <span className={cn('text-xs', !isActive && 'text-muted-foreground')}>{step.step_number}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-medium truncate', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                            {step.approver_user
                              ? `${step.approver_user.first_name} ${step.approver_user.last_name}`
                              : (step.approver_role?.name ?? 'Role Approver')}
                          </p>
                          {/* Show approval time if approved, or "Awaiting" if active */}
                          <p className="text-xs text-muted-foreground">
                            {isDone && step.approved_at
                              ? `Approved ${dayjs(step.approved_at).fromNow()}`
                              : isActive
                                ? 'Awaiting approval'
                                : 'Pending'}
                          </p>
                          {step.comments && (
                            <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">"{step.comments}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signatures card */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <PenLine className="h-4 w-4" />
                Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingSigs ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : sigRequests.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No signature requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {sigRequests.map((req) => {
                    const name = req.signer
                      ? `${req.signer.first_name} ${req.signer.last_name}`
                      : 'Unknown';
                    const statusMap: Record<string, { cls: string; icon: React.ReactNode }> = {
                      pending: { cls: 'bg-amber-50 text-amber-700 border-amber-300', icon: <Clock className="h-3 w-3" /> },
                      signed: { cls: 'bg-green-50 text-green-700 border-green-300', icon: <CheckCircle className="h-3 w-3" /> },
                      declined: { cls: 'bg-red-50 text-red-700 border-red-300', icon: <XCircle className="h-3 w-3" /> },
                      expired: { cls: 'bg-gray-100 text-gray-500 border-gray-300', icon: <X className="h-3 w-3" /> },
                    };
                    const s = statusMap[req.status] ?? statusMap.pending;
                    return (
                      <div key={req.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-gray-600 truncate">{name}</span>
                          {req.sign_order > 1 && (
                            <span className="text-xs text-gray-400">#{req.sign_order}</span>
                          )}
                        </div>
                        <Badge variant="outline" className={cn('border text-xs flex items-center gap-1 flex-shrink-0', s.cls)}>
                          {s.icon}
                          <span className="capitalize">{req.status}</span>
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => setIsRequestSigOpen(true)}
              >
                <PenLine className="h-4 w-4 mr-2 text-gray-500" />
                Request Signature
              </Button>
            </CardContent>
          </Card>

          {/* File Info card */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4" />
                File Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'File Name', value: doc.file_name, mono: true },
                { label: 'File Type', value: doc.file_type || doc.document_type || '—' },
                { label: 'File Size', value: formatBytes(doc.file_size) },
                { label: 'Version', value: `v${doc.version}` },
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

          {/* Quick Actions card */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Download File', icon: <Download className="h-4 w-4 mr-2 text-gray-500" />, onClick: handleDownload },
                { label: 'Share Link', icon: <Share2 className="h-4 w-4 mr-2 text-gray-500" />, onClick: () => setIsShareOpen(true) },
                { label: 'Version History', icon: <History className="h-4 w-4 mr-2 text-gray-500" />, onClick: openVersions },
                { label: 'Edit Metadata', icon: <Pencil className="h-4 w-4 mr-2 text-gray-500" />, onClick: openEdit },
              ].map(({ label, icon, onClick }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Button variant="outline" className="w-full justify-start border-gray-200 hover:border-gray-300" size="sm" onClick={onClick}>
                    {icon}{label}
                  </Button>
                </motion.div>
              ))}
              <Separator />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-200"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* AI card */}
          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-[#2a5230]/10">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">AI Analysis</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Extract summaries, key insights, themes, and action items from this document.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-primary hover:bg-[#2a5230] text-white text-xs"
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

      {/* ── Share Modal ── */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-foreground">Share Document</DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Copy the link below and paste it directly into a browser address bar to open this document.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-2">
            {/* Full URL — recipient pastes this into their browser address bar */}
            <Input
              readOnly
              value={window.location.href}
              className="text-xs font-mono text-gray-500 bg-muted border-gray-200"
            />
            <Button size="sm" onClick={handleCopyUrl} className="flex-shrink-0 bg-ch-primary hover:bg-ch-primary-700 text-white">
              {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {urlCopied && (
            <p className="text-xs text-emerald-600 font-medium -mt-1">✓ Link copied — paste it in the browser address bar.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
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
                <Select
                  value={editData.visibility_level ?? ''}
                  onValueChange={(value: DocumentUpdatePayload['visibility_level']) =>
                    setEditData({ ...editData, visibility_level: value })
                  }
                >
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
                <Select
                  value={editData.status ?? ''}
                  onValueChange={(value: DocumentUpdatePayload['status']) =>
                    setEditData({ ...editData, status: value })
                  }
                >
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
            <Button onClick={handleUpdate} disabled={isUpdating} className="bg-ch-primary hover:bg-ch-primary-700 text-white font-semibold">
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{doc.title}"</strong>? This will soft-delete the document and preserve the audit trail, but it will no longer appear in the explorer.
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

      {/* ── Version History Dialog ── */}
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
              versions.map((v, idx) => (
                <div key={v.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-white rounded-lg border text-gray-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">Version {v.version_number}</p>
                          {idx === 0 && <Badge className="bg-blue-100 text-blue-700 text-xs">Latest</Badge>}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{v.file_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleVersionDownload(v)} className="text-blue-600 hover:text-blue-700">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-11">
                    <span>{formatBytes(v.file_size)}</span>
                    <span>•</span>
                    <span>{dayjs(v.created_at).format('MMM DD, YYYY HH:mm')}</span>
                    {v.uploaded_by && (
                      <>
                        <span>•</span>
                        <span>Uploaded by {v.uploaded_by.first_name} {v.uploaded_by.last_name}</span>
                      </>
                    )}
                  </div>

                  {v.change_notes && (
                    <div className="mt-2 ml-11 p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs text-gray-600"><span className="font-semibold">Changes:</span> {v.change_notes}</p>
                    </div>
                  )}
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
                  className="flex-1 bg-ch-primary hover:bg-ch-primary-700 text-white font-semibold"
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

      {/* ── Request Signature Modal ── */}
      {doc && (
        <RequestSignatureModal
          documentId={doc.id}
          documentTitle={doc.title}
          open={isRequestSigOpen}
          onClose={() => setIsRequestSigOpen(false)}
          onRequested={(req) => {
            setSigRequests((prev) => [...prev, req]);
            setIsRequestSigOpen(false);
          }}
        />
      )}
    </div>
  );
}