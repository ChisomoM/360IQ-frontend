import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Lock,
  FileText,
  CheckCircle,
} from '@/components/icons';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import type { User } from '@/types/auth';
import { cn } from '@/lib/utils';

interface ReportTypeConfig {
  id: string;
  name: string;
  description: string;
  permission: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badges: string[];
  preview: {
    metric1: string;
    metric1Value: string;
    metric2: string;
    metric2Value: string;
    metric3: string;
    metric3Value: string;
  };
  useCases: string[];
}

interface ReportDiscoveryCardsProps {
  selectedType: string | null;
  onSelect: (type: string) => void;
  user: User | null;
}

const reportTypes: ReportTypeConfig[] = [
  {
    id: 'lifecycle',
    name: 'Document lifecycle',
    description: 'Track each document from submission to completion',
    permission: 'analytics.read',
    icon: TrendingUp,
    badges: ['All teams', 'Workflow'],
    preview: {
      metric1: 'Total documents',
      metric1Value: '2,847',
      metric2: 'Average processing time',
      metric2Value: '4.2 days',
      metric3: 'Completion rate',
      metric3Value: '89%',
    },
    useCases: [
      'Monitor document bottlenecks',
      'Track approval workflows',
      'Measure processing efficiency',
    ],
  },
  {
    id: 'financial',
    name: 'Financial and invoices',
    description: 'Invoice volume, values and approval rates',
    permission: 'payments.read',
    icon: DollarSign,
    badges: ['Finance'],
    preview: {
      metric1: 'Total value',
      metric1Value: '$847K',
      metric2: 'Transaction count',
      metric2Value: '365',
      metric3: 'Approval rate',
      metric3Value: '94%',
    },
    useCases: [
      'Revenue analysis',
      'Budget tracking',
      'Payment reconciliation',
    ],
  },
  {
    id: 'user_activity',
    name: 'Team activity',
    description: 'Team interactions and document processing metrics',
    permission: 'analytics.read',
    icon: Users,
    badges: ['All teams', 'Productivity'],
    preview: {
      metric1: 'Active people',
      metric1Value: '48',
      metric2: 'Documents processed',
      metric2Value: '1,234',
      metric3: 'Actions per person',
      metric3Value: '25.7',
    },
    useCases: [
      'Team productivity metrics',
      'User engagement tracking',
      'Performance benchmarking',
    ],
  },
  {
    id: 'audit_trail',
    name: 'Audit trail',
    description: 'Full audit logs for compliance',
    permission: 'audit.read',
    icon: Lock,
    badges: ['Compliance', 'Auditors'],
    preview: {
      metric1: 'Audit events',
      metric1Value: '847',
      metric2: 'People tracked',
      metric2Value: '28',
      metric3: 'Modified records',
      metric3Value: '324',
    },
    useCases: [
      'Compliance reporting',
      'Security audits',
      'Change tracking',
    ],
  },
  {
    id: 'custom',
    name: 'Custom report',
    description: 'Build your own report with the metrics you choose',
    permission: 'analytics.read',
    icon: FileText,
    badges: ['Advanced'],
    preview: {
      metric1: 'Custom metrics',
      metric1Value: 'Unlimited',
      metric2: 'Data sources',
      metric2Value: 'All departments',
      metric3: 'Flexibility',
      metric3Value: 'Maximum',
    },
    useCases: [
      'Ad hoc analysis',
      'Cross-department insights',
      'Custom KPI dashboards',
    ],
  },
];

export const ReportDiscoveryCards: React.FC<ReportDiscoveryCardsProps> = ({
  selectedType,
  onSelect,
  user,
}) => {
  const canViewAnalytics = user?.permissions ? 
    hasPermission(user.permissions, PERMISSIONS['analytics.read']) : false;
  const canViewPayments = user?.permissions ? 
    hasPermission(user.permissions, PERMISSIONS['payments.read']) : false;
  const canViewAudit = user?.permissions ? 
    hasPermission(user.permissions, PERMISSIONS['audit.read']) : false;

  const hasPermissionForType = (reportType: ReportTypeConfig): boolean => {
    if (reportType.permission === 'analytics.read') return canViewAnalytics;
    if (reportType.permission === 'payments.read') return canViewPayments;
    if (reportType.permission === 'audit.read') return canViewAudit;
    return true;
  };

  const availableReports = reportTypes.filter(hasPermissionForType);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Select a report type</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose a ready-made report or build your own. The figures show sample content for each type.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {availableReports.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedType === report.id;

          return (
            <article
              key={report.id}
              className={cn(
                'min-w-0 rounded-lg border bg-surface-1 shadow-card transition-shadow hover:shadow-card-hover',
                isSelected ? 'border-signal ring-1 ring-signal' : 'border-line',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(report.id)}
                aria-pressed={isSelected}
                className="flex w-full items-start gap-4 rounded-lg p-4 text-left"
              >
                <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                  <Icon size={24} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="mb-2 flex items-start justify-between gap-2">
                    <span className="block">
                      <span className="block text-base font-semibold text-text-primary">{report.name}</span>
                      <span className="mt-1 block text-sm text-text-secondary">{report.description}</span>
                    </span>
                    {isSelected && <CheckCircle size={20} className="mt-1 flex-shrink-0 text-signal-text" />}
                  </span>

                  <span className="mb-3 flex flex-wrap gap-2">
                    {report.badges.map((badge) => (
                      <span key={badge} className="rounded-pill bg-field px-2.5 py-0.5 text-xs text-text-secondary">
                        {badge}
                      </span>
                    ))}
                  </span>

                  <span className="grid grid-cols-1 gap-3 rounded-sm bg-field p-3 sm:grid-cols-3">
                    {[
                      [report.preview.metric1, report.preview.metric1Value],
                      [report.preview.metric2, report.preview.metric2Value],
                      [report.preview.metric3, report.preview.metric3Value],
                    ].map(([label, value]) => (
                      <span key={label} className="block">
                        <span className="block text-xs text-text-muted">{label}</span>
                        <span className="block text-sm font-semibold text-text-primary">{value}</span>
                      </span>
                    ))}
                  </span>
                </span>
              </button>

              {/* Use cases */}
              <details className="px-4 pb-4">
                <summary className="cursor-pointer text-xs font-medium text-signal-text hover:underline">
                  Common use cases
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-text-secondary">
                  {report.useCases.map((useCase, idx) => (
                    <li key={idx}>{useCase}</li>
                  ))}
                </ul>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
};
