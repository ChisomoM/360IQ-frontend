import { useState, useEffect } from 'react';
import {
  Users, UserCheck, Calendar, AlertTriangle, ArrowUpRight, Clock,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getHRAnalytics } from '@/lib/api/hr';
import type { HRAnalytics } from '@/types/hr';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiTile } from '@/components/shared/KpiTile';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity',
  paternity: 'Paternity', compassionate: 'Compassionate', unpaid: 'Unpaid',
};

const AXIS_TICK = { fontSize: 12, fill: 'var(--chart-axis)' };

const TOOLTIP_PROPS = {
  cursor: { fill: 'var(--surface-2)' },
  contentStyle: {
    background: 'var(--surface-1)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-raised)',
    color: 'var(--text-primary)',
  },
  itemStyle: { color: 'var(--text-primary)' },
};

const sentenceCase = (value: string) => {
  const words = value.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function HRDashboard() {
  const [data, setData] = useState<HRAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHRAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const header = (
    <PageHeader
      title="HR dashboard"
      description="Staff records, leave and workforce figures."
      actions={
        <Button asChild>
          <Link to="/admin/hr/staff">
            View staff directory <ArrowUpRight />
          </Link>
        </Button>
      }
    />
  );

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <SectionCard padded={false}>
          <SectionBody loading={loading} error={!data ? 'Could not load HR figures. Refresh the page to try again.' : undefined}>
            {null}
          </SectionBody>
        </SectionCard>
      </div>
    );
  }

  const pendingLeave = data.leave_by_status.find(s => s.status === 'pending')?.count ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {header}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiTile label="Total staff" value={data.total_staff} icon={<Users size={18} />} />
        <KpiTile label="Active staff" value={data.active_staff} icon={<UserCheck size={18} />} />
        <KpiTile label="Pending leave" value={pendingLeave} icon={<Calendar size={18} />} />
        <KpiTile label="Contracts ending in 90 days" value={data.contracts_expiring_in_90_days} icon={<Clock size={18} />} />
      </div>

      {/* Contract Expiry Warning */}
      {data.contracts_expiring_in_30_days > 0 && (
        <div className="flex items-center gap-3 bg-risk-tint rounded-md px-4 py-3">
          <AlertTriangle size={18} className="text-risk shrink-0" />
          <p className="text-risk text-sm">
            <span className="font-semibold">
              {data.contracts_expiring_in_30_days} {data.contracts_expiring_in_30_days === 1 ? 'contract ends' : 'contracts end'}
            </span>{' '}
            within 30 days. <Link to="/admin/hr/staff" className="font-semibold underline">Review staff records</Link>
          </p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <SectionCard eyebrow="Staff" title="Headcount by department">
          {data.staff_by_department.length === 0 ? (
            <EmptyState className="py-6" title="No department data yet" description="Headcount appears once staff are assigned to departments." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.staff_by_department} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department_name" width={110} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} />
                <Bar dataKey="count" name="Staff" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard eyebrow="Requests" title="Leave requests by type">
          {data.leave_by_type.length === 0 ? (
            <EmptyState className="py-6" title="No leave data yet" description="Leave types appear once requests are submitted." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.leave_by_type} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="leave_type" width={110} tick={AXIS_TICK} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => LEAVE_TYPE_LABELS[v] ?? v}
                />
                <Tooltip {...TOOLTIP_PROPS} labelFormatter={(v) => LEAVE_TYPE_LABELS[String(v)] ?? String(v)} />
                <Bar dataKey="count" name="Requests" radius={[0, 4, 4, 0]} maxBarSize={44}>
                  {data.leave_by_type.map((item) => (
                    <Cell key={item.leave_type} fill="var(--chart-2)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Employment Type + Leave Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <SectionCard title="Staff by employment type">
          {data.staff_by_employment_type.length === 0 ? (
            <EmptyState className="py-6" title="No HR profiles yet" description="Create staff profiles to see the split." />
          ) : (
            <ul className="divide-y divide-line">
              {data.staff_by_employment_type.map((item) => (
                <li key={item.employment_type} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-secondary">{sentenceCase(item.employment_type)}</span>
                  <span className="font-mono text-text-primary">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Leave requests by status">
          {data.leave_by_status.length === 0 ? (
            <EmptyState className="py-6" title="No leave requests yet" description="Requests appear here once staff submit them." />
          ) : (
            <ul className="divide-y divide-line">
              {data.leave_by_status.map(item => (
                <li key={item.status} className="flex items-center justify-between py-2.5">
                  <StatusBadge status={item.status} />
                  <span className="font-mono text-sm text-text-primary">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Contract Expiry Timeline */}
      <section aria-label="Contracts ending soon" className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text-primary">Contracts ending soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiTile label="Within 30 days" value={data.contracts_expiring_in_30_days} icon={<AlertTriangle size={18} className="text-risk" />} />
          <KpiTile label="Within 60 days" value={data.contracts_expiring_in_60_days} icon={<Clock size={18} className="text-caution" />} />
          <KpiTile label="Within 90 days" value={data.contracts_expiring_in_90_days} icon={<Calendar size={18} />} />
        </div>
      </section>
    </div>
  );
}
