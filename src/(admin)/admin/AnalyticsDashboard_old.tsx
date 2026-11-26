import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, FileText, Download, Calendar, Filter, AlertCircle, RefreshCw, GraduationCap } from '@/components/icons';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { toast } from 'sonner';

// Type definitions for document analytics
interface DocumentMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  period: string;
  count: number;
  [key: string]: string | number;
}

// Department-specific dummy data for document workflows
const financialsData = {
  invoices: [
    { month: 'Jan', count: 45, value: 125000 },
    { month: 'Feb', count: 52, value: 145000 },
    { month: 'Mar', count: 48, value: 135000 },
    { month: 'Apr', count: 65, value: 175000 },
    { month: 'May', count: 70, value: 185000 },
    { month: 'Jun', count: 85, value: 220000 },
  ],
  statusBreakdown: [
    { status: 'Approved', count: 285, percentage: 65 },
    { status: 'Pending', count: 95, percentage: 22 },
    { status: 'Rejected', count: 60, percentage: 13 },
  ],
};

const registryData = {
  submissions: [
    { month: 'Jan', count: 120, processed: 95 },
    { month: 'Feb', count: 135, processed: 110 },
    { month: 'Mar', count: 128, processed: 115 },
    { month: 'Apr', count: 145, processed: 132 },
    { month: 'May', count: 152, processed: 140 },
    { month: 'Jun', count: 165, processed: 155 },
  ],
  processingTime: [
    { day: 1, count: 25 },
    { day: 2, count: 45 },
    { day: 3, count: 55 },
    { day: 4, count: 35 },
    { day: 5, count: 28 },
    { day: '6+', count: 18 },
  ],
};

const hrData = {
  contracts: [
    { month: 'Jan', active: 80, expiring: 12, expired: 3 },
    { month: 'Feb', active: 82, expiring: 10, expired: 2 },
    { month: 'Mar', active: 85, expiring: 14, expired: 1 },
    { month: 'Apr', active: 88, expiring: 16, expired: 4 },
    { month: 'May', active: 90, expiring: 12, expired: 2 },
    { month: 'Jun', active: 92, expiring: 18, expired: 3 },
  ],
  signatures: [
    { status: 'Signed', count: 285, percentage: 78 },
    { status: 'Pending', count: 65, percentage: 18 },
    { status: 'Rejected', count: 12, percentage: 4 },
  ],
};

// Legacy enrollment data kept for reference
const dummyStatusDistribution = {
  status_counts: [
    { status: 'active', count: 450, percentage: 62.5 },
    { status: 'suspended', count: 100, percentage: 13.9 },
    { status: 'graduated', count: 120, percentage: 16.7 },
    { status: 'withdrawn', count: 50, percentage: 6.9 },
  ],
  total: 720,
};

const dummyEnrollmentTrends = {
  series: [
    { period: '2024-09', count: 45, change_pct: 0.0, cumulative: 45 },
    { period: '2024-10', count: 52, change_pct: 15.6, cumulative: 97 },
    { period: '2024-11', count: 48, change_pct: -7.7, cumulative: 145 },
    { period: '2024-12', count: 65, change_pct: 35.4, cumulative: 210 },
    { period: '2025-01', count: 70, change_pct: 7.7, cumulative: 280 },
    { period: '2025-02', count: 85, change_pct: 21.4, cumulative: 365 },
    { period: '2025-03', count: 92, change_pct: 8.2, cumulative: 457 },
    { period: '2025-04', count: 88, change_pct: -4.3, cumulative: 545 },
    { period: '2025-05', count: 95, change_pct: 8.0, cumulative: 640 },
    { period: '2025-06', count: 80, change_pct: -15.8, cumulative: 720 },
  ],
  summary: {
    total: 720,
    average_per_period: 72.0,
    period_count: 10,
    growth_rate: 15.3,
  },
};

const dummyApplicationVolume = {
  series: [
    { period: '2024-09', status_counts: { pending: 15, under_review: 20, approved: 35, rejected: 10, enrolled: 30 }, total: 110 },
    { period: '2024-10', status_counts: { pending: 18, under_review: 25, approved: 40, rejected: 12, enrolled: 38 }, total: 133 },
    { period: '2024-11', status_counts: { pending: 20, under_review: 22, approved: 38, rejected: 8, enrolled: 35 }, total: 123 },
    { period: '2024-12', status_counts: { pending: 25, under_review: 30, approved: 50, rejected: 15, enrolled: 45 }, total: 165 },
    { period: '2025-01', status_counts: { pending: 28, under_review: 35, approved: 55, rejected: 18, enrolled: 50 }, total: 186 },
    { period: '2025-02', status_counts: { pending: 30, under_review: 40, approved: 65, rejected: 20, enrolled: 60 }, total: 215 },
  ],
  status_summary: { pending: 136, under_review: 172, approved: 283, rejected: 83, enrolled: 258 },
  total: 932,
};

