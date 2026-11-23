/**
 * Financial Comparison Viewer Component
 * Compares 2-4 financial statements side-by-side with metrics and variance analysis
 */

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { StatementTypeIndicator } from './StatementTypeIndicator';
import { getMockFinancialTableData, getMockFinancialComparison, formatCurrency, getVarianceColor, getVarianceIcon } from '@/lib/mocks/mockFinancialData';
import type { FinancialDocument, FinancialComparisonData } from '@/types/finance';
import { RotateCw } from 'lucide-react';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
];

interface FinancialComparisonViewerProps {
  docs: FinancialDocument[];
  onClearAll: () => void;
}

export function FinancialComparisonViewer({
  docs,
  onClearAll,
}: FinancialComparisonViewerProps) {
  // Get comparison data
  const comparisonData = useMemo(() => {
    const docIds = docs.map((d) => d.id);
    return getMockFinancialComparison(docIds);
  }, [docs]);

  if (!comparisonData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Could not compare these documents. They may not be compatible.
        </p>
        <Button onClick={onClearAll} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Prepare chart data from comparison series
  const chartData = useMemo(() => {
    if (!comparisonData.series[0]) return [];

    const firstSeriesRows = comparisonData.series[0].rows;
    return firstSeriesRows.map((row, idx) => {
      const obj: Record<string, any> = {
        account: row[0],
      };
      comparisonData.series.forEach((series, seriesIdx) => {
        obj[series.title] = series.rows[idx]?.[1] || 0;
      });
      return obj;
    });
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Comparing {docs.length} Statements
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {docs.map((doc, idx) => (
              <div key={doc.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{doc.title}</span>
                {idx < docs.length - 1 && (
                  <span className="text-gray-300 mx-2">•</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="text-gray-500"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Financial Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparisonData.financial_metrics.slice(0, 6).map((metric, idx) => {
          const isMultiValue = metric.values && Object.keys(metric.values).length > 1;
          const singleValue = metric.value ?? 0;

          return (
            <Card key={idx} className={`border-l-4 ${
              metric.interpretation === 'positive'
                ? 'border-l-green-500 bg-green-50'
                : metric.interpretation === 'negative'
                ? 'border-l-red-500 bg-red-50'
                : 'border-l-gray-300 bg-gray-50'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {metric.metric}
                    </p>
                    {isMultiValue ? (
                      <div className="mt-2 space-y-1">
                        {Object.entries(metric.values || {}).map(([key, value]) => (
                          <p key={key} className="text-xs text-gray-600">
                            {key}: <span className="font-semibold">{value.toFixed(1)}{metric.unit}</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-2xl font-bold mt-2">
                        {singleValue.toFixed(1)}{metric.unit}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      metric.interpretation === 'positive'
                        ? 'default'
                        : metric.interpretation === 'negative'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="ml-2"
                  >
                    {getVarianceIcon(metric.interpretation)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Amount Comparison</CardTitle>
          <CardDescription>
            Side-by-side comparison of key line items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="account"
                  angle={-45}
                  textAnchor="end"
                  height={110}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow">
                        {payload.map((entry, idx) => (
                          <p key={idx} style={{ color: entry.color }} className="text-xs">
                            {entry.name}: {formatCurrency(Number(entry.value))}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                {docs.map((doc, idx) => (
                  <Bar
                    key={doc.id}
                    dataKey={doc.title}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Variance Analysis Table */}
      {comparisonData.variance_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variance Analysis</CardTitle>
            <CardDescription>
              Line-by-line variance and percentage change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">
                      Account
                    </th>
                    {Object.entries(comparisonData.variance_analysis.by_row[0]?.values || {}).map(
                      ([key]) => (
                        <th key={key} className="text-right py-2 px-3 font-medium text-gray-700">
                          {key}
                        </th>
                      )
                    )}
                    <th className="text-right py-2 px-3 font-medium text-gray-700">
                      Variance
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">
                      % Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.variance_analysis.by_row.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        row.variance_percent > 10
                          ? 'bg-yellow-50'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {row.account}
                      </td>
                      {Object.entries(row.values).map(([key, value]) => (
                        <td key={key} className="text-right py-2 px-3 text-gray-700">
                          {formatCurrency(value)}
                        </td>
                      ))}
                      <td
                        className={`text-right py-2 px-3 font-semibold ${
                          row.variance > 0
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(row.variance)}
                      </td>
                      <td
                        className={`text-right py-2 px-3 font-semibold ${
                          row.variance_percent > 0
                            ? 'text-green-700'
                            : row.variance_percent < 0
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {row.variance_percent > 0 ? '+' : ''}
                        {row.variance_percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc, idx) => (
          <Card key={doc.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {doc.file_name}
                  </CardDescription>
                </div>
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Statement Type:</span>
                <StatementTypeIndicator type={doc.statement_type} showIcon={false} />
              </div>
              {doc.fiscal_year && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fiscal Year:</span>
                  <span className="font-semibold">{doc.fiscal_year}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Currency:</span>
                <span className="font-semibold">{doc.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Uploaded:</span>
                <span className="text-xs">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
