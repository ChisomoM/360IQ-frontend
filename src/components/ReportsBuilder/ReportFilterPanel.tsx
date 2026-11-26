import React, { useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Eye, RotateCcw } from '@/components/icons';
import { SectionCard } from '@/components/shared/SectionCard';
import type { User } from '@/types/auth';

interface FilterConfig {
  startDate: string;
  endDate: string;
  department: string;
  documentType: string;
  status: string;
  user: string;
}

interface ReportFilterPanelProps {
  reportType: string | null;
  filters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  user: User | null;
  onPreview?: () => void;
  previewLoading?: boolean;
  documentCount?: number;
}

const departmentDocumentTypes: Record<string, string[]> = {
  all: ['Invoice', 'Contract', 'Request', 'Submission', 'Approval Form'],
  finance: ['Invoice', 'Receipt', 'Payment Request', 'Expense Report'],
  registry: ['Submission', 'Registration Form', 'Application', 'Amendment Request'],
  hr: ['Contract', 'Employment Agreement', 'Leave Request', 'Performance Review'],
};

// Smart defaults based on user role
const getSmartDefaults = (user: User | null): Partial<FilterConfig> => {
  if (!user) return {};

  // Check user role/department
  const userDept = (user as any)?.department || 'all';
  const userRole = (user as any)?.role || 'user';

  const defaults: Partial<FilterConfig> = {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: userDept,
    status: 'all',
    user: '',
  };

  // Add role-specific defaults
  if (userRole === 'finance' || userRole === 'finance_lead') {
    defaults.department = 'finance';
  } else if (userRole === 'hr' || userRole === 'hr_lead') {
    defaults.department = 'hr';
  } else if (userRole === 'auditor') {
    defaults.department = 'all'; // Auditors see all
  }

  return defaults;
};

export const ReportFilterPanel: React.FC<ReportFilterPanelProps> = ({
  reportType,
  filters,
  onFilterChange,
  user,
  onPreview,
  previewLoading = false,
  documentCount,
}) => {
  // Get smart defaults on mount
  useEffect(() => {
    const smartDefaults = getSmartDefaults(user);
    if (Object.keys(smartDefaults).length > 0) {
      onFilterChange({
        ...filters,
        ...smartDefaults,
      });
    }
  }, [reportType, user]); // Re-apply when user or report type changes

  const availableDocumentTypes = useMemo(() => {
    const deptKey = filters.department || 'all';
    return departmentDocumentTypes[deptKey] || departmentDocumentTypes['all'];
  }, [filters.department]);

  const handleReset = () => {
    const smartDefaults = getSmartDefaults(user);
    onFilterChange({
      startDate: smartDefaults.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: smartDefaults.endDate || new Date().toISOString().split('T')[0],
      department: smartDefaults.department || 'all',
      documentType: 'all',
      status: 'all',
      user: '',
    });
  };

  // Warn if large dataset
  const showLargeDatasetWarning = documentCount && documentCount > 50000;

  return (
    <SectionCard title="Set report filters">
      <div className="space-y-6">
        <p className="text-sm text-text-secondary">
          Filters narrow the report data. Your role fills in the relevant options.
        </p>

        {/* Date Range Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Date and period</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-start-date">Start date (required)</Label>
              <Input
                id="report-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  onFilterChange({ ...filters, startDate: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-end-date">End date (required)</Label>
              <Input
                id="report-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  onFilterChange({ ...filters, endDate: e.target.value })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Content Filters Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Content filters</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-department">Department</Label>
              <Select
                value={filters.department} 
                onValueChange={(value) => {
                  onFilterChange({
                    ...filters,
                    department: value,
                    documentType: 'all', // Reset document type on dept change
                  });
                }}
              >
                <SelectTrigger id="report-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="registry">Registry</SelectItem>
                  <SelectItem value="hr">Human resources</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-text-muted">
                Filled in from your role
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-document-type">Document type</Label>
              <Select 
                value={filters.documentType} 
                onValueChange={(value) =>
                  onFilterChange({ ...filters, documentType: value })
                }
              >
                <SelectTrigger id="report-document-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {availableDocumentTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-status">Status</Label>
              <Select
                value={filters.status} 
                onValueChange={(value) =>
                  onFilterChange({ ...filters, status: value })
                }
              >
                <SelectTrigger id="report-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Large Dataset Warning */}
        {showLargeDatasetWarning && (
          <div className="p-3 bg-caution-tint rounded-md flex gap-3 text-caution">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Large result set</p>
              <p className="text-xs mt-1">
                Your filters match {documentCount?.toLocaleString()} documents. Narrow the date range or department to make the report faster.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-line flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            Reset filters
          </Button>
          {onPreview && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onPreview}
              disabled={previewLoading}
            >
              <Eye size={16} />
              {previewLoading ? 'Loading' : 'Preview data'}
            </Button>
          )}
        </div>

        {/* Preview Info */}
        {documentCount !== undefined && !showLargeDatasetWarning && (
          <p role="status" className="flex items-center gap-2 p-3 bg-positive-tint rounded-md text-sm text-positive">
            <CheckCircle size={16} />
            Matches {documentCount?.toLocaleString()} documents
          </p>
        )}
      </div>
    </SectionCard>
  );
};
