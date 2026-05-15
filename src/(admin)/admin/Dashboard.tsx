import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, ResponsiveContainer,
} from 'recharts';
import {
  Search, Bell, Mail, ChevronDown,
  FileText, CheckSquare, AlertCircle, AlertTriangle,
  Clock, Building2, Users, User, Check,
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { DocumentSearchModal } from '@/components/DocumentSearchModal';
import type { AdminLayoutContext } from '@/layouts/AdminLayout';
import { useAuth } from '@/lib/context/useAuth';

import BossView  from './BossView';
import DeptView  from './DeptView';
import AdminView from './AdminView';
import { RecentUploadsSection } from './RecentUploadsSection';

import {
  BOSS_STATS, BOSS_MINI,
  DEPT_STATS, DEPT_MINI,
  ADMIN_STATS, ADMIN_MINI,
  SHARED_PENDING, SHARED_ACTIVITY,
} from './mockData';
import type { RoleType, UrgencyType } from './mockData';

// ── Animation constants ───────────────────────────────────────────────────────
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
const SPRING_CARD = { type: 'spring', stiffness: 400, damping: 28 } as const;
const SPRING_BTN  = { type: 'spring', stiffness: 500, damping: 30 } as const;
const SPRING_ROW  = { type: 'spring', stiffness: 400, damping: 30 } as const;
const SPRING_PILL = { type: 'spring', stiffness: 400, damping: 28 } as const;

const CARD: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 6%, white)',
  borderRadius: '1rem',
  border: '1px solid rgb(241 245 249)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  padding: '1.25rem',
};

// ── Tenant colour hook (MutationObserver — fires after branding injection) ─────
function useTenantColor(varName: string, fallback: string): string {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (v) setColor(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => obs.disconnect();
  }, [varName]);
  return color;
}

// ── Role config ───────────────────────────────────────────────────────────────
const createRoles = (userName: string) => [
  {
    key:         'boss',
    label:       'System Admin',
    contextLine: '7 overdue · 24 pending across org',
    icon:        Building2,
    userName:    userName,
    userTitle:   'System Admin',
  },
  {
    key:         'dept',
    label:       'Department Head',
    contextLine: 'Finance Department · 3 overdue · 9 pending',
    icon:        Users,
    userName:    userName,
    userTitle:   'Director',
  },
  {
    key:         'admin',
    label:       'Regular Admin',
    contextLine: 'Your workspace · 5 pending · 1 overdue',
    icon:        User,
    userName:    userName,
    userTitle:   'Admin',
  },
];

// ── Urgency badge styles ──────────────────────────────────────────────────────
const URGENCY_STYLE: Record<UrgencyType, string> = {
  'Urgent':    'bg-red-50 text-red-600',
  'Due Today': 'bg-amber-50 text-amber-600',
  'Pending':   'bg-slate-100 text-slate-500',
};

const PANEL_ICON_MAP = {
  file:  FileText,
  check: CheckSquare,
  alert: AlertCircle,
} as const;

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  chartType: 'bar' | 'line';
  chartData: { m: string; v: number }[];
  primary: string;
  secondary: string;
}

