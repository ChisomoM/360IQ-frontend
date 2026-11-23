// src/(admin)/admin/DepartmentDetailPage.tsx
// Department detail page — tabbed layout with Overview, Members, Documents, Activity.
// USE_MOCK = true while backend endpoints are being confirmed.
// Flip to false once DEPARTMENT_STATISTICS, DEPARTMENT_USERS, and
// DEPARTMENT_DOCUMENTS are live on the new base URL (port 8094).

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Building2, Users, Edit2, Loader2,
  FileText, Clock, Crown, Mail, Shield,
  ChevronRight, Activity, LayoutDashboard,
  CheckCircle, AlertCircle, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import type { DepartmentDetail, DepartmentUser } from '@/types/dms';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Remove when USE_MOCK = false

const MOCK_DEPT: DepartmentDetail = {
  id: 'dept-001',
  name: 'Registry',
  code: 'REG',
  description: 'Handles student records, academic documentation, and official university correspondence.',
  is_active: true,
  head_of_dept_id: 'u-001',
  created_at: dayjs().subtract(2, 'year').toISOString(),
  updated_at: dayjs().subtract(3, 'day').toISOString(),
  users: [
    { id: 'u-001', first_name: 'Tendai', last_name: 'Moyo', email: 'tendai.moyo@unilus.ac.zm', role: 'Department Head' },
    { id: 'u-002', first_name: 'Amara', last_name: 'Banda', email: 'amara.banda@unilus.ac.zm', role: 'Records Officer' },
    { id: 'u-003', first_name: 'Chanda', last_name: 'Phiri', email: 'chanda.phiri@unilus.ac.zm', role: 'Admin Assistant' },
    { id: 'u-004', first_name: 'Kemi', last_name: 'Dlamini', email: 'kemi.dlamini@unilus.ac.zm', role: 'Records Officer' },
    { id: 'u-005', first_name: 'Bongani', last_name: 'Ncube', email: 'bongani.ncube@unilus.ac.zm', role: 'Data Entry Clerk' },
  ],
};

const MOCK_STATS = {
  total_members: 5,
  total_heads: 1,
  total_documents: 24,
  documents_pending_approval: 3,
  last_activity_at: dayjs().subtract(2, 'hour').toISOString(),
};

const MOCK_DOCUMENTS = [
  { id: 'doc-001', title: 'Student Enrollment Policy 2024', document_type: 'policy', status: 'approved', updated_at: dayjs().subtract(2, 'day').toISOString() },
  { id: 'doc-002', title: 'Q1 Departmental Report', document_type: 'report', status: 'pending', updated_at: dayjs().subtract(5, 'day').toISOString() },
  { id: 'doc-003', title: 'Staff Meeting Minutes – March', document_type: 'minutes', status: 'active', updated_at: dayjs().subtract(1, 'week').toISOString() },
  { id: 'doc-004', title: 'Leave Application Form', document_type: 'form', status: 'active', updated_at: dayjs().subtract(2, 'week').toISOString() },
  { id: 'doc-005', title: 'Budget Allocation Memo – April', document_type: 'memo', status: 'approved', updated_at: dayjs().subtract(3, 'week').toISOString() },
  { id: 'doc-006', title: 'Student Records Archive 2023', document_type: 'report', status: 'archived', updated_at: dayjs().subtract(1, 'month').toISOString() },
];

const MOCK_ACTIVITY = [
  { action: 'Document approved', user: 'Tendai Moyo', time: dayjs().subtract(2, 'hour').toISOString(), type: 'approve' },
  { action: 'New member added', user: 'Kemi Dlamini', time: dayjs().subtract(1, 'day').toISOString(), type: 'member' },
  { action: 'Department details updated', user: 'Tendai Moyo', time: dayjs().subtract(3, 'day').toISOString(), type: 'edit' },
  { action: 'Document submitted', user: 'Amara Banda', time: dayjs().subtract(1, 'week').toISOString(), type: 'document' },
  { action: 'Document rejected', user: 'Chanda Phiri', time: dayjs().subtract(2, 'week').toISOString(), type: 'reject' },
  { action: 'Member removed', user: 'Tendai Moyo', time: dayjs().subtract(3, 'week').toISOString(), type: 'member' },
];

