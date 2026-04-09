/**
 * Mock Financial Data for Frontend Simulation
 * Includes P&L statements, cash flow, and invoice lists for testing
 */

import type { FinancialDocument, FinancialTableData, FinancialComparisonData, FinancialComparisonMetric } from '@/types/finance';
import { format } from 'date-fns';

// ============================================================================
// MOCK DOCUMENTS (Simulates uploaded files)
// ============================================================================

export const MOCK_FINANCIAL_DOCUMENTS: FinancialDocument[] = [
  {
    id: 'doc-pl-2024',
    title: 'P&L Statement 2024',
    file_name: 'P&L_2024.xlsx',
    description: 'Full year 2024 profit and loss statement',
    category: 'financial',
    statement_type: 'profit_loss',
    fiscal_year: 2024,
    fiscal_period: 'full_year',
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-15T10:00:00Z',
    visibility_level: 'restricted',
  } as any,
  {
    id: 'doc-pl-2023',
    title: 'P&L Statement 2023',
    file_name: 'P&L_2023.xlsx',
    description: 'Full year 2023 profit and loss statement',
    category: 'financial',
    statement_type: 'profit_loss',
    fiscal_year: 2023,
    fiscal_period: 'full_year',
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2023-12-15T10:00:00Z',
    updated_at: '2023-12-15T10:00:00Z',
    visibility_level: 'restricted',
  } as any,
  {
    id: 'doc-cf-2024',
    title: 'Cash Flow Statement 2024',
    file_name: 'CashFlow_2024.xlsx',
    description: 'Monthly cash flow for 2024',
    category: 'financial',
    statement_type: 'cash_flow',
    fiscal_year: 2024,
    fiscal_period: 'monthly',
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2024-12-20T10:00:00Z',
    updated_at: '2024-12-20T10:00:00Z',
    visibility_level: 'restricted',
  } as any,
  {
    id: 'doc-invoices-2024',
    title: 'Invoices Q1-Q4 2024',
    file_name: 'Invoices_2024.csv',
    description: 'All invoices issued in 2024',
    category: 'financial',
    statement_type: 'invoice_list',
    fiscal_year: 2024,
    fiscal_period: 'full_year',
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-12-31T10:00:00Z',
    visibility_level: 'restricted',
  } as any,
  {
    id: 'doc-payments-2024',
    title: 'Payments Received 2024',
    file_name: 'Payments_2024.csv',
    description: 'All payments received in 2024',
    category: 'financial',
    statement_type: 'payment_list',
    fiscal_year: 2024,
    fiscal_period: 'full_year',
    currency: 'USD',
    owner_id: 'user-1',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-12-31T10:00:00Z',
    visibility_level: 'restricted',
  } as any,
];

// ============================================================================
// P&L 2024 DATA
// ============================================================================

export const PL_2024_DATA: FinancialTableData = {
  sheets: [
    {
      name: 'P&L',
      columns: [
        { name: 'Account', kind: 'categorical' },
        {
          name: 'Q1',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Q2',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Q3',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Q4',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Total',
          kind: 'numeric',
          financial_metadata: {
            type: 'amount',
            currency: 'USD',
            is_calculated: true,
          },
        },
      ],
      rows: [
        // REVENUE SECTION
        ['REVENUE', 150000, 165000, 180000, 195000, 690000],
        ['  Product Sales', 100000, 110000, 120000, 130000, 460000],
        ['  Service Revenue', 50000, 55000, 60000, 65000, 230000],
        ['', '', '', '', '', ''],

        // COST OF REVENUE
        ['COST OF REVENUE', 60000, 66000, 72000, 78000, 276000],
        ['  Materials & Supplies', 30000, 33000, 36000, 39000, 138000],
        ['  Labor - Production', 30000, 33000, 36000, 39000, 138000],
        ['', '', '', '', '', ''],

        // GROSS PROFIT
        ['GROSS PROFIT', 90000, 99000, 108000, 117000, 414000],
        ['', '', '', '', '', ''],

        // OPERATING EXPENSES
        ['OPERATING EXPENSES', 50000, 52000, 54000, 56000, 212000],
        ['  Salaries & Benefits', 30000, 30000, 30000, 30000, 120000],
        ['  Marketing & Sales', 10000, 12000, 14000, 16000, 52000],
        ['  Office & Admin', 10000, 10000, 10000, 10000, 40000],
        ['', '', '', '', '', ''],

        // OPERATING INCOME
        ['OPERATING INCOME', 40000, 47000, 54000, 61000, 202000],
        ['', '', '', '', '', ''],

        // OTHER INCOME/EXPENSES
        ['OTHER INCOME/EXPENSES', 2000, 2500, 3000, 3500, 11000],
        ['  Interest Income', 2000, 2500, 3000, 3500, 11000],
        ['', '', '', '', '', ''],

        // NET INCOME
        ['NET INCOME', 42000, 49500, 57000, 64500, 213000],
      ],
      financial_metadata: {
        statement_type: 'profit_loss',
        fiscal_year: 2024,
        currency: 'USD',
        total_row_indices: [0, 4, 9, 14, 18, 22],
        sections: {
          revenue: { start: 0, end: 2 },
          cost_of_revenue: { start: 4, end: 6 },
          gross_profit: { start: 8, end: 8 },
          operating_expenses: { start: 10, end: 13 },
          operating_income: { start: 15, end: 15 },
          other_income: { start: 17, end: 18 },
          net_income: { start: 20, end: 20 },
        },
      } as any,
    },
  ],
  detected_statement_type: 'profit_loss',
  extracted_at: format(new Date('2024-12-15'), 'yyyy-MM-dd HH:mm:ss'),
};

