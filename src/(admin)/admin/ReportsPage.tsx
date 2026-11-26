import React, { useState } from 'react';
import { Plus, Lock, FileText } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';
import { 
  ReportDiscoveryCards, 
  ReportFilterPanel, 
  SavedReportsManager,
  ReportGenerationResult 
} from '@/components/ReportsBuilder';

type ReportType = 'lifecycle' | 'financial' | 'user_activity' | 'audit_trail' | 'custom';

interface ReportConfig {
  type: ReportType | null;
  filters: {
    startDate: string;
    endDate: string;
    department: string;
    documentType: string;
    status: string;
    user: string;
  };
  name: string;
  schedule: boolean;
  taggedReviewers: string[];
}

interface SavedReport {
  id: string;
  name: string;
  type: ReportType;
  createdAt: string;
  lastRun?: string;
  status?: 'success' | 'error' | 'pending';
  documentCount?: number;
}

interface GeneratedReport {
  type: string;
  name: string;
  generatedAt: string;
  dateRange: { start: string; end: string };
  filters: Record<string, string>;
  data: any[];
  metrics?: Record<string, string | number>;
}

// Sample users for tagging
const sampleUsers = [
  { id: '1', name: 'John Banda', email: 'john@example.com' },
  { id: '2', name: 'Mary Mwale', email: 'mary@example.com' },
  { id: '3', name: 'James Phiri', email: 'james@example.com' },
  { id: '4', name: 'Sarah Kaunda', email: 'sarah@example.com' },
];

// Predefined saved reports
const initialSavedReports: SavedReport[] = [
  {
    id: '1',
    name: 'Monthly finance summary',
    type: 'financial',
    createdAt: '2025-06-01',
    lastRun: '2025-06-15',
    status: 'success',
    documentCount: 847,
  },
  {
    id: '2',
    name: 'Registry processing figures',
    type: 'lifecycle',
    createdAt: '2025-05-20',
    lastRun: '2025-06-10',
    status: 'success',
    documentCount: 1234,
  },
  {
    id: '3',
    name: 'Q2 audit report',
    type: 'audit_trail',
    createdAt: '2025-04-01',
    lastRun: '2025-06-12',
    status: 'success',
    documentCount: 324,
  },
];

// AI insights for reports
const aiInsights = [
  {
    type: 'trend' as const,
    title: 'Processing efficiency',
    suggestion: 'Documents are being processed 15% faster this quarter compared to last quarter. Continue current workflows.',
  },
  {
    type: 'alert' as const,
    title: 'Approval bottleneck',
    suggestion: 'Registry submissions show 28% of documents stuck in "In Review" stage. Consider adding resources to review team.',
  },
  {
    type: 'recommendation' as const,
    title: 'Cost saving',
    suggestion: 'Finance invoices average $2,607 per document. Taking early payment discounts could save about $45K a year.',
  },
];

