import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis,
} from 'recharts';
import {
  Search, FileText, CheckSquare, AlertCircle, AlertTriangle, Clock,
} from '@/components/icons';
import { PageTransition } from '@/components/PageTransition';
import { DocumentSearchModal } from '@/components/DocumentSearchModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { KpiTile } from '@/components/shared/KpiTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AdminLayoutContext } from '@/layouts/AdminLayout';
import { useAuth } from '@/lib/context/useAuth';
import type { Tone } from '@/lib/status';

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

// ── Role config ───────────────────────────────────────────────────────────────
const ROLES: { key: RoleType; label: string; contextLine: string }[] = [
  { key: 'boss',  label: 'System admin',    contextLine: '7 overdue and 24 pending across the organisation.' },
  { key: 'dept',  label: 'Department head', contextLine: 'Finance department: 3 overdue and 9 pending.' },
  { key: 'admin', label: 'Regular admin',   contextLine: 'Your workspace: 5 pending and 1 overdue.' },
];

const URGENCY: Record<UrgencyType, { tone: Tone; label: string }> = {
  'Urgent':    { tone: 'risk',    label: 'Urgent' },
  'Due Today': { tone: 'caution', label: 'Due today' },
  'Pending':   { tone: 'neutral', label: 'Pending' },
};

const PANEL_ICON_MAP = {
  file:  FileText,
  check: CheckSquare,
  alert: AlertCircle,
} as const;

// ── Sparkline shown under a KPI value ─────────────────────────────────────────
function Sparkline({ type, data, color }: {
  type: 'bar' | 'line';
  data: { m: string; v: number }[];
  color: string;
}) {
  return (
    <span className="block h-8 w-24 flex-shrink-0" aria-hidden="true">
      {type === 'bar' ? (
        <BarChart width={96} height={32} data={data} barSize={9}>
          <XAxis hide dataKey="m" />
          <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : (
        <LineChart width={96} height={32} data={data} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
          <XAxis hide dataKey="m" />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      )}
    </span>
  );
}

// ── ActivityPanel ─────────────────────────────────────────────────────────────
function ActivityPanel() {
  return (
    <SectionCard title="Activity">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending actions</TabsTrigger>
          <TabsTrigger value="activity">Recent activity</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ul className="divide-y divide-line">
            {SHARED_PENDING.map((item, i) => {
              const Icon = PANEL_ICON_MAP[item.iconKey];
              return (
                <li key={i} className="flex items-center gap-3 py-3">
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
        </TabsContent>

        <TabsContent value="activity">
          <ul className="divide-y divide-line">
            {SHARED_ACTIVITY.map((item, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-pill bg-surface-2 text-xs font-semibold text-text-secondary" aria-hidden="true">
                  {item.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">{item.name}</span>
                    {' '}{item.action}{' '}
                    <span className="font-semibold text-text-primary">{item.doc}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">{item.dept}</p>
                </div>
                <span className="flex-shrink-0 whitespace-nowrap text-xs text-text-muted">{item.time}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </SectionCard>
  );
}

// ── Root DemoDashboard ────────────────────────────────────────────────────────
export default function DemoDashboard() {
  const navigate = useNavigate();
  const { sendChatMessage } = useOutletContext<AdminLayoutContext>();
  const { user } = useAuth();
  const firstName = user?.first_name || user?.firstName || 'there';

  const [role, setRole]           = useState<RoleType>('boss');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAIInsights = (title: string, context: string) => {
    sendChatMessage(`Analyse this dashboard data for me, "${title}": ${context}`);
  };

  const current    = ROLES.find((r) => r.key === role)!;
  const statsList  = role === 'boss' ? BOSS_STATS  : role === 'dept' ? DEPT_STATS  : ADMIN_STATS;
  const miniCharts = role === 'boss' ? BOSS_MINI   : role === 'dept' ? DEPT_MINI   : ADMIN_MINI;
  const statIcons: React.ElementType[] = [FileText, Clock, AlertTriangle];
  const miniArrays = [miniCharts.docs, miniCharts.pending, miniCharts.overdue];

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <PageHeader
          crumb={dateStr}
          title="Dashboard"
          description={`Welcome back, ${firstName}. ${current.contextLine}`}
          actions={
            <>
              <Button variant="secondary" onClick={() => setIsSearchOpen(true)}>
                <Search size={16} />
                Search documents
              </Button>
              <span className="text-xs text-text-muted">Demo view</span>
              <Select value={role} onValueChange={(v) => setRole(v as RoleType)}>
                <SelectTrigger className="w-48" aria-label="Demo view by role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statsList.map((stat, i) => {
            const Icon = statIcons[i];
            return (
              <KpiTile
                key={`${role}-${stat.label}`}
                label={stat.label}
                value={stat.value}
                icon={<Icon size={18} />}
                hint={
                  <span className="flex w-full items-end justify-between gap-3">
                    <span><span className="font-mono text-text-secondary">{stat.trend}</span> change</span>
                    <Sparkline
                      type={stat.chartType}
                      data={miniArrays[i]}
                      color={i === 2 ? 'var(--chart-risk)' : 'var(--chart-1)'}
                    />
                  </span>
                }
              />
            );
          })}
        </div>

        {/* Role view, with the activity panel beside it on wide screens */}
        <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[2fr_1fr]">
          <div className="min-w-0">
            {role === 'boss'  && <BossView onAIInsights={handleAIInsights} />}
            {role === 'dept'  && <DeptView onAIInsights={handleAIInsights} />}
            {role === 'admin' && <AdminView />}
          </div>
          <ActivityPanel />
        </div>

        <RecentUploadsSection role={role} />
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
