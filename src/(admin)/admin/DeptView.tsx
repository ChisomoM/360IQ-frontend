import { motion, useReducedMotion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LabelList, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from '@/components/icons';
import { AIInsightsPill } from '@/components/AIInsightsPill';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  axisProps, gridProps, tooltipProps, barCursor, lineCursor, valueLabelStyle,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { cn } from '@/lib/utils';
import {
  DEPT_STAGES, DEPT_TEAM, DEPT_OVERDUE_DOCS,
  DEPT_VOL_30D, DEPT_WEEKLY, DEPT_REJECTIONS,
} from './mockData';

// ── Local constants ───────────────────────────────────────────────────────────
const EASE_CUSTOM: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Compute drops (% reduction from previous stage)
const drops = DEPT_STAGES.map((s, j) =>
  j === 0 ? 0 : Math.round(((DEPT_STAGES[j - 1].count - s.count) / DEPT_STAGES[j - 1].count) * 100)
);
const BOTTLENECK_IDX = drops.indexOf(Math.max(...drops.slice(1)));

/** A horizontal meter that fills once on first view. */
function Meter({ pct, color, label }: { pct: number; color: string; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
      className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-2"
    >
      <motion.div
        className="h-full rounded-pill"
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: EASE_CUSTOM }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// ── Card 1: Document stage funnel ────────────────────────────────────────────
function StageFunnelCard() {
  const maxCount = DEPT_STAGES[0].count;
  return (
    <SectionCard eyebrow="Documents, change from previous stage" title="Document stage funnel">
      <div className="flex flex-col gap-3">
        {DEPT_STAGES.map((stage, i) => {
          const pct    = Math.round((stage.count / maxCount) * 100);
          const isBN   = i === BOTTLENECK_IDX && i > 0;
          return (
            <div key={stage.stage} className="flex items-center gap-3">
              <span className="w-36 flex-shrink-0 text-xs leading-tight text-text-secondary">{stage.stage}</span>
              <Meter pct={pct} color={isBN ? 'var(--caution)' : 'var(--chart-1)'} label={`${stage.stage}: ${stage.count} documents`} />
              <span className="w-8 flex-shrink-0 text-right font-mono text-xs text-text-primary">{stage.count}</span>
              <span className={cn('w-12 flex-shrink-0 text-right font-mono text-xs', isBN ? 'text-caution' : 'text-text-muted')}>
                {i > 0 ? `-${drops[i]}%` : ''}
              </span>
            </div>
          );
        })}
      </div>
      {BOTTLENECK_IDX > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-caution">
          <AlertTriangle size={14} />
          Bottleneck at <strong>{DEPT_STAGES[BOTTLENECK_IDX].stage}</strong>
        </p>
      )}
    </SectionCard>
  );
}

// ── Card 2: Urgent and overdue in my department ──────────────────────────────
function UrgentOverdueDeptCard() {
  const total = DEPT_OVERDUE_DOCS.length;
  const totalDocs = 48;
  const pct = ((total / totalDocs) * 100).toFixed(1);
  return (
    <SectionCard eyebrow="Finance" title="Urgent and overdue">
      <p className="flex items-baseline gap-2">
        <span className="text-[2rem] font-semibold leading-none text-risk">{total}</span>
        <span className="text-xs text-text-muted">overdue, {pct}% of {totalDocs} active documents</span>
      </p>
      <div className="mb-3 mt-3 flex">
        <Meter pct={Number(pct)} color="var(--chart-risk)" label="Share of active documents overdue" />
      </div>
      <ul className="divide-y divide-line">
        {DEPT_OVERDUE_DOCS.map((item) => (
          <li key={item.doc} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.doc}</p>
              <p className="mt-0.5 text-xs text-text-muted">{item.assignee}</p>
            </div>
            <StatusBadge tone="risk" label={`${item.daysOverdue}d overdue`} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Card 3: Department submissions this month ────────────────────────────────
function DeptSubmissionsCard({ onAIInsights }: { onAIInsights?: () => void }) {
  const total = DEPT_WEEKLY.reduce((s, w) => s + w.v, 0);
  return (
    <SectionCard
      eyebrow="Documents per week"
      title="Finance submissions in April"
      actions={onAIInsights && <AIInsightsPill onClick={onAIInsights} />}
    >
      <p className="mb-3 text-xs text-text-muted">{total} documents submitted this month</p>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={DEPT_WEEKLY} margin={{ top: 18, right: 8, bottom: 0, left: 8 }}>
          <XAxis {...axisProps} dataKey="week" />
          <YAxis hide />
          <Tooltip {...tooltipProps} cursor={barCursor} formatter={(v: number) => [v, 'Documents']} />
          <Bar dataKey="v" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE}>
            <LabelList dataKey="v" position="top" style={valueLabelStyle} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}

// ── Card 4: Department activity trend (area + 3 inline stats) ────────────────
function DeptActivityCard() {
  return (
    <SectionCard eyebrow="Documents per day, last 30 days" title="Department activity">
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={DEPT_VOL_30D} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
          <CartesianGrid {...gridProps} />
          <XAxis {...axisProps} dataKey="d" interval={6} />
          <YAxis {...axisProps} width={44} />
          <Tooltip {...tooltipProps} cursor={lineCursor} formatter={(v: number) => [v, 'Documents']} labelFormatter={(d) => `Day ${d}`} />
          <Area
            type="monotone" dataKey="v"
            stroke="var(--chart-1)" strokeWidth={2}
            fill="var(--chart-1)" fillOpacity={0.12} dot={false}
            activeDot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
        {[
          { label: 'Submitted',          val: '28'   },
          { label: 'Average processing', val: '4.4d' },
          { label: 'On-time rate',       val: '81%'  },
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

// ── Card 5: Team completion rate ─────────────────────────────────────────────
function TeamCompletionCard() {
  return (
    <SectionCard title="Team completion rate">
      <div className="flex flex-col gap-3">
        {DEPT_TEAM.map((member) => {
          const behind = member.pct < 60;
          return (
            <div key={member.name} className="flex items-center gap-3">
              <span className="w-24 flex-shrink-0 truncate text-xs text-text-secondary">{member.name}</span>
              <Meter pct={member.pct} color={behind ? 'var(--chart-risk)' : 'var(--chart-1)'} label={`${member.name} completion rate`} />
              <span className={cn('flex w-14 flex-shrink-0 items-center justify-end gap-1 font-mono text-xs', behind ? 'text-risk' : 'text-text-primary')}>
                {behind && <AlertTriangle size={14} />}
                {member.pct}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-text-muted">David B. is well behind. Follow up recommended.</p>
    </SectionCard>
  );
}

// ── Card 6: Rejected and returned in my department ───────────────────────────
function RejectedInDeptCard() {
  return (
    <SectionCard title="Rejected and returned">
      <p className="mb-3 flex items-baseline gap-2">
        <span className="text-[2rem] font-semibold leading-none text-risk">{DEPT_REJECTIONS.length}</span>
        <span className="text-xs text-text-muted">this month</span>
      </p>
      <ul className="divide-y divide-line">
        {DEPT_REJECTIONS.map((item) => (
          <li key={item.doc} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.doc}</p>
              <p className="mt-0.5 text-xs text-text-muted">{item.reason}</p>
            </div>
            <span className="flex-shrink-0 font-mono text-xs text-text-muted">{item.date}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Dept view layout ─────────────────────────────────────────────────────────
export default function DeptView({
  onAIInsights,
}: {
  onAIInsights?: (title: string, context: string) => void;
}) {
  const buildContext = (title: string, rows: object[]) =>
    `Dashboard card: "${title}". Data: ${JSON.stringify(rows)}`;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5">
        <StageFunnelCard />
        <UrgentOverdueDeptCard />
        <DeptSubmissionsCard
          onAIInsights={onAIInsights
            ? () => onAIInsights('Finance submissions in April', buildContext('Dept Submissions', DEPT_WEEKLY))
            : undefined
          }
        />
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <DeptActivityCard />
        <TeamCompletionCard />
        <RejectedInDeptCard />
      </div>
    </div>
  );
}
