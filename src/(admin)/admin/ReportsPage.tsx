import React, { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
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
    name: 'Monthly Finance Summary',
    type: 'financial',
    createdAt: '2025-06-01',
    lastRun: '2025-06-15',
    status: 'success',
    documentCount: 847,
  },
  {
    id: '2',
    name: 'Registry Processing Stats',
    type: 'lifecycle',
    createdAt: '2025-05-20',
    lastRun: '2025-06-10',
    status: 'success',
    documentCount: 1234,
  },
  {
    id: '3',
    name: 'Q2 Audit Report',
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
    title: 'Processing Efficiency',
    suggestion: 'Documents are being processed 15% faster this quarter compared to last quarter. Continue current workflows.',
  },
  {
    type: 'alert' as const,
    title: 'Approval Bottleneck',
    suggestion: 'Registry submissions show 28% of documents stuck in "In Review" stage. Consider adding resources to review team.',
  },
  {
    type: 'recommendation' as const,
    title: 'Cost Optimization',
    suggestion: 'Finance invoices averaging $2,607 per document. Early payment discount utilization could save ~$45K annually.',
  },
];

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
        <div className="p-6 flex flex-col items-center justify-center min-h-screen gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <AlertCircle className="h-12 w-12 text-danger" />
          </motion.div>
          <h1 className="font-display font-bold text-display-xs text-gray-900">
            You do not have permission to access reports
          </h1>
          <p className="font-sans text-text-md text-gray-500">
            Please contact your administrator
          </p>
        </div>
      </PageTransition>
    );
  }

  // Handle report type selection
  const handleSelectReportType = (type: string) => {
    setConfig({
      ...config,
      type: type as ReportType,
      name: `${type.replace(/_/g, ' ')} Report`,
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
      toast.error('Please select a report type');
      return;
    }

    const newReport: GeneratedReport = {
      type: config.type,
      name: config.name || `${config.type} Report`,
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
    toast.success('Report generated successfully');
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
      toast.success('Report saved successfully');
    }
  };

  // Handle run saved report
  const handleRunSavedReport = (reportId: string) => {
    const report = savedReports.find(r => r.id === reportId);
    if (report) {
      toast.success(`Running "${report.name}"...`);
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
        <div className="p-6 space-y-6 bg-white min-h-screen">
          <ReportGenerationResult
            report={generatedReport}
            aiInsights={aiInsights}
            onBack={handleBackFromGenerated}
            onSave={handleSaveReport}
            users={sampleUsers}
            canExport={canExportAnalytics}
          />
        </div>
      </PageTransition>
    );
  }

  // Builder view - Hybrid split panel layout
  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-white min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-display-sm text-gray-900">
                Reports Builder
              </h1>
              <p className="font-sans text-text-md text-gray-500 mt-1">
                Create, customize, and manage your reports with ease • Export as PDF, Excel, or CSV
              </p>
            </div>
            <motion.button
              onClick={handleCreateNewReport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="h-10 px-4 rounded-xl bg-primary text-primary-fg font-sans font-medium text-text-sm flex items-center gap-2 outline-none"
            >
              <Plus className="h-4 w-4" />
              Create New Report
            </motion.button>
          </div>

          {/* Quick Info */}
          {config.type && !showFilterPanel && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="mt-4 p-3 bg-blue-50/80 rounded-lg text-text-sm text-blue-700 border border-blue-200"
            >
              <p className="font-sans font-medium">
                📊 {config.type.replace(/_/g, ' ')} Report Selected
              </p>
              <p className="font-sans text-text-xs mt-1">
                Click "Configure & Generate" to customize filters, or click a saved report below to run it immediately.
              </p>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="lg:col-span-2 space-y-6"
          >
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
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleCreateNewReport}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex-1 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-150 text-gray-700 font-sans font-medium text-text-sm outline-none border border-slate-300 transition-colors"
                  >
                    Back to Report Selection
                  </motion.button>
                  <motion.button
                    onClick={handleGenerateReport}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex-1 h-10 px-4 rounded-xl bg-primary text-primary-fg font-sans font-medium text-text-sm flex items-center justify-center gap-2 outline-none"
                  >
                    Generate Report
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>

          {/* Sidebar: Saved Reports */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="lg:col-span-1"
          >
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
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ReportsPage;