// ============================================================================
// P&L 2023 DATA (for comparison)
// ============================================================================

export const PL_2023_DATA: FinancialTableData = {
  sheets: [
    {
      name: 'P&L',
      columns: [
        { name: 'Account', kind: 'categorical' },
        {
          name: 'Q1',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Q2',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Q3',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Q4',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Total',
          kind: 'numeric',
          financial_metadata: {
            type: 'amount',
            currency: 'USD',
            is_calculated: true,
          },
        },
      ],
      rows: [
        // REVENUE SECTION
        ['REVENUE', 120000, 130000, 140000, 150000, 540000],
        ['  Product Sales', 80000, 85000, 90000, 100000, 355000],
        ['  Service Revenue', 40000, 45000, 50000, 50000, 185000],
        ['', '', '', '', '', ''],

        // COST OF REVENUE
        ['COST OF REVENUE', 48000, 52000, 56000, 60000, 216000],
        ['  Materials & Supplies', 24000, 26000, 28000, 30000, 108000],
        ['  Labor - Production', 24000, 26000, 28000, 30000, 108000],
        ['', '', '', '', '', ''],

        // GROSS PROFIT
        ['GROSS PROFIT', 72000, 78000, 84000, 90000, 324000],
        ['', '', '', '', '', ''],

        // OPERATING EXPENSES
        ['OPERATING EXPENSES', 45000, 46000, 48000, 50000, 189000],
        ['  Salaries & Benefits', 28000, 28000, 28000, 28000, 112000],
        ['  Marketing & Sales', 10000, 10000, 12000, 14000, 46000],
        ['  Office & Admin', 7000, 8000, 8000, 8000, 31000],
        ['', '', '', '', '', ''],

        // OPERATING INCOME
        ['OPERATING INCOME', 27000, 32000, 36000, 40000, 135000],
        ['', '', '', '', '', ''],

        // OTHER INCOME/EXPENSES
        ['OTHER INCOME/EXPENSES', 1000, 1500, 1500, 2000, 6000],
        ['  Interest Income', 1000, 1500, 1500, 2000, 6000],
        ['', '', '', '', '', ''],

        // NET INCOME
        ['NET INCOME', 28000, 33500, 37500, 42000, 141000],
      ],
      financial_metadata: {
        statement_type: 'profit_loss',
        fiscal_year: 2023,
        currency: 'USD',
        total_row_indices: [0, 4, 9, 14, 18, 22],
        sections: {
          revenue: { start: 0, end: 2 },
          cost_of_revenue: { start: 4, end: 6 },
          gross_profit: { start: 8, end: 8 },
          operating_expenses: { start: 10, end: 13 },
          operating_income: { start: 15, end: 15 },
          other_income: { start: 17, end: 18 },
          net_income: { start: 20, end: 20 },
        },
      } as any,
    },
  ],
  detected_statement_type: 'profit_loss',
  extracted_at: format(new Date('2023-12-15'), 'yyyy-MM-dd HH:mm:ss'),
};

// ============================================================================
// CASH FLOW 2024 DATA
// ============================================================================

