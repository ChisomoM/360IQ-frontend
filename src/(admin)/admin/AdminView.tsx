import React from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, LabelList, ResponsiveContainer,
} from 'recharts';
import { FileText, CheckSquare, AlertCircle } from 'lucide-react';
import {
  ADMIN_DOC_STATUS, ADMIN_SUBMISSIONS, ADMIN_WEEKLY, ADMIN_PENDING, ADMIN_URGENT,
} from './mockData';
import type { DocStatus, UrgencyType } from './mockData';

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
const SPRING_ROW = { type: 'spring', stiffness: 400, damping: 30 } as const;
const CARD: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 6%, white)',
  borderRadius: '1rem',
  border: '1px solid rgb(241 245 249)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  padding: '1.25rem',
};

const ADMIN_DOC_TOTAL = ADMIN_DOC_STATUS.reduce((a, d) => a + d.value, 0); // 22

const STATUS_STYLE: Record<DocStatus, string> = {
  approved: 'bg-positive-tint text-positive',
  pending:  'bg-caution-tint text-caution',
  rejected: 'bg-risk-tint text-risk',
  draft:    'bg-gray-100 text-gray-600',
};
const STATUS_LABEL: Record<DocStatus, string> = {
  approved: 'Approved',
  pending:  'Pending',
  rejected: 'Rejected',
  draft:    'Draft',
};

const URGENCY_STYLE: Record<UrgencyType, string> = {
  'Urgent':    'bg-red-50 text-red-600',
  'Due Today': 'bg-amber-50 text-amber-600',
  'Pending':   'bg-slate-100 text-slate-500',
};

const ACTION_ICONS: Record<'file' | 'check' | 'alert', React.ElementType> = {
  file:  FileText,
  check: CheckSquare,
  alert: AlertCircle,
};

// ── Card 1 — My Documents by Status (donut) ───────────────────────────────────
function MyDocStatusCard({ primary, secondary }: { primary: string; secondary: string }) {
  const docColors = [primary, 'rgb(245 158 11)', 'rgb(239 68 68)', 'rgb(148 163 184)'];

  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-5">My Documents by Status</h3>
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
              {ADMIN_DOC_STATUS.map((_, i) => (
                <Cell key={i} fill={docColors[i]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-2xl font-black text-slate-900 leading-none">{ADMIN_DOC_TOTAL}</span>
          <span className="font-sans text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">Total</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        {ADMIN_DOC_STATUS.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: docColors[i] }} />
            <span className="font-sans text-xs font-semibold text-slate-500 truncate">{item.name}</span>
            <span className="font-sans text-xs font-bold text-slate-700 ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 2 — My Recent Submissions (list) ─────────────────────────────────────
function MyRecentSubmissionsCard({ secondary }: { secondary: string }) {
  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-lg text-gray-800">My Recent Submissions</h3>
        <a href="#" className="font-sans text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-0.5 transition-colors">
          View all ›
        </a>
      </div>
      <motion.div
        className="divide-y divide-white/30"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {ADMIN_SUBMISSIONS.map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-sans text-[11px] text-slate-400">{item.date}</span>
                <span
                  className="font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${secondary}20`, color: secondary }}
                >
                  {item.dept}
                </span>
              </div>
            </div>
            <span className={`font-sans text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_STYLE[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Card 3 — My Workload This Month (4-week bars + inline stats) ───────────────
function MyWorkloadCard({ primary }: { primary: string }) {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-5">My Workload — This Month</h3>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={ADMIN_WEEKLY} barSize={28} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: 'rgb(100 116 139)', fontWeight: 600 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
          <Bar dataKey="v" fill={primary} radius={[6, 6, 0, 0]}>
            <LabelList
              dataKey="v" position="top"
              style={{ fontSize: 11, fill: 'rgb(100 116 139)', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100">
        {[
          { label: 'Submitted', val: '22' },
          { label: 'Approved',  val: '14' },
          { label: 'Rejected',  val: '2'  },
        ].map((s, i) => (
          <div key={i}>
            <p className="font-display text-2xl font-black text-slate-800">{s.val}</p>
            <p className="font-sans text-[10px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 4 — My Pending Actions (personal queue) ──────────────────────────────
function MyPendingActionsCard({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-5">My Pending Actions</h3>
      <motion.div
        className="divide-y divide-slate-50"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {ADMIN_PENDING.map((item, i) => {
          const iconKey = (['file', 'check', 'alert', 'file'] as const)[i];
          const Icon = ACTION_ICONS[iconKey];
          return (
            <motion.div
              key={i}
              className="flex items-center gap-3 py-3.5"
              variants={LIST_ITEM_REVEAL}
              whileHover={{ x: 2 }} transition={SPRING_ROW}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${secondary}20` }}
              >
                <Icon size={16} style={{ color: primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
                <p className="font-sans text-xs text-slate-400 mt-0.5">{item.action}</p>
              </div>
              <span className={`font-sans text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 uppercase tracking-wider ${URGENCY_STYLE[item.urgency]}`}>
                {item.urgency}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── Card 5 — Urgent Items Assigned to Me (no chart) ──────────────────────────
function UrgentItemsAdminCard() {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-3">Urgent — Assigned to Me</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display text-5xl font-black text-red-500 leading-none">
          {ADMIN_URGENT.length}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-slate-400 leading-tight">Urgent</p>
          <p className="font-sans text-xs text-slate-400">require your immediate action</p>
        </div>
      </div>
      <motion.div
        className="divide-y divide-slate-50"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {ADMIN_URGENT.map((item, i) => (
          <motion.div
            key={i} className="flex items-center gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">{item.action}</p>
            </div>
            <span className="font-sans text-xs font-black text-red-500 flex-shrink-0">
              {item.daysOverdue}d overdue
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Approval Rate (Admin — Personal 88%) ──────────────────────────────────────
function ApprovalRateCard({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-4">My Approval Rate</h3>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-display text-5xl font-black tracking-tighter" style={{ color: secondary }}>88%</span>
        <span className="font-sans text-sm text-slate-400 font-bold uppercase tracking-widest">Approved</span>
      </div>
      <div className="h-2 rounded-full bg-white/60 overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }} animate={{ width: '88%' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ backgroundColor: primary }}
        />
      </div>
      <div className="flex gap-8">
        <div>
          <span className="font-display text-xl font-black text-red-500">8%</span>
          <p className="font-sans text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Rejected</p>
        </div>
        <div>
          <span className="font-display text-xl font-black text-amber-500">4%</span>
          <p className="font-sans text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Pending</p>
        </div>
      </div>
    </div>
  );
}

// ── Admin View layout ─────────────────────────────────────────────────────────
export default function AdminView({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-4"
      variants={STAGGER} initial="hidden" animate="visible"
    >
      <motion.div variants={FADE_UP} className="flex flex-col gap-4">
        <MyDocStatusCard primary={primary} secondary={secondary} />
        <MyRecentSubmissionsCard secondary={secondary} />
      </motion.div>
      <motion.div variants={FADE_UP} className="flex flex-col gap-4">
        <MyPendingActionsCard primary={primary} secondary={secondary} />
        <MyWorkloadCard primary={primary} />
        <UrgentItemsAdminCard />
      </motion.div>
    </motion.div>
  );
}