const dummyApprovalRates = {
  overall: {
    total_reviewed: 849,
    approved: 683,
    rejected: 166,
    approval_rate: 80.4,
    rejection_rate: 19.6,
  },
  by_program: [
    { programme: 'BSc Computer Science', total_applications: 250, approved: 210, rejected: 40, approval_rate: 84.0 },
    { programme: 'BSc Information Systems', total_applications: 180, approved: 145, rejected: 35, approval_rate: 80.6 },
    { programme: 'BA Business Administration', total_applications: 200, approved: 155, rejected: 45, approval_rate: 77.5 },
    { programme: 'BSc Mathematics', total_applications: 120, approved: 98, rejected: 22, approval_rate: 81.7 },
    { programme: 'BA Economics', total_applications: 99, approved: 75, rejected: 24, approval_rate: 75.8 },
  ],
  by_reviewer: [
    { reviewer_id: '1', reviewer_name: 'Dr. John Banda', total_reviewed: 285, approved: 235, rejected: 50, approval_rate: 82.5, avg_processing_days: 4.2 },
    { reviewer_id: '2', reviewer_name: 'Prof. Mary Mwale', total_reviewed: 310, approved: 252, rejected: 58, approval_rate: 81.3, avg_processing_days: 5.1 },
    { reviewer_id: '3', reviewer_name: 'Dr. James Phiri', total_reviewed: 254, approved: 196, rejected: 58, approval_rate: 77.2, avg_processing_days: 6.3 },
  ],
  time_period: '2024-09-01 to 2025-06-30',
};

const dummyProgramPopularity = {
  programs: [
    { programme: 'BSc Computer Science', department_id: '1', department_name: 'Computer Science', total_applications: 250, approved: 210, enrolled: 185, conversion_rate: 74.0, rank: 1 },
    { programme: 'BA Business Administration', department_id: '2', department_name: 'Business', total_applications: 200, approved: 155, enrolled: 140, conversion_rate: 70.0, rank: 2 },
    { programme: 'BSc Information Systems', department_id: '1', department_name: 'Computer Science', total_applications: 180, approved: 145, enrolled: 125, conversion_rate: 69.4, rank: 3 },
    { programme: 'BSc Mathematics', department_id: '3', department_name: 'Mathematics', total_applications: 120, approved: 98, enrolled: 88, conversion_rate: 73.3, rank: 4 },
    { programme: 'BA Economics', department_id: '4', department_name: 'Economics', total_applications: 99, approved: 75, enrolled: 65, conversion_rate: 65.7, rank: 5 },
  ],
  total: 849,
};

const dummyApplicationFunnel = {
  stages: [
    { stage: 'pending' as const, count: 932, percentage: 100.0, drop_off_count: 0, drop_off_pct: 0.0, conversion_pct: 100.0 },
    { stage: 'under_review' as const, count: 796, percentage: 85.4, drop_off_count: 136, drop_off_pct: 14.6, conversion_pct: 85.4 },
    { stage: 'approved' as const, count: 683, percentage: 73.3, drop_off_count: 113, drop_off_pct: 14.2, conversion_pct: 73.3 },
    { stage: 'enrolled' as const, count: 603, percentage: 64.7, drop_off_count: 80, drop_off_pct: 11.7, conversion_pct: 64.7 },
  ],
  total_started: 932,
  total_enrolled: 603,
  overall_conversion: 64.7,
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];
const STATUS_COLORS: Record<string, string> = {
  active: 'hsl(var(--primary))',
  suspended: 'var(--caution)',
  graduated: 'var(--positive)',
  withdrawn: 'var(--risk)',
  pending: '#94a3b8',
  under_review: 'var(--caution)',
  approved: 'var(--positive)',
  rejected: 'var(--risk)',
  enrolled: 'hsl(var(--primary))',
};