export const CASH_FLOW_2024_DATA: FinancialTableData = {
  sheets: [
    {
      name: 'Cash Flow',
      columns: [
        { name: 'Month', kind: 'categorical' },
        {
          name: 'Operating',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Investing',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Financing',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Net Change',
          kind: 'numeric',
          financial_metadata: {
            type: 'amount',
            currency: 'USD',
            is_calculated: true,
          },
        },
        {
          name: 'Cumulative',
          kind: 'numeric',
          financial_metadata: {
            type: 'amount',
            currency: 'USD',
            is_calculated: true,
          },
        },
      ],
      rows: [
        ['January', 42000, -5000, -2000, 35000, 35000],
        ['February', 49500, -3000, 0, 46500, 81500],
        ['March', 38000, -8000, -5000, 25000, 106500],
        ['April', 52000, -2000, 0, 50000, 156500],
        ['May', 45000, -4000, -3000, 38000, 194500],
        ['June', 55000, -6000, 0, 49000, 243500],
        ['July', 48000, -3000, -2000, 43000, 286500],
        ['August', 60000, -5000, 0, 55000, 341500],
        ['September', 52000, -4000, -4000, 44000, 385500],
        ['October', 58000, -2000, 0, 56000, 441500],
        ['November', 54000, -3000, -3000, 48000, 489500],
        ['December', 62000, -6000, -5000, 51000, 540500],
      ],
      financial_metadata: {
        statement_type: 'cash_flow',
        fiscal_year: 2024,
        currency: 'USD',
      } as any,
    },
  ],
  detected_statement_type: 'cash_flow',
  extracted_at: format(new Date('2024-12-20'), 'yyyy-MM-dd HH:mm:ss'),
};

// ============================================================================
// INVOICES 2024 DATA
// ============================================================================

export const INVOICES_2024_DATA: FinancialTableData = {
  sheets: [
    {
      name: 'Invoices',
      columns: [
        { name: 'Invoice #', kind: 'categorical' },
        {
          name: 'Customer',
          kind: 'categorical',
        },
        {
          name: 'Date',
          kind: 'categorical',
          financial_metadata: { type: 'date' },
        },
        {
          name: 'Amount',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Paid',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Outstanding',
          kind: 'numeric',
          financial_metadata: {
            type: 'amount',
            currency: 'USD',
            is_calculated: true,
          },
        },
        { name: 'Status', kind: 'categorical' },
      ],
      rows: [
        ['INV-001', 'Acme Corp', '2024-01-05', 45000, 45000, 0, 'Paid'],
        ['INV-002', 'Global Tech', '2024-01-15', 32000, 32000, 0, 'Paid'],
        ['INV-003', 'Blue Industries', '2024-02-10', 28000, 28000, 0, 'Paid'],
        ['INV-004', 'Acme Corp', '2024-02-20', 38000, 38000, 0, 'Paid'],
        ['INV-005', 'Summit LLC', '2024-03-05', 22000, 0, 22000, 'Overdue'],
        ['INV-006', 'Global Tech', '2024-03-18', 35000, 17500, 17500, 'Partial'],
        ['INV-007', 'Zenith Ventures', '2024-04-02', 41000, 41000, 0, 'Paid'],
        ['INV-008', 'Blue Industries', '2024-04-15', 29000, 0, 29000, 'Pending'],
        ['INV-009', 'Acme Corp', '2024-05-10', 50000, 50000, 0, 'Paid'],
        ['INV-010', 'Global Tech', '2024-05-22', 33000, 33000, 0, 'Paid'],
        ['INV-011', 'Summit LLC', '2024-06-08', 27000, 27000, 0, 'Paid'],
        ['INV-012', 'Zenith Ventures', '2024-06-25', 44000, 44000, 0, 'Paid'],
        ['INV-013', 'Blue Industries', '2024-07-10', 36000, 0, 36000, 'Pending'],
        ['INV-014', 'Acme Corp', '2024-08-05', 48000, 48000, 0, 'Paid'],
        ['INV-015', 'Global Tech', '2024-08-20', 39000, 39000, 0, 'Paid'],
        ['INV-016', 'Summit LLC', '2024-09-12', 30000, 30000, 0, 'Paid'],
        ['INV-017', 'Zenith Ventures', '2024-10-01', 42000, 0, 42000, 'Pending'],
        ['INV-018', 'Blue Industries', '2024-10-18', 31000, 31000, 0, 'Paid'],
        ['INV-019', 'Acme Corp', '2024-11-05', 46000, 46000, 0, 'Paid'],
        ['INV-020', 'Global Tech', '2024-11-22', 37000, 0, 37000, 'Pending'],
      ],
      financial_metadata: {
        statement_type: 'invoice_list',
        fiscal_year: 2024,
        currency: 'USD',
      } as any,
    },
  ],
  detected_statement_type: 'invoice_list',
  extracted_at: format(new Date('2024-12-31'), 'yyyy-MM-dd HH:mm:ss'),
};

