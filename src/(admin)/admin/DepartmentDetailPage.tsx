// src/(admin)/admin/DepartmentDetailPage.tsx
// Department detail page: tabbed layout with Overview, Members, Documents, Activity.
// USE_MOCK = true while backend endpoints are being confirmed.
// Flip to false once DEPARTMENT_STATISTICS, DEPARTMENT_USERS, and
// DEPARTMENT_DOCUMENTS are live on the new base URL (port 8094).

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiTile } from '@/components/shared/KpiTile';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  ArrowLeft, Users, Edit2,
  FileText, Clock, Crown, Shield,
  Activity, LayoutDashboard,
  CheckCircle, AlertCircle, TrendingUp,
} from '@/components/icons';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import { formatDate, formatDateTime } from '@/lib/format';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const ACTIVITY_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  approve: { color: 'bg-positive-tint text-positive', icon: <CheckCircle size={14} /> },
  reject: { color: 'bg-risk-tint text-risk', icon: <AlertCircle size={14} /> },
  document: { color: 'bg-field text-text-secondary', icon: <FileText size={14} /> },
  edit: { color: 'bg-field text-text-secondary', icon: <Edit2 size={14} /> },
  member: { color: 'bg-field text-text-secondary', icon: <Users size={14} /> },
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'members', label: 'Members', icon: <Users size={16} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
  { id: 'activity', label: 'Activity', icon: <Activity size={16} /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberRow({ user, isHead = false }: { user: DepartmentUser; isHead?: boolean }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-field text-xs font-semibold text-text-secondary">
              {initials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-text-primary">
            {user.first_name} {user.last_name}
          </span>
          {isHead && (
            <span className="inline-flex items-center gap-1 h-[1.572rem] px-2 rounded-pill bg-signal-tint text-xs font-semibold text-signal-text">
              <Crown size={14} />
              Head
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-text-secondary">{user.email}</TableCell>
      <TableCell className="text-text-secondary">{user.role}</TableCell>
    </TableRow>
  );
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function OverviewTab({ dept, stats }: { dept: DepartmentDetail; stats: DeptStats | null }) {
  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiTile label="Members" value={stats?.total_members ?? 'N/A'} icon={<Users size={18} />} />
        <KpiTile label="Documents" value={stats?.total_documents ?? 'N/A'} icon={<FileText size={18} />} />
        <KpiTile label="Pending approval" value={stats?.documents_pending_approval ?? 'N/A'} icon={<Clock size={18} />} />
        <KpiTile
          label="Last activity"
          value={stats?.last_activity_at ? dayjs(stats.last_activity_at).fromNow() : 'N/A'}
          hint={stats?.last_activity_at ? formatDateTime(stats.last_activity_at) : undefined}
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Department details card */}
      <SectionCard title="Department details">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-1">Description</p>
            <p className="text-sm text-text-primary leading-relaxed max-w-[75ch]">
              {dept.description || 'No description yet.'}
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-4">
            {[
              { label: 'Department code', value: dept.code, mono: true },
              { label: 'Status', value: <StatusBadge status={dept.is_active ? 'active' : 'inactive'} /> },
              { label: 'Created', value: formatDate(dept.created_at), mono: true },
              { label: 'Last updated', value: formatDateTime(dept.updated_at), mono: true },
              { label: 'Department heads', value: String(stats?.total_heads ?? 'N/A') },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <dt className="text-xs text-text-muted mb-1">{label}</dt>
                <dd className={`text-sm font-medium text-text-primary ${mono ? 'font-mono' : ''}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center gap-2 border-t border-line pt-3 text-text-muted">
            <Shield size={16} />
            <span className="text-xs">Access is set by your organisation's roles.</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function MembersTab({ dept }: { dept: DepartmentDetail }) {
  const head = dept.users?.find(u => u.id === dept.head_of_dept_id);
  const members = dept.users?.filter(u => u.id !== dept.head_of_dept_id) ?? [];
  const total = dept.users?.length ?? 0;

  return (
    <SectionCard
      title={`${total} ${total === 1 ? 'member' : 'members'}`}
      padded={false}
    >
      {total === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No members yet"
          description="Add people to this department from Edit department."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col">Email</TableHead>
              <TableHead scope="col">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Head first */}
            {head && <MemberRow user={head} isHead />}
            {/* Everyone else */}
            {members.map(m => <MemberRow key={m.id} user={m} />)}
          </TableBody>
        </Table>
      )}
    </SectionCard>
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
    <SectionCard
      title={`${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`}
      padded={false}
    >
      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No documents yet"
          description="Documents assigned to this department appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Title</TableHead>
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col">Updated</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="cursor-pointer" onClick={() => onNavigate(doc.id)}>
                <TableCell>
                  <button
                    type="button"
                    className="text-left font-semibold text-text-primary hover:text-signal-text"
                    onClick={(e) => { e.stopPropagation(); onNavigate(doc.id); }}
                  >
                    {doc.title}
                  </button>
                </TableCell>
                <TableCell className="text-text-secondary first-letter:uppercase">{doc.document_type}</TableCell>
                <TableCell className="font-mono text-xs text-text-secondary" title={dayjs(doc.updated_at).fromNow()}>
                  {formatDate(doc.updated_at)}
                </TableCell>
                <TableCell><StatusBadge status={doc.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}

function ActivityTab({ activity }: { activity: typeof MOCK_ACTIVITY }) {
  return (
    <SectionCard title="Recent activity" padded={activity.length > 0}>
      {activity.length === 0 ? (
        <EmptyState
          icon={<Activity size={24} />}
          title="No activity yet"
          description="Changes to this department appear here."
        />
      ) : (
        <ol>
          {activity.map((entry, i) => {
            const cfg = ACTIVITY_CONFIG[entry.type] ?? ACTIVITY_CONFIG.document;
            const isLast = i === activity.length - 1;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-pill flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-line mt-1 mb-1" />}
                </div>
                <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                  <p className="text-sm font-medium text-text-primary">{entry.action}</p>
                  <p className="text-xs text-text-muted">
                    {entry.user} · <time className="font-mono" dateTime={entry.time} title={dayjs(entry.time).fromNow()}>{formatDateTime(entry.time)}</time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
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

        // Real API calls: all three run in parallel for speed
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
      <div role="status" aria-busy="true" aria-label="Loading" className="w-full flex flex-col gap-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!dept) return null;

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        crumb={
          <button
            type="button"
            onClick={() => navigate('/admin/departments')}
            className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Departments / {dept.name}
          </button>
        }
        title={dept.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <code className="text-xs px-2 py-0.5 rounded-pill font-mono bg-field text-text-secondary">
              {dept.code}
            </code>
            <StatusBadge status={dept.is_active ? 'active' : 'inactive'} />
          </span>
        }
        actions={canManage && (
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/departments', { state: { editId: dept.id } })}
          >
            <Edit2 />
            Edit department
          </Button>
        )}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
        <TabsList>
          {TABS.map((tab) => {
            // Count badges for members and documents tabs
            const count =
              tab.id === 'members' ? (dept.users?.length ?? 0) :
                tab.id === 'documents' ? documents.length :
                  null;

            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                {tab.icon}
                {tab.label}
                {count !== null && count > 0 && (
                  <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs text-text-secondary">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab dept={dept} stats={stats} />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab dept={dept} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab
            documents={documents}
            onNavigate={(docId) => navigate(`/admin/documents/${docId}`)}
          />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab activity={MOCK_ACTIVITY} />
        </TabsContent>
      </Tabs>

    </div>
  );
}
