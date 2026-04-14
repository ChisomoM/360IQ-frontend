import type {
  DashboardCardDefinition,
  EscalationItem,
} from '@/lib/api/dashboard';

export interface MockDepartment {
  id: string;
  name: string;
}

export interface MockRole {
  id: string;
  name: string;
}

export interface CardConfig {
  cardDefinitionId: string;
  cardId: string;
  title: string;
  departmentId: string;
  roleId?: string | null;
  visible: boolean;
  orderIndex: number;
  permissionRequired?: string;
}

/**
 * Mock departments for the dashboard demo
 */
export const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: 'dept-fin-uuid', name: 'Finance' },
  { id: 'dept-hr-uuid', name: 'Human Resources' },
  { id: 'dept-ops-uuid', name: 'Operations' },
  { id: 'dept-legal-uuid', name: 'Legal' },
  { id: 'dept-it-uuid', name: 'IT & Systems' },
];

/**
 * Mock roles for the dashboard demo
 */
export const MOCK_ROLES: MockRole[] = [
  { id: 'role-admin', name: 'Admin' },
  { id: 'role-manager', name: 'Manager' },
  { id: 'role-employee', name: 'Employee' },
  { id: 'role-approver', name: 'Approver' },
];

/**
 * Mock card definitions - templates available in the system
 */
export const MOCK_CARD_DEFINITIONS: DashboardCardDefinition[] = [
  {
    id: 'def-escalations-1',
    card_id: 'escalations-pending',
    title: 'Pending Approvals',
    description:
      'Documents and requests awaiting approval in your department',
    card_type: 'escalations',
    layout_zone: 'top',
    order_index: 1,
    config: { threshold_days: 7, show_critical_only: false },
  },
  {
    id: 'def-metric-spend',
    card_id: 'metric-monthly-spend',
    title: 'Monthly Spend',
    description: 'Total departmental spending this month vs. budget',
    card_type: 'metric',
    layout_zone: 'side',
    order_index: 1,
    config: { currency: 'USD', target: 50000, showPercentage: true },
  },
  {
    id: 'def-metric-headcount',
    card_id: 'metric-headcount',
    title: 'Team Headcount',
    description: 'Current active employees in your department',
    card_type: 'metric',
    layout_zone: 'side',
    order_index: 2,
    config: { target: 25, showTrend: true },
  },
  {
    id: 'def-chart-revenue',
    card_id: 'chart-revenue-trend',
    title: 'Revenue Trend',
    description: 'YTD revenue trajectory',
    card_type: 'chart',
    layout_zone: 'middle',
    order_index: 1,
    config: { chartType: 'line', period: 'monthly', showForecast: true },
  },
  {
    id: 'def-chart-hiring',
    card_id: 'chart-hiring-pipeline',
    title: 'Hiring Pipeline',
    description: 'Open positions and candidate flow',
    card_type: 'chart',
    layout_zone: 'middle',
    order_index: 2,
    config: { chartType: 'bar', period: 'weekly' },
  },
  {
    id: 'def-table-tasks',
    card_id: 'table-open-tasks',
    title: 'Open Tasks',
    description: 'Unassigned tasks in your queue',
    card_type: 'table',
    layout_zone: 'middle',
    order_index: 3,
    config: { maxRows: 10, sortBy: 'priority' },
  },
  {
    id: 'def-table-compliance',
    card_id: 'table-compliance-items',
    title: 'Compliance Items',
    description: 'Upcoming compliance deadlines',
    card_type: 'table',
    layout_zone: 'middle',
    order_index: 4,
    config: { maxRows: 8, sortBy: 'due_date' },
  },
];

/**
 * Mock escalations - documents pending approval with varying urgency
 */
