import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  CreditCard,
  ArrowUpRight,
  Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFinanceDashboard } from '@/lib/api/payments';
import type { DashboardData } from '@/types/finance';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FinanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await getFinanceDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-blue" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, revenue_trend, payment_type_breakdown, payment_method_breakdown, recent_activities } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of payments and revenue</p>
        </div>
        <Button asChild className="bg-primary-blue hover:bg-primary-blue/90">
          <Link to="/admin/finance/payments">
            View All Payments
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  K{stats.total_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.verified_count} verified payments
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Revenue</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">
                  K{stats.pending_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {stats.pending_count} awaiting verification
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">This Month</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  K{stats.monthly_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">Current month revenue</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Success Rate</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {stats.success_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Avg: K{stats.average_payment.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Payment Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payment_type_breakdown}
                    dataKey="total"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.type.replace('_', ' ')}: ${entry.percentage.toFixed(0)}%`}
                  >
                    {payment_type_breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payment_method_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {recent_activities.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {payment.student_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {payment.payment_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="font-semibold text-sm">K{payment.amount.toLocaleString()}</span>
                    <Badge 
                      variant={
                        payment.status === 'verified' ? 'default' : 
                        payment.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {stats.pending_count > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {stats.pending_count} payment{stats.pending_count !== 1 ? 's' : ''} awaiting verification
                  </p>
                  <p className="text-sm text-gray-600">
                    Total pending amount: K{stats.pending_revenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button asChild variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                <Link to="/admin/finance/payments?status=pending">
                  Review Pending
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
