import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Loader2,
  DollarSign
} from 'lucide-react';
import { getPayments, exportPaymentsToCSV, downloadCSV } from '@/lib/api/payments';
import type { Payment, PaymentTypeBreakdown, PaymentMethodBreakdown } from '@/types/finance';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinanceReports() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = exportPaymentsToCSV(payments);
    const filename = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csv, filename);
    toast.success('Report exported successfully');
  };

  // Calculate statistics
  const verifiedPayments = payments.filter(p => p.status === 'verified');
  const totalRevenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  
  // Payment type breakdown
  const paymentTypeBreakdown: PaymentTypeBreakdown[] = [
    'application_fee',
    'tuition_fee',
    'registration_fee',
    'accommodation_fee',
    'custom'
  ].map(type => {
    const typePayments = verifiedPayments.filter(p => p.payment_type === type);
    const total = typePayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      type: type as any,
      count: typePayments.length,
      total,
      percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0,
    };
  }).filter(b => b.count > 0);

  // Payment method breakdown
  const paymentMethodBreakdown: PaymentMethodBreakdown[] = [
    'bank_transfer',
    'online',
    'cash',
    'mobile_money'
  ].map(method => {
    const methodPayments = verifiedPayments.filter(p => p.payment_method === method);
    const total = methodPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      method: method as any,
      count: methodPayments.length,
      total,
      percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0,
    };
  }).filter(b => b.count > 0);

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthPayments = verifiedPayments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate >= monthDate && paymentDate <= monthEnd;
    });
    
    monthlyRevenue.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      count: monthPayments.length,
    });
  }

  // Top students by payment amount
  const studentPayments = new Map<string, { name: string; total: number; count: number }>();
  verifiedPayments.forEach(p => {
    const existing = studentPayments.get(p.student_id) || { name: p.student_name, total: 0, count: 0 };
    existing.total += p.amount;
    existing.count += 1;
    studentPayments.set(p.student_id, existing);
  });
  const topStudents = Array.from(studentPayments.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  K{totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {verifiedPayments.length} verified payments
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  K{pendingRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {payments.filter(p => p.status === 'pending').length} pending
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Payment</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  K{verifiedPayments.length > 0 ? Math.round(totalRevenue / verifiedPayments.length).toLocaleString() : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="students">Top Students</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend */}
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
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                    <TableHead className="text-right">Avg Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRevenue.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right font-semibold">
                        K{month.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{month.count}</TableCell>
                      <TableCell className="text-right">
                        K{month.count > 0 ? Math.round(month.revenue / month.count).toLocaleString() : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Type Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-green-600" />
                  Revenue by Payment Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Amount",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentTypeBreakdown}
                        dataKey="total"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.percentage.toFixed(1)}%`}
                      >
                        {paymentTypeBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Payment Method Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Payments by Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Count",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethodBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Type Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentTypeBreakdown.map((item) => (
                      <TableRow key={item.type}>
                        <TableCell className="font-medium capitalize">
                          {item.type.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right font-semibold">
                          K{item.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment Method Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethodBreakdown.map((item) => (
                      <TableRow key={item.method}>
                        <TableCell className="font-medium capitalize">
                          {item.method.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right font-semibold">
                          K{item.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Students by Payment Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                    <TableHead className="text-right">Avg Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-bold text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        K{student.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{student.count}</TableCell>
                      <TableCell className="text-right">
                        K{Math.round(student.total / student.count).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
