import { useState } from 'react';
import {
  BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis,
  Tooltip, LabelList, LineChart, Line, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { AIInsightsPill } from '@/components/AIInsightsPill';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  axisProps, gridProps, tooltipProps, barCursor, valueLabelStyle,
  BAR_RADIUS, BAR_RADIUS_HORIZONTAL, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import type { Tone } from '@/lib/status';
import { cn } from '@/lib/utils';
import {
  BOSS_THROUGHPUT, BOSS_ORG_VOLUME,
  BOSS_REJECTIONS, BOSS_DEPT_STATUS_GRID,
  BOSS_OVERDUE_LIST, BOSS_COMPLIANCE_ALERTS,
} from './mockData';
import type { AlertSeverity, OrgVolumeRow } from './mockData';

// ── Local constants ───────────────────────────────────────────────────────────
const DEPT_KEYS = ['Finance', 'Legal', 'HR', 'Operations', 'Executive'] as const;
const SLA_DAYS = 5;
type VolRange = '30D' | '60D' | '90D';

// ── Card 1: Department throughput (horizontal bar + SLA reference line) ──────
function DeptThroughputCard() {
  const overSla = BOSS_THROUGHPUT.filter((d) => d.days > SLA_DAYS).length;
  return (
    <SectionCard eyebrow="Average days" title="Throughput by department">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={BOSS_THROUGHPUT}
          layout="vertical"
          margin={{ top: 16, right: 44, bottom: 0, left: 0 }}
          maxBarSize={MAX_BAR_SIZE}
          barSize={12}
        >
          <XAxis type="number" hide domain={[0, 9]} />
          <YAxis {...axisProps} type="category" dataKey="name" width={90} />
          <ReferenceLine
            x={SLA_DAYS}
            stroke="var(--line-strong)"
            strokeDasharray="4 4"
            label={{ value: `SLA ${SLA_DAYS}d`, position: 'top', fontSize: 12, fill: 'var(--chart-axis)' }}
          />
          <Tooltip {...tooltipProps} cursor={barCursor} formatter={(v: number) => [`${v}d`, 'Average time']} />
          <Bar dataKey="days" radius={BAR_RADIUS_HORIZONTAL}>
            {BOSS_THROUGHPUT.map((item, i) => (
              <Cell key={i} fill={item.days > SLA_DAYS ? 'var(--chart-risk)' : 'var(--chart-1)'} />
            ))}
            <LabelList dataKey="days" position="right" formatter={(v) => `${v}d`} style={valueLabelStyle} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-pill" style={{ background: 'var(--chart-1)' }} aria-hidden="true" />
          Within the {SLA_DAYS}-day SLA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-pill" style={{ background: 'var(--chart-risk)' }} aria-hidden="true" />
          Over the SLA: {overSla} departments
        </span>
      </div>
    </SectionCard>
  );
}

// ── Card 2: Status summary by department ─────────────────────────────────────
function QuickStatusSummaryCard({ onAIInsights }: { onAIInsights?: () => void }) {
  return (
    <SectionCard
      title="Status by department"
      actions={onAIInsights && <AIInsightsPill onClick={onAIInsights} />}
      padded={false}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead className="text-right">Active</TableHead>
            <TableHead className="text-right">Pending</TableHead>
            <TableHead className="text-right">Overdue</TableHead>
            <TableHead className="text-right">Rejected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {BOSS_DEPT_STATUS_GRID.map((row) => (
            <TableRow key={row.dept}>
              <TableCell className="font-semibold">{row.dept}</TableCell>
              <TableCell className="text-right font-mono text-xs text-text-secondary">{row.active}</TableCell>
              <TableCell className="text-right font-mono text-xs text-text-secondary">{row.pending}</TableCell>
              <TableCell className={cn('text-right font-mono text-xs', row.overdue > 0 ? 'text-risk' : 'text-text-muted')}>
                {row.overdue}
              </TableCell>
              <TableCell className={cn('text-right font-mono text-xs', row.rejected > 0 ? 'text-caution' : 'text-text-muted')}>
                {row.rejected}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

// ── Card 3: Urgent and overdue, org wide ─────────────────────────────────────
function UrgentOverdueOrgCard() {
  const total = BOSS_OVERDUE_LIST.length;
  return (
    <SectionCard title="Urgent and overdue">
      <p className="mb-3 flex items-baseline gap-2">
        <span className="text-[2rem] font-semibold leading-none text-risk">{total}</span>
        <span className="text-xs text-text-muted">overdue across the organisation</span>
      </p>
      <ul className="divide-y divide-line">
        {BOSS_OVERDUE_LIST.map((item, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.doc}</p>
              <p className="mt-0.5 text-xs text-text-muted">{item.assignee}, {item.dept}</p>
            </div>
            <StatusBadge tone="risk" label={`${item.daysOverdue}d overdue`} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Card 4: Document volume trend. Five departments, so a table with trends ──
function OrgVolumeTrendCard() {
  const [range, setRange] = useState<VolRange>('30D');
  const offset = range === '30D' ? 60 : range === '60D' ? 30 : 0;
  const data: OrgVolumeRow[] = BOSS_ORG_VOLUME.slice(offset);

  return (
    <SectionCard
      eyebrow="Documents per day"
      title="Document volume trend"
      padded={false}
      actions={
        <Tabs value={range} onValueChange={(v) => setRange(v as VolRange)}>
          <TabsList aria-label="Date range">
            {(['30D', '60D', '90D'] as VolRange[]).map((r) => (
              <TabsTrigger key={r} value={r}>{r}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead className="text-right">Daily average</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DEPT_KEYS.map((dept) => {
            const total = data.reduce((sum, row) => sum + row[dept], 0);
            return (
              <TableRow key={dept}>
                <TableCell className="font-semibold">{dept}</TableCell>
                <TableCell>
                  <div className="h-8 min-w-[7rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                        <CartesianGrid {...gridProps} horizontal={false} />
                        <XAxis dataKey="d" hide />
                        <YAxis hide domain={[0, 'dataMax']} />
                        <Line type="monotone" dataKey={dept} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-text-secondary">
                  {(total / data.length).toFixed(1)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-text-secondary">{total}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

// ── Card 5: Rejected and returned this month ─────────────────────────────────
function RejectedReturnedCard() {
  const total = BOSS_REJECTIONS.reduce((s, r) => s + r.count, 0);
  return (
    <SectionCard eyebrow="Documents this month" title="Rejected and returned">
      <p className="mb-3 flex items-baseline gap-2">
        <span className="text-[2rem] font-semibold leading-none text-risk">{total}</span>
        <span className="text-xs text-text-muted">this month</span>
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={BOSS_REJECTIONS} margin={{ top: 18, right: 12, bottom: 0, left: 12 }}>
          <XAxis {...axisProps} dataKey="name" />
          <YAxis hide />
          <Tooltip {...tooltipProps} cursor={barCursor} formatter={(v: number) => [v, 'Documents']} />
          <Bar dataKey="count" fill="var(--chart-risk)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE}>
            <LabelList dataKey="count" position="top" style={valueLabelStyle} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}

// ── Card 6: Compliance alerts ────────────────────────────────────────────────
const SEVERITY: Record<AlertSeverity, { tone: Tone; label: string }> = {
  critical: { tone: 'risk',    label: 'Critical' },
  warning:  { tone: 'caution', label: 'Warning' },
  info:     { tone: 'neutral', label: 'Info' },
};

function ComplianceAlertsCard({ onAIInsights }: { onAIInsights?: () => void }) {
  return (
    <SectionCard
      title="Compliance alerts"
      actions={onAIInsights && <AIInsightsPill onClick={onAIInsights} />}
    >
      <ul className="divide-y divide-line">
        {BOSS_COMPLIANCE_ALERTS.map((alert, i) => (
          <li key={i} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-text-primary">{alert.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">{alert.desc}</p>
            </div>
            <StatusBadge tone={SEVERITY[alert.severity].tone} label={SEVERITY[alert.severity].label} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Boss view layout ─────────────────────────────────────────────────────────
export default function BossView({
  onAIInsights,
}: {
  onAIInsights?: (title: string, context: string) => void;
}) {
  const buildContext = (title: string, rows: object[]) =>
    `Dashboard card: "${title}". Data: ${JSON.stringify(rows)}`;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5">
        <DeptThroughputCard />
        <QuickStatusSummaryCard
          onAIInsights={onAIInsights
            ? () => onAIInsights('Status by department', buildContext('Status by department', BOSS_DEPT_STATUS_GRID))
            : undefined
          }
        />
        <UrgentOverdueOrgCard />
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <OrgVolumeTrendCard />
        <RejectedReturnedCard />
        <ComplianceAlertsCard
          onAIInsights={onAIInsights
            ? () => onAIInsights('Compliance alerts', buildContext('Compliance alerts', BOSS_COMPLIANCE_ALERTS))
            : undefined
          }
        />
      </div>
    </div>
  );
}