// Flip to false once the backend endpoints are confirmed on port 8094
const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'members' | 'documents' | 'activity';

interface DeptStats {
  total_members: number;
  total_heads: number;
  total_documents: number;
  documents_pending_approval: number;
  last_activity_at: string;
}

// ─── Animation variants ───────────────────────────────────────────────────────
const tabContentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Same accent colour logic as the Departments list page — consistent per code
const accentColors = [
  { ring: 'from-ch-primary-600 to-ch-primary-600', bg: 'bg-ch-primary-50', text: 'text-ch-primary-700', iconBg: 'bg-ch-primary/[0.08]', iconText: 'text-ch-primary-600' },
  { ring: 'from-ch-secondary-600 to-ch-secondary-600', bg: 'bg-ch-secondary-50', text: 'text-ch-secondary-700', iconBg: 'bg-ch-secondary/[0.08]', iconText: 'text-ch-secondary-600' },
  { ring: 'from-ch-tertiary-500 to-ch-tertiary-500', bg: 'bg-surface-2', text: 'text-text-secondary', iconBg: 'bg-surface-2', iconText: 'text-text-secondary' },
  { ring: 'from-caution to-caution', bg: 'bg-caution-tint', text: 'text-caution', iconBg: 'bg-caution-tint', iconText: 'text-caution' },
];

const getAccent = (code: string) => accentColors[code.charCodeAt(0) % accentColors.length];

const initials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  active: { cls: 'bg-success-light text-success-fg', label: 'Active' },
  approved: { cls: 'bg-blue-50 text-blue-700', label: 'Approved' },
  pending: { cls: 'bg-warning-light text-warning-fg', label: 'Pending' },
  rejected: { cls: 'bg-danger-light text-danger-fg', label: 'Rejected' },
  archived: { cls: 'bg-gray-100 text-gray-500', label: 'Archived' },
};

const DOC_TYPE_COLOR: Record<string, string> = {
  policy: 'bg-surface-2 text-sky-text',
  minutes: 'bg-signal-tint text-signal-text',
  report: 'bg-caution-tint text-caution',
  form: 'bg-surface-2 text-text-secondary',
  memo: 'bg-positive-tint text-positive',
};

