import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis,
  Tooltip, LabelList, LineChart, Line, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { ShieldAlert } from 'lucide-react';
import { AIInsightsPill } from '@/components/AIInsightsPill';
import {
  BOSS_THROUGHPUT, BOSS_ORG_VOLUME,
  BOSS_REJECTIONS, BOSS_DEPT_STATUS_GRID,
  BOSS_OVERDUE_LIST, BOSS_COMPLIANCE_ALERTS,
} from './mockData';
import type { OrgVolumeRow } from './mockData';

// ── Local constants ───────────────────────────────────────────────────────────
const EASE_CUSTOM: [number, number, number, number] = [0.16, 1, 0.3, 1];
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const FADE_UP = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_CUSTOM } },
};
const LIST_ITEM_REVEAL = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_CUSTOM } },
};
const SPRING_BTN  = { type: 'spring', stiffness: 500, damping: 30 } as const;
const SPRING_PILL = { type: 'spring', stiffness: 400, damping: 28 } as const;
const SPRING_ROW  = { type: 'spring', stiffness: 400, damping: 30 } as const;
const CARD: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 6%, white)',
  borderRadius: '1rem',
  border: '1px solid rgb(241 245 249)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  padding: '1.25rem',
}; 
const DEPT_KEYS = ['Finance', 'Legal', 'HR', 'Operations', 'Executive'] as const;
const SLA_DAYS = 5;
type VolRange = '30D' | '60D' | '90D';

// Fixed distinct palette — one semantic hue per department
const DEPT_CHART_COLORS: Record<string, string> = {
  Finance:    'rgb(124 105 255)', // ch-primary purple
  Legal:      'rgb(239 68 68)',   // danger red
  HR:         'rgb(16 185 129)',  // success green
  Operations: 'rgb(245 158 11)', // warning amber
  Executive:  'rgb(3 216 253)',   // ch-secondary cyan
};

