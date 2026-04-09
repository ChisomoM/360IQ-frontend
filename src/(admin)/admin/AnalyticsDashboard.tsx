import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, FileText, Download, Calendar, Filter, AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { toast } from 'sonner';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';

// Skeleton Loaders
const ChartSkeleton: React.FC = () => (
  <div className="p-6 space-y-4">
    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
    <div className="h-300 bg-gray-100 rounded animate-pulse" />
  </div>
);

const MetricCardSkeleton: React.FC = () => (
  <Card className="bg-gradient-to-br from-gray-200 to-gray-300 border-0">
    <CardHeader className="pb-2">
      <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="h-8 w-16 bg-gray-300 rounded animate-pulse" />
      <div className="h-3 w-24 bg-gray-300 rounded animate-pulse" />
    </CardContent>
  </Card>
);

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  'Approved': '#10b981',
  'Pending': '#f59e0b',
  'Rejected': '#ef4444',
  'Signed': '#3b82f6',
  'Processing': '#8b5cf6',
  'Active': '#10b981',
  'Expiring': '#f59e0b',
  'Expired': '#ef4444',
};

interface AnalyticsDashboardProps {
  isLoading?: boolean;
  isError?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isLoading = false, isError = false }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last_6_months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Permission checks
  const canViewAnalytics = hasPermission(user?.permissions || [], PERMISSIONS['analytics.read']);
  const canExportAnalytics = hasPermission(user?.permissions || [], PERMISSIONS['analytics.export']);
  const canViewPayments = hasPermission(user?.permissions || [], PERMISSIONS['payments.read']);
  const canViewAudit = hasPermission(user?.permissions || [], PERMISSIONS['audit.read']);
  const canViewMultiDept = hasPermission(user?.permissions || [], PERMISSIONS['departments.read']);

  // Filter department selector visibility
  const userDepartment = user?.departments?.[0] || null;
  const showDepartmentFilter = canViewMultiDept;

  const handleExport = () => {
    if (!canExportAnalytics) {
      toast.error('You do not have permission to export analytics');
      return;
    }
    toast.success('Exporting analytics data...');
    // Mock export - in production, integrate with real PDF/Excel generation
  };

  const handleRefresh = () => {
    toast.success('Analytics data refreshed');
  };

  if (!canViewAnalytics) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-semibold text-gray-800">
          You do not have permission to view analytics
        </h1>
        <p className="text-gray-600">Please contact your administrator</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <h1 className="text-2xl font-semibold text-gray-800">
          Something went wrong
        </h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Document and workflow analytics across departments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>

          {showDepartmentFilter && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="registry">Registry</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="tenantPrimary"
            size="sm"
            onClick={handleExport}
            disabled={!canExportAnalytics}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        // Loading state with skeletons
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : (
        <>
          {/* Summary Metrics */}
          {canViewPayments && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium opacity-90">Total Documents</div>
                    <FileText className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1,245</div>
                  <p className="text-xs opacity-80 mt-1">This period</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium opacity-90">Processed</div>
                    <TrendingUp className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">892</div>
                  <p className="text-xs opacity-80 mt-1">71.6% completion</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium opacity-90">Avg Processing</div>
                    <BarChart3 className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2.3 days</div>
                  <p className="text-xs opacity-80 mt-1">Per document</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Finance Department Analytics */}
          {(!selectedDepartment || selectedDepartment === 'all' || selectedDepartment === 'finance') && canViewPayments && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invoice Volume */}
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Invoice Volume & Value
                  </CardTitle>
                  <CardDescription>Monthly invoice processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={financialsData.invoices}>
                      <defs>
                        <linearGradient id="colorInvoice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorInvoice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Invoice Status */}
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Invoice Status Breakdown
                  </CardTitle>
                  <CardDescription>Current distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={financialsData.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.status}: ${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {financialsData.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Registry Department Analytics */}
          {(!selectedDepartment || selectedDepartment === 'all' || selectedDepartment === 'registry') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Submissions Trend */}
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Submissions & Processing
                  </CardTitle>
                  <CardDescription>Monthly submission processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={registryData.submissions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8b5cf6" name="Submitted" />
                      <Bar dataKey="processed" fill="#10b981" name="Processed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Processing Time Distribution */}
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Processing Time Distribution
                  </CardTitle>
                  <CardDescription>Days to process documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={registryData.processingTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* HR Department Analytics */}
          {(!selectedDepartment || selectedDepartment === 'all' || selectedDepartment === 'hr') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contract Status */}
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Contract Status Trend
                  </CardTitle>
                  <CardDescription>Active, expiring, and expired contracts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hrData.contracts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="expiring" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="expired" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Signature Status */}
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-600" />
                    Signature Status
                  </CardTitle>
                  <CardDescription>Document signature completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={hrData.signatures}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.status}: ${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {hrData.signatures.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Analysis Panel */}
          <AIAnalysisPanel />
        </>
      )}
    </div>
  );
};