/** `user_activity` becomes "User activity report". */
const reportTitle = (type: string) => {
  const words = type.replace(/_/g, ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} report`;
};

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  
  // State management - Hybrid workflow
  const [mode, setMode] = useState<'builder' | 'generated'>('builder');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(initialSavedReports);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [documentCount, setDocumentCount] = useState<number | undefined>();

  const [config, setConfig] = useState<ReportConfig>({
    type: null,
    filters: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      department: 'all',
      documentType: 'all',
      status: 'all',
      user: '',
    },
    name: '',
    schedule: false,
    taggedReviewers: [],
  });

  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  // Permission checks
  const canViewAnalytics = hasPermission(user?.permissions || [], PERMISSIONS['analytics.read']);
  const canExportAnalytics = hasPermission(user?.permissions || [], PERMISSIONS['analytics.export']);

  if (!canViewAnalytics) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <EmptyState
            icon={<Lock size={24} />}
            title="You do not have permission to access reports"
            description="Ask your administrator for access."
          />
        </div>
      </PageTransition>
    );
  }

  // Handle report type selection
  const handleSelectReportType = (type: string) => {
    setConfig({
      ...config,
      type: type as ReportType,
      name: reportTitle(type),
    });
    setShowFilterPanel(true);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setConfig(prev => ({
      ...prev,
      filters: newFilters,
    }));
    setDocumentCount(undefined);
  };

  // Handle data preview
  const handlePreview = async () => {
    setPreviewLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const baseCount = 2847;
    let count = baseCount;
    
    if (config.filters.department !== 'all') count = Math.floor(count * 0.6);
    if (config.filters.status !== 'all') count = Math.floor(count * 0.7);
    
    setDocumentCount(count);
    setPreviewLoading(false);
    toast.success(`Preview loaded: ${count.toLocaleString()} documents`);
  };

  // Handle generate report
  const handleGenerateReport = () => {
    if (!config.type) {
      toast.error('Select a report type');
      return;
    }

    const newReport: GeneratedReport = {
      type: config.type,
      name: config.name || reportTitle(config.type),
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: config.filters.startDate,
        end: config.filters.endDate,
      },
      filters: config.filters,
      data: [],
    };

    setGeneratedReport(newReport);
    setMode('generated');
    toast.success('Report generated');
  };

  // Handle save report
  const handleSaveReport = (name: string, reviewers: string[]) => {
    const newSavedReport: SavedReport = {
      id: Date.now().toString(),
      name,
      type: config.type as ReportType,
      createdAt: new Date().toISOString(),
      lastRun: new Date().toISOString(),
      status: 'success',
      documentCount,
    };

    setSavedReports(prev => [newSavedReport, ...prev]);
    
    if (reviewers.length > 0) {
      const reviewerNames = reviewers
        .map(id => sampleUsers.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      toast.success(`Report saved and sent to ${reviewerNames}`);
    } else {
      toast.success('Report saved');
    }
  };

  // Handle run saved report
  const handleRunSavedReport = (reportId: string) => {
    const report = savedReports.find(r => r.id === reportId);
    if (report) {
      toast.success(`Running "${report.name}"`);
    }
  };

  // Handle back from generated view
  const handleBackFromGenerated = () => {
    setMode('builder');
    setGeneratedReport(null);
  };

  // Reset to new report
  const handleCreateNewReport = () => {
    setConfig({
      type: null,
      filters: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        department: 'all',
        documentType: 'all',
        status: 'all',
        user: '',
      },
      name: '',
      schedule: false,
      taggedReviewers: [],
    });
    setShowFilterPanel(false);
    setDocumentCount(undefined);
  };

  // Generated report view
  if (mode === 'generated' && generatedReport) {
    return (
      <PageTransition>
        <ReportGenerationResult
          report={generatedReport}
          aiInsights={aiInsights}
          onBack={handleBackFromGenerated}
          onSave={handleSaveReport}
          users={sampleUsers}
          canExport={canExportAnalytics}
        />
      </PageTransition>
    );
  }

  // Builder view - Hybrid split panel layout
  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <PageHeader
          title="Reports"
          description="Build, save and run reports. Export as PDF, Excel or CSV."
          actions={
            <Button variant={showFilterPanel ? 'secondary' : 'default'} onClick={handleCreateNewReport}>
              <Plus size={16} />
              New report
            </Button>
          }
        />

        {/* Quick info */}
        {config.type && !showFilterPanel && (
          <div className="flex items-start gap-3 rounded-lg bg-field p-4 text-text-secondary">
            <FileText size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {reportTitle(config.type)} selected
              </p>
              <p className="mt-1 text-xs">
                Select the report type again to set filters, or run a saved report.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* Main Content */}
          <div className="min-w-0 space-y-5 lg:col-span-2">
            {/* Step 1: Report Type Selection */}
            {!showFilterPanel ? (
              <ReportDiscoveryCards
                selectedType={config.type}
                onSelect={handleSelectReportType}
                user={user}
              />
            ) : (
              <>
                {/* Step 2: Filter Configuration */}
                <ReportFilterPanel
                  reportType={config.type}
                  filters={config.filters}
                  onFilterChange={handleFilterChange}
                  user={user}
                  onPreview={handlePreview}
                  previewLoading={previewLoading}
                  documentCount={documentCount}
                />

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" onClick={handleCreateNewReport}>
                    Back to report types
                  </Button>
                  <Button onClick={handleGenerateReport}>
                    Generate report
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Sidebar: Saved Reports */}
          <div className="min-w-0 lg:col-span-1">
            <SavedReportsManager
              reports={savedReports}
              onRun={handleRunSavedReport}
              onEdit={(id) => {
                const report = savedReports.find(r => r.id === id);
                if (report) {
                  setConfig(prev => ({
                    ...prev,
                    type: report.type,
                  }));
                  setShowFilterPanel(true);
                }
              }}
              onDelete={(id) => {
                setSavedReports(prev => prev.filter(r => r.id !== id));
                toast.success('Report deleted');
              }}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ReportsPage;