// ── Card 1 — Department Throughput (horizontal bar + SLA reference line) ──────
function DeptThroughputCard({ primary }: { primary: string }) {
  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-gray-800">Throughput by Department</h3>
        <span className="font-sans text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">avg days</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={BOSS_THROUGHPUT}
          layout="vertical"
          margin={{ top: 0, right: 44, bottom: 0, left: 0 }}
          barSize={10}
        >
          <XAxis type="number" hide domain={[0, 9]} />
          <YAxis
            type="category" dataKey="name"
            tick={{ fontSize: 12, fill: 'rgb(100 116 139)', fontWeight: 600 }}
            axisLine={false} tickLine={false} width={90}
          />
          <ReferenceLine
            x={SLA_DAYS}
            stroke="rgba(148,163,184,0.5)"
            strokeDasharray="4 4"
            label={{ value: `SLA ${SLA_DAYS}d`, position: 'top', fontSize: 9, fill: 'rgb(148 163 184)' }}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            formatter={(v: number) => [`${v}d`, 'Avg time']}
          />
          <Bar dataKey="days" radius={[0, 5, 5, 0]}>
            {BOSS_THROUGHPUT.map((item, i) => (
              <Cell
                key={i}
                fill={item.days > SLA_DAYS ? 'rgb(239 68 68)' : primary}
                fillOpacity={item.days > SLA_DAYS ? 0.72 : 0.9}
              />
            ))}
            <LabelList
              dataKey="days"
              position="right"
              formatter={(v) => `${v}d`}
              style={{ fontSize: 11, fill: 'rgb(100 116 139)', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="font-sans text-xs text-slate-400 mt-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full inline-block bg-red-400" />
        2 departments exceeding the {SLA_DAYS}-day SLA target
      </p>
    </div>
  );
}

// ── Card 2 — Quick Status Summary by Department (data grid) ───────────────────
function QuickStatusSummaryCard({
  primary,
  onAIInsights,
}: { primary: string; onAIInsights?: () => void }) {
  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-gray-800">Status by Department</h3>
        {onAIInsights && <AIInsightsPill primary={primary} onClick={onAIInsights} />}
      </div>
      {/* Table */}
      <div className="w-full">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] pb-2 border-b border-slate-100 mb-1">
          {['Dept', 'Act', 'Pend', 'Ovd', 'Rej'].map((h, i) => (
            <span
              key={i}
              className={`font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${i === 0 ? '' : 'text-right'}`}
            >
              {h}
            </span>
          ))}
        </div>
        <motion.div variants={STAGGER} initial="hidden" animate="visible" className="divide-y divide-slate-50">
          {BOSS_DEPT_STATUS_GRID.map((row, i) => (
            <motion.div
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] py-2.5"
              variants={LIST_ITEM_REVEAL}
              whileHover={{ x: 2 }} transition={SPRING_ROW}
            >
              <span className="font-sans text-sm font-semibold text-slate-700 truncate">{row.dept}</span>
              <span className="font-mono text-xs text-slate-600 text-right">{row.active}</span>
              <span className="font-mono text-xs text-slate-600 text-right">{row.pending}</span>
              <span className={`font-mono text-xs font-bold text-right ${row.overdue > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {row.overdue > 0 ? row.overdue : '—'}
              </span>
              <span className={`font-mono text-xs font-bold text-right ${row.rejected > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                {row.rejected > 0 ? row.rejected : '—'}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── Card 3 — Urgent & Overdue Org-wide ────────────────────────────────────────
function UrgentOverdueOrgCard() {
  const total = BOSS_OVERDUE_LIST.length;
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-3">Urgent &amp; Overdue</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display text-6xl font-black text-red-500 leading-none">{total}</span>
        <div>
          <p className="font-display text-lg font-bold text-slate-400 leading-tight">Overdue</p>
          <p className="font-sans text-xs text-slate-400">across the organisation</p>
        </div>
      </div>
      <motion.div
        className="divide-y divide-slate-50"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {BOSS_OVERDUE_LIST.map((item, i) => (
          <motion.div
            key={i} className="flex items-center gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-sans text-[11px] text-slate-400">{item.assignee}</span>
                <span
                  className="font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                >
                  {item.dept}
                </span>
              </div>
            </div>
            <span className="font-sans text-xs font-black text-red-500 flex-shrink-0">
              {item.daysOverdue}d
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Card 4 — Document Volume Trend (multi-line, distinct dept colours) ─────────
function OrgVolumeTrendCard({ primary: _primary }: { primary: string }) {
  const [range, setRange] = useState<VolRange>('30D');
  const offset = range === '30D' ? 60 : range === '60D' ? 30 : 0;
  const data: OrgVolumeRow[] = BOSS_ORG_VOLUME.slice(offset);
  const tickInterval = range === '30D' ? 5 : range === '60D' ? 10 : 17;

  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-lg text-gray-800">Document Volume Trend</h3>
        <div className="relative flex items-center bg-slate-50/80 p-1 rounded-xl h-9 border border-slate-100">
          {(['30D', '60D', '90D'] as VolRange[]).map((r) => (
            <motion.button
              key={r}
              onClick={() => setRange(r)}
              className={`relative flex items-center justify-center px-4 rounded-lg font-sans text-xs font-bold outline-none z-10 h-7 transition-colors ${
                range === r ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={SPRING_BTN}
            >
              {range === r && (
                <motion.div layoutId="bossVolPill" className="absolute inset-0 bg-white rounded-lg shadow-sm" transition={SPRING_PILL} />
              )}
              <span className="relative z-10">{r}</span>
            </motion.button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={172}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
          <CartesianGrid strokeDasharray="5 5" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis
            dataKey="d"
            tick={{ fontSize: 10, fill: 'rgb(148 163 184)' }}
            axisLine={false} tickLine={false} interval={tickInterval}
          />
          <YAxis tick={{ fontSize: 9, fill: 'rgb(148 163 184)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
          />
          {DEPT_KEYS.map((dept) => (
            <Line
              key={dept} type="monotone" dataKey={dept}
              stroke={DEPT_CHART_COLORS[dept]}
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 4, fill: DEPT_CHART_COLORS[dept], strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-4">
        {DEPT_KEYS.map((dept) => (
          <div key={dept} className="flex items-center gap-1.5">
            <span
              className="w-5 h-0.5 inline-block rounded-full"
              style={{ backgroundColor: DEPT_CHART_COLORS[dept] }}
            />
            <span className="font-sans text-[11px] text-slate-500">{dept}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 5 — Rejected & Returned This Month (bar by dept, red tint) ───────────
function RejectedReturnedCard() {
  const total = BOSS_REJECTIONS.reduce((s, r) => s + r.count, 0);
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-1">Rejected &amp; Returned</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display text-3xl font-black text-red-500">{total}</span>
        <span className="font-sans text-xs text-slate-400 font-semibold">this month</span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={BOSS_REJECTIONS} barSize={18} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <Bar dataKey="count" fill="rgb(239 68 68)" fillOpacity={0.6} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="count" position="top"
              style={{ fontSize: 11, fill: 'rgb(100 116 139)', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Card 6 — Compliance Alerts (list + severity, gated by permission) ─────────
const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning:  'bg-amber-400',
  info:     'bg-blue-400',
};
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  warning:  'Warning',
  info:     'Info',
};

function ComplianceAlertsCard({
  primary,
  onAIInsights,
}: { primary: string; onAIInsights?: () => void }) {
  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-500" />
          <h3 className="font-display font-bold text-lg text-gray-800">Compliance Alerts</h3>
        </div>
        {onAIInsights && <AIInsightsPill primary={primary} onClick={onAIInsights} />}
      </div>
      <motion.div
        className="divide-y divide-slate-50"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {BOSS_COMPLIANCE_ALERTS.map((alert, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${SEVERITY_DOT[alert.severity]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 leading-snug">{alert.title}</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">{alert.desc}</p>
            </div>
            <span className={`font-sans text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide mt-0.5 ${
              alert.severity === 'critical'
                ? 'bg-red-50 text-red-600'
                : alert.severity === 'warning'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
            }`}>
              {SEVERITY_LABEL[alert.severity]}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Boss View layout ──────────────────────────────────────────────────────────
export default function BossView({
  primary,
  secondary: _secondary,
  onAIInsights,
}: {
  primary: string;
  secondary: string;
  onAIInsights?: (title: string, context: string) => void;
}) {
  const buildContext = (title: string, rows: object[]) =>
    `Dashboard card: "${title}". Data: ${JSON.stringify(rows)}`;

  return (
    <motion.div
      className="grid grid-cols-2 gap-4"
      variants={STAGGER} initial="hidden" animate="visible"
    >
      <motion.div variants={FADE_UP} className="flex flex-col gap-4">
        <DeptThroughputCard primary={primary} />
        <QuickStatusSummaryCard
          primary={primary}
          onAIInsights={onAIInsights
            ? () => onAIInsights('Status by Department', buildContext('Status by Department', BOSS_DEPT_STATUS_GRID))
            : undefined
          }
        />
        <UrgentOverdueOrgCard />
      </motion.div>
      <motion.div variants={FADE_UP} className="flex flex-col gap-4">
        <OrgVolumeTrendCard primary={primary} />
        <RejectedReturnedCard />
        <ComplianceAlertsCard
          primary={primary}
          onAIInsights={onAIInsights
            ? () => onAIInsights('Compliance Alerts', buildContext('Compliance Alerts', BOSS_COMPLIANCE_ALERTS))
            : undefined
          }
        />
      </motion.div>
    </motion.div>
  );
}