function StatCard({
  icon: Icon, label, value, trend, trendUp, chartType, chartData, primary, secondary,
}: StatCardProps) {
  return (
    <motion.div
      style={CARD}
      className="flex items-center justify-between gap-4 hover:shadow-md transition-shadow duration-200 cursor-default"
      variants={FADE_UP}
      whileHover={{ y: -3 }}
      transition={SPRING_CARD}
    >
      <div className="flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${secondary}26` }}
        >
          <Icon size={18} style={{ color: primary }} />
        </div>
        <p className="font-sans text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display text-4xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          <span className={`font-sans text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        </div>
      </div>
      <div className="w-28 h-[68px] flex-shrink-0">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={9}>
              <XAxis hide dataKey="m" />
              <Bar dataKey="v" fill={primary} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis hide dataKey="m" />
              <Line
                type="monotone" dataKey="v"
                stroke={primary} strokeWidth={2.5}
                dot={{ r: 2.5, fill: primary, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

// ── ActivityPanel ─────────────────────────────────────────────────────────────
function ActivityPanel({ primary, secondary }: { primary: string; secondary: string }) {
  const [tab, setTab] = useState<'pending' | 'activity'>('pending');

  return (
    <div style={{ ...CARD, padding: 0 }} className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center px-6 pt-6 border-b border-slate-100">
        {(['pending', 'activity'] as const).map((t) => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-4 mr-8 font-sans text-sm font-bold relative whitespace-nowrap transition-colors ${
              tab === t ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={SPRING_BTN}
          >
            {t === 'pending' ? 'Pending Actions' : 'Recent Activity'}
            {tab === t && (
              <motion.span
                layoutId="activityTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                transition={SPRING_PILL}
              />
            )}
          </motion.button>
        ))}
      </div>
      {/* List */}
      <motion.div
        className="flex-1 divide-y divide-slate-50 px-6 py-2 overflow-y-auto"
        variants={STAGGER} initial="hidden" animate="visible"
        key={tab}
      >
        {tab === 'pending'
          ? SHARED_PENDING.map((item, i) => {
              const Icon = PANEL_ICON_MAP[item.iconKey];
              return (
                <motion.div
                  key={i} className="flex items-center gap-4 py-4"
                  variants={LIST_ITEM_REVEAL}
                  whileHover={{ x: 2 }} transition={SPRING_ROW}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${secondary}20` }}
                  >
                    <Icon size={16} style={{ color: primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-bold text-slate-800 truncate">{item.doc}</p>
                    <p className="font-sans text-xs text-slate-500 mt-1">{item.action}</p>
                  </div>
                  <span className={`font-sans text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider ${URGENCY_STYLE[item.urgency]}`}>
                    {item.urgency}
                  </span>
                </motion.div>
              );
            })
          : SHARED_ACTIVITY.map((item, i) => (
              <motion.div
                key={i} className="flex items-center gap-4 py-4"
                variants={LIST_ITEM_REVEAL}
                whileHover={{ x: 2 }} transition={SPRING_ROW}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: i % 2 === 0 ? primary : secondary,
                    color: i % 2 === 0 ? 'var(--tenant-primary-fg)' : 'var(--tenant-secondary-fg)',
                  }}
                >
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-slate-800 leading-snug">
                    <span className="font-bold">{item.name}</span>
                    {' '}{item.action}{' '}
                    <span className="font-bold">{item.doc}</span>
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1">{item.dept}</p>
                </div>
                <span className="font-sans text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                  {item.time}
                </span>
              </motion.div>
            ))}
      </motion.div>
    </div>
  );
}

// ── PageHeader (with profile dropdown role switcher) ──────────────────────────
interface PageHeaderProps {
  role: RoleType;
  onRoleChange: (r: RoleType) => void;
  primary: string;
  onSearchClick: () => void;
  userName: string;
}

function PageHeader({ role, onRoleChange, primary, onSearchClick, userName }: PageHeaderProps) {
  const [open, setOpen] = useState(false);
  const ROLES = createRoles(userName);
  const current = ROLES.find((r) => r.key === role)!;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display font-bold text-display-sm text-gray-900 tracking-tight leading-none">
          Welcome back, {userName}
        </h1>
        <p className="font-sans text-sm font-medium text-slate-500 mt-1.5">{dateStr}</p>
        <p className="font-sans text-xs text-slate-400 mt-0.5">{current.contextLine}</p>
      </div>

      <div className="flex items-center gap-5">
        {/* Icon buttons */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onSearchClick}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} transition={SPRING_BTN}
            aria-label="Search documents"
          >
            <Search size={18} strokeWidth={1.5} />
          </motion.button>
          {([Bell, Mail] as const).map((Icon, i) => (
            <motion.button
              key={i}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} transition={SPRING_BTN}
            >
              <Icon size={18} strokeWidth={1.5} />
            </motion.button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Profile pill + dropdown */}
        <div className="relative">
          {/* Click-outside trap */}
          {open && (
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          )}

          <motion.button
            className="flex items-center gap-3 cursor-pointer select-none relative z-20"
            onClick={() => setOpen(!open)}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={SPRING_BTN}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: primary,
                color: 'var(--tenant-primary-fg)',
              }}
            >
              CM
            </div>
            <div className="leading-none text-left">
              <div className="font-sans font-semibold text-sm text-slate-800">{current.userName}</div>
              <div className="font-sans text-xs text-slate-400 mt-1">{current.userTitle}</div>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-1"
            >
              <ChevronDown size={14} className="text-slate-400" />
            </motion.div>
          </motion.button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{    opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-100 p-1.5 z-20"
                style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
              >
                <p className="font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 py-1.5">
                  Demo: Switch Role
                </p>
                {ROLES.map((r) => {
                  const RIcon = r.icon;
                  const isActive = r.key === role;
                  return (
                    <motion.button
                      key={r.key}
                      onClick={() => { onRoleChange(r.key as RoleType); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                        isActive
                          ? 'bg-primary/10 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                      whileHover={{ x: 2 }} transition={SPRING_ROW}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isActive ? `${primary}25` : 'rgb(241 245 249)',
                        }}
                      >
                        <RIcon size={14} style={{ color: isActive ? primary : 'rgb(100 116 139)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-semibold leading-none">{r.label}</p>
                      </div>
                      {isActive && (
                        <Check size={13} style={{ color: primary }} className="flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Root DemoDashboard ────────────────────────────────────────────────────────
export default function DemoDashboard() {
  const navigate = useNavigate();
  const { sendChatMessage } = useOutletContext<AdminLayoutContext>();
  const { user } = useAuth();
  const firstName = user?.first_name || user?.firstName || 'there';

  const primary   = useTenantColor('--tenant-primary',   '#7C69FF');
  const secondary = useTenantColor('--tenant-secondary', '#03D8FD');
  const [role, setRole]           = useState<RoleType>('boss');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAIInsights = (title: string, context: string) => {
    sendChatMessage(`Analyse this dashboard data for me — "${title}": ${context}`);
  };

  const statsList  = role === 'boss' ? BOSS_STATS  : role === 'dept' ? DEPT_STATS  : ADMIN_STATS;
  const miniCharts = role === 'boss' ? BOSS_MINI   : role === 'dept' ? DEPT_MINI   : ADMIN_MINI;
  const statIcons  = [FileText, Clock, AlertTriangle] as const;
  const miniArrays = [miniCharts.docs, miniCharts.pending, miniCharts.overdue];

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <div className="px-8 py-6 max-w-[1600px] mx-auto">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <PageHeader
            role={role}
            onRoleChange={setRole}
            primary={primary}
            onSearchClick={() => setIsSearchOpen(true)}
            userName={firstName}
          />

          {/* ── View content — transitions on role change ───────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE_CUSTOM }}
            >
              <motion.div
                className="mt-6 grid grid-cols-3 gap-4"
                variants={STAGGER} initial="hidden" animate="visible"
              >
                {statsList.map((stat, i) => (
                  <StatCard
                    key={i}
                    icon={statIcons[i]}
                    label={stat.label}
                    value={stat.value}
                    trend={stat.trend}
                    trendUp={stat.trendUp}
                    chartType={stat.chartType}
                    chartData={miniArrays[i]}
                    primary={primary}
                    secondary={secondary}
                  />
                ))}
              </motion.div>

              {/* Body — 3-col grid: view (col-span-2) + ActivityPanel */}
              <div className="mt-4 grid grid-cols-3 gap-4 items-stretch">
                <div className="col-span-2">
                  {role === 'boss'  && (
                    <BossView
                      primary={primary}
                      secondary={secondary}
                      onAIInsights={handleAIInsights}
                    />
                  )}
                  {role === 'dept'  && (
                    <DeptView
                      primary={primary}
                      secondary={secondary}
                      onAIInsights={handleAIInsights}
                    />
                  )}
                  {role === 'admin' && (
                    <AdminView primary={primary} secondary={secondary} />
                  )}
                </div>
                <ActivityPanel primary={primary} secondary={secondary} />
              </div>

              {/* ── Recent Uploads — full width ──────────────────────────── */}
              <div className="mt-4">
                <RecentUploadsSection primary={primary} secondary={secondary} role={role} />
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* ── Consolidated search modal ──────────────────────────────────────── */}
      <DocumentSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={(doc) => {
          setIsSearchOpen(false);
          navigate(`/admin/documents/${doc.id}`);
        }}
      />
    </PageTransition>
  );
}
