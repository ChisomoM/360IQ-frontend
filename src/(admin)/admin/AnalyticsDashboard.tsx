// src/(admin)/admin/AnalyticsDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  FileText, Clock, Download, RefreshCw, Lock, CheckCircle, Hourglass, X,
} from '@/components/icons';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { PageTransition } from '@/components/PageTransition';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { KpiTile } from '@/components/shared/KpiTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, BAR_RADIUS_HORIZONTAL, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import type { Tone } from '@/lib/status';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_VOLUME = [
  { month: 'Nov', count: 142 },
  { month: 'Dec', count: 118 },
  { month: 'Jan', count: 189 },
  { month: 'Feb', count: 174 },
  { month: 'Mar', count: 203 },
  { month: 'Apr', count: 167 },
];
const MOCK_STATUS = [
  { month: 'Nov', approved: 98, pending: 28, rejected: 16 },
  { month: 'Dec', approved: 82, pending: 22, rejected: 14 },
  { month: 'Jan', approved: 134, pending: 35, rejected: 20 },
  { month: 'Feb', approved: 121, pending: 32, rejected: 21 },
  { month: 'Mar', approved: 148, pending: 38, rejected: 17 },
  { month: 'Apr', approved: 118, pending: 31, rejected: 18 },
];
const MOCK_APPROVAL_TIME = [
  { department: 'Registry', avgDays: 4.2 },
  { department: 'Finance', avgDays: 2.8 },
  { department: 'HR', avgDays: 3.5 },
  { department: 'ICT', avgDays: 1.9 },
  { department: 'Procurement', avgDays: 5.1 },
];
const MOCK_DEPT_PERFORMANCE = [
  { department: 'Registry', processed: 312, submitted: 348 },
  { department: 'Finance', processed: 284, submitted: 301 },
  { department: 'HR', processed: 198, submitted: 221 },
  { department: 'ICT', processed: 156, submitted: 162 },
  { department: 'Procurement', processed: 143, submitted: 178 },
];
const MOCK_BOTTLENECKS = [
  { stage: 'Submitted', count: 993 },
  { stage: 'Under review', count: 847 },
  { stage: 'Approved', count: 703 },
  { stage: 'Signed', count: 612 },
  { stage: 'Completed', count: 541 },
];
const MOCK_STATUS_SUMMARY = [
  { name: 'Approved', value: 701 },
  { name: 'Pending', value: 186 },
  { name: 'Rejected', value: 106 },
];

const DATE_RANGES = [
  { value: 'last_3_months', label: '3M' },
  { value: 'last_6_months', label: '6M' },
  { value: 'last_year', label: '1Y' },
  { value: 'all_time', label: 'All' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Filters {
  dateRange: string;
  department: string;
  docType: string;
  status: string;
}

// ─── Small reusable components ────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <SectionCard>
      <div role="status" aria-busy="true" aria-label="Loading" className="grid gap-3">
        <div className="skeleton h-4 w-40 rounded-xs" />
        <div className="skeleton h-[280px] w-full rounded-sm" />
      </div>
    </SectionCard>
  );
}

