import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AlertCircle, Eye, RotateCcw } from 'lucide-react';
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
    <Card className="shadow-md border-gray-200">
      <CardHeader>
        <CardTitle>Configure Report Filters</CardTitle>
        <CardDescription>
          Apply filters to refine your report data. Your role automatically pre-fills relevant options.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Date & Period</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  onFilterChange({ ...filters, startDate: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <Input
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
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Content Filters</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="registry">Registry</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                💡 Pre-filled based on your role
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <Select 
                value={filters.documentType} 
                onValueChange={(value) =>
                  onFilterChange({ ...filters, documentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableDocumentTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select 
                value={filters.status} 
                onValueChange={(value) =>
                  onFilterChange({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">Large dataset detected</p>
              <p className="text-xs mt-1">
                Your filters match {documentCount?.toLocaleString()} documents. Consider narrowing the date range or department filter for better performance.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          {onPreview && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onPreview}
              disabled={previewLoading}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewLoading ? 'Loading...' : 'Preview Data'}
            </Button>
          )}
        </div>

        {/* Preview Info */}
        {documentCount !== undefined && !showLargeDatasetWarning && (
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium">✓ Matches {documentCount?.toLocaleString()} documents</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
