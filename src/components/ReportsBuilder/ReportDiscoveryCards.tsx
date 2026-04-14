import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Lock, 
  FileText,
  Zap 
} from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import type { User } from '@/types/auth';

interface ReportTypeConfig {
  id: string;
  name: string;
  description: string;
  permission: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
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
    name: 'Document Lifecycle',
    description: 'Track document journey from submission to completion',
    permission: 'analytics.read',
    icon: TrendingUp,
    color: 'blue',
    badges: ['All Teams', 'Workflow'],
    preview: {
      metric1: 'Total Documents',
      metric1Value: '2,847',
      metric2: 'Avg Processing Time',
      metric2Value: '4.2 days',
      metric3: 'Completion Rate',
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
    name: 'Financial / Invoices',
    description: 'Invoice volume, values, and approval rates',
    permission: 'payments.read',
    icon: DollarSign,
    color: 'green',
    badges: ['Finance'],
    preview: {
      metric1: 'Total Value',
      metric1Value: '$847K',
      metric2: 'Transaction Count',
      metric2Value: '365',
      metric3: 'Approval Rate',
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
    name: 'User Activity',
    description: 'User interactions and document processing metrics',
    permission: 'analytics.read',
    icon: Users,
    color: 'purple',
    badges: ['All Teams', 'Productivity'],
    preview: {
      metric1: 'Active Users',
      metric1Value: '48',
      metric2: 'Documents Processed',
      metric2Value: '1,234',
      metric3: 'Avg Actions/User',
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
    name: 'Audit Trail',
    description: 'Comprehensive audit logs for compliance',
    permission: 'audit.read',
    icon: Lock,
    color: 'red',
    badges: ['Compliance', 'Auditors'],
    preview: {
      metric1: 'Audit Events',
      metric1Value: '847',
      metric2: 'Users Tracked',
      metric2Value: '28',
      metric3: 'Modified Records',
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
    name: 'Custom Report',
    description: 'Build your own report with selected metrics',
    permission: 'analytics.read',
    icon: FileText,
    color: 'gray',
    badges: ['Advanced', 'Power Users'],
    preview: {
      metric1: 'Custom Metrics',
      metric1Value: 'Unlimited',
      metric2: 'Data Sources',
      metric2Value: 'All Depts',
      metric3: 'Flexibility',
      metric3Value: 'Maximum',
    },
    useCases: [
      'Ad-hoc analysis',
      'Cross-department insights',
      'Custom KPI dashboards',
    ],
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  green: 'bg-green-50 border-green-200 hover:border-green-300',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
  red: 'bg-red-50 border-red-200 hover:border-red-300',
  gray: 'bg-gray-50 border-gray-200 hover:border-gray-300',
};

const badgeColorMap: Record<string, string> = {
  'All Teams': 'bg-blue-100 text-blue-700',
  'Finance': 'bg-green-100 text-green-700',
  'Compliance': 'bg-red-100 text-red-700',
  'Auditors': 'bg-red-100 text-red-700',
  'Advanced': 'bg-purple-100 text-purple-700',
  'Power Users': 'bg-purple-100 text-purple-700',
  'Workflow': 'bg-blue-100 text-blue-700',
  'Productivity': 'bg-yellow-100 text-yellow-700',
};

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose a pre-built report template or create a custom one. Datapoints show typical content for each report type.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {availableReports.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedType === report.id;
          
          return (
            <button
              key={report.id}
              onClick={() => onSelect(report.id)}
              className={`text-left transition-all border-2 rounded-lg p-4 ${
                isSelected
                  ? `${colorMap[report.color]} border-primary bg-primary/5`
                  : `${colorMap[report.color]}`
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`p-3 rounded-lg flex-shrink-0 ${
                    report.color === 'blue' ? 'bg-blue-100' :
                    report.color === 'green' ? 'bg-green-100' :
                    report.color === 'purple' ? 'bg-purple-100' :
                    report.color === 'red' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${
                    report.color === 'blue' ? 'text-blue-600' :
                    report.color === 'green' ? 'text-green-600' :
                    report.color === 'purple' ? 'text-purple-600' :
                    report.color === 'red' ? 'text-red-600' :
                    'text-gray-600'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {report.badges.map((badge) => (
                      <Badge 
                        key={badge} 
                        variant="secondary"
                        className={`text-xs ${badgeColorMap[badge] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  {/* Preview Metrics */}
                  <div className="grid grid-cols-3 gap-3 bg-white/50 rounded p-3">
                    <div>
                      <p className="text-xs text-gray-600">{report.preview.metric1}</p>
                      <p className="text-sm font-semibold text-gray-900">{report.preview.metric1Value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{report.preview.metric2}</p>
                      <p className="text-sm font-semibold text-gray-900">{report.preview.metric2Value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{report.preview.metric3}</p>
                      <p className="text-sm font-semibold text-gray-900">{report.preview.metric3Value}</p>
                    </div>
                  </div>

                  {/* Use Cases */}
                  <details className="mt-3 group">
                    <summary className="text-xs font-medium text-primary cursor-pointer hover:underline">
                      Common use cases →
                    </summary>
                    <ul className="mt-2 ml-3 space-y-1 text-xs text-gray-600">
                      {report.useCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
