import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, Calendar, AlertTriangle,
  TrendingUp, Loader2, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getHRAnalytics } from '@/lib/api/hr';
import type { HRAnalytics } from '@/types/hr';

const CHART_COLORS = ['#1e5631', '#febb00', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];
const CHART_BG_CLASSES = [
  'bg-[#1e5631]', 'bg-[#febb00]', 'bg-[#3b82f6]',
  'bg-[#ef4444]', 'bg-[#8b5cf6]', 'bg-[#f59e0b]',
] as const;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity',
  paternity: 'Paternity', compassionate: 'Compassionate', unpaid: 'Unpaid',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#1e5631]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Failed to load HR analytics</p>
      </div>
    );
  }

  const pendingLeave = data.leave_by_status.find(s => s.status === 'pending')?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600 mt-1">Staff records, leave management and workforce analytics</p>
        </div>
        <Button asChild className="bg-[#1e5631] hover:bg-[#1e5631]/90">
          <Link to="/admin/hr/staff">
            View Staff Directory <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><Users className="h-6 w-6 text-[#1e5631]" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold">{data.total_staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg"><UserCheck className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Active Staff</p>
                <p className="text-2xl font-bold">{data.active_staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg"><Calendar className="h-6 w-6 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Pending Leave</p>
                <p className="text-2xl font-bold">{pendingLeave}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Contracts Expiring (90d)</p>
                <p className="text-2xl font-bold">{data.contracts_expiring_in_90_days}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Expiry Warning */}
      {data.contracts_expiring_in_30_days > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-red-800 text-sm">
            <span className="font-semibold">{data.contracts_expiring_in_30_days} contract(s)</span> expiring within
            30 days. <Link to="/admin/hr/staff" className="underline">Review staff records</Link>
          </p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Headcount by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.staff_by_department.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No department data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.staff_by_department} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="department_name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e5631" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Leave Requests by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.leave_by_type.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No leave data yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={data.leave_by_type} dataKey="count" nameKey="leave_type" cx="50%" cy="50%" outerRadius={80}>
                      {data.leave_by_type.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, LEAVE_TYPE_LABELS[n as string] ?? n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {data.leave_by_type.map((item, i) => (
                    <div key={item.leave_type} className="flex items-center gap-2 text-sm">
                      <span className={`h-3 w-3 rounded-full shrink-0 ${CHART_BG_CLASSES[i % CHART_BG_CLASSES.length]}`} />
                      <span className="text-gray-600">{LEAVE_TYPE_LABELS[item.leave_type] ?? item.leave_type}</span>
                      <span className="font-semibold ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employment Type + Leave Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Employment Type Breakdown</CardTitle></CardHeader>
          <CardContent>
            {data.staff_by_employment_type.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No HR profiles created yet</p>
            ) : (
              <div className="space-y-3">
                {data.staff_by_employment_type.map((item, i) => (
                  <div key={item.employment_type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${CHART_BG_CLASSES[i % CHART_BG_CLASSES.length]}`} />
                      <span className="text-sm capitalize">{item.employment_type.replace('_', ' ')}</span>
                    </div>
                    <span className="font-semibold text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leave Request Status Summary</CardTitle></CardHeader>
          <CardContent>
            {data.leave_by_status.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No leave requests yet</p>
            ) : (
              <div className="space-y-3">
                {data.leave_by_status.map(item => (
                  <div key={item.status} className="flex items-center justify-between">
                    <Badge className={STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-600'}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <span className="font-semibold text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Expiry Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Contract Expiry Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-3xl font-bold text-red-700">{data.contracts_expiring_in_30_days}</p>
              <p className="text-sm text-red-600 mt-1">Within 30 days</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-3xl font-bold text-amber-700">{data.contracts_expiring_in_60_days}</p>
              <p className="text-sm text-amber-600 mt-1">Within 60 days</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-3xl font-bold text-yellow-700">{data.contracts_expiring_in_90_days}</p>
              <p className="text-sm text-yellow-600 mt-1">Within 90 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
