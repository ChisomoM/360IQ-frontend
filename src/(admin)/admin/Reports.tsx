import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Download, MapPin } from '@/components/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAnalyticsData, type AnalyticsFilters } from '@/hooks/useAnalyticsData';
import { exportToCSV } from '@/lib/csvExport';
import dayjs from 'dayjs';

export const ReportsPage: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const { data, loading, error } = useAnalyticsData(filters);

  // Date picker states
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Apply date filters
  const handleApplyFilters = () => {
    setFilters({
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFilters({});
  };

  // Province distribution data
  const provinceData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const province = item.province || 'Unknown';
      counts[province] = (counts[province] || 0) + 1;
    });
    return Object.entries(counts).map(([province, count]) => ({
      province,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [data]);

  // District data for selected province
  const districtData = useMemo(() => {
    if (!selectedProvince) return [];
    const counts: Record<string, number> = {};
    data.filter(item => item.province === selectedProvince).forEach(item => {
      const district = item.district || 'Unknown';
      counts[district] = (counts[district] || 0) + 1;
    });
    return Object.entries(counts).map(([district, count]) => ({
      district,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [data, selectedProvince]);

  // Salary scale distribution
  const salaryData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const scale = item.salaryScale || 'Unknown';
      counts[scale] = (counts[scale] || 0) + 1;
    });
    return Object.entries(counts).map(([scale, count]) => ({
      scale,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [data]);

  // Referral data
  const referralData = useMemo(() => {
    const withReferral = data.filter(item => item.referralCode).length;
    const withoutReferral = data.length - withReferral;
    return [
      { name: 'With Referral', value: withReferral },
      { name: 'Direct', value: withoutReferral },
    ];
  }, [data]);

  // Growth trend data (applications over time)
  const growthData = useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    data.forEach(item => {
      if (item.createdAt) {
        const date = dayjs(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt);
        const monthKey = date.format('YYYY-MM');
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });
    return Object.entries(monthlyCounts)
      .map(([month, count]) => ({
        month: dayjs(month).format('MMM YYYY'),
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);



  // Export to CSV
  const handleExportCSV = () => {
    const exportData = data.map(item => ({
      'Full Name': item.fullName,
      'Province': item.province,
      'District': item.district,
      'Salary Scale': item.salaryScale,
      'Status': item.status,
      'Referral Code': item.referralCode || 'N/A',
      'Application Date': item.createdAt ? dayjs(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).format('YYYY-MM-DD') : 'N/A',
    }));
    exportToCSV(exportData, `360IQ_Reports_${dayjs().format('YYYY-MM-DD')}`);
  };

  if (loading || error) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <PageHeader title="Reports and analytics" />
        <SectionCard padded={false}>
          <SectionBody loading={loading} error={error ? `Couldn't load the reports. ${error}` : undefined}>
            {null}
          </SectionBody>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      {/* Header */}
      <PageHeader
        title="Reports and analytics"
        description="Applications by area, salary scale, source and month."
        actions={
          <Button onClick={handleExportCSV}>
            <Download size={16} />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <SectionCard title="Filters">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="report-from">Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="report-from"
                    variant="secondary"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !startDate && "text-text-muted"
                    )}
                  >
                    <CalendarIcon size={16} />
                    {startDate ? formatDate(startDate) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label htmlFor="report-to">End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="report-to"
                    variant="secondary"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !endDate && "text-text-muted"
                    )}
                  >
                    <CalendarIcon size={16} />
                    {endDate ? formatDate(endDate) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="report-status-filter">Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as 'pending' | 'approved' | 'rejected' }))}>
                <SelectTrigger id="report-status-filter" className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleApplyFilters} variant="secondary">Apply filters</Button>
            <Button onClick={handleClearFilters} variant="ghost">Clear filters</Button>
          </div>
      </SectionCard>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500 text-white shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Total Applications</div>
              <Users className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.length}</div>
            <p className="text-xs opacity-80 mt-1">All submissions</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1e3c21] text-white shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Approved</div>
              <CheckCircle className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusData.find(s => s.status === 'Approved')?.count || 0}</div>
            <p className="text-xs opacity-80 mt-1">{data.length > 0 ? Math.round((statusData.find(s => s.status === 'Approved')?.count || 0) / data.length * 100) : 0}% approval rate</p>
          </CardContent>
        </Card>
        <Card className="bg-[#febb00] text-[#1e3c21] shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">Pending</div>
              <Clock className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusData.find(s => s.status === 'Pending')?.count || 0}</div>
            <p className="text-xs opacity-80 mt-1">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white shadow-lg hover:shadow-xl transition-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium opacity-90">With Referrals</div>
              <UserCheck className="h-5 w-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{referralData[0].value}</div>
            <p className="text-xs opacity-80 mt-1">{data.length > 0 ? Math.round(referralData[0].value / data.length * 100) : 0}% referred</p>
          </CardContent>
        </Card>
      </div> */}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {/* Province Distribution */}
        <SectionCard eyebrow="Applications, select a bar to see districts" title="Applications by province">
          <div className="w-full overflow-x-auto">
            <div className="h-[280px]" style={{ minWidth: `${Math.max(400, provinceData.length * 80)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...axisProps} dataKey="province" />
                  <YAxis {...axisProps} />
                  <Tooltip {...tooltipProps} cursor={barCursor} />
                  <Bar
                    dataKey="count"
                    name="Applications"
                    fill="var(--chart-1)"
                    radius={BAR_RADIUS}
                    maxBarSize={MAX_BAR_SIZE}
                    onClick={(data) => {
                      if (data && data.payload && data.payload.province) {
                        setSelectedProvince(data.payload.province);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionCard>

        {/* District Distribution (when province selected) */}
        <SectionCard
          eyebrow="Applications"
          title={selectedProvince ? `Districts in ${selectedProvince}` : 'Districts'}
        >
          {selectedProvince ? (
            <div className="w-full overflow-x-auto">
              <div className="h-[280px]" style={{ minWidth: `${Math.max(400, districtData.length * 80)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="district" angle={-45} textAnchor="end" height={70} />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipProps} cursor={barCursor} />
                    <Bar dataKey="count" name="Applications" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<MapPin size={24} />}
              title="Select a province"
              description="Choose a province bar to see its districts."
            />
          )}
        </SectionCard>

        {/* Salary Scale Distribution */}
        <SectionCard eyebrow="Applications" title="Salary scale distribution">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid {...gridProps} />
                <XAxis {...axisProps} dataKey="scale" />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} cursor={barCursor} />
                <Bar dataKey="count" name="Applications" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Referral Source */}
        <SectionCard eyebrow="Applications" title="Referral and direct applications">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={referralData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={90}
                  innerRadius={0}
                  dataKey="value"
                >
                  {referralData.map((entry, index) => (
                    <Cell key={entry.name} fill={seriesColor(index)} stroke="var(--surface-1)" />
                  ))}
                </Pie>
                <Tooltip {...tooltipProps} />
                <Legend {...legendProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Growth Trend */}
        <SectionCard eyebrow="Applications per month" title="Application growth" className="lg:col-span-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid {...gridProps} />
                <XAxis {...axisProps} dataKey="month" />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} cursor={lineCursor} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Applications"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};