// src/(admin)/admin/DepartmentDetailPage.tsx
// Department detail page — shows metadata, members, stats, and documents
// for a single department.
// Set USE_MOCK = false once the backend DEPARTMENT_DETAIL endpoint is live.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Building2, Users, Calendar, Edit2, Loader2,
  FileText, CheckCircle, Clock, Crown, Mail, Shield,
  ChevronRight, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import type { DepartmentDetail, DepartmentUser } from '@/types/dms';
import dayjs from 'dayjs';

// ─── Mock Data (remove when backend endpoint is live) ─────────────────────────
// Keyed by department ID so navigating to any dept shows sensible data.
// The fallback entry ('default') is used for IDs not explicitly listed.

const MOCK_DEPARTMENTS: Record<string, DepartmentDetail> = {
  'dept-001': {
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
    ],
  },
  'dept-002': {
    id: 'dept-002',
    name: 'Finance',
    code: 'FIN',
    description: 'Manages university finances, student fees, staff payroll, and budget allocations.',
    is_active: true,
    head_of_dept_id: 'u-010',
    created_at: dayjs().subtract(2, 'year').toISOString(),
    updated_at: dayjs().subtract(1, 'week').toISOString(),
    users: [
      { id: 'u-010', first_name: 'Bongani', last_name: 'Ncube', email: 'bongani.ncube@unilus.ac.zm', role: 'Finance Director' },
      { id: 'u-011', first_name: 'Priya', last_name: 'Naidoo', email: 'priya.naidoo@unilus.ac.zm', role: 'Accountant' },
      { id: 'u-012', first_name: 'James', last_name: 'Mwale', email: 'james.mwale@unilus.ac.zm', role: 'Budget Analyst' },
    ],
  },
  'dept-003': {
    id: 'dept-003',
    name: 'Human Resources',
    code: 'HR',
    description: 'Handles staff recruitment, employment contracts, leave management, and welfare.',
    is_active: true,
    head_of_dept_id: 'u-020',
    created_at: dayjs().subtract(18, 'month').toISOString(),
    updated_at: dayjs().subtract(2, 'day').toISOString(),
    users: [
      { id: 'u-020', first_name: 'Grace', last_name: 'Zimba', email: 'grace.zimba@unilus.ac.zm', role: 'HR Director' },
      { id: 'u-021', first_name: 'Samuel', last_name: 'Lungu', email: 'samuel.lungu@unilus.ac.zm', role: 'HR Officer' },
    ],
  },
};

// Fallback used for any ID not in the map above (e.g. dept-004 through dept-008)
const MOCK_FALLBACK: DepartmentDetail = {
  id: 'dept-000',
  name: 'Department',
  code: 'DEPT',
  description: 'A university department.',
  is_active: true,
  head_of_dept_id: 'u-099',
  created_at: dayjs().subtract(1, 'year').toISOString(),
  updated_at: dayjs().subtract(1, 'week').toISOString(),
  users: [
    { id: 'u-099', first_name: 'Alex', last_name: 'Mbewe', email: 'alex.mbewe@unilus.ac.zm', role: 'Department Head' },
    { id: 'u-100', first_name: 'Rita', last_name: 'Banda', email: 'rita.banda@unilus.ac.zm', role: 'Officer' },
  ],
};

// Mock documents belonging to a department
const MOCK_DOCUMENTS = [
  { id: 'doc-001', title: 'Student Enrollment Policy 2024', document_type: 'policy', status: 'approved', updated_at: dayjs().subtract(2, 'day').toISOString() },
  { id: 'doc-002', title: 'Q1 Departmental Report', document_type: 'report', status: 'pending', updated_at: dayjs().subtract(5, 'day').toISOString() },
  { id: 'doc-003', title: 'Staff Meeting Minutes – March', document_type: 'minutes', status: 'active', updated_at: dayjs().subtract(1, 'week').toISOString() },
  { id: 'doc-004', title: 'Leave Application Form', document_type: 'form', status: 'active', updated_at: dayjs().subtract(2, 'week').toISOString() },
  { id: 'doc-005', title: 'Budget Allocation Memo – April', document_type: 'memo', status: 'approved', updated_at: dayjs().subtract(3, 'week').toISOString() },
];