function ChartEmpty({ message = 'No data for this filter' }: { message?: string }) {
  return <EmptyState title={message} description="Change the filters to see more." />;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-field py-1 pl-3 pr-1.5 text-xs font-medium text-text-secondary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="grid h-5 w-5 place-items-center rounded-pill hover:bg-field-hover"
      >
        <X size={12} />
      </button>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();

  const canViewAnalytics = hasPermission(user, PERMISSIONS['analytics.read']);
  const canExportAnalytics = hasPermission(user, PERMISSIONS['analytics.export']);
  const canViewDepts = hasPermission(user, PERMISSIONS['departments.read']);

  const [filters, setFilters] = useState<Filters>({
    dateRange: 'last_6_months',
    department: 'all',
    docType: 'all',
    status: 'all',
  });

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!canExportAnalytics) { toast.error('You do not have permission to export analytics'); return; }
    toast.success('Exporting report. The PDF download starts shortly.');
  };

  const handleRefresh = () => {
    toast.success('Refreshing analytics data');
    fetchData();
  };

  const activeFilters = [
    filters.department !== 'all' && { key: 'department', label: `Department: ${filters.department}` },
    filters.docType !== 'all' && { key: 'docType', label: `Type: ${filters.docType}` },
    filters.status !== 'all' && { key: 'status', label: `Status: ${filters.status}` },
  ].filter(Boolean) as { key: keyof Filters; label: string }[];

  const totalDocs = MOCK_VOLUME.reduce((s, d) => s + d.count, 0);
  const totalApproved = MOCK_STATUS_SUMMARY.find(d => d.name === 'Approved')?.value ?? 0;
  const totalPending = MOCK_STATUS_SUMMARY.find(d => d.name === 'Pending')?.value ?? 0;
  const avgApproval = (MOCK_APPROVAL_TIME.reduce((s, d) => s + d.avgDays, 0) / MOCK_APPROVAL_TIME.length).toFixed(1);
  const statusTotal = MOCK_STATUS_SUMMARY.reduce((acc, d) => acc + d.value, 0);
  const firstStage = MOCK_BOTTLENECKS[0];
  const lastStage = MOCK_BOTTLENECKS[MOCK_BOTTLENECKS.length - 1];

  if (!canViewAnalytics) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <EmptyState
          icon={<Lock size={24} />}
          title="You don't have permission to view analytics"
          description="Ask your administrator for access."
        />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">

        <PageHeader
          title="Analytics"
          description="Leadership view of document workflows across all departments."
          actions={
            <>
              <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : undefined} />
                Refresh
              </Button>
              <Button onClick={handleExport} disabled={!canExportAnalytics || loading}>
                <Download size={16} />
                Export report
              </Button>
            </>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filters.dateRange} onValueChange={(v) => setFilter('dateRange', v)}>
            <TabsList aria-label="Date range">
              {DATE_RANGES.map((opt) => (
                <TabsTrigger key={opt.value} value={opt.value}>{opt.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {canViewDepts && (
            <Select value={filters.department} onValueChange={v => setFilter('department', v)}>
              <SelectTrigger className="w-48" aria-label="Department">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                <SelectItem value="registry">Registry</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="ict">ICT</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={filters.docType} onValueChange={v => setFilter('docType', v)}>
            <SelectTrigger className="w-40" aria-label="Document type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="memo">Memo</SelectItem>
              <SelectItem value="report">Report</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={v => setFilter('status', v)}>
            <SelectTrigger className="w-40" aria-label="Status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters.map(f => (
            <FilterChip key={f.key} label={f.label} onRemove={() => setFilter(f.key, 'all')} />
          ))}
        </div>

        {/* KPI tiles */}
        {loading ? (
          <div role="status" aria-busy="true" aria-label="Loading" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[104px] rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label="Total documents" value={totalDocs.toLocaleString()} hint="This period"
              icon={<FileText size={18} />} />
            <KpiTile label="Approved" value={totalApproved.toLocaleString()}
              hint={`${Math.round((totalApproved / (totalApproved + totalPending + 106)) * 100)}% approval rate`}
              icon={<CheckCircle size={18} />} />
            <KpiTile label="Pending review" value={totalPending.toLocaleString()} hint="Awaiting action"
              icon={<Hourglass size={18} />} />
            <KpiTile label="Average approval time" value={`${avgApproval} days`} hint="Across all departments"
              icon={<Clock size={18} />} />
          </div>
        )}

        {/* Row 1: volume trend and status breakdown */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {loading ? <ChartSkeleton /> : (
            <SectionCard eyebrow="Documents per month" title="Documents processed over time">
              {MOCK_VOLUME.length === 0 ? <ChartEmpty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={MOCK_VOLUME} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="month" />
                    <YAxis {...axisProps} width={48} />
                    <Tooltip {...tooltipProps} cursor={lineCursor} />
                    <Area type="monotone" dataKey="count" name="Documents"
                      stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}

          {loading ? <ChartSkeleton /> : (
            <SectionCard eyebrow="Documents per month" title="Pending, approved and rejected">
              {MOCK_STATUS.length === 0 ? <ChartEmpty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={MOCK_STATUS} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="month" />
                    <YAxis {...axisProps} width={48} />
                    <Tooltip {...tooltipProps} cursor={barCursor} />
                    <Legend {...legendProps} />
                    <Bar dataKey="approved" name="Approved" stackId="a" fill="var(--chart-1)" maxBarSize={MAX_BAR_SIZE} />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--chart-2)" maxBarSize={MAX_BAR_SIZE} />
                    <Bar dataKey="rejected" name="Rejected" stackId="a" fill="var(--chart-3)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}
        </div>

        {/* Row 2: average approval time and department performance */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {loading ? <ChartSkeleton /> : (
            <SectionCard eyebrow="Days" title="Average approval time by department">
              {MOCK_APPROVAL_TIME.length === 0 ? <ChartEmpty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={MOCK_APPROVAL_TIME} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <XAxis {...axisProps} type="number" unit="d" />
                    <YAxis {...axisProps} type="category" dataKey="department" width={96} />
                    <Tooltip {...tooltipProps} cursor={barCursor} />
                    <Bar dataKey="avgDays" name="Average days" fill="var(--chart-1)" radius={BAR_RADIUS_HORIZONTAL} maxBarSize={MAX_BAR_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}

          {loading ? <ChartSkeleton /> : (
            <SectionCard eyebrow="Documents" title="Submitted and processed by department">
              {MOCK_DEPT_PERFORMANCE.length === 0 ? <ChartEmpty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={MOCK_DEPT_PERFORMANCE} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="department" />
                    <YAxis {...axisProps} width={48} />
                    <Tooltip {...tooltipProps} cursor={barCursor} />
                    <Legend {...legendProps} />
                    <Bar dataKey="submitted" name="Submitted" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                    <Bar dataKey="processed" name="Processed" fill="var(--chart-2)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}
        </div>

        {/* Row 3: bottlenecks and overall status */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {loading ? <ChartSkeleton /> : (
            <SectionCard eyebrow="Documents reaching each stage" title="Bottlenecks by stage">
              {MOCK_BOTTLENECKS.length === 0 ? <ChartEmpty /> : (
                <div className="space-y-3">
                  {MOCK_BOTTLENECKS.map((stage, i) => {
                    const pct = Math.round((stage.count / firstStage.count) * 100);
                    const dropOff = i > 0 ? MOCK_BOTTLENECKS[i - 1].count - stage.count : 0;
                    return (
                      <div key={stage.stage} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-text-primary">{stage.stage}</span>
                          <div className="flex items-center gap-3 font-mono text-xs">
                            {dropOff > 0 && <span className="text-risk">{dropOff} dropped</span>}
                            <span className="text-text-primary">{stage.count.toLocaleString()}</span>
                            <span className="w-10 text-right text-text-muted">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
                          <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: 'var(--chart-1)' }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="border-t border-line pt-3 text-xs text-text-muted">
                    Overall completion rate:{' '}
                    <span className="font-semibold text-text-primary">
                      {Math.round((lastStage.count / firstStage.count) * 100)}%
                    </span>
                    {' '}({lastStage.count} completed of {firstStage.count} submitted)
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          {loading ? <ChartSkeleton /> : (
            <SectionCard eyebrow="Documents in the selected period" title="Overall status summary">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={MOCK_STATUS_SUMMARY} cx="50%" cy="50%"
                        innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                        {MOCK_STATUS_SUMMARY.map((s, i) => <Cell key={s.name} fill={seriesColor(i)} />)}
                      </Pie>
                      <Tooltip {...tooltipProps} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-[12rem] flex-1 space-y-3">
                  {MOCK_STATUS_SUMMARY.map((s, i) => {
                    const pct = Math.round((s.value / statusTotal) * 100);
                    return (
                      <div key={s.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: seriesColor(i) }} aria-hidden="true" />
                          <span className="text-sm text-text-primary">{s.name}</span>
                        </div>
                        <span className="font-mono text-xs text-text-secondary">
                          {s.value.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                  <p className="border-t border-line pt-3 text-xs text-text-muted">
                    Total: <span className="font-semibold text-text-primary">{statusTotal.toLocaleString()}</span> documents
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Department leaderboard */}
        {loading ? <ChartSkeleton /> : (
          <SectionCard eyebrow="Ranked by documents processed out of submitted" title="Department leaderboard" padded={false}>
            {MOCK_DEPT_PERFORMANCE.length === 0 ? <ChartEmpty message="No department data available" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                    <TableHead className="text-right">Processed</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...MOCK_DEPT_PERFORMANCE]
                    .sort((a, b) => (b.processed / b.submitted) - (a.processed / a.submitted))
                    .map((dept, i) => {
                      const efficiency = Math.round((dept.processed / dept.submitted) * 100);
                      const status: { tone: Tone; label: string } =
                        efficiency >= 90 ? { tone: 'positive', label: 'On track' }
                          : efficiency >= 75 ? { tone: 'caution', label: 'At risk' }
                            : { tone: 'risk', label: 'Behind' };
                      return (
                        <TableRow key={dept.department}>
                          <TableCell className="font-mono text-xs text-text-muted">{i + 1}</TableCell>
                          <TableCell className="font-semibold">{dept.department}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-text-secondary">{dept.submitted.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-text-secondary">{dept.processed.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
                                <div className="h-full rounded-pill" style={{ width: `${efficiency}%`, background: 'var(--chart-1)' }} />
                              </div>
                              <span className="font-mono text-xs">{efficiency}%</span>
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge tone={status.tone} label={status.label} /></TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        )}

        <AIAnalysisPanel />

      </div>
    </PageTransition>
  );
};
