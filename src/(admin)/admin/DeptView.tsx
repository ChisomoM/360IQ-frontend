import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LabelList, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, XCircle } from 'lucide-react';
import { AIInsightsPill } from '@/components/AIInsightsPill';
import {
  DEPT_STAGES, DEPT_TEAM, DEPT_OVERDUE_DOCS,
  DEPT_VOL_30D, DEPT_WEEKLY, DEPT_REJECTIONS,
} from './mockData';

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

// Compute drops (% reduction from previous stage)
const drops = DEPT_STAGES.map((s, j) =>
  j === 0 ? 0 : Math.round(((DEPT_STAGES[j - 1].count - s.count) / DEPT_STAGES[j - 1].count) * 100)
);
const BOTTLENECK_IDX = drops.indexOf(Math.max(...drops.slice(1)));

// ── Card 1 — Document Stage Funnel (left-aligned animated bars) ───────────────
function StageFunnelCard({ primary }: { primary: string }) {
  const maxCount = DEPT_STAGES[0].count;
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-5">Document Stage Funnel</h3>
      <div className="flex flex-col gap-3">
        {DEPT_STAGES.map((stage, i) => {
          const pct    = (stage.count / maxCount) * 100;
          const drop   = drops[i];
          const isBN   = i === BOTTLENECK_IDX && i > 0;
          const fill   = isBN ? 'rgb(245 158 11)' : primary;
          const fillOp = 1 - i * 0.13;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="font-sans text-xs font-medium text-slate-500 w-36 flex-shrink-0 leading-tight">
                {stage.stage}
              </span>
              <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-lg flex items-center pl-2.5"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_CUSTOM }}
                  style={{ backgroundColor: fill, opacity: fillOp }}
                >
                  <span className="font-sans text-xs font-bold text-white leading-none">
                    {stage.count}
                  </span>
                </motion.div>
              </div>
              {i > 0 ? (
                <span className={`font-sans text-xs font-bold w-10 text-right flex-shrink-0 ${isBN ? 'text-amber-600' : 'text-slate-400'}`}>
                  −{drop}%
                </span>
              ) : (
                <span className="w-10 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      {BOTTLENECK_IDX > 0 && (
        <p className="font-sans text-xs font-semibold text-amber-600 flex items-center gap-1.5 mt-4">
          <AlertTriangle size={12} />
          Bottleneck at: <strong>{DEPT_STAGES[BOTTLENECK_IDX].stage}</strong>
        </p>
      )}
    </div>
  );
}

// ── Card 2 — Urgent & Overdue in My Department ────────────────────────────────
function UrgentOverdueDeptCard() {
  const total = DEPT_OVERDUE_DOCS.length;
  const totalDocs = 48;
  const pct = ((total / totalDocs) * 100).toFixed(1);
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-3">
        Urgent &amp; Overdue — Finance
      </h3>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-6xl font-black text-red-500 leading-none">{total}</span>
        <div>
          <p className="font-display text-lg font-bold text-slate-400 leading-tight">Overdue</p>
          <p className="font-sans text-xs text-slate-400">{pct}% of {totalDocs} active docs</p>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5 mt-3">
        <div className="h-full rounded-full bg-red-400" style={{ width: `${pct}%` }} />
      </div>
      <motion.div
        className="divide-y divide-slate-50"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {DEPT_OVERDUE_DOCS.map((item, i) => (
          <motion.div
            key={i} className="flex items-center gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">{item.assignee}</p>
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

// ── Card 3 — Department Submissions This Month ────────────────────────────────
function DeptSubmissionsCard({
  primary,
  onAIInsights,
}: { primary: string; onAIInsights?: () => void }) {
  const total = DEPT_WEEKLY.reduce((s, w) => s + w.v, 0);
  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-bold text-lg text-gray-800">Finance Submissions — April</h3>
        {onAIInsights && <AIInsightsPill primary={primary} onClick={onAIInsights} />}
      </div>
      <p className="font-sans text-xs text-slate-400 mb-4">{total} documents submitted this month</p>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={DEPT_WEEKLY} barSize={26} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: 'rgb(100 116 139)', fontWeight: 600 }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <Bar dataKey="v" fill={primary} fillOpacity={0.85} radius={[5, 5, 0, 0]}>
            <LabelList
              dataKey="v" position="top"
              style={{ fontSize: 11, fill: 'rgb(100 116 139)', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Card 4 — Department Activity Trend (area + 3 inline stats) ────────────────
function DeptActivityCard({ primary }: { primary: string }) {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-4">Dept Activity — 30 Days</h3>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={DEPT_VOL_30D} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="deptGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={primary} stopOpacity={0.15} />
              <stop offset="95%" stopColor={primary} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="6 6" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis
            dataKey="d"
            tick={{ fontSize: 9, fill: 'rgb(148 163 184)' }}
            axisLine={false} tickLine={false} interval={6}
          />
          <YAxis tick={{ fontSize: 9, fill: 'rgb(148 163 184)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          />
          <Area
            type="monotone" dataKey="v"
            stroke={primary} strokeWidth={2.5}
            fill="url(#deptGrad)" dot={false}
            activeDot={{ r: 5, fill: primary, strokeWidth: 3, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100">
        {[
          { label: 'Submitted',      val: '28'   },
          { label: 'Avg Processing', val: '4.4d' },
          { label: 'On-time Rate',   val: '81%'  },
        ].map((s, i) => (
          <div key={i}>
            <p className="font-display text-xl font-black text-slate-800">{s.val}</p>
            <p className="font-sans text-[10px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 5 — Team Completion Rate ─────────────────────────────────────────────
function TeamCompletionCard({ primary }: { primary: string }) {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-5">Team Completion Rate</h3>
      <motion.div
        className="flex flex-col gap-3"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {DEPT_TEAM.map((member, i) => (
          <motion.div
            key={i} className="flex items-center gap-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <span className="font-sans text-xs font-semibold text-slate-600 w-20 flex-shrink-0 truncate">
              {member.name}
            </span>
            <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${member.pct}%` }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_CUSTOM }}
                className="h-full rounded-full"
                style={{ backgroundColor: member.pct < 60 ? 'rgb(239 68 68)' : primary }}
              />
            </div>
            <span className={`font-sans text-xs font-bold w-9 text-right flex-shrink-0 ${member.pct < 60 ? 'text-red-500' : 'text-slate-700'}`}>
              {member.pct}%
            </span>
          </motion.div>
        ))}
      </motion.div>
      <p className="font-sans text-xs text-slate-400 mt-4 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-400 inline-block flex-shrink-0" />
        David B. is significantly behind — follow-up recommended
      </p>
    </div>
  );
}

// ── Card 6 — Rejected & Returned in My Department ─────────────────────────────
function RejectedInDeptCard() {
  return (
    <div style={CARD}>
      <div className="flex items-center gap-2 mb-3">
        <XCircle size={15} className="text-red-500 flex-shrink-0" />
        <h3 className="font-display font-bold text-lg text-gray-800">Rejected &amp; Returned</h3>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display text-4xl font-black text-red-500">{DEPT_REJECTIONS.length}</span>
        <span className="font-sans text-xs text-slate-400 font-semibold">this month</span>
      </div>
      <motion.div
        className="divide-y divide-slate-50"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {DEPT_REJECTIONS.map((item, i) => (
          <motion.div
            key={i} className="flex items-center gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">{item.reason}</p>
            </div>
            <span className="font-mono text-xs text-slate-400 flex-shrink-0">{item.date}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Dept View layout ──────────────────────────────────────────────────────────
export default function DeptView({
  primary,
  secondary,
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
        <StageFunnelCard primary={primary} />
        <UrgentOverdueDeptCard />
        <DeptSubmissionsCard
          primary={primary}
          onAIInsights={onAIInsights
            ? () => onAIInsights('Finance Submissions — April', buildContext('Dept Submissions', DEPT_WEEKLY))
            : undefined
          }
        />
      </motion.div>
      <motion.div variants={FADE_UP} className="flex flex-col gap-4">
        <DeptActivityCard primary={primary} />
        <TeamCompletionCard primary={primary} />
        <RejectedInDeptCard />
      </motion.div>
    </motion.div>
  );
}


// // ── Local constants ───────────────────────────────────────────────────────────
// const EASE_CUSTOM: [number, number, number, number] = [0.16, 1, 0.3, 1];
// const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
// const FADE_UP = {
//   hidden:  { opacity: 0, y: 12 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_CUSTOM } },
// };
// const LIST_ITEM_REVEAL = {
//   hidden:  { opacity: 0, x: -16 },
//   visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_CUSTOM } },
// };
// const SPRING_ROW = { type: 'spring', stiffness: 400, damping: 30 } as const;
// const CARD: React.CSSProperties = {
//   backgroundColor: 'var(--tenant-primary-light)',
//   borderRadius: '1rem',
//   boxShadow: '0 0.25rem 1.5rem rgba(100, 100, 160, 0.08)',
//   padding: '1.25rem',
// };

// Compute bottleneck index: largest % drop between stages
// const drops = DEPT_STAGES.map((s, j) =>
//   j === 0 ? 0 : (DEPT_STAGES[j - 1].count - s.count) / DEPT_STAGES[j - 1].count
// );
// const BOTTLENECK_IDX = drops.indexOf(Math.max(...drops));

// ── Card 1 — Document Stage Funnel (SVG) ──────────────────────────────────────
// function StageFunnelCard({ primary }: { primary: string }) {
//   const maxCount = DEPT_STAGES[0].count;
//   const FUNNEL_W = 260;
//   const STAGE_H = 38;
//   const GAP = 5;
//   const totalH = DEPT_STAGES.length * (STAGE_H + GAP) - GAP;

//   return (
//     <div style={CARD}>
//       <h3 className="font-display font-bold text-lg text-gray-800 mb-5">Document Stage Funnel</h3>
//       <div className="flex justify-center">
//         <svg width={FUNNEL_W} height={totalH} viewBox={`0 0 ${FUNNEL_W} ${totalH}`}>
//           {DEPT_STAGES.map((stage, i) => {
//             const w = (stage.count / maxCount) * FUNNEL_W;
//             const x = (FUNNEL_W - w) / 2;
//             const y = i * (STAGE_H + GAP);
//             const isBottleneck = i === BOTTLENECK_IDX;
//             const fill = isBottleneck ? 'rgb(245 158 11)' : primary;
//             const opacity = 1 - i * 0.14;
//             return (
//               <g key={i}>
//                 <rect x={x} y={y} width={w} height={STAGE_H} rx="7" fill={fill} fillOpacity={opacity} />
//                 <text
//                   x={FUNNEL_W / 2} y={y + STAGE_H / 2 + 4.5}
//                   textAnchor="middle" fontSize="11" fontWeight="700"
//                   fill={isBottleneck ? '#fff' : 'rgba(255,255,255,0.92)'}
//                   fontFamily="Plus Jakarta Sans, sans-serif"
//                 >
//                   {stage.stage} — {stage.count}
//                 </text>
//               </g>
//             );
//           })}
//         </svg>
//       </div>
//       <p className={`font-sans text-xs font-semibold mt-4 flex items-center gap-1.5 ${
//         BOTTLENECK_IDX > 0 ? 'text-amber-600' : 'text-emerald-600'
//       }`}>
//         {BOTTLENECK_IDX > 0 ? (
//           <>
//             <AlertTriangle size={12} />
//             Bottleneck at: <strong>{DEPT_STAGES[BOTTLENECK_IDX].stage}</strong>
//           </>
//         ) : 'No bottleneck detected'}
//       </p>
//     </div>
//   );
// }

// // ── Card 2 — Team Action Completion Rate ──────────────────────────────────────
// function TeamCompletionCard({ primary }: { primary: string }) {
//   return (
//     <div style={CARD}>
//       <h3 className="font-display font-bold text-lg text-gray-800 mb-5">Team Completion Rate</h3>
//       <motion.div
//         className="flex flex-col gap-3"
//         variants={STAGGER} initial="hidden" animate="visible"
//       >
//         {DEPT_TEAM.map((member, i) => (
//           <motion.div
//             key={i} className="flex items-center gap-3"
//             variants={LIST_ITEM_REVEAL}
//             whileHover={{ x: 2 }} transition={SPRING_ROW}
//           >
//             <span className="font-sans text-xs font-semibold text-slate-600 w-20 flex-shrink-0 truncate">
//               {member.name}
//             </span>
//             <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,0.15)' }}>
//               <motion.div
//                 initial={{ width: 0 }}
//                 animate={{ width: `${member.pct}%` }}
//                 transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_CUSTOM }}
//                 className="h-full rounded-full"
//                 style={{ backgroundColor: member.pct < 60 ? 'rgb(239 68 68)' : primary }}
//               />
//             </div>
//             <span className={`font-sans text-xs font-bold w-9 text-right flex-shrink-0 ${
//               member.pct < 60 ? 'text-red-500' : 'text-slate-700'
//             }`}>
//               {member.pct}%
//             </span>
//           </motion.div>
//         ))}
//       </motion.div>
//       <p className="font-sans text-xs text-slate-400 mt-4">
//         <span className="inline-flex items-center gap-1.5">
//           <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
//           David B. is significantly behind — follow-up recommended
//         </span>
//       </p>
//     </div>
//   );
// }

// ── Card 3 — Overdue Documents in Dept (pure layout, no chart) ────────────────
function OverdueDocsCard() {
  const total = 48;
  const overdue = DEPT_OVERDUE_DOCS.length;
  const pct = (overdue / total) * 100;

  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-3">Overdue in Department</h3>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-6xl font-black text-red-500 leading-none">{overdue}</span>
        <span className="font-display text-xl font-bold text-slate-400">Overdue</span>
      </div>
      <p className="font-sans text-xs text-slate-400 mb-3">Out of {total} active documents ({pct.toFixed(1)}%)</p>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full bg-red-400" style={{ width: `${pct}%` }} />
      </div>
      <motion.div
        className="divide-y divide-white/30"
        variants={STAGGER} initial="hidden" animate="visible"
      >
        {DEPT_OVERDUE_DOCS.map((item, i) => (
          <motion.div
            key={i} className="flex items-center gap-3 py-3"
            variants={LIST_ITEM_REVEAL}
            whileHover={{ x: 2 }} transition={SPRING_ROW}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">{item.assignee}</p>
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

// ── Card 4 — Department Activity Trend ────────────────────────────────────────
// function DeptActivityCard({ primary }: { primary: string }) {
//   return (
//     <div style={CARD}>
//       <h3 className="font-display font-bold text-lg text-gray-800 mb-4">Dept Activity — 30 Days</h3>
//       <ResponsiveContainer width="100%" height={140}>
//         <AreaChart data={DEPT_VOL_30D} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
//           <defs>
//             <linearGradient id="deptGrad" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="5%"  stopColor={primary} stopOpacity={0.18} />
//               <stop offset="95%" stopColor={primary} stopOpacity={0}    />
//             </linearGradient>
//           </defs>
//           <CartesianGrid strokeDasharray="6 6" stroke="rgba(148,163,184,0.15)" vertical={false} />
//           <XAxis
//             dataKey="d"
//             tick={{ fontSize: 9, fill: 'rgb(148 163 184)' }}
//             axisLine={false} tickLine={false} interval={6}
//           />
//           <YAxis tick={{ fontSize: 9, fill: 'rgb(148 163 184)' }} axisLine={false} tickLine={false} width={28} />
//           <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
//           <Area
//             type="monotone" dataKey="v"
//             stroke={primary} strokeWidth={2.5}
//             fill="url(#deptGrad)" dot={false}
//             activeDot={{ r: 5, fill: primary, strokeWidth: 3, stroke: '#fff' }}
//           />
//         </AreaChart>
//       </ResponsiveContainer>
//       {/* 3 inline pulse stats */}
//       <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/30">
//         {[
//           { label: 'Submitted',       val: '28' },
//           { label: 'Avg Processing',  val: '4.4d' },
//           { label: 'On-time Rate',    val: '81%' },
//         ].map((s, i) => (
//           <div key={i}>
//             <p className="font-display text-xl font-black text-slate-800">{s.val}</p>
//             <p className="font-sans text-[10px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// ── Approval Rate (Dept — 78%) ────────────────────────────────────────────────
function ApprovalRateCard({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div style={CARD}>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-4">Dept Approval Rate</h3>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-display text-5xl font-black tracking-tighter" style={{ color: secondary }}>78%</span>
        <span className="font-sans text-sm text-slate-400 font-bold uppercase tracking-widest">Approved</span>
      </div>
      <div className="h-2 rounded-full bg-white/60 overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }} animate={{ width: '78%' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ backgroundColor: primary }}
        />
      </div>
      <div className="flex gap-8">
        <div>
          <span className="font-display text-xl font-black text-red-500">17%</span>
          <p className="font-sans text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Rejected</p>
        </div>
        <div>
          <span className="font-display text-xl font-black text-amber-500">5%</span>
          <p className="font-sans text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Returned</p>
        </div>
      </div>
    </div>
  );
}

// ── Dept View layout ──────────────────────────────────────────────────────────
// export default function DeptView({ primary, secondary }: { primary: string; secondary: string }) {
//   return (
//     <motion.div
//       className="grid grid-cols-2 gap-4"
//       variants={STAGGER} initial="hidden" animate="visible"
//     >
//       <motion.div variants={FADE_UP} className="flex flex-col gap-4">
//         <StageFunnelCard primary={primary} />
//         <OverdueDocsCard />
//       </motion.div>
//       <motion.div variants={FADE_UP} className="flex flex-col gap-4">
//         <DeptActivityCard primary={primary} />
//         <TeamCompletionCard primary={primary} />
//         <ApprovalRateCard primary={primary} secondary={secondary} />
//       </motion.div>
//     </motion.div>
//   );
// }