// ============================================================================
// PAYMENTS 2024 DATA
// ============================================================================

export const PAYMENTS_2024_DATA: FinancialTableData = {
  sheets: [
    {
      name: 'Payments',
      columns: [
        { name: 'Payment ID', kind: 'categorical' },
        {
          name: 'Invoice #',
          kind: 'categorical',
        },
        {
          name: 'Customer',
          kind: 'categorical',
        },
        {
          name: 'Date',
          kind: 'categorical',
          financial_metadata: { type: 'date' },
        },
        {
          name: 'Amount',
          kind: 'numeric',
          financial_metadata: { type: 'amount', currency: 'USD' },
        },
        {
          name: 'Method',
          kind: 'categorical',
        },
      ],
      rows: [
        ['PAY-001', 'INV-001', 'Acme Corp', '2024-01-10', 45000, 'Bank Transfer'],
        ['PAY-002', 'INV-002', 'Global Tech', '2024-01-20', 32000, 'Check'],
        ['PAY-003', 'INV-003', 'Blue Industries', '2024-02-14', 28000, 'Bank Transfer'],
        ['PAY-004', 'INV-004', 'Acme Corp', '2024-02-25', 38000, 'ACH'],
        ['PAY-005', 'INV-007', 'Zenith Ventures', '2024-04-10', 41000, 'Bank Transfer'],
        ['PAY-006', 'INV-009', 'Acme Corp', '2024-05-15', 50000, 'ACH'],
        ['PAY-007', 'INV-010', 'Global Tech', '2024-05-28', 33000, 'Bank Transfer'],
        ['PAY-008', 'INV-011', 'Summit LLC', '2024-06-12', 27000, 'Check'],
        ['PAY-009', 'INV-012', 'Zenith Ventures', '2024-07-01', 44000, 'ACH'],
        ['PAY-010', 'INV-014', 'Acme Corp', '2024-08-10', 48000, 'Bank Transfer'],
        ['PAY-011', 'INV-015', 'Global Tech', '2024-08-25', 39000, 'Check'],
        ['PAY-012', 'INV-016', 'Summit LLC', '2024-09-18', 30000, 'ACH'],
        ['PAY-013', 'INV-018', 'Blue Industries', '2024-10-22', 31000, 'Bank Transfer'],
        ['PAY-014', 'INV-019', 'Acme Corp', '2024-11-10', 46000, 'ACH'],
        ['PAY-015', 'INV-006', 'Global Tech', '2024-11-15', 17500, 'Bank Transfer'],
      ],
      financial_metadata: {
        statement_type: 'payment_list',
        fiscal_year: 2024,
        currency: 'USD',
      } as any,
    },
  ],
  detected_statement_type: 'payment_list',
  extracted_at: format(new Date('2024-12-31'), 'yyyy-MM-dd HH:mm:ss'),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all mock financial documents
 */
export function getMockFinancialDocuments(): FinancialDocument[] {
  return MOCK_FINANCIAL_DOCUMENTS;
}

/**
 * Get a specific document by ID
 */
export function getMockFinancialDocument(
  docId: string
): FinancialDocument | undefined {
  return MOCK_FINANCIAL_DOCUMENTS.find((d) => d.id === docId);
}

/**
 * Get financial table data for a document
 */
export function getMockFinancialTableData(
  docId: string
): FinancialTableData | undefined {
  switch (docId) {
    case 'doc-pl-2024':
      return PL_2024_DATA;
    case 'doc-pl-2023':
      return PL_2023_DATA;
    case 'doc-cf-2024':
      return CASH_FLOW_2024_DATA;
    case 'doc-invoices-2024':
      return INVOICES_2024_DATA;
    case 'doc-payments-2024':
      return PAYMENTS_2024_DATA;
    default:
      return undefined;
  }
}

/**
 * Simulate comparison extraction
 */
export function getMockFinancialComparison(
  docIds: string[]
): FinancialComparisonData | undefined {
  if (docIds.length === 2) {
    // P&L 2024 vs 2023
    if (
      (docIds[0] === 'doc-pl-2024' && docIds[1] === 'doc-pl-2023') ||
      (docIds[0] === 'doc-pl-2023' && docIds[1] === 'doc-pl-2024')
    ) {
      return getPLComparison();
    }
  }

  // Generic comparison fallback
  return undefined;
}

/**
 * Get P&L 2024 vs 2023 comparison
 */
function getPLComparison(): FinancialComparisonData {
  return {
    shared_columns: [
      { name: 'Account', kind: 'categorical' },
      {
        name: '2024',
        kind: 'numeric',
        financial_metadata: { type: 'amount', currency: 'USD' },
      },
      {
        name: '2023',
        kind: 'numeric',
        financial_metadata: { type: 'amount', currency: 'USD' },
      },
    ],
    series: [
      {
        document_id: 'doc-pl-2024',
        title: '2024',
        file_name: 'P&L_2024.xlsx',
        rows: [
          ['REVENUE', 690000],
          ['COST OF REVENUE', 276000],
          ['GROSS PROFIT', 414000],
          ['OPERATING EXPENSES', 212000],
          ['OPERATING INCOME', 202000],
          ['NET INCOME', 213000],
        ],
      },
      {
        document_id: 'doc-pl-2023',
        title: '2023',
        file_name: 'P&L_2023.xlsx',
        rows: [
          ['REVENUE', 540000],
          ['COST OF REVENUE', 216000],
          ['GROSS PROFIT', 324000],
          ['OPERATING EXPENSES', 189000],
          ['OPERATING INCOME', 135000],
          ['NET INCOME', 141000],
        ],
      },
    ],
    financial_metrics: [
      {
        metric: 'Revenue Growth',
        value: 27.8,
        unit: '%',
        interpretation: 'positive',
      },
      {
        metric: 'Gross Margin',
        values: { '2024': 60.0, '2023': 60.0 },
        unit: '%',
        interpretation: 'neutral',
      },
      {
        metric: 'Operating Margin',
        values: { '2024': 29.3, '2023': 25.0 },
        unit: '%',
        interpretation: 'positive',
      },
      {
        metric: 'Net Margin',
        values: { '2024': 30.9, '2023': 26.1 },
        unit: '%',
        interpretation: 'positive',
      },
      {
        metric: 'Cost of Revenue Ratio',
        values: { '2024': 40.0, '2023': 40.0 },
        unit: '%',
        interpretation: 'neutral',
      },
      {
        metric: 'Operating Expense Ratio',
        values: { '2024': 30.8, '2023': 35.0 },
        unit: '%',
        interpretation: 'positive',
      },
      {
        metric: 'Net Income Growth',
        value: 51.1,
        unit: '%',
        interpretation: 'positive',
      },
    ],
    variance_analysis: {
      by_row: [
        {
          account: 'REVENUE',
          values: { '2024': 690000, '2023': 540000 },
          variance: 150000,
          variance_percent: 27.8,
        },
        {
          account: 'COST OF REVENUE',
          values: { '2024': 276000, '2023': 216000 },
          variance: 60000,
          variance_percent: 27.8,
        },
        {
          account: 'GROSS PROFIT',
          values: { '2024': 414000, '2023': 324000 },
          variance: 90000,
          variance_percent: 27.8,
        },
        {
          account: 'OPERATING EXPENSES',
          values: { '2024': 212000, '2023': 189000 },
          variance: 23000,
          variance_percent: 12.2,
        },
        {
          account: 'OPERATING INCOME',
          values: { '2024': 202000, '2023': 135000 },
          variance: 67000,
          variance_percent: 49.6,
        },
        {
          account: 'NET INCOME',
          values: { '2024': 213000, '2023': 141000 },
          variance: 72000,
          variance_percent: 51.1,
        },
      ],
    },
  };
}

/**
 * Format number as currency with K/M/B suffix
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  if (value === 0 || !value) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000000) {
    return `${sign}$${(absValue / 1000000000).toFixed(1)}B`;
  } else if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(1)}K`;
  } else {
    return `${sign}$${absValue.toFixed(0)}`;
  }
}

/**
 * Calculate financial metrics from table data
 */
export function calculateFinancialMetrics(data: FinancialTableData): Record<string, number> {
  const metrics: Record<string, number> = {};

  if (data.sheets[0]?.rows) {
    // For now, return empty - to be implemented
  }

  return metrics;
}

/**
 * Get display color for variance interpretation
 */
export function getVarianceColor(
  interpretation: 'positive' | 'negative' | 'neutral'
): string {
  switch (interpretation) {
    case 'positive':
      return 'text-green-600 bg-green-50';
    case 'negative':
      return 'text-red-600 bg-red-50';
    case 'neutral':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get icon for variance interpretation
 */
export function getVarianceIcon(
  interpretation: 'positive' | 'negative' | 'neutral'
): string {
  switch (interpretation) {
    case 'positive':
      return '↑';
    case 'negative':
      return '↓';
    case 'neutral':
      return '→';
    default:
      return '→';
  }
}