const ACTIVITY_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  approve: { color: 'bg-positive-tint text-positive', icon: <CheckCircle className="h-3 w-3" /> },
  reject: { color: 'bg-danger-light text-danger-fg', icon: <AlertCircle className="h-3 w-3" /> },
  document: { color: 'bg-blue-50 text-blue-600', icon: <FileText className="h-3 w-3" /> },
  edit: { color: 'bg-ch-primary/10 text-ch-primary', icon: <Edit2 className="h-3 w-3" /> },
  member: { color: 'bg-amber-50 text-amber-600', icon: <Users className="h-3 w-3" /> },
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberRow({ user, isHead = false }: { user: DepartmentUser; isHead?: boolean }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isHead
          ? 'bg-ch-primary/[0.04] border-ch-primary/20'
          : 'bg-card border-gray-200 hover:bg-slate-50/60'
        }`}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className={`text-xs font-semibold ${isHead ? 'bg-ch-primary/10 text-ch-primary' : 'bg-muted text-muted-foreground'
          }`}>
          {initials(user.first_name, user.last_name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {user.first_name} {user.last_name}
          </p>
          {isHead && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Crown className="h-3 w-3" />
              Head
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-sans truncate">{user.email}</p>
        </div>
      </div>

      {user.role && (
        <span className="text-xs text-muted-foreground font-sans flex-shrink-0">{user.role}</span>
      )}
    </motion.div>
  );
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function OverviewTab({ dept, stats }: { dept: DepartmentDetail; stats: DeptStats | null }) {
  const accent = getAccent(dept.code);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Members',
            value: stats?.total_members ?? '—',
            icon: <Users className="h-5 w-5" />,
            iconBg: accent.iconBg,
            iconText: accent.iconText,
          },
          {
            label: 'Total Documents',
            value: stats?.total_documents ?? '—',
            icon: <FileText className="h-5 w-5" />,
            iconBg: 'bg-ch-secondary/[0.08]',
            iconText: 'text-ch-secondary-600',
          },
          {
            label: 'Pending Approval',
            value: stats?.documents_pending_approval ?? '—',
            icon: <Clock className="h-5 w-5" />,
            iconBg: 'bg-warning-light',
            iconText: 'text-warning-fg',
          },
          {
            label: 'Last Activity',
            value: stats?.last_activity_at ? dayjs(stats.last_activity_at).fromNow() : '—',
            icon: <TrendingUp className="h-5 w-5" />,
            iconBg: 'bg-muted',
            iconText: 'text-muted-foreground',
          },
        ].map(({ label, value, icon, iconBg, iconText }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="bg-card rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-lg ${iconBg} flex-shrink-0`}>
              <span className={iconText}>{icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-sans text-text-xs text-muted-foreground">{label}</p>
              <p className="font-display font-bold text-xl text-foreground truncate">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Department details card */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display font-semibold text-foreground">
              Department Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-foreground font-sans leading-relaxed">
                {dept.description || 'No description provided.'}
              </p>
            </div>

            <div className="border-t border-gray-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Department Code', value: dept.code, mono: true },
                { label: 'Status', value: dept.is_active ? 'Active' : 'Inactive' },
                { label: 'Created', value: dayjs(dept.created_at).format('D MMM YYYY') },
                { label: 'Last Updated', value: dayjs(dept.updated_at).format('D MMM YYYY, HH:mm') },
                { label: 'Total Heads', value: String(stats?.total_heads ?? '—') },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                    {label}
                  </p>
                  <p className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-sans">
                  Access controlled by tenant RBAC
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function MembersTab({ dept }: { dept: DepartmentDetail }) {
  const head = dept.users?.find(u => u.id === dept.head_of_dept_id);
  const members = dept.users?.filter(u => u.id !== dept.head_of_dept_id) ?? [];
  const total = dept.users?.length ?? 0;

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* Summary row */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <p className="font-sans text-text-sm text-muted-foreground">
          {total} {total === 1 ? 'member' : 'members'} assigned
        </p>
      </motion.div>

      {total === 0 ? (
        <motion.div variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-xl border-2 border-dashed border-gray-200 bg-muted/30">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="font-display font-semibold text-foreground">No members yet</p>
          <p className="font-sans text-text-sm text-muted-foreground max-w-xs">
            Assign users to this department from the Edit dialog.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {/* Head first */}
          {head && <MemberRow user={head} isHead />}
          {/* Everyone else */}
          {members.map(m => <MemberRow key={m.id} user={m} />)}
        </div>
      )}
    </motion.div>
  );
}

