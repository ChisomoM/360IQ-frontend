/**
 * Financial Data Types for Frontend
 * Extends base Document types with financial-specific metadata
 */

import type { Document } from './dms';

// ============================================================================
// FINANCIAL COLUMN TYPES
// ============================================================================

export interface FinancialColumnMeta {
  name: string;
  kind: 'numeric' | 'categorical';
  financial_metadata?: {
    type?:
      | 'amount'
      | 'date'
      | 'count'
      | 'ratio'
      | 'percentage'
      | 'currency';
    currency?: string; // "USD", "KES", etc
    is_calculated?: boolean; // Subtotal/total rows
    sign_convention?: 'normal' | 'inverted'; // Some accounting systems invert
  };
}

// ============================================================================
// FINANCIAL SHEET DATA
// ============================================================================

export interface FinancialSheetData {
  name: string;
  columns: FinancialColumnMeta[];
  rows: (string | number | null)[][];
  financial_metadata?: {
    statement_type:
      | 'profit_loss'
      | 'balance_sheet'
      | 'cash_flow'
      | 'invoice_list'
      | 'payment_list'
      | 'other';
    fiscal_year?: number;
    fiscal_period?: 'full_year' | 'quarterly' | 'monthly' | 'weekly';
    currency: string;
    total_row_indices?: number[]; // Row indices that are subtotals
    sections?: Record<string, { start: number; end: number }>; // "revenue", "expenses"
  };
}

// ============================================================================
// FINANCIAL TABLE DATA
// ============================================================================

export interface FinancialTableData {
  sheets: FinancialSheetData[];
  extracted_at: string;
  detected_statement_type:
    | 'profit_loss'
    | 'balance_sheet'
    | 'cash_flow'
    | 'invoice_list'
    | 'payment_list'
    | 'other';
}

// ============================================================================
// FINANCIAL DOCUMENT TYPE
// ============================================================================

export interface FinancialDocument extends Document {
  category: 'financial';
  statement_type:
    | 'profit_loss'
    | 'balance_sheet'
    | 'cash_flow'
    | 'invoice_list'
    | 'payment_list'
    | 'other';
  fiscal_year?: number;
  fiscal_period?: 'full_year' | 'quarterly' | 'monthly' | 'weekly';
  currency: string;
}

// ============================================================================
// FINANCIAL COMPARISON TYPES
// ============================================================================

export interface FinancialComparisonSeries {
  document_id: string;
  title: string;
  file_name: string;
  rows: (string | number | null)[][];
}

export interface FinancialComparisonMetric {
  metric: string; // "Revenue Growth", "Operating Margin"
  value?: number; // For single value metrics
  values?: Record<string, number>; // For per-document metrics
  unit: '%' | 'K' | 'M' | 'absolute';
  interpretation: 'positive' | 'negative' | 'neutral';
  formula?: string; // For documentation
}

export interface VarianceAnalysisRow {
  account: string;
  values: Record<string, number>;
  variance: number;
  variance_percent: number;
}

export interface FinancialComparisonData {
  shared_columns: FinancialColumnMeta[];
  series: FinancialComparisonSeries[];
  financial_metrics: FinancialComparisonMetric[];
  variance_analysis?: {
    by_row: VarianceAnalysisRow[];
  };
}

// ============================================================================
// CHART VIEWER STATE
// ============================================================================

export interface FinancialChartState {
  selectedSheet: string;
  xAxis: string;
  yAxes: string[];
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'pl_layout' | 'waterfall';
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export type StatementType =
  | 'profit_loss'
  | 'balance_sheet'
  | 'cash_flow'
  | 'invoice_list'
  | 'payment_list'
  | 'other';

export type FiscalPeriod =
  | 'full_year'
  | 'quarterly'
  | 'monthly'
  | 'weekly';

export interface StatementTypeInfo {
  key: StatementType;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const STATEMENT_TYPE_INFO: Record<StatementType, StatementTypeInfo> = {
  profit_loss: {
    key: 'profit_loss',
    label: 'P&L Statement',
    description: 'Profit and Loss statement',
    color: 'bg-orange-100 text-orange-700',
    icon: '📊',
  },
  balance_sheet: {
    key: 'balance_sheet',
    label: 'Balance Sheet',
    description: 'Balance sheet / Assets, Liabilities & Equity',
    color: 'bg-blue-100 text-blue-700',
    icon: '⚖️',
  },
  cash_flow: {
    key: 'cash_flow',
    label: 'Cash Flow',
    description: 'Cash flow statement',
    color: 'bg-positive-tint text-positive',
    icon: '💧',
  },
  invoice_list: {
    key: 'invoice_list',
    label: 'Invoices',
    description: 'Invoice list / Receivables',
    color: 'bg-green-100 text-green-700',
    icon: '📄',
  },
  payment_list: {
    key: 'payment_list',
    label: 'Payments',
    description: 'Payment list / Transactions',
    color: 'bg-signal-tint text-signal-text',
    icon: '💰',
  },
  other: {
    key: 'other',
    label: 'Other',
    description: 'Other financial data',
    color: 'bg-gray-100 text-gray-700',
    icon: '📋',
  },
};

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface FinancialDashboardSummary {
  total_documents: number;
  latest_statement?: {
    title: string;
    statement_type: StatementType;
    fiscal_year: number;
    uploaded_at: string;
  };
  statements_by_type: Record<StatementType, number>;
  latest_metrics?: {
    total_revenue?: number;
    total_expenses?: number;
    net_income?: number;
    gross_margin?: number;
  };
}
