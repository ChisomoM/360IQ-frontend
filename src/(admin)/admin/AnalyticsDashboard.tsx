import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  FileText, TrendingUp, Clock, Building2, AlertTriangle,
  Download, RefreshCw, AlertCircle, CheckCircle, XCircle,
  Hourglass,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { PageTransition } from '@/components/PageTransition';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';

// ─── Animation config (matches ManageUsers & Departments) ────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Design system status colors ─────────────────────────────────────────────
// Using semantic token pairs as per Issue #36 design requirements
const STATUS_COLOR = {
  approved: { bar: '#10B981', bg: 'bg-success-light', text: 'text-success-fg' },
  pending: { bar: '#F59E0B', bg: 'bg-warning-light', text: 'text-warning-fg' },
  rejected: { bar: '#EF4444', bg: 'bg-danger-light', text: 'text-danger-fg' },
};

// ─── Mock data (matches shape of real API responses we proposed) ──────────────
// TODO: Replace each mock with real API call once Chisomo confirms endpoints

// GET /analytics/documents/volume
const MOCK_VOLUME = [
  { month: 'Nov', count: 142 },
  { month: 'Dec', count: 118 },
  { month: 'Jan', count: 189 },
  { month: 'Feb', count: 174 },
  { month: 'Mar', count: 203 },
  { month: 'Apr', count: 167 },
];

// GET /analytics/documents/status
const MOCK_STATUS = [
  { month: 'Nov', approved: 98, pending: 28, rejected: 16 },
  { month: 'Dec', approved: 82, pending: 22, rejected: 14 },
  { month: 'Jan', approved: 134, pending: 35, rejected: 20 },
  { month: 'Feb', approved: 121, pending: 32, rejected: 21 },
  { month: 'Mar', approved: 148, pending: 38, rejected: 17 },
  { month: 'Apr', approved: 118, pending: 31, rejected: 18 },
];

// GET /analytics/documents/approval-time
const MOCK_APPROVAL_TIME = [
  { department: 'Registry', avgDays: 4.2 },
  { department: 'Finance', avgDays: 2.8 },
  { department: 'HR', avgDays: 3.5 },
  { department: 'ICT', avgDays: 1.9 },
  { department: 'Procurement', avgDays: 5.1 },
];

// GET /analytics/departments/performance
const MOCK_DEPT_PERFORMANCE = [
  { department: 'Registry', processed: 312, submitted: 348 },
  { department: 'Finance', processed: 284, submitted: 301 },
  { department: 'HR', processed: 198, submitted: 221 },
  { department: 'ICT', processed: 156, submitted: 162 },
  { department: 'Procurement', processed: 143, submitted: 178 },
];

// GET /analytics/workflows/bottlenecks
const MOCK_BOTTLENECKS = [
  { stage: 'Submitted', count: 993 },
  { stage: 'Under Review', count: 847 },
  { stage: 'Approved', count: 703 },
  { stage: 'Signed', count: 612 },
  { stage: 'Completed', count: 541 },
];

// Donut chart: overall status summary
const MOCK_STATUS_SUMMARY = [
  { name: 'Approved', value: 701 },
  { name: 'Pending', value: 186 },
  { name: 'Rejected', value: 106 },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Filters {
  dateRange: string;
  department: string;
  docType: string;
  status: string;
}

// ─── Small reusable components ────────────────────────────────────────────────

// Chart card skeleton
function ChartSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// Stat card skeleton
function StatSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-6 w-14" />
      </div>
    </div>
  );
}

// Stat card
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}
function StatCard({ label, value, sub, icon, iconBg }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
    >
      <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
      <div>
        <p className="font-sans text-text-xs text-muted-foreground">{label}</p>
        <p className="font-display font-bold text-xl text-foreground">{value}</p>
        {sub && <p className="font-sans text-text-xs text-muted-foreground">{sub}</p>}
      </div>
    </motion.div>
  );
}

// Empty state for charts
function ChartEmpty({ message = 'No data for this filter' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] gap-3 text-muted-foreground">
      <AlertCircle className="h-8 w-8 opacity-30" />
      <p className="font-sans text-text-sm">{message}</p>
    </div>
  );
}