function DocumentsTab({
  documents,
  onNavigate,
}: {
  documents: typeof MOCK_DOCUMENTS;
  onNavigate: (id: string) => void;
}) {
  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <p className="font-sans text-text-sm text-muted-foreground">
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </p>
      </motion.div>

      {documents.length === 0 ? (
        <motion.div variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-xl border-2 border-dashed border-gray-200 bg-muted/30">
          <FileText className="h-10 w-10 text-gray-300" />
          <p className="font-display font-semibold text-foreground">No documents yet</p>
          <p className="font-sans text-text-sm text-muted-foreground max-w-xs">
            Documents assigned to this department will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const st = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.active;
            const dtc = DOC_TYPE_COLOR[doc.document_type] ?? 'bg-gray-100 text-gray-600';
            return (
              <motion.div
                key={doc.id}
                variants={itemVariants}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => onNavigate(doc.id)}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 hover:bg-slate-50/60 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dtc}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-ch-primary transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {doc.document_type} · {dayjs(doc.updated_at).fromNow()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`border-0 text-xs font-sans ${st.cls}`}>{st.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function ActivityTab({ activity }: { activity: typeof MOCK_ACTIVITY }) {
  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-0">
      {activity.length === 0 ? (
        <motion.div variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-xl border-2 border-dashed border-gray-200 bg-muted/30">
          <Activity className="h-10 w-10 text-gray-300" />
          <p className="font-display font-semibold text-foreground">No activity yet</p>
        </motion.div>
      ) : (
        activity.map((entry, i) => {
          const cfg = ACTIVITY_CONFIG[entry.type] ?? ACTIVITY_CONFIG.document;
          const isLast = i === activity.length - 1;
          return (
            <motion.div key={i} variants={itemVariants} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                  {cfg.icon}
                </div>
                {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1 mb-1" />}
              </div>
              <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                <p className="text-sm font-medium text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground font-sans">
                  {entry.user} · {dayjs(entry.time).fromNow()}
                </p>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dept, setDept] = useState<DepartmentDetail | null>(null);
  const [stats, setStats] = useState<DeptStats | null>(null);
  const [documents, setDocuments] = useState<typeof MOCK_DOCUMENTS>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const canManage = hasPermission(user, PERMISSIONS['departments.manage']);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);

        if (USE_MOCK) {
          // Patch the mock with the actual URL id so any dept works
          setDept({ ...MOCK_DEPT, id });
          setStats(MOCK_STATS);
          setDocuments(MOCK_DOCUMENTS);
          return;
        }

        // Real API calls — all three run in parallel for speed
        // Endpoints require X-Tenant-ID and Authorization headers
        // (fetchData handles these via your existing auth interceptor)
        const [deptData, statsData, docsData] = await Promise.all([
          fetchData('DEPARTMENT_DETAIL', 'GET', { id }),
          fetchData('DEPARTMENT_STATISTICS', 'GET', { id }),
          fetchData('DEPARTMENT_DOCUMENTS', 'GET', { id }, null, { page: '1', limit: '20' }),
        ]);

        setDept(deptData);
        setStats(statsData);
        setDocuments(Array.isArray(docsData) ? docsData : (docsData?.data ?? []));
      } catch (error) {
        console.error('Failed to load department:', error);
        toast.error('Could not load this department.');
        navigate('/admin/departments');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          {TABS.map(t => <Skeleton key={t.id} className="h-10 w-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!dept) return null;

  const accent = getAccent(dept.code);

  return (
    <div className="w-full space-y-6">

      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 text-sm"
      >
        <Button variant="ghost" size="sm"
          onClick={() => navigate('/admin/departments')}
          className="text-muted-foreground hover:text-foreground h-8 px-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Departments
        </Button>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-foreground">{dept.name}</span>
      </motion.div>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {/* Gradient-ring avatar — matches colour on the list page */}
          <div className={`p-0.5 rounded-2xl bg-gradient-to-br ${accent.ring} flex-shrink-0`}>
            <div className={`h-14 w-14 rounded-2xl ${accent.bg} flex items-center justify-center`}>
              <span className={`font-display font-bold text-lg font-mono ${accent.text}`}>
                {dept.code.slice(0, 2)}
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-display font-bold text-display-sm text-gray-900">{dept.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <code className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${accent.bg} ${accent.text}`}>
                {dept.code}
              </code>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${dept.is_active ? 'bg-success-light text-success-fg' : 'bg-danger-light text-danger-fg'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dept.is_active ? 'bg-positive' : 'bg-risk'}`} />
                {dept.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Button variant="outline" size="sm"
              onClick={() => navigate('/admin/departments', { state: { editId: dept.id } })}
              className="border-gray-200 gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Department
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Tab bar — Frosted Pill pattern per design spec */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="flex bg-slate-50/80 p-1 rounded-xl gap-0.5 w-fit"
      >
        {TABS.map((tab) => {
          // Count badges for members and documents tabs
          const count =
            tab.id === 'members' ? (dept.users?.length ?? 0) :
              tab.id === 'documents' ? documents.length :
                null;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 h-9 px-3 rounded-lg font-sans text-text-sm font-medium outline-none transition-colors duration-150
                ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {/* Animated active pill sliding between tabs */}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="deptDetailActivePill"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
                {/* Count badge — only on members and documents tabs */}
                {count !== null && count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="bg-ch-primary text-white rounded-full text-xs px-1.5 py-0.5 leading-none font-semibold"
                  >
                    {count}
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Tab content — AnimatePresence gives exit animations when switching */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {activeTab === 'overview' && (
            <OverviewTab dept={dept} stats={stats} />
          )}
          {activeTab === 'members' && (
            <MembersTab dept={dept} />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab
              documents={documents}
              onNavigate={(docId) => navigate(`/admin/documents/${docId}`)}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTab activity={MOCK_ACTIVITY} />
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}