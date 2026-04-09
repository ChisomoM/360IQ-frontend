import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Plus, Trash2, Eye } from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  category: string;
  description: string;
  example: string;
}

interface SelectedMetric {
  id: string;
  name: string;
  groupBy: string;
}

const availableMetrics: Metric[] = [
  {
    id: 'total_docs',
    name: 'Total Documents',
    category: 'Count',
    description: 'Total number of documents in the period',
    example: '1,245',
  },
  {
    id: 'approval_rate',
    name: 'Approval Rate',
    category: 'Percentage',
    description: 'Percentage of documents approved',
    example: '71.6%',
  },
  {
    id: 'overdue_count',
    name: 'Overdue Count',
    category: 'Count',
    description: 'Number of overdue documents',
    example: '45',
  },
  {
    id: 'avg_processing_time',
    name: 'Avg Processing Time',
    category: 'Duration',
    description: 'Average time to process documents',
    example: '2.3 days',
  },
  {
    id: 'document_value',
    name: 'Document Value',
    category: 'Financial',
    description: 'Total monetary value of documents',
    example: '$125,000',
  },
  {
    id: 'rejected_count',
    name: 'Rejected Count',
    category: 'Count',
    description: 'Number of rejected documents',
    example: '60',
  },
  {
    id: 'pending_signatures',
    name: 'Pending Signatures',
    category: 'Count',
    description: 'Documents awaiting signature',
    example: '65',
  },
  {
    id: 'completion_rate',
    name: 'Completion Rate',
    category: 'Percentage',
    description: 'Percentage of completed workflows',
    example: '85.2%',
  },
  {
    id: 'user_count',
    name: 'Active Users',
    category: 'Count',
    description: 'Number of active users in period',
    example: '128',
  },
  {
    id: 'department_breakdown',
    name: 'Department Breakdown',
    category: 'Dimension',
    description: 'Metrics split by department',
    example: 'Finance, HR, Registry',
  },
];

const groupingOptions = [
  { id: 'none', name: 'No Grouping' },
  { id: 'day', name: 'By Day' },
  { id: 'week', name: 'By Week' },
  { id: 'month', name: 'By Month' },
  { id: 'quarter', name: 'By Quarter' },
  { id: 'year', name: 'By Year' },
  { id: 'department', name: 'By Department' },
  { id: 'status', name: 'By Status' },
  { id: 'user', name: 'By User' },
];

interface CustomReportBuilderProps {
  onSave?: (metrics: SelectedMetric[]) => void;
  onCancel?: () => void;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  onSave,
  onCancel,
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Count'])
  );
  const [previewMode, setPreviewMode] = useState(false);

  const categories = Array.from(new Set(availableMetrics.map(m => m.category))).sort();

  const handleAddMetric = (metric: Metric) => {
    if (!selectedMetrics.find(m => m.id === metric.id)) {
      setSelectedMetrics([
        ...selectedMetrics,
        {
          id: metric.id,
          name: metric.name,
          groupBy: 'none',
        },
      ]);
    }
  };

  const handleRemoveMetric = (id: string) => {
    setSelectedMetrics(selectedMetrics.filter(m => m.id !== id));
  };

  const handleUpdateGrouping = (id: string, groupBy: string) => {
    setSelectedMetrics(
      selectedMetrics.map(m =>
        m.id === id ? { ...m, groupBy } : m
      )
    );
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryMetrics = (category: string) => {
    return availableMetrics.filter(m => m.category === category);
  };

  const handleSave = () => {
    if (selectedMetrics.length === 0) {
      alert('Please select at least one metric');
      return;
    }
    onSave?.(selectedMetrics);
  };

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics Selector */}
        <div className="lg:col-span-2">
          <Card className="shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>Select Metrics</CardTitle>
              <CardDescription>
                Choose metrics to include in your custom report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{category}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        expandedCategories.has(category) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedCategories.has(category) && (
                    <div className="pl-4 space-y-2">
                      {getCategoryMetrics(category).map(metric => (
                        <button
                          key={metric.id}
                          onClick={() => handleAddMetric(metric)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 group-hover:text-primary">
                                {metric.name}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {metric.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Example: {metric.example}
                              </p>
                            </div>
                            <Plus className="h-5 w-5 text-gray-400 group-hover:text-primary flex-shrink-0 ml-2" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Selected Metrics */}
        <div className="lg:col-span-1">
          <Card className="shadow-md border-gray-200 sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Selected Metrics</CardTitle>
              <CardDescription>
                {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {selectedMetrics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No metrics selected yet</p>
                  <p className="text-xs mt-1">Select metrics from the left</p>
                </div>
              ) : (
                selectedMetrics.map(metric => (
                  <div
                    key={metric.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-sm text-gray-800">
                        {metric.name}
                      </p>
                      <button
                        onClick={() => handleRemoveMetric(metric.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Select
                      value={metric.groupBy}
                      onValueChange={(value) =>
                        handleUpdateGrouping(metric.id, value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {groupingOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section */}
      {previewMode && selectedMetrics.length > 0 && (
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="border-b border-primary/10">
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Shows how your selected metrics will appear in the report
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMetrics.map(metric => (
                <div
                  key={metric.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <p className="font-semibold text-gray-800 text-sm">
                    {metric.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Grouped by: {groupingOptions.find(o => o.id === metric.groupBy)?.name}
                  </p>
                  <div className="mt-3 h-32 bg-white rounded border border-gray-300 flex items-center justify-center">
                    <p className="text-xs text-gray-500">[Chart Preview]</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {selectedMetrics.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Hide' : 'Preview'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedMetrics.length === 0}
            variant="default"
          >
            Save Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;
