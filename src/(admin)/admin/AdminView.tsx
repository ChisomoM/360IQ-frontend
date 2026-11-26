import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, LabelList, ResponsiveContainer,
} from 'recharts';
import { FileText, CheckSquare, AlertCircle } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  axisProps, tooltipProps, barCursor, valueLabelStyle, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import type { Tone } from '@/lib/status';
import {
  ADMIN_DOC_STATUS, ADMIN_SUBMISSIONS, ADMIN_WEEKLY, ADMIN_PENDING, ADMIN_URGENT,
} from './mockData';
import type { UrgencyType } from './mockData';

// ── Local constants ───────────────────────────────────────────────────────────
const ADMIN_DOC_TOTAL = ADMIN_DOC_STATUS.reduce((a, d) => a + d.value, 0); // 22

const URGENCY: Record<UrgencyType, { tone: Tone; label: string }> = {
  'Urgent':    { tone: 'risk',    label: 'Urgent' },
  'Due Today': { tone: 'caution', label: 'Due today' },
  'Pending':   { tone: 'neutral', label: 'Pending' },
};

const ACTION_ICONS: Record<'file' | 'check' | 'alert', React.ElementType> = {
  file:  FileText,
  check: CheckSquare,
  alert: AlertCircle,
};

// ── Card 1: My documents by status (donut, four slices) ──────────────────────
function MyDocStatusCard() {
  return (
    <SectionCard eyebrow="Documents" title="My documents by status">
      <div className="relative mx-auto" style={{ width: 164, height: 164 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ADMIN_DOC_STATUS}
              dataKey="value"
              innerRadius={54} outerRadius={78}
              paddingAngle={4} startAngle={90} endAngle={-270}
              strokeWidth={0}
            >
              {ADMIN_DOC_STATUS.map((item, i) => (
                <Cell key={item.name} fill={seriesColor(i)} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip {...tooltipProps} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold leading-none text-text-primary">{ADMIN_DOC_TOTAL}</span>
          <span className="mt-0.5 text-xs text-text-muted">Total</span>
        </div>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {ADMIN_DOC_STATUS.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-pill" style={{ backgroundColor: seriesColor(i) }} aria-hidden="true" />
            <span className="truncate text-text-secondary">{item.name}</span>
            <span className="ml-auto font-mono text-text-primary">{item.value}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Card 2: My recent submissions ────────────────────────────────────────────
function MyRecentSubmissionsCard() {
  return (
    <SectionCard
      title="My recent submissions"
      actions={
        <Button asChild variant="ghost" size="sm">
          <a href="#">View all</a>
        </Button>
      }
    >
      <ul className="divide-y divide-line">
        {ADMIN_SUBMISSIONS.map((item) => (
          <li key={item.doc} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.doc}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                <span className="font-mono">{item.date}</span>, {item.dept}
              </p>
            </div>
            <StatusBadge status={item.status} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Card 3: My workload this month ───────────────────────────────────────────
function MyWorkloadCard() {
  return (
    <SectionCard eyebrow="Documents per week" title="My workload this month">
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={ADMIN_WEEKLY} margin={{ top: 18, right: 8, bottom: 0, left: 8 }}>
          <XAxis {...axisProps} dataKey="week" />
          <Tooltip {...tooltipProps} cursor={barCursor} formatter={(v: number) => [v, 'Documents']} />
          <Bar dataKey="v" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE}>
            <LabelList dataKey="v" position="top" style={valueLabelStyle} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
        {[
          { label: 'Submitted', val: '22' },
          { label: 'Approved',  val: '14' },
          { label: 'Rejected',  val: '2'  },
        ].map((s) => (
          <div key={s.label} className="flex flex-col-reverse">
            <dt className="text-xs text-text-muted">{s.label}</dt>
            <dd className="text-xl font-semibold text-text-primary">{s.val}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

// ── Card 4: My pending actions (personal queue) ──────────────────────────────
function MyPendingActionsCard() {
  return (
    <SectionCard title="My pending actions">
      <ul className="divide-y divide-line">
        {ADMIN_PENDING.map((item, i) => {
          const iconKey = (['file', 'check', 'alert', 'file'] as const)[i];
          const Icon = ACTION_ICONS[iconKey];
          return (
            <li key={item.doc} className="flex items-center gap-3 py-3">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{item.doc}</p>
                <p className="mt-0.5 text-xs text-text-muted">{item.action}</p>
              </div>
              <StatusBadge tone={URGENCY[item.urgency].tone} label={URGENCY[item.urgency].label} />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

// ── Card 5: Urgent items assigned to me ──────────────────────────────────────
function UrgentItemsAdminCard() {
  return (
    <SectionCard title="Urgent, assigned to me">
      <p className="mb-3 flex items-baseline gap-2">
        <span className="text-[2rem] font-semibold leading-none text-risk">{ADMIN_URGENT.length}</span>
        <span className="text-xs text-text-muted">need your action now</span>
      </p>
      <ul className="divide-y divide-line">
        {ADMIN_URGENT.map((item) => (
          <li key={item.doc} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.doc}</p>
              <p className="mt-0.5 text-xs text-text-muted">{item.action}</p>
            </div>
            <StatusBadge tone="risk" label={`${item.daysOverdue}d overdue`} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Admin view layout ────────────────────────────────────────────────────────
export default function AdminView() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5">
        <MyDocStatusCard />
        <MyRecentSubmissionsCard />
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <MyPendingActionsCard />
        <MyWorkloadCard />
        <UrgentItemsAdminCard />
      </div>
    </div>
  );
}
