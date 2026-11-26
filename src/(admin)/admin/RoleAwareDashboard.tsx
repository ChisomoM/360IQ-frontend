import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, FileSignature, Upload } from '@/components/icons';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { KpiTile } from '@/components/shared/KpiTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { formatDate } from '@/lib/format';

export type RoleLevel = 'SuperAdmin' | 'TenantAdmin' | 'Manager' | 'User';
export type Department = 'Finance' | 'Registry' | 'HR' | 'None';

export default function RoleAwareDashboard() {
  const [role, setRole] = useState<RoleLevel>('SuperAdmin');
  const [department, setDepartment] = useState<Department>('Finance');

  // Hardcoded mock user
  const user = { firstName: 'Alex' };
  const currentDate = `${new Date().toLocaleDateString('en-GB', { weekday: 'long' })} ${formatDate(new Date())}`;

  // -----------------------------------------------------
  // Subtitles base on role
  // -----------------------------------------------------
  const subtitleMap: Record<RoleLevel, string> = {
    SuperAdmin: "System is operating normally. 12 tenants active.",
    TenantAdmin: "Tenant overview: 4 pending approvals need review.",
    Manager: "You have 3 documents awaiting your signature and 2 approvals pending.",
    User: "You have 1 document awaiting your signature."
  };

  // -----------------------------------------------------
  // Metric Data calculations based on role
  // -----------------------------------------------------
  // SuperAdmin/TenantAdmin sees all 3, Manager sees Approvals and Signatures, User sees Signatures
  const showTotalDocs = role === 'SuperAdmin' || role === 'TenantAdmin';
  const showApprovals = role === 'SuperAdmin' || role === 'TenantAdmin' || role === 'Manager';
  const showSignatures = true; // All roles with signing rights

  // -----------------------------------------------------
  // Render Chart Configurations
  // -----------------------------------------------------
  const renderCharts = () => {
    switch (department) {
      case 'Finance':
        return (
          <>
            <ChartCard title="Invoice volume by month" desc="Invoices processed">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{ name: 'Jan', val: 40 }, { name: 'Feb', val: 30 }, { name: 'Mar', val: 20 }, { name: 'Apr', val: 27 }, { name: 'May', val: 18 }, { name: 'Jun', val: 23 }]}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...axisProps} dataKey="name" />
                  <YAxis {...axisProps} />
                  <RechartsTooltip {...tooltipProps} cursor={barCursor} />
                  <Bar dataKey="val" name="Invoices" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChartCard title="Invoice status" desc="Pending, approved and paid invoices">
                <StatusPie data={[{ name: 'Pending', value: 400 }, { name: 'Approved', value: 300 }, { name: 'Paid', value: 300 }]} />
              </ChartCard>
              <ChartCard title="Value trend, last 6 months" desc="Total invoice value ($)">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[{ month: 'Jan', val: 4000 }, { month: 'Feb', val: 3000 }, { month: 'Mar', val: 2000 }, { month: 'Apr', val: 2780 }, { month: 'May', val: 1890 }, { month: 'Jun', val: 2390 }]}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="month" />
                    <YAxis {...axisProps} />
                    <RechartsTooltip {...tooltipProps} cursor={lineCursor} />
                    <Line type="monotone" dataKey="val" name="Value ($)" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        );
      case 'Registry':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ChartCard title="Documents by status" desc="Documents in each state">
              <StatusPie data={[{ name: 'Pending', value: 45 }, { name: 'Signed', value: 300 }, { name: 'Rejected', value: 20 }]} />
            </ChartCard>
            <ChartCard title="Submission trend" desc="Submissions, past 30 days">
              <TrendLine xKey="day" name="Submissions" data={[{ day: '1', val: 10 }, { day: '10', val: 15 }, { day: '20', val: 8 }, { day: '30', val: 22 }]} />
            </ChartCard>
          </div>
        );
      case 'HR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ChartCard title="Contract status" desc="Contracts per quarter">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: 'Q1', Active: 400, Expiring: 240, Expired: 24 }, { name: 'Q2', Active: 300, Expiring: 139, Expired: 22 }]} layout="vertical">
                  <XAxis {...axisProps} type="number" />
                  <YAxis {...axisProps} dataKey="name" type="category" />
                  <RechartsTooltip {...tooltipProps} cursor={barCursor} />
                  <Legend {...legendProps} />
                  <Bar dataKey="Active" stackId="a" fill="var(--chart-1)" maxBarSize={MAX_BAR_SIZE} />
                  <Bar dataKey="Expiring" stackId="a" fill="var(--chart-2)" maxBarSize={MAX_BAR_SIZE} />
                  <Bar dataKey="Expired" stackId="a" fill="var(--chart-3)" radius={[0, 4, 4, 0]} maxBarSize={MAX_BAR_SIZE} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Signature turnaround" desc="Average days per week">
              <TrendLine xKey="week" name="Days" data={[{ week: 'W1', val: 4 }, { week: 'W2', val: 3.5 }, { week: 'W3', val: 2 }, { week: 'W4', val: 2.5 }]} />
            </ChartCard>
          </div>
        );
      case 'None':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ChartCard title="Document status" desc="Pending and completed documents">
              <StatusPie data={[{ name: 'Pending', value: 40 }, { name: 'Completed', value: 300 }]} />
            </ChartCard>
            <ChartCard title="Activity, last 30 days" desc="Document actions">
              <TrendLine type="step" xKey="day" name="Actions" data={[{ day: '1', val: 5 }, { day: '10', val: 25 }, { day: '20', val: 12 }, { day: '30', val: 18 }]} />
            </ChartCard>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <PageHeader
        crumb={currentDate}
        title="Dashboard"
        description={`Welcome back, ${user.firstName}. ${subtitleMap[role]}`}
        actions={
          <>
            {/* Preview controls, to test different roles */}
            <span className="text-xs text-text-muted">Preview as</span>
            <Select value={role} onValueChange={(v) => setRole(v as RoleLevel)}>
              <SelectTrigger className="w-44" aria-label="Preview role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SuperAdmin">Super admin</SelectItem>
                <SelectItem value="TenantAdmin">Tenant admin</SelectItem>
                <SelectItem value="Manager">Manager or HOD</SelectItem>
                <SelectItem value="User">Regular user</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
              <SelectTrigger className="w-40" aria-label="Preview department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Registry">Registry</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="None">No department</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Zone 1: Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {showTotalDocs && (
          <KpiTile label="Total documents" value="1,248" hint="+12 change" icon={<FileText size={18} />} />
        )}
        {showApprovals && (
          <KpiTile label="Pending approvals" value="4" hint="-2 change" icon={<CheckCircle size={18} />} />
        )}
        {showSignatures && (
          <KpiTile label="Pending signatures" value="3" icon={<FileSignature size={18} />} />
        )}
      </div>

      {/* Zones 2 & 3: Main content grid */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[2fr_1fr]">

        {/* Zone 2: Left column (charts) */}
        <div className="flex min-w-0 flex-col gap-5">
          <h2 className="text-base font-semibold text-text-primary">
            {department !== 'None' ? `${department} analytics` : 'Organisation overview'}
          </h2>
          {role === 'SuperAdmin' || role === 'TenantAdmin' ? (
            <>
              <CustomFunnelChart />
              <CustomRankingChart />
            </>
          ) : null}
          {renderCharts()}
        </div>

        {/* Zone 3: Right column (activity panel) */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Documents needing attention */}
          <SectionCard title="Requires attention">
            <ul className="divide-y divide-line">
              <AttentionItem doc="Q3 Partnership Agreement" action="Sign" label="Overdue" />
              <AttentionItem doc="Invoice #8841-A" action="Approve" />
              <AttentionItem doc="Employee Contract, Sarah M." action="Review" />
            </ul>
          </SectionCard>

          {/* Recent requests */}
          <SectionCard title="Recent requests">
            <ul className="divide-y divide-line">
              <RequestItem doc="Vendor API License" status="pending" time="2 hours ago" />
              <RequestItem doc="Leave Application (August)" status="approved" time="1 day ago" />
              <RequestItem doc="Hardware Procurement" status="rejected" time="3 days ago" />
            </ul>
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            title="Alerts"
            actions={
              <Button asChild variant="ghost" size="sm">
                <a href="#">View all</a>
              </Button>
            }
          >
            <ul className="divide-y divide-line">
              <NotificationItem msg="John Doe requested signature on ND-330" time="10 min ago" unread />
              <NotificationItem msg="Your document 'Expense Q2' was approved" time="2 hr ago" />
              <NotificationItem msg="System maintenance scheduled for Friday" time="1 day ago" />
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* Zone 4: Bottom documents section */}
      <SectionCard
        eyebrow="Latest files in your workflow"
        title="Recent documents"
        actions={<Button variant="ghost" size="sm">Show all documents</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocumentCard title="Q3 Marketing Strategy" type="Word" status="in_progress" author="Alex" />
          <button
            type="button"
            className="flex h-full min-h-[140px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface-1 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2"
          >
            <Upload size={24} className="text-text-secondary" />
            Upload document
          </button>
          <DocumentCard title="2026 Budget Draft" type="PDF" status="pending_approval" author="Sarah M." />
        </div>
      </SectionCard>
    </div>
  );
}