export const MOCK_ESCALATIONS: EscalationItem[] = [
  {
    document_id: 'doc-uuid-001',
    document_title: 'Q1 2026 Budget Proposal - Finance Department',
    document_type: 'budget_request',
    department_id: 'dept-fin-uuid',
    department_name: 'Finance',
    current_stage: 'CFO Approval',
    current_approver_id: 'user-uuid-005',
    approver_name: 'Sarah Chen',
    days_pending: 18,
    status: 'critical',
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    document_id: 'doc-uuid-002',
    document_title: 'Annual Compensation Review - HR Department',
    document_type: 'hr_policy',
    department_id: 'dept-hr-uuid',
    department_name: 'Human Resources',
    current_stage: 'CHRO Review',
    current_approver_id: 'user-uuid-006',
    approver_name: 'Marcus Johnson',
    days_pending: 12,
    status: 'urgent',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    document_id: 'doc-uuid-003',
    document_title: 'Emergency Procurement Authorization',
    document_type: 'purchase_order',
    department_id: 'dept-ops-uuid',
    department_name: 'Operations',
    current_stage: 'Operations Manager Sign-off',
    current_approver_id: 'user-uuid-007',
    approver_name: 'Elena Rodriguez',
    days_pending: 9,
    status: 'urgent',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    document_id: 'doc-uuid-004',
    document_title: 'New IT Security Policy Update',
    document_type: 'policy_document',
    department_id: 'dept-it-uuid',
    department_name: 'IT & Systems',
    current_stage: 'CTO Review',
    current_approver_id: 'user-uuid-008',
    approver_name: 'David Kim',
    days_pending: 5,
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    document_id: 'doc-uuid-005',
    document_title: 'Contract Review - Vendor Agreement',
    document_type: 'contract',
    department_id: 'dept-legal-uuid',
    department_name: 'Legal',
    current_stage: 'General Counsel Review',
    current_approver_id: 'user-uuid-009',
    approver_name: 'Patricia Zhang',
    days_pending: 3,
    status: 'pending',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    document_id: 'doc-uuid-006',
    document_title: 'Quarterly Headcount Adjustment',
    document_type: 'hr_request',
    department_id: 'dept-fin-uuid',
    department_name: 'Finance',
    current_stage: 'Finance Manager Approval',
    current_approver_id: 'user-uuid-010',
    approver_name: 'Robert Thompson',
    days_pending: 7,
    status: 'pending',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Mock card configurations - visibility rules per department/role
 * This defines which cards are shown to whom and in what order
 */
export const MOCK_CARD_CONFIGURATIONS: CardConfig[] = [
  // Finance Department - All Roles
  {
    cardDefinitionId: 'def-escalations-1',
    cardId: 'escalations-pending',
    title: 'Pending Approvals',
    departmentId: 'dept-fin-uuid',
    roleId: null, // All roles in Finance see this
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.escalations',
  },
  {
    cardDefinitionId: 'def-metric-spend',
    cardId: 'metric-monthly-spend',
    title: 'Monthly Spend',
    departmentId: 'dept-fin-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.financials',
  },
  {
    cardDefinitionId: 'def-chart-revenue',
    cardId: 'chart-revenue-trend',
    title: 'Revenue Trend',
    departmentId: 'dept-fin-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.analytics',
  },

  // HR Department - All Roles
  {
    cardDefinitionId: 'def-escalations-1',
    cardId: 'escalations-pending',
    title: 'Pending Approvals',
    departmentId: 'dept-hr-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.escalations',
  },
  {
    cardDefinitionId: 'def-metric-headcount',
    cardId: 'metric-headcount',
    title: 'Team Headcount',
    departmentId: 'dept-hr-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.hr_metrics',
  },
  {
    cardDefinitionId: 'def-chart-hiring',
    cardId: 'chart-hiring-pipeline',
    title: 'Hiring Pipeline',
    departmentId: 'dept-hr-uuid',
    roleId: null,
    visible: true,
    orderIndex: 2,
    permissionRequired: 'view.hr_analytics',
  },

  // Operations Department - All Roles
  {
    cardDefinitionId: 'def-escalations-1',
    cardId: 'escalations-pending',
    title: 'Pending Approvals',
    departmentId: 'dept-ops-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.escalations',
  },
  {
    cardDefinitionId: 'def-table-tasks',
    cardId: 'table-open-tasks',
    title: 'Open Tasks',
    departmentId: 'dept-ops-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.tasks',
  },

  // Legal Department - All Roles
  {
    cardDefinitionId: 'def-escalations-1',
    cardId: 'escalations-pending',
    title: 'Pending Approvals',
    departmentId: 'dept-legal-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.escalations',
  },
  {
    cardDefinitionId: 'def-table-compliance',
    cardId: 'table-compliance-items',
    title: 'Compliance Items',
    departmentId: 'dept-legal-uuid',
    roleId: null,
    visible: true,
    orderIndex: 2,
    permissionRequired: 'view.compliance',
  },

  // IT Department - All Roles
  {
    cardDefinitionId: 'def-escalations-1',
    cardId: 'escalations-pending',
    title: 'Pending Approvals',
    departmentId: 'dept-it-uuid',
    roleId: null,
    visible: true,
    orderIndex: 1,
    permissionRequired: 'view.escalations',
  },
];

/**
 * Sample chart data for Revenue Trend card
 */
export const MOCK_CHART_REVENUE_DATA = [
  { month: 'Jan', revenue: 45000, forecast: 47000 },
  { month: 'Feb', revenue: 52000, forecast: 54000 },
  { month: 'Mar', revenue: 48000, forecast: 51000 },
  { month: 'Apr', revenue: 61000, forecast: 58000 },
  { month: 'May', revenue: 0, forecast: 62000 },
  { month: 'Jun', revenue: 0, forecast: 65000 },
];

/**
 * Sample chart data for Hiring Pipeline card
 */
export const MOCK_CHART_HIRING_DATA = [
  { position: 'Senior Engineer', openings: 3, applications: 24, interviews: 8 },
  { position: 'Product Manager', openings: 1, applications: 12, interviews: 4 },
  { position: 'Data Analyst', openings: 2, applications: 15, interviews: 5 },
  { position: 'Designer', openings: 1, applications: 8, interviews: 2 },
];

/**
 * Sample table data for Open Tasks
 */
export const MOCK_TASKS_TABLE_DATA = [
  {
    id: 'task-1',
    title: 'Review Q1 Financial Statements',
    priority: 'high',
    assignedTo: 'Unassigned',
    dueDate: '2026-04-10',
    status: 'open',
  },
  {
    id: 'task-2',
    title: 'Update employee handbook',
    priority: 'medium',
    assignedTo: 'Unassigned',
    dueDate: '2026-04-15',
    status: 'open',
  },
  {
    id: 'task-3',
    title: 'Compliance audit follow-up',
    priority: 'high',
    assignedTo: 'Unassigned',
    dueDate: '2026-04-08',
    status: 'open',
  },
  {
    id: 'task-4',
    title: 'System upgrade scheduling',
    priority: 'low',
    assignedTo: 'Unassigned',
    dueDate: '2026-04-30',
    status: 'open',
  },
];

/**
 * Sample table data for Compliance Items
 */
export const MOCK_COMPLIANCE_TABLE_DATA = [
  {
    id: 'comp-1',
    requirement: 'SOC 2 Type II Audit',
    dueDate: '2026-06-15',
    status: 'in_progress',
    owner: 'IT Compliance Officer',
  },
  {
    id: 'comp-2',
    requirement: 'Privacy Policy Review',
    dueDate: '2026-04-20',
    status: 'pending',
    owner: 'Legal Team',
  },
  {
    id: 'comp-3',
    requirement: 'Annual Security Training',
    dueDate: '2026-05-01',
    status: 'pending',
    owner: 'HR Department',
  },
];