// Flip to false once DEPARTMENT_DETAIL endpoint is confirmed working
const USE_MOCK = true;

// ─── Animation variants ────────────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Consistent accent colour per dept code initial — same logic as Departments page
const accentColors = [
  { ring: 'from-ch-primary-500 to-ch-primary-600', bg: 'bg-ch-primary-50', text: 'text-ch-primary-700', iconBg: 'bg-ch-primary/[0.08]', icon: 'text-ch-primary-600' },
  { ring: 'from-ch-secondary-500 to-ch-secondary-600', bg: 'bg-ch-secondary-50', text: 'text-ch-secondary-700', iconBg: 'bg-ch-secondary/[0.08]', icon: 'text-ch-secondary-600' },
  { ring: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-500/[0.08]', icon: 'text-emerald-600' },
  { ring: 'from-amber-400 to-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-500/[0.08]', icon: 'text-amber-600' },
];

function getAccent(code: string) {
  return accentColors[code.charCodeAt(0) % accentColors.length];
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const statusConfig: Record<string, { cls: string; label: string }> = {
  active: { cls: 'bg-success-light text-success-fg', label: 'Active' },
  approved: { cls: 'bg-blue-50 text-blue-700', label: 'Approved' },
  pending: { cls: 'bg-warning-light text-warning-fg', label: 'Pending' },
  rejected: { cls: 'bg-danger-light text-danger-fg', label: 'Rejected' },
  archived: { cls: 'bg-gray-100 text-gray-500', label: 'Archived' },
};

const docTypeColor: Record<string, string> = {
  policy: 'bg-indigo-50 text-indigo-700',
  minutes: 'bg-teal-50 text-teal-700',
  report: 'bg-orange-50 text-orange-700',
  form: 'bg-pink-50 text-pink-700',
  memo: 'bg-cyan-50 text-cyan-700',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberRow({ user, isHead = false }: { user: DepartmentUser; isHead?: boolean }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isHead ? 'bg-ch-primary/[0.04] border-ch-primary/20' : 'bg-card border-gray-200 hover:bg-slate-50/60'
        }`}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className={`text-xs font-semibold ${isHead ? 'bg-ch-primary/10 text-ch-primary' : 'bg-muted text-muted-foreground'}`}>
          {initials(user.first_name, user.last_name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {user.first_name} {user.last_name}
          </p>
          {/* Crown badge for dept head */}
          {isHead && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Crown className="h-3 w-3" />
              Head
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {user.role && (
        <span className="text-xs text-muted-foreground font-sans flex-shrink-0">{user.role}</span>
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
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission(user, PERMISSIONS['departments.manage']);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);

        if (USE_MOCK) {
          // Return the matching mock entry, or patch the fallback with the correct ID
          const found = MOCK_DEPARTMENTS[id];
          setDept(found ?? { ...MOCK_FALLBACK, id });
          return;
        }

        const data = await fetchData('DEPARTMENT_DETAIL', 'GET', { id });
        setDept(data);
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
        {/* Skeleton header */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dept) return null;

  const accent = getAccent(dept.code);
  const head = dept.users?.find(u => u.id === dept.head_of_dept_id);
  const members = dept.users?.filter(u => u.id !== dept.head_of_dept_id) ?? [];
  const totalMembers = dept.users?.length ?? 0;

  return (
    <div className="w-full space-y-6">

      {/* Breadcrumb nav */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 text-sm"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/departments')}
          className="text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Departments
        </Button>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-foreground">{dept.name}</span>
      </motion.div>

      {/* Page header — avatar + name + actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {/* Gradient-ring avatar matching the card on the list page */}
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
                <div className={`w-1.5 h-1.5 rounded-full ${dept.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                {dept.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit — navigates back to list with editId state so the modal opens */}
        {canManage && (
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/departments', { state: { editId: dept.id } })}
              className="border-gray-200 gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Department
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Total Members',
            value: totalMembers,
            icon: <Users className="h-5 w-5" />,
            iconBg: accent.iconBg,
            iconColor: accent.icon,
          },
          {
            label: 'Department Head',
            value: head ? `${head.first_name} ${head.last_name}` : 'Unassigned',
            icon: <Crown className="h-5 w-5" />,
            iconBg: 'bg-amber-500/[0.08]',
            iconColor: 'text-amber-600',
          },
          {
            label: 'Total Documents',
            value: MOCK_DOCUMENTS.length,
            icon: <FileText className="h-5 w-5" />,
            iconBg: 'bg-ch-secondary/[0.08]',
            iconColor: 'text-ch-secondary-600',
          },
          {
            label: 'Last Updated',
            value: dayjs(dept.updated_at).fromNow(),
            icon: <Clock className="h-5 w-5" />,
            iconBg: 'bg-muted',
            iconColor: 'text-muted-foreground',
          },
        ].map(({ label, value, icon, iconBg, iconColor }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="bg-card rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-lg ${iconBg} flex-shrink-0`}>
              <span className={iconColor}>{icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-sans text-text-xs text-muted-foreground">{label}</p>
              <p className="font-display font-bold text-lg text-foreground truncate">{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column layout below stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Left: Documents + Activity ── */}
        <div className="space-y-6">

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Documents
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-ch-primary/10 text-ch-primary text-xs font-semibold">
                    {MOCK_DOCUMENTS.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_DOCUMENTS.map((doc) => {
                  const st = statusConfig[doc.status] ?? statusConfig.active;
                  const dtc = docTypeColor[doc.document_type] ?? 'bg-gray-100 text-gray-600';
                  return (
                    <motion.div
                      key={doc.id}
                      whileHover={{ x: 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      onClick={() => navigate(`/admin/documents/${doc.id}`)}
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
                            {dayjs(doc.updated_at).fromNow()}
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity / recent changes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Simple timeline of mock activity */}
                <div className="space-y-0">
                  {[
                    { action: 'Document approved', user: 'Tendai Moyo', time: '2 hours ago', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle className="h-3 w-3" /> },
                    { action: 'New member added', user: 'Kemi Dlamini', time: '1 day ago', color: 'bg-blue-50 text-blue-600', icon: <Users className="h-3 w-3" /> },
                    { action: 'Department details updated', user: 'Tendai Moyo', time: '3 days ago', color: 'bg-ch-primary/10 text-ch-primary', icon: <Edit2 className="h-3 w-3" /> },
                    { action: 'Document submitted', user: 'Amara Banda', time: '1 week ago', color: 'bg-amber-50 text-amber-600', icon: <FileText className="h-3 w-3" /> },
                  ].map((entry, i, arr) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${entry.color}`}>
                          {entry.icon}
                        </div>
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1 mb-1" />}
                      </div>
                      <div className={`flex-1 ${i < arr.length - 1 ? 'pb-4' : ''}`}>
                        <p className="text-sm font-medium text-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground font-sans">
                          {entry.user} · {entry.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Right: Metadata + Members ── */}
        <div className="space-y-4">

          {/* Metadata card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-foreground font-sans leading-relaxed">
                    {dept.description || '—'}
                  </p>
                </div>

                <div className="border-t border-gray-100" />

                {/* Created / Updated */}
                {[
                  { label: 'Created', value: dayjs(dept.created_at).format('D MMM YYYY') },
                  { label: 'Last Updated', value: dayjs(dept.updated_at).format('D MMM YYYY, HH:mm') },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    <span className="text-xs font-mono text-foreground">{value}</span>
                  </div>
                ))}

                {/* Permissions indicator */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-sans">
                      {canManage ? 'You can manage this department' : 'View-only access'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Members card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Members
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                    {totalMembers}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalMembers === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <Users className="h-8 w-8 text-gray-200" />
                    <p className="text-sm text-muted-foreground font-sans">No members assigned yet.</p>
                  </div>
                ) : (
                  <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-2">
                    {/* Head always first */}
                    {head && <MemberRow user={head} isHead />}
                    {/* Other members */}
                    {members.map(m => <MemberRow key={m.id} user={m} />)}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}