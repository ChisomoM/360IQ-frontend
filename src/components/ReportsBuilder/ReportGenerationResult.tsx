import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  FileText,
  FileSpreadsheet,
  Mail,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Save,
} from '@/components/icons';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { KpiTile } from '@/components/shared/KpiTile';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ReportPreviewData {
  type: string;
  name: string;
  generatedAt: string;
  dateRange: { start: string; end: string };
  filters: Record<string, string>;
  data: any[];
  metrics?: Record<string, string | number>;
}

interface AIInsight {
  type: 'trend' | 'alert' | 'recommendation';
  title: string;
  suggestion: string;
}

interface ReportGenerationResultProps {
  report: ReportPreviewData;
  aiInsights: AIInsight[];
  onBack: () => void;
  onSave: (name: string, reviewers: string[]) => void;
  users?: Array<{ id: string; name: string; email: string }>;
  canExport?: boolean;
}

const reportDataSamples = {
  lifecycle: [
    { stage: 'Submitted', count: 245 },
    { stage: 'In review', count: 189 },
    { stage: 'Approved', count: 156 },
    { stage: 'Completed', count: 142 },
  ],
  financial: [
    { month: 'Jan', value: 125000, count: 45 },
    { month: 'Feb', value: 145000, count: 52 },
    { month: 'Mar', value: 135000, count: 48 },
    { month: 'Apr', value: 175000, count: 65 },
    { month: 'May', value: 185000, count: 70 },
    { month: 'Jun', value: 220000, count: 85 },
  ],
  statusBreakdown: [
    { name: 'Approved', value: 385 },
    { name: 'Pending', value: 145 },
    { name: 'Rejected', value: 70 },
  ],
};

export const ReportGenerationResult: React.FC<ReportGenerationResultProps> = ({
  report,
  aiInsights,
  onBack,
  onSave,
  users = [],
  canExport = true,
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [reportName, setReportName] = useState(report.name);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!canExport) {
      toast.error('You do not have permission to export reports');
      return;
    }
    setExportFormat(format);
    toast.success(`Exporting report as ${format.toUpperCase()}`);
  };

  const handleEmailReport = () => {
    const recipients = selectedReviewers
      .map(id => users.find(u => u.id === id)?.email)
      .filter(Boolean);

    if (recipients.length === 0) {
      toast.error('Select reviewers to email');
      return;
    }

    toast.success(
      `Report sent to ${recipients.length} reviewer${recipients.length > 1 ? 's' : ''}`
    );
  };

  const handleSave = () => {
    if (!reportName.trim()) {
      toast.error('Enter a report name');
      return;
    }
    onSave(reportName, selectedReviewers);
    toast.success(`Report "${reportName}" saved`);
  };

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewers(prev =>
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const exportClass = (format: 'pdf' | 'excel' | 'csv') =>
    cn(exportFormat === format && 'bg-surface-2');

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <PageHeader
        crumb="Reports"
        title={report.name}
        description={`Report generated ${formatDateTime(report.generatedAt)}`}
        actions={
          <>
            <Button variant="ghost" onClick={onBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button variant="secondary" className={exportClass('pdf')} onClick={() => handleExport('pdf')} disabled={!canExport}>
              <FileText size={16} />
              Export PDF
            </Button>
            <Button variant="secondary" className={exportClass('excel')} onClick={() => handleExport('excel')} disabled={!canExport}>
              <FileSpreadsheet size={16} />
              Export Excel
            </Button>
            <Button variant="secondary" className={exportClass('csv')} onClick={() => handleExport('csv')} disabled={!canExport}>
              <FileText size={16} />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleEmailReport} disabled={selectedReviewers.length === 0}>
              <Mail size={16} />
              Email report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Main content */}
        <div className="min-w-0 space-y-5 lg:col-span-2">
          {/* Report data preview */}
          <SectionCard
            eyebrow={`Data from ${report.dateRange.start} to ${report.dateRange.end}`}
            title="Report data preview"
          >
            {report.type === 'lifecycle' && (
              <div className="space-y-5">
                <p className="text-xs text-text-muted">Documents by stage</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportDataSamples.lifecycle}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="stage" />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipProps} cursor={barCursor} />
                    <Bar dataKey="count" name="Documents" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KpiTile label="Total documents" value="732" />
                  <KpiTile label="Completed" value="142" />
                </div>
              </div>
            )}

            {report.type === 'financial' && (
              <div className="space-y-5">
                <p className="text-xs text-text-muted">Value in $ (left axis) and document count (right axis) by month</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportDataSamples.financial}>
                    <CartesianGrid {...gridProps} />
                    <XAxis {...axisProps} dataKey="month" />
                    <YAxis {...axisProps} yAxisId="value" />
                    <YAxis {...axisProps} yAxisId="count" orientation="right" />
                    <Tooltip {...tooltipProps} cursor={lineCursor} />
                    <Legend {...legendProps} />
                    <Line yAxisId="value" type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Value ($)" />
                    <Line yAxisId="count" type="monotone" dataKey="count" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Count" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KpiTile label="Total value" value="$1.28M" />
                  <KpiTile label="Total documents" value="365" />
                </div>
              </div>
            )}

            {report.type === 'user_activity' && (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Documents by status</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportDataSamples.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value }) => value}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {reportDataSamples.statusBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={seriesColor(index)} stroke="var(--surface-1)" />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipProps} />
                    <Legend {...legendProps} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {report.type === 'audit_trail' && (
              <dl className="divide-y divide-line">
                {[
                  ['Total audit events', '847'],
                  ['Modified records', '324'],
                  ['People involved', '28'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <dt className="text-sm text-text-secondary">{label}</dt>
                    <dd className="font-mono text-base text-text-primary">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionCard>

          {/* Analysis */}
          <SectionCard
            tone="ai"
            eyebrow={
              <span className="flex items-center gap-1.5 text-signal-text">
                <Sparkles size={16} />
                Sample analysis
              </span>
            }
            title="Analysis and recommendations"
          >
            <ul className="divide-y divide-line">
              {aiInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={cn('mt-0.5 flex-shrink-0', insight.type === 'alert' ? 'text-caution' : 'text-signal-text')}>
                    {insight.type === 'alert' && <AlertTriangle size={18} />}
                    {insight.type === 'trend' && <TrendingUp size={18} />}
                    {insight.type === 'recommendation' && <Lightbulb size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{insight.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{insight.suggestion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-5 lg:col-span-1">
          {/* Save report */}
          <SectionCard title="Save this report">
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">Save it to run it again later.</p>
              <div className="space-y-1.5">
                <Label htmlFor="report-name">Report name</Label>
                <Input
                  id="report-name"
                  placeholder="Q2 finance report"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save size={16} />
                Save report
              </Button>
            </div>
          </SectionCard>

          {/* Reviewers */}
          {users.length > 0 && (
            <SectionCard title="Notify reviewers">
              <p className="mb-3 text-sm text-text-secondary">Tag people to review this report.</p>
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-sm p-2 hover:bg-surface-2"
                  >
                    <Checkbox
                      id={`reviewer-${user.id}`}
                      checked={selectedReviewers.includes(user.id)}
                      onCheckedChange={() => toggleReviewer(user.id)}
                    />
                    <label
                      htmlFor={`reviewer-${user.id}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="block text-sm font-medium text-text-primary">{user.name}</span>
                      <span className="block truncate text-xs text-text-muted">{user.email}</span>
                    </label>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};