// -----------------------------------------------------
// Helper Components
// -----------------------------------------------------

function ChartCard({ title, desc, children }: { title: string, desc: string, children: React.ReactNode }) {
  return (
    <SectionCard eyebrow={desc} title={title}>
      {children}
    </SectionCard>
  );
}

function StatusPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
          {data.map((slice, i) => <Cell key={slice.name} fill={seriesColor(i)} />)}
        </Pie>
        <RechartsTooltip {...tooltipProps} />
        <Legend {...legendProps} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TrendLine({ data, xKey, name, type = 'monotone' }: {
  data: Record<string, string | number>[];
  xKey: string;
  name: string;
  type?: 'monotone' | 'step';
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid {...gridProps} />
        <XAxis {...axisProps} dataKey={xKey} />
        <YAxis {...axisProps} width={36} />
        <RechartsTooltip {...tooltipProps} cursor={lineCursor} />
        <Line type={type} dataKey="val" name={name} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AttentionItem({ doc, action, label }: { doc: string, action: string, label?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{doc}</p>
          {label && <StatusBadge tone="risk" label={label} />}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">Waiting for you to {action.toLowerCase()}</p>
      </div>
      <Button size="sm" variant="secondary">{action}</Button>
    </li>
  );
}

function RequestItem({ doc, status, time }: { doc: string, status: string, time: string }) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{doc}</p>
        <p className="mt-0.5 text-xs text-text-muted">{time}</p>
      </div>
      <StatusBadge status={status} />
    </li>
  );
}

function NotificationItem({ msg, time, unread }: { msg: string, time: string, unread?: boolean }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${unread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{msg}</p>
        <span className="mt-0.5 block text-xs text-text-muted">{time}</span>
      </div>
      {unread && <StatusBadge tone="neutral" label="Unread" />}
    </li>
  );
}

function DocumentCard({ title, type, status, author }: { title: string, type: string, status: string, author: string }) {
  return (
    <article className="flex h-full min-w-0 flex-col gap-4 rounded-lg border border-line p-4">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-sm bg-field text-text-secondary">
          <FileText size={20} />
        </span>
        <span className="rounded-pill bg-field px-2.5 py-0.5 text-xs text-text-secondary">{type}</span>
      </div>
      <div>
        <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-xs text-text-muted">Edited by {author}</p>
      </div>
      <div className="mt-auto border-t border-line pt-3">
        <StatusBadge status={status} />
      </div>
    </article>
  );
}

// Funnel chart
function CustomFunnelChart() {
  return (
    <SectionCard eyebrow="Stage progression and drop-off" title="Document workflow funnel">
      <div className="space-y-4">
        <FunnelStage label="Submitted" count="1,248" percentage="100.0%" width="100%" />
        <FunnelStage label="Under review" count="1,032" percentage="82.6%" width="82.6%" drop="216" />
        <FunnelStage label="Approved" count="890" percentage="71.3%" width="71.3%" drop="142" />
        <FunnelStage label="Signed and completed" count="750" percentage="60.0%" width="60.0%" drop="140" />
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs text-text-muted">
        <span className="font-semibold text-text-primary">Overall completion rate: 60.0%.</span>{' '}
        750 completed out of 1,248 submissions.
      </p>
    </SectionCard>
  );
}

function FunnelStage({ label, count, percentage, width, drop }: { label: string; count: string; percentage: string; width: string; drop?: string; }) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <span className="text-sm text-text-primary">{label}</span>
        <span className="flex gap-3 font-mono text-xs">
          {drop && <span className="text-risk">{drop} dropped</span>}
          <span className="text-text-primary">{count}</span>
          <span className="text-text-muted">{percentage}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
        <div className="h-full rounded-pill" style={{ width, background: 'var(--chart-1)' }} />
      </div>
    </div>
  );
}

// Ranking list
function CustomRankingChart() {
  return (
    <SectionCard eyebrow="Top workflows by submissions" title="Workflow popularity ranking">
      <ol className="divide-y divide-line">
        <RankingItem rank={1} title="Vendor Agreement Form" dept="Procurement" count="350" conv="84.0%" />
        <RankingItem rank={2} title="Employee Leave Request" dept="Human Resources" count="282" conv="92.0%" />
        <RankingItem rank={3} title="Q3 Expense Report" dept="Finance" count="215" conv="78.5%" />
        <RankingItem rank={4} title="IT Asset Requisition" dept="IT Operations" count="190" conv="88.2%" />
        <RankingItem rank={5} title="Client Onboarding Setup" dept="Sales" count="145" conv="65.0%" />
      </ol>
    </SectionCard>
  );
}

function RankingItem({ rank, title, dept, count, conv }: { rank: number; title: string; dept: string; count: string; conv: string; }) {
  return (
    <li className="flex items-center gap-4 py-3">
      <span className="w-6 flex-shrink-0 font-mono text-sm text-text-muted">{rank}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 truncate text-xs text-text-muted">{dept}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm text-text-primary">{count}</p>
        <p className="mt-0.5 text-xs text-text-muted">{conv} converted</p>
      </div>
    </li>
  );
}
