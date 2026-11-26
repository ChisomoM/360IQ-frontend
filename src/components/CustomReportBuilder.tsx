import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Plus, Trash2, Eye, BarChart3 } from '@/components/icons';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

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
    name: 'Total documents',
    category: 'Count',
    description: 'Total number of documents in the period',
    example: '1,245',
  },
  {
    id: 'approval_rate',
    name: 'Approval rate',
    category: 'Percentage',
    description: 'Percentage of documents approved',
    example: '71.6%',
  },
  {
    id: 'overdue_count',
    name: 'Overdue count',
    category: 'Count',
    description: 'Number of overdue documents',
    example: '45',
  },
  {
    id: 'avg_processing_time',
    name: 'Average processing time',
    category: 'Duration',
    description: 'Average time to process documents',
    example: '2.3 days',
  },
  {
    id: 'document_value',
    name: 'Document value',
    category: 'Financial',
    description: 'Total monetary value of documents',
    example: '$125,000',
  },
  {
    id: 'rejected_count',
    name: 'Rejected count',
    category: 'Count',
    description: 'Number of rejected documents',
    example: '60',
  },
  {
    id: 'pending_signatures',
    name: 'Pending signatures',
    category: 'Count',
    description: 'Documents awaiting signature',
    example: '65',
  },
  {
    id: 'completion_rate',
    name: 'Completion rate',
    category: 'Percentage',
    description: 'Percentage of completed workflows',
    example: '85.2%',
  },
  {
    id: 'user_count',
    name: 'Active people',
    category: 'Count',
    description: 'Number of active people in the period',
    example: '128',
  },
  {
    id: 'department_breakdown',
    name: 'Department breakdown',
    category: 'Dimension',
    description: 'Metrics split by department',
    example: 'Finance, HR, Registry',
  },
];

const groupingOptions = [
  { id: 'none', name: 'No grouping' },
  { id: 'day', name: 'By day' },
  { id: 'week', name: 'By week' },
  { id: 'month', name: 'By month' },
  { id: 'quarter', name: 'By quarter' },
  { id: 'year', name: 'By year' },
  { id: 'department', name: 'By department' },
  { id: 'status', name: 'By status' },
  { id: 'user', name: 'By person' },
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
      alert('Select at least one metric');
      return;
    }
    onSave?.(selectedMetrics);
  };

  return (
    <div className="space-y-5">
      {/* Main content */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Metrics selector */}
        <SectionCard eyebrow="Choose what the report includes" title="Select metrics" className="lg:col-span-2">
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={expandedCategories.has(category)}
                  className="flex w-full items-center justify-between rounded-md bg-field p-3 transition-colors hover:bg-field-hover"
                >
                  <span className="text-sm font-semibold text-text-primary">{category}</span>
                  <ChevronDown
                    size={16}
                    className={cn('transition-transform', expandedCategories.has(category) && 'rotate-180')}
                  />
                </button>

                {expandedCategories.has(category) && (
                  <div className="space-y-2 pl-4">
                    {getCategoryMetrics(category).map(metric => (
                      <button
                        type="button"
                        key={metric.id}
                        onClick={() => handleAddMetric(metric)}
                        className="flex w-full items-start justify-between rounded-md border border-line p-3 text-left transition-colors hover:bg-surface-2"
                      >
                        <span className="block flex-1">
                          <span className="block text-sm font-semibold text-text-primary">{metric.name}</span>
                          <span className="mt-1 block text-xs text-text-secondary">{metric.description}</span>
                          <span className="mt-1 block text-xs text-text-muted">Example: {metric.example}</span>
                        </span>
                        <Plus size={18} className="ml-2 flex-shrink-0 text-text-muted" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Selected metrics */}
        <SectionCard
          eyebrow={`${selectedMetrics.length} metric${selectedMetrics.length !== 1 ? 's' : ''} selected`}
          title="Selected metrics"
        >
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {selectedMetrics.length === 0 ? (
              <EmptyState
                icon={<BarChart3 size={24} />}
                title="No metrics yet"
                description="Select metrics from the list to add them here."
              />
            ) : (
              selectedMetrics.map(metric => (
                <div
                  key={metric.id}
                  className="space-y-2 rounded-md border border-line p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {metric.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMetric(metric.id)}
                      aria-label={`Remove ${metric.name}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <Select
                    value={metric.groupBy}
                    onValueChange={(value) =>
                      handleUpdateGrouping(metric.id, value)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs" aria-label={`Grouping for ${metric.name}`}>
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
          </div>
        </SectionCard>
      </div>

      {/* Preview */}
      {previewMode && selectedMetrics.length > 0 && (
        <SectionCard eyebrow="How the selected metrics appear" title="Report preview">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedMetrics.map(metric => (
              <div
                key={metric.id}
                className="rounded-md border border-line p-4"
              >
                <p className="text-sm font-semibold text-text-primary">
                  {metric.name}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Grouped by: {groupingOptions.find(o => o.id === metric.groupBy)?.name}
                </p>
                <div className="mt-3 flex h-32 items-center justify-center rounded-sm border border-dashed border-line-strong bg-surface-2">
                  <p className="text-xs text-text-muted">[Chart preview]</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          {selectedMetrics.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye size={16} />
              {previewMode ? 'Hide preview' : 'Show preview'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedMetrics.length === 0}
          >
            Save report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;