export const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('last_6_months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  return (
    <div className="p-6 space-y-6 bg-surface-0 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enrollment, applications, and program performance metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="cs">Computer Science</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="math">Mathematics</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="tenantPrimary" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-white shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Total Students</div>
              <Users className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dummyStatusDistribution.total}</div>
            <p className="text-xs opacity-80 mt-1">Across all programs</p>
          </CardContent>
        </Card>

        <Card className="bg-positive text-white shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Applications</div>
              <FileText className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dummyApplicationVolume.total}</div>
            <p className="text-xs opacity-80 mt-1">Total submissions</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Approval Rate</div>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dummyApprovalRates.overall.approval_rate.toFixed(1)}%</div>
            <p className="text-xs opacity-80 mt-1">{dummyApprovalRates.overall.approved} approved</p>
          </CardContent>
        </Card>

        <Card className="bg-caution text-white shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Enrolled</div>
              <GraduationCap className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dummyApplicationFunnel.total_enrolled}</div>
            <p className="text-xs opacity-80 mt-1">{dummyApplicationFunnel.overall_conversion.toFixed(1)}% conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Enrollment Trends & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <Card className="shadow-md border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Enrollment Trends
            </CardTitle>
            <CardDescription>Monthly enrollment over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dummyEnrollmentTrends.series}>
                <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{dummyEnrollmentTrends.summary.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg/Month</p>
                <p className="text-lg font-semibold">{dummyEnrollmentTrends.summary.average_per_period.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Growth Rate</p>
                <p className="text-lg font-semibold text-positive">+{dummyEnrollmentTrends.summary.growth_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="shadow-md border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-positive" />
              Student Status Distribution
            </CardTitle>
            <CardDescription>Current enrollment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dummyStatusDistribution.status_counts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dummyStatusDistribution.status_counts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {dummyStatusDistribution.status_counts.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status.status] || COLORS[index % COLORS.length] }} />
                    <span className="capitalize">{status.status}</span>
                  </div>
                  <div className="font-semibold">{status.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Application Volume & Approval Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Volume */}
        <Card className="shadow-md border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-signal-text" />
              Application Volume
            </CardTitle>
            <CardDescription>Application trends by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dummyApplicationVolume.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="status_counts.pending" fill={STATUS_COLORS.pending} name="Pending" stackId="a" />
                <Bar dataKey="status_counts.under_review" fill={STATUS_COLORS.under_review} name="Under Review" stackId="a" />
                <Bar dataKey="status_counts.approved" fill={STATUS_COLORS.approved} name="Approved" stackId="a" />
                <Bar dataKey="status_counts.enrolled" fill={STATUS_COLORS.enrolled} name="Enrolled" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Approval Rates by Program */}
        <Card className="shadow-md border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Approval Rates by Program
            </CardTitle>
            <CardDescription>Top performing programs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dummyApprovalRates.by_program} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="programme" type="category" tick={{ fontSize: 11 }} width={150} />
                <Tooltip />
                <Bar dataKey="approval_rate" fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Application Funnel & Program Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Funnel */}
        <Card className="shadow-md border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-signal-text" />
              Application Funnel
            </CardTitle>
            <CardDescription>Stage progression with drop-off analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dummyApplicationFunnel.stages.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-semibold">{stage.stage.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">
                      {stage.count} ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary flex items-center justify-end pr-2 text-white text-xs font-bold"
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.drop_off_count > 0 && (
                        <span>↓ {stage.drop_off_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">
                Overall Conversion Rate: {dummyApplicationFunnel.overall_conversion.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {dummyApplicationFunnel.total_enrolled} enrolled out of {dummyApplicationFunnel.total_started} applications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Program Popularity */}
        <Card className="shadow-md border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-text" />
              Program Popularity Ranking
            </CardTitle>
            <CardDescription>Top programs by applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dummyProgramPopularity.programs.map((program, index) => (
                <div key={program.programme} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {program.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{program.programme}</p>
                    <p className="text-xs text-muted-foreground">{program.department_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{program.total_applications}</p>
                    <p className="text-xs text-positive">{program.conversion_rate.toFixed(1)}% conv</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviewer Performance Table */}
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle>Reviewer Performance</CardTitle>
          <CardDescription>Application processing metrics by reviewer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">Reviewer</th>
                  <th className="pb-2 font-semibold text-right">Reviewed</th>
                  <th className="pb-2 font-semibold text-right">Approved</th>
                  <th className="pb-2 font-semibold text-right">Rejected</th>
                  <th className="pb-2 font-semibold text-right">Approval Rate</th>
                  <th className="pb-2 font-semibold text-right">Avg Days</th>
                </tr>
              </thead>
              <tbody>
                {dummyApprovalRates.by_reviewer.map((reviewer) => (
                  <tr key={reviewer.reviewer_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{reviewer.reviewer_name}</td>
                    <td className="py-3 text-right">{reviewer.total_reviewed}</td>
                    <td className="py-3 text-right text-positive">{reviewer.approved}</td>
                    <td className="py-3 text-right text-red-600">{reviewer.rejected}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-positive-tint text-positive">
                        {reviewer.approval_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right">{reviewer.avg_processing_days.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
