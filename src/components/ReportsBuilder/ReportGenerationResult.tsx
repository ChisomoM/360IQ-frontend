import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Download,
  FileText,
  Mail,
  Share2,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

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
    { stage: 'In Review', count: 189 },
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
    { name: 'Approved', value: 385, fill: '#10b981' },
    { name: 'Pending', value: 145, fill: '#f59e0b' },
    { name: 'Rejected', value: 70, fill: '#ef4444' },
  ],
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
  const [showSavePanel, setShowSavePanel] = useState(false);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!canExport) {
      toast.error('You do not have permission to export reports');
      return;
    }
    setExportFormat(format);
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  const handleEmailReport = () => {
    const recipients = selectedReviewers
      .map(id => users.find(u => u.id === id)?.email)
      .filter(Boolean);
    
    if (recipients.length === 0) {
      toast.error('Please select reviewers to email');
      return;
    }

    toast.success(
      `Report sent to ${recipients.length} reviewer${recipients.length > 1 ? 's' : ''}`
    );
  };

  const handleSave = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }
    onSave(reportName, selectedReviewers);
    toast.success(`Report "${reportName}" saved successfully`);
  };

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewers(prev =>
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Report Generated
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {report.name} • Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Export Actions - Now Primary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Button
            onClick={() => handleExport('pdf')}
            disabled={!canExport}
            className="gap-2"
            variant={exportFormat === 'pdf' ? 'default' : 'outline'}
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleExport('excel')}
            disabled={!canExport}
            variant={exportFormat === 'excel' ? 'default' : 'outline'}
            className="gap-2"
          >
            📊 Export Excel
          </Button>
          <Button
            onClick={() => handleExport('csv')}
            disabled={!canExport}
            variant={exportFormat === 'csv' ? 'default' : 'outline'}
            className="gap-2"
          >
            📋 Export CSV
          </Button>
          <Button
            onClick={handleEmailReport}
            variant="outline"
            className="gap-2"
            disabled={selectedReviewers.length === 0}
          >
            <Mail className="h-4 w-4" />
            Email Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Data Preview */}
          <Card className="shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>Report Data Preview</CardTitle>
              <CardDescription>
                Data from {report.dateRange.start} to {report.dateRange.end}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.type === 'lifecycle' && (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportDataSamples.lifecycle}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-primary">732</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">142</p>
                    </div>
                  </div>
                </div>
              )}

              {report.type === 'financial' && (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportDataSamples.financial}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Value ($)" />
                      <Line type="monotone" dataKey="count" stroke="#10b981" name="Count" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-primary">$1.28M</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-green-600">365</p>
                    </div>
                  </div>
                </div>
              )}

              {report.type === 'user_activity' && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportDataSamples.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportDataSamples.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {report.type === 'audit_trail' && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Total Audit Events</span>
                    <span className="text-xl font-bold">847</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Modified Records</span>
                    <span className="text-xl font-bold">324</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Users Involved</span>
                    <span className="text-xl font-bold">28</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="border-b border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Analysis & Recommendations</CardTitle>
                  <CardDescription>Data-driven insights and actionable decisions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        insight.type === 'alert'
                          ? 'bg-orange-100'
                          : insight.type === 'trend'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      }`}
                    >
                      {insight.type === 'alert' && (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                      {insight.type === 'trend' && (
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      )}
                      {insight.type === 'recommendation' && (
                        <Sparkles className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{insight.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{insight.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Save Report Card */}
          <Card className="shadow-md border-gray-200 sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Save This Report</CardTitle>
              <CardDescription>Make it easy to re-run later</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name *
                </label>
                <Input
                  placeholder="e.g., Q2 Finance Report"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} className="w-full gap-2">
                <Copy className="h-4 w-4" />
                Save Report
              </Button>
            </CardContent>
          </Card>

          {/* Tag Reviewers Card */}
          {users.length > 0 && (
            <Card className="shadow-md border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Notify Reviewers
                </CardTitle>
                <CardDescription>Tag people to review this report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`reviewer-${user.id}`}
                      checked={selectedReviewers.includes(user.id)}
                      onCheckedChange={() => toggleReviewer(user.id)}
                    />
                    <label
                      htmlFor={`reviewer-${user.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