// Active filter chip
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-ch-secondary/10 text-ch-secondary border border-ch-secondary/20">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">×</button>
    </span>
  );
}

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs font-sans">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();

  // ── Permission checks ──────────────────────────────────────────────────────
  const canViewAnalytics = hasPermission(user, PERMISSIONS['analytics.read']);
  const canExportAnalytics = hasPermission(user, PERMISSIONS['analytics.export']);
  const canViewDepts = hasPermission(user, PERMISSIONS['departments.read']);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    dateRange: 'last_6_months',
    department: 'all',
    docType: 'all',
    status: 'all',
  });

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  // ── Loading state per section ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  // ── Simulated data fetch (replace with real API calls) ────────────────────
  // When Chisomo confirms endpoints, replace this with:
  // const [volumeData, setVolumeData] = useState([]);
  // useEffect(() => { list('ANALYTICS_VOLUME', {}, { ...filters }).then(setVolumeData) }, [filters]);
  const fetchData = useCallback(async () => {
    setLoading(true);
    // Simulate network delay — remove when real API is connected
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!canExportAnalytics) {
      toast.error('You do not have permission to export analytics');
      return;
    }
    // TODO: call real export endpoint when available
    // GET /analytics/export?format=pdf&...filters
    toast.success('Exporting report... (PDF download will start shortly)');
  };

  const handleRefresh = () => {
    toast.success('Refreshing analytics data...');
    fetchData();
  };

  // ── Active filter chips ────────────────────────────────────────────────────
  const activeFilters = [
    filters.department !== 'all' && { key: 'department', label: `Dept: ${filters.department}` },
    filters.docType !== 'all' && { key: 'docType', label: `Type: ${filters.docType}` },
    filters.status !== 'all' && { key: 'status', label: `Status: ${filters.status}` },
  ].filter(Boolean) as { key: keyof Filters; label: string }[];

  // ── Summary numbers derived from mock data ────────────────────────────────
  const totalDocs = MOCK_VOLUME.reduce((s, d) => s + d.count, 0);
  const totalApproved = MOCK_STATUS_SUMMARY.find(d => d.name === 'Approved')?.value ?? 0;
  const totalPending = MOCK_STATUS_SUMMARY.find(d => d.name === 'Pending')?.value ?? 0;
  const avgApproval = (MOCK_APPROVAL_TIME.reduce((s, d) => s + d.avgDays, 0) / MOCK_APPROVAL_TIME.length).toFixed(1);

  // ── Permission denied ──────────────────────────────────────────────────────
  if (!canViewAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive opacity-60" />
        <h2 className="font-display font-bold text-lg text-foreground">
          You don't have permission to view analytics
        </h2>
        <p className="font-sans text-text-sm text-muted-foreground">
          Contact your administrator to request access.
        </p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-display-sm text-gray-900">
              Analytics
            </h1>
            <p className="font-sans text-text-sm text-muted-foreground mt-1">
              Leadership performance view — document workflows across all departments
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="font-sans text-text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!canExportAnalytics || loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold font-sans text-text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* ── Filters Row ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range */}
          <Select value={filters.dateRange} onValueChange={v => setFilter('dateRange', v)}>
            <SelectTrigger className="w-44 h-9 font-sans text-text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Department — only shown to users with dept read permission */}
          {canViewDepts && (
            <Select value={filters.department} onValueChange={v => setFilter('department', v)}>
              <SelectTrigger className="w-44 h-9 font-sans text-text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="registry">Registry</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="ict">ICT</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Document type */}
          <Select value={filters.docType} onValueChange={v => setFilter('docType', v)}>
            <SelectTrigger className="w-40 h-9 font-sans text-text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="memo">Memo</SelectItem>
              <SelectItem value="report">Report</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filters.status} onValueChange={v => setFilter('status', v)}>
            <SelectTrigger className="w-36 h-9 font-sans text-text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Active filter chips */}
          {activeFilters.map(f => (
            <FilterChip
              key={f.key}
              label={f.label}
              onRemove={() => setFilter(f.key, 'all')}
            />
          ))}
        </div>

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard
              label="Total Documents"
              value={totalDocs.toLocaleString()}
              sub="This period"
              icon={<FileText className="h-5 w-5 text-ch-primary-600" />}
              iconBg="bg-ch-primary/[0.08]"
            />
            <StatCard
              label="Approved"
              value={totalApproved.toLocaleString()}
              sub={`${Math.round((totalApproved / (totalApproved + totalPending + 106)) * 100)}% approval rate`}
              icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-500/[0.08]"
            />
            <StatCard
              label="Pending Review"
              value={totalPending.toLocaleString()}
              sub="Awaiting action"
              icon={<Hourglass className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-500/[0.08]"
            />
            <StatCard
              label="Avg Approval Time"
              value={`${avgApproval} days`}
              sub="Across all departments"
              icon={<Clock className="h-5 w-5 text-ch-secondary-600" />}
              iconBg="bg-ch-secondary/[0.08]"
            />
          </motion.div>
        )}

        {/* ── Row 1: Volume trend + Status breakdown ── */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Chart 1: Documents processed over time (Area chart) */}
          <motion.div variants={cardVariants}>
            {loading ? <ChartSkeleton /> : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-ch-primary-600" />
                    Documents Processed Over Time
                  </CardTitle>
                  <CardDescription className="font-sans text-text-xs text-muted-foreground">
                    Monthly volume of documents entering the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {MOCK_VOLUME.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={MOCK_VOLUME}>
                        <defs>
                          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C69FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#7C69FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Documents"
                          stroke="#7C69FF"
                          strokeWidth={2}
                          fill="url(#volGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Chart 2: Pending vs Approved vs Rejected (Stacked bar) */}
          <motion.div variants={cardVariants}>
            {loading ? <ChartSkeleton /> : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Pending vs Approved vs Rejected
                  </CardTitle>
                  <CardDescription className="font-sans text-text-xs text-muted-foreground">
                    Monthly document status distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {MOCK_STATUS.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={MOCK_STATUS}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <Bar dataKey="approved" name="Approved" stackId="a" fill={STATUS_COLOR.approved.bar} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="pending" name="Pending" stackId="a" fill={STATUS_COLOR.pending.bar} />
                        <Bar dataKey="rejected" name="Rejected" stackId="a" fill={STATUS_COLOR.rejected.bar} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* ── Row 2: Avg approval time + Department performance ── */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Chart 3: Average approval time by dept (Horizontal bar) */}
          <motion.div variants={cardVariants}>
            {loading ? <ChartSkeleton /> : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Average Approval Time by Department
                  </CardTitle>
                  <CardDescription className="font-sans text-text-xs text-muted-foreground">
                    How many days on average to approve a document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {MOCK_APPROVAL_TIME.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={MOCK_APPROVAL_TIME} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                        <XAxis
                          type="number"
                          unit=" days"
                          tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="department"
                          tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                          width={90}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="avgDays"
                          name="Avg Days"
                          fill="#F59E0B"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Chart 4: Department performance — submitted vs processed */}
          <motion.div variants={cardVariants}>
            {loading ? <ChartSkeleton /> : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-ch-secondary-600" />
                    Department Performance
                  </CardTitle>
                  <CardDescription className="font-sans text-text-xs text-muted-foreground">
                    Documents submitted vs processed per department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {MOCK_DEPT_PERFORMANCE.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={MOCK_DEPT_PERFORMANCE}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="department"
                          tick={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans' }}
                        />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                        <Bar dataKey="submitted" name="Submitted" fill="#03D8FD" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="processed" name="Processed" fill="#7C69FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* ── Row 3: Bottlenecks + Overall status donut ── */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Chart 5: Bottlenecks by stage (Funnel-style horizontal bar) */}
          <motion.div variants={cardVariants}>
            {loading ? <ChartSkeleton /> : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Bottlenecks by Stage
                  </CardTitle>
                  <CardDescription className="font-sans text-text-xs text-muted-foreground">
                    Where documents are getting stuck in the workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {MOCK_BOTTLENECKS.length === 0 ? <ChartEmpty /> : (
                    <div className="space-y-3 pt-2">
                      {MOCK_BOTTLENECKS.map((stage, i) => {
                        const pct = Math.round((stage.count / MOCK_BOTTLENECKS[0].count) * 100);
                        const dropOff = i > 0
                          ? MOCK_BOTTLENECKS[i - 1].count - stage.count
                          : 0;
                        return (
                          <div key={stage.stage} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-sans text-text-sm font-medium text-foreground">
                                {stage.stage}
                              </span>
                              <div className="flex items-center gap-3">
                                {dropOff > 0 && (
                                  <span className="font-sans text-text-xs text-destructive font-medium">
                                    ↓ {dropOff} dropped
                                  </span>
                                )}
                                <span className="font-mono text-text-sm font-bold text-foreground">
                                  {stage.count.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="h-7 bg-muted rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-ch-primary-500 to-ch-primary-400 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              >
                                <span className="text-white text-xs font-bold font-sans">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t border-border">
                        <p className="font-sans text-text-xs text-muted-foreground">
                          Overall completion rate:{' '}
                          <span className="font-bold text-emerald-600">
                            {Math.round((MOCK_BOTTLENECKS[MOCK_BOTTLENECKS.length - 1].count / MOCK_BOTTLENECKS[0].count) * 100)}%
                          </span>
                          {' '}({MOCK_BOTTLENECKS[MOCK_BOTTLENECKS.length - 1].count} completed of {MOCK_BOTTLENECKS[0].count} submitted)
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Chart 6: Overall status donut + ranked table */}
          <motion.div variants={cardVariants}>
            {loading ? <ChartSkeleton /> : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-ch-primary-600" />
                    Overall Status Summary
                  </CardTitle>
                  <CardDescription className="font-sans text-text-xs text-muted-foreground">
                    Total document outcomes across the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {/* Donut chart */}
                    <div className="flex-shrink-0">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={MOCK_STATUS_SUMMARY}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            <Cell fill={STATUS_COLOR.approved.bar} />
                            <Cell fill={STATUS_COLOR.pending.bar} />
                            <Cell fill={STATUS_COLOR.rejected.bar} />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend + values */}
                    <div className="flex-1 space-y-3">
                      {MOCK_STATUS_SUMMARY.map((s) => {
                        const total = MOCK_STATUS_SUMMARY.reduce((acc, d) => acc + d.value, 0);
                        const pct = Math.round((s.value / total) * 100);
                        const color = STATUS_COLOR[s.name.toLowerCase() as keyof typeof STATUS_COLOR];
                        return (
                          <div key={s.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.bar }} />
                              <span className="font-sans text-text-sm text-foreground">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-text-sm font-bold text-foreground">
                                {s.value.toLocaleString()}
                              </span>
                              <Badge className={`${color.bg} ${color.text} border-0 text-xs font-sans`}>
                                {pct}%
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t border-border">
                        <p className="font-sans text-text-xs text-muted-foreground">
                          Total:{' '}
                          <span className="font-bold text-foreground">
                            {MOCK_STATUS_SUMMARY.reduce((a, d) => a + d.value, 0).toLocaleString()}
                          </span>{' '}
                          documents
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* ── Department Performance Ranked Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          {loading ? <ChartSkeleton /> : (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-ch-primary-600" />
                  Department Leaderboard
                </CardTitle>
                <CardDescription className="font-sans text-text-xs text-muted-foreground">
                  Ranked by processing efficiency — documents processed vs submitted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {MOCK_DEPT_PERFORMANCE.length === 0 ? <ChartEmpty message="No department data available" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      {/* Table header */}
                      <thead>
                        <tr className="border-b border-border">
                          {['Rank', 'Department', 'Submitted', 'Processed', 'Efficiency', 'Status'].map(h => (
                            <th
                              key={h}
                              className="pb-3 text-left font-sans font-medium text-text-sm text-gray-700 first:w-12"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...MOCK_DEPT_PERFORMANCE]
                          .sort((a, b) => (b.processed / b.submitted) - (a.processed / a.submitted))
                          .map((dept, i) => {
                            const efficiency = Math.round((dept.processed / dept.submitted) * 100);
                            const isHigh = efficiency >= 90;
                            const isMid = efficiency >= 75 && efficiency < 90;
                            return (
                              <tr key={dept.department} className="border-b border-border hover:bg-muted/40 transition-colors">
                                <td className="py-3">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans ${i === 0 ? 'bg-amber-100 text-amber-700' :
                                      i === 1 ? 'bg-gray-100 text-gray-600' :
                                        i === 2 ? 'bg-orange-100 text-orange-600' :
                                          'bg-muted text-muted-foreground'
                                    }`}>
                                    {i + 1}
                                  </div>
                                </td>
                                <td className="py-3 font-sans font-semibold text-foreground">
                                  {dept.department}
                                </td>
                                <td className="py-3 font-mono text-text-sm text-muted-foreground">
                                  {dept.submitted.toLocaleString()}
                                </td>
                                <td className="py-3 font-mono text-text-sm text-foreground font-semibold">
                                  {dept.processed.toLocaleString()}
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                                      <div
                                        className={`h-full rounded-full ${isHigh ? 'bg-emerald-500' : isMid ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${efficiency}%` }}
                                      />
                                    </div>
                                    <span className="font-mono text-text-sm font-bold text-foreground">
                                      {efficiency}%
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <Badge className={`font-sans text-xs border-0 ${isHigh ? 'bg-success-light text-success-fg' :
                                      isMid ? 'bg-warning-light text-warning-fg' :
                                        'bg-danger-light text-danger-fg'
                                    }`}>
                                    {isHigh ? 'On Track' : isMid ? 'At Risk' : 'Behind'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ── AI Analysis Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          <AIAnalysisPanel />
        </motion.div>

      </div>
    </PageTransition>
  );
};