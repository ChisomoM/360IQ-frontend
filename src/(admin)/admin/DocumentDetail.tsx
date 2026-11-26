// src/(admin)/admin/DocumentDetail.tsx
// Document detail page: preview, metadata, comments, audit trail,
// workflow stage, related documents, share controls, and owner info.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchData, file as downloadFile, fetchFileBuffer } from '@/lib/api/crud';
import type { Document, Department, DocumentVersion, DocumentUpdatePayload } from '@/types/dms';
import type { AdminLayoutContext } from '@/layouts/AdminLayout';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Button, buttonVariants } from '@/components/ui/button';
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
  Globe,
  Lock,
  Shield,
  XCircle,
  Plus,
  X,
  Activity,
  PenLine,
  CheckCircle,
  Share2,
  Copy,
  Check,
  MessageSquare,
  CornerDownRight,
  Send,
  Eye,
  ChevronRight,
} from '@/components/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { formatDateTime } from '@/lib/format';
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
  if (level === 'public') return { icon: <Globe size={14} />, label: 'Public' };
  if (level === 'restricted') return { icon: <Lock size={14} />, label: 'Restricted' };
  return { icon: <Shield size={14} />, label: 'Department' };
};

/** "bid_document" reads as "Bid document". */
const sentenceCase = (value: string) => {
  const words = value.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Tone + icon for each audit action type
const actionConfig = (action: string) => {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    viewed: { cls: 'bg-surface-2 text-text-secondary', icon: <Eye size={14} />, label: 'Viewed' },
    downloaded: { cls: 'bg-surface-2 text-text-secondary', icon: <Download size={14} />, label: 'Downloaded' },
    edited: { cls: 'bg-surface-2 text-text-secondary', icon: <Pencil size={14} />, label: 'Edited' },
    approved: { cls: 'bg-positive-tint text-positive', icon: <CheckCircle size={14} />, label: 'Approved' },
    rejected: { cls: 'bg-risk-tint text-risk', icon: <XCircle size={14} />, label: 'Rejected' },
  };
  return map[action] ?? { cls: 'bg-surface-2 text-text-muted', icon: <Activity size={14} />, label: action };
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
      toast.info('Opening document for printing');
      // fetchFileBuffer handles auth — returns an ArrayBuffer
      const { buffer } = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: doc.id });
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        toast.error('Popup blocked. Allow popups for this site, then try again.');
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
    if (!doc || !newVersionFile) { toast.error('Choose a file first.'); return; }
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
      <div role="status" aria-busy="true" aria-label="Loading document" className="flex w-full flex-col gap-5">
        <div className="skeleton h-9 w-72 rounded-md" />
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="skeleton h-[480px] rounded-lg" />
          <div className="grid gap-5">
            <div className="skeleton h-40 rounded-lg" />
            <div className="skeleton h-40 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Shown when the backend returns 403 — the user is logged in but lacks permission
  if (accessDenied) {
    return (
      <EmptyState
        className="min-h-[60vh] justify-center"
        icon={<Lock size={24} />}
        title="Hidden by your access level"
        description="You don't have permission to view this document. If you think this is a mistake, contact your administrator."
        action={{ label: 'Back to documents', onAction: () => navigate('/admin/documents') }}
      />
    );
  }

  if (notFound || !doc) {
    return (
      <EmptyState
        className="min-h-[60vh] justify-center"
        title="Document not found"
        description="It may have been deleted, or the link may be incomplete."
        action={{ label: 'Back to documents', onAction: () => navigate('/admin/documents') }}
      />
    );
  }

  const vis = visibilityConfig(doc.visibility_level);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex w-full flex-col gap-5">

      {/* ── Page header ── */}
      <PageHeader
        crumb={
          <button
            type="button"
            onClick={() => navigate('/admin/documents')}
            className="inline-flex items-center gap-1 rounded-xs hover:text-text-primary"
          >
            <ArrowLeft size={14} />
            Documents
          </button>
        }
        title={doc.title}
        description={doc.description || 'No description provided.'}
        actions={
          <>
            <Button variant="ghost" onClick={openEdit}><Pencil />Edit</Button>
            <Button variant="ghost" onClick={openVersions}><History />Versions</Button>
            <Button variant="secondary" onClick={() => setIsShareOpen(true)}><Share2 />Share</Button>
            <Button variant="secondary" onClick={handleDownload}><Download />Download</Button>
            <Button onClick={handleAnalyzeWithAI}><Sparkles />Analyse document</Button>
          </>
        }
      />

      {/* ── Status strip ── */}
      <div className="flex flex-wrap items-center gap-2">
        <DocumentStatusBadge status={doc.status} />
        <StatusBadge tone="neutral">{vis.icon}{vis.label}</StatusBadge>
        {doc.document_type && (
          <StatusBadge tone="neutral">{sentenceCase(doc.document_type)}</StatusBadge>
        )}
        {doc.is_encrypted && (
          <StatusBadge tone="neutral"><Lock size={14} />Encrypted</StatusBadge>
        )}
        <span className="ml-1 font-mono text-xs text-text-muted">v{doc.version}</span>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.35fr_1fr]">

        {/* ── Left column: main content ── */}
        <div className="flex min-w-0 flex-col gap-5">

          <DocumentPreview
            document={doc}
            signatureRequests={sigRequests}
            loadingSignatures={loadingSigs}
          />

          {/* Document details card, includes owner */}
          <SectionCard title="Document details">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                {
                  label: 'Document type',
                  value: doc.document_type ? sentenceCase(doc.document_type) : 'Not set',
                },
                {
                  label: 'Category',
                  value: doc.category ? sentenceCase(doc.category) : 'Not set',
                },
                {
                  label: 'Department',
                  value: deptLabel(doc),
                },
                {
                  label: 'Visibility',
                  value: vis.label,
                },
                {
                  label: 'Uploaded',
                  value: formatDateTime(doc.created_at),
                  mono: true,
                },
                {
                  label: 'Last modified',
                  value: formatDateTime(doc.updated_at),
                  mono: true,
                },
              ].map(({ label, value, mono }) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-text-muted">{label}</dt>
                  <dd className={cn('mt-0.5 text-sm font-medium text-text-primary', mono && 'font-mono text-xs')}>{value}</dd>
                </div>
              ))}

              {/* Owner: displayed as a truncated ID with a copy button
                  since owner_id is a raw UUID string with no nested user object */}
              {doc.owner_id && (
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">Owner ID</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5">
                    <span className="truncate font-mono text-xs text-text-primary">
                      {doc.owner_id.slice(0, 8)}…
                    </span>
                    {/* Copy button lets users grab the full UUID */}
                    <button
                      type="button"
                      onClick={handleCopyOwnerId}
                      title="Copy owner ID"
                      aria-label="Copy owner ID"
                      className="rounded-xs text-text-muted transition-colors hover:text-text-primary"
                    >
                      {ownerIdCopied
                        ? <Check size={16} className="text-positive" />
                        : <Copy size={16} />
                      }
                    </button>
                  </dd>
                </div>
              )}
            </dl>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="mb-2 text-xs text-text-muted">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map(tag => (
                      <StatusBadge key={tag} tone="neutral">{tag}</StatusBadge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </SectionCard>

          {/* ── Approval history / audit trail ── */}
          <SectionCard title="Approval history">
            {auditLogs.length === 0 ? (
              <EmptyState
                className="py-4"
                icon={<Activity size={24} />}
                title="No activity yet"
                description="Views, downloads, edits and approvals of this document are listed here."
              />
            ) : (
              // Timeline: each log entry is a row with a toned action icon
              <ol>
                {auditLogs.map((log, idx) => {
                  const ac = actionConfig(log.action);
                  const isLast = idx === auditLogs.length - 1;
                  return (
                    <li key={log.id} className="flex gap-3">
                      {/* Vertical line connecting entries */}
                      <div className="flex flex-col items-center">
                        <div className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-pill', ac.cls)}>
                          {ac.icon}
                        </div>
                        {/* Line below icon, hidden for the last item */}
                        {!isLast && <div className="my-1 w-px flex-1 bg-line" />}
                      </div>
                      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-text-primary">
                            {log.user.first_name} {log.user.last_name}
                            <span className="ml-1 font-normal text-text-secondary">{ac.label.toLowerCase()} this document</span>
                          </p>
                          <span className="shrink-0 whitespace-nowrap font-mono text-xs text-text-muted" title={formatDateTime(log.created_at)}>
                            {dayjs(log.created_at).fromNow()}
                          </span>
                        </div>
                        {log.details && (
                          <p className="mt-0.5 text-xs text-text-muted">{log.details}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>

          {/* ── Comments ── */}
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                Comments
                {comments.length > 0 && (
                  <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs font-medium text-text-secondary">
                    {comments.length}
                  </span>
                )}
              </span>
            }
            bodyClassName="space-y-4"
          >
            {/* Comment list */}
            {topLevelComments.length === 0 ? (
              <EmptyState
                className="py-4"
                icon={<MessageSquare size={24} />}
                title="No comments yet"
                description="Leave a note about this document below."
              />
            ) : (
              <div className="space-y-4">
                {topLevelComments.map(comment => (
                  <div key={comment.id}>
                    {/* Top-level comment */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-field text-xs font-semibold text-text-secondary">
                          {initials(comment.user.first_name, comment.user.last_name || '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-text-primary">
                            {comment.user.first_name} {comment.user.last_name}
                          </span>
                          <span className="text-xs text-text-muted" title={formatDateTime(comment.created_at)}>{dayjs(comment.created_at).fromNow()}</span>
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{comment.content}</p>
                        {/* Reply toggle */}
                        <button
                          type="button"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="mt-1 rounded-xs text-xs font-medium text-signal-text hover:underline"
                        >
                          Reply
                        </button>
                      </div>
                    </div>

                    {/* Replies, indented under parent */}
                    {repliesFor(comment.id).length > 0 && (
                      <div className="ml-11 mt-3 space-y-3 border-l border-line pl-4">
                        {repliesFor(comment.id).map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <CornerDownRight size={14} className="mt-1 shrink-0 text-text-muted" />
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-field text-xs font-semibold text-text-secondary">
                                {initials(reply.user.first_name, reply.user.last_name || '?')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-text-primary">
                                  {reply.user.first_name} {reply.user.last_name}
                                </span>
                                <span className="text-xs text-text-muted" title={formatDateTime(reply.created_at)}>{dayjs(reply.created_at).fromNow()}</span>
                              </div>
                              <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline reply box, shown when user clicks "Reply" on this comment */}
                    {replyingTo === comment.id && (
                      <div className="ml-11 mt-3 flex gap-2">
                        <Input
                          aria-label="Reply"
                          placeholder="I will check the clause today"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostReply(comment.id); } }}
                          className="flex-1"
                        />
                        <Button variant="secondary" size="icon" aria-label="Send reply" title="Send reply" onClick={() => handlePostReply(comment.id)}>
                          <Send />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Cancel reply" title="Cancel reply" onClick={() => setReplyingTo(null)}>
                          <X />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* New comment input */}
            <Separator />
            <div className="flex gap-2">
              <Input
                aria-label="Comment"
                placeholder="Notice period confirmed with Legal"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                // Enter submits, Shift+Enter would add a newline if it were a textarea
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={handlePostComment}
                disabled={!newComment.trim()}
              >
                <Send />
                Post comment
              </Button>
            </div>
          </SectionCard>

          {/* ── Related documents ── */}
          <SectionCard title="Related documents">
            {relatedDocs.length === 0 ? (
              <EmptyState
                className="py-4"
                title="No related documents"
                description="Documents linked to this one are listed here."
              />
            ) : (
              <div className="space-y-2">
                {relatedDocs.map(related => (
                  <motion.div
                    key={related.id}
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={() => navigate(`/admin/documents/${related.id}`)}
                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-md border border-line p-3 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {related.title}
                        </p>
                        <p className="truncate font-mono text-xs text-text-muted">{related.file_name}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <DocumentStatusBadge status={related.status} />
                      <ChevronRight size={16} className="text-text-muted" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Right column ── */}
        <div className="flex min-w-0 flex-col gap-5">

          {/* AI card */}
          <SectionCard
            tone="ai"
            eyebrow={<span className="flex items-center gap-1.5 text-signal-text"><Sparkles size={16} />360IQ analysis</span>}
            title="Read this document with 360IQ"
            bodyClassName="space-y-3"
          >
            <p className="text-sm leading-relaxed text-text-secondary">
              Get a summary, key insights, themes and action items. Check each one against the file before you rely on it.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-signal-text">
              <FileText size={14} className="shrink-0" />
              <span className="min-w-0 truncate">Source: <span className="font-mono">{doc.file_name}</span></span>
            </p>
            <Button size="sm" variant="secondary" onClick={handleAnalyzeWithAI}>
              <Sparkles />
              Analyse document
            </Button>
          </SectionCard>

          {/* Workflow stage card */}
          {workflow && (
            <SectionCard
              title="Workflow"
              actions={<DocumentStatusBadge status={workflow.status} />}
              bodyClassName="space-y-4"
            >
              {/* Progress bar showing how far through the workflow we are */}
              <div className="space-y-1.5">
                <p className="text-xs text-text-muted">
                  Step <span className="font-mono">{workflow.current_step_index + 1}</span> of <span className="font-mono">{workflow.total_steps}</span>
                </p>
                <div className="h-1.5 overflow-hidden rounded-pill bg-surface-2">
                  <div
                    className="h-full rounded-pill bg-signal transition-all duration-300"
                    style={{ width: `${((workflow.current_step_index) / workflow.total_steps) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step list */}
              <ol className="space-y-3">
                {workflow.steps.map((step, idx) => {
                  // Determine visual state: done, active, or upcoming
                  const isDone = step.status === 'approved';
                  const isActive = idx === workflow.current_step_index;
                  const isRejected = step.status === 'rejected';

                  return (
                    <li key={step.id} className="flex items-start gap-2.5">
                      {/* Step status icon */}
                      <div className={cn(
                        'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-pill font-mono text-xs',
                        isDone && 'bg-positive text-surface-1',
                        isActive && 'bg-signal text-on-signal',
                        isRejected && 'bg-risk text-surface-1',
                        !isDone && !isActive && !isRejected && 'border border-line bg-field text-text-muted',
                      )}>
                        {isDone ? <Check size={12} /> :
                          isRejected ? <X size={12} /> :
                            <span>{step.step_number}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-[13px] font-medium', isActive ? 'text-text-primary' : 'text-text-secondary')}>
                          {step.approver_user
                            ? `${step.approver_user.first_name} ${step.approver_user.last_name}`
                            : (step.approver_role?.name ?? 'Role approver')}
                        </p>
                        {/* Show approval time if approved, or "Awaiting" if active */}
                        <p className="text-xs text-text-muted" title={step.approved_at ? formatDateTime(step.approved_at) : undefined}>
                          {isDone && step.approved_at
                            ? `Approved ${dayjs(step.approved_at).fromNow()}`
                            : isRejected
                              ? 'Rejected'
                              : isActive
                                ? 'Awaiting approval'
                                : 'Pending'}
                        </p>
                        {step.comments && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">"{step.comments}"</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </SectionCard>
          )}

          {/* Signatures card */}
          <SectionCard title="Signatures" bodyClassName="space-y-3">
            {loadingSigs ? (
              <TableSkeleton rows={2} columns={2} />
            ) : sigRequests.length === 0 ? (
              <p className="text-sm text-text-muted">No signature requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {sigRequests.map((req) => {
                  const name = req.signer
                    ? `${req.signer.first_name} ${req.signer.last_name}`
                    : 'Unknown';
                  return (
                    <li key={req.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-text-primary">{name}</span>
                        {req.sign_order > 1 && (
                          <span className="font-mono text-xs text-text-muted">#{req.sign_order}</span>
                        )}
                      </div>
                      <DocumentStatusBadge status={req.status} className="shrink-0" />
                    </li>
                  );
                })}
              </ul>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRequestSigOpen(true)}
            >
              <PenLine />
              Request signature
            </Button>
          </SectionCard>

          {/* File info card */}
          <SectionCard title="File">
            <dl className="space-y-3">
              {[
                { label: 'File name', value: doc.file_name },
                { label: 'File type', value: doc.file_type || doc.document_type || 'Unknown' },
                { label: 'File size', value: formatBytes(doc.file_size) },
                { label: 'Version', value: `v${doc.version}` },
                ...(doc.file_hash
                  ? [{ label: 'Hash', value: doc.file_hash.slice(0, 16) + '…' }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="whitespace-nowrap text-xs text-text-muted">{label}</dt>
                  <dd className="min-w-0 truncate text-right font-mono text-xs text-text-primary" title={String(value)}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          {/* Delete */}
          <SectionCard title="Delete document" bodyClassName="space-y-3">
            <p className="text-sm text-text-secondary">It leaves the document list. The audit trail is kept.</p>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 />
              Delete document
            </Button>
          </SectionCard>
        </div>
      </div>

      {/* ── Share modal ── */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Share document</DialogTitle>
            <DialogDescription>
              Copy this link and paste it into a browser address bar to open the document.
            </DialogDescription>
          </DialogHeader>
          {/* Full URL: recipient pastes this into their browser address bar */}
          <Input
            readOnly
            aria-label="Document link"
            value={window.location.href}
            className="font-mono text-xs"
          />
          {urlCopied && (
            <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-positive">
              <CheckCircle size={14} />Link copied
            </p>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsShareOpen(false)}>Close</Button>
            <Button onClick={handleCopyUrl}>
              {urlCopied ? <Check /> : <Copy />}
              Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit document details</DialogTitle>
            <DialogDescription>Update the document's information. The file itself is not changed.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="detail-title">Title</Label>
              <Input id="detail-title" value={editData.title ?? ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail-description">Description</Label>
              <Textarea id="detail-description" value={editData.description ?? ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editData.document_type ?? ''} onValueChange={(v) => setEditData({ ...editData, document_type: v })}>
                  <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="memo">Memo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editData.category ?? ''} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                  <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="hr">Human resources</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select
                  value={editData.visibility_level ?? ''}
                  onValueChange={(value) =>
                    setEditData({ ...editData, visibility_level: value as DocumentUpdatePayload['visibility_level'] })
                  }
                >
                  <SelectTrigger aria-label="Visibility"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editData.status ?? ''}
                  onValueChange={(value) =>
                    setEditData({ ...editData, status: value as DocumentUpdatePayload['status'] })
                  }
                >
                  <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{doc.title}"</strong> will no longer appear in the document list. The audit trail is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={buttonVariants({ variant: 'destructive' })}
            >
              {isDeleting && <Loader2 className="animate-spin" />}
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Version history dialog ── */}
      <Dialog open={isVersionsOpen} onOpenChange={(open) => { setIsVersionsOpen(open); if (!open) setIsNewVersionOpen(false); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>All versions of "{doc.title}", newest first.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {loadingVersions ? (
              <TableSkeleton rows={3} columns={3} />
            ) : versions.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">No version history yet.</p>
            ) : (
              versions.map((v, idx) => (
                <div key={v.id} className="rounded-md border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary">Version <span className="font-mono">{v.version_number}</span></p>
                          {idx === 0 && <StatusBadge tone="neutral">Latest</StatusBadge>}
                        </div>
                        <p className="mt-0.5 truncate font-mono text-xs text-text-secondary">{v.file_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleVersionDownload(v)}>
                      <Download />Download
                    </Button>
                  </div>

                  <div className="ml-11 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                    <span className="font-mono">{formatBytes(v.file_size)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{formatDateTime(v.created_at)}</span>
                    {v.uploaded_by && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Uploaded by {v.uploaded_by.first_name} {v.uploaded_by.last_name}</span>
                      </>
                    )}
                  </div>

                  {v.change_notes && (
                    <p className="ml-11 mt-2 rounded-sm bg-field px-3 py-2 text-xs text-text-secondary">
                      <span className="font-semibold">Changes:</span> {v.change_notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
          {!isNewVersionOpen ? (
            <DialogFooter className="border-t border-line pt-4">
              <Button variant="secondary" onClick={() => setIsNewVersionOpen(true)}>
                <Plus />Upload new version
              </Button>
            </DialogFooter>
          ) : (
            <div className="space-y-3 border-t border-line pt-4">
              <p className="text-sm font-semibold text-text-primary">Upload new version</p>
              <Input type="file" aria-label="New version file" onChange={(e) => setNewVersionFile(e.target.files?.[0] ?? null)} />
              <Textarea
                aria-label="Change notes"
                placeholder="Updated the payment schedule (optional)"
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsNewVersionOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadVersion}
                  disabled={isUploadingVersion}
                >
                  {isUploadingVersion && <Loader2 className="animate-spin" />}
                  Upload version
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Request signature modal ── */}
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
