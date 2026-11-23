/**
 * Financial Chart Viewer Component
 * Displays a single financial statement with interactive charting
 * User can select sheet, axes, and chart type
 */

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatementTypeIndicator } from './StatementTypeIndicator';
import { getMockFinancialTableData } from '@/lib/mocks/mockFinancialData';
import { formatCurrency } from '@/lib/mocks/mockFinancialData';
import type { FinancialDocument, FinancialTableData, FinancialChartState } from '@/types/finance';
import { X } from 'lucide-react';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
];

interface FinancialChartViewerProps {
  document: FinancialDocument;
  onClose: () => void;
}

export function FinancialChartViewer({
  document,
  onClose,
}: FinancialChartViewerProps) {
  const [state, setState] = useState<FinancialChartState>({
    selectedSheet: '',
    xAxis: '',
    yAxes: ['Total'] as string[],
    chartType: 'bar',
  });

  // Load financial data
  const tableData = useMemo(() => {
    return getMockFinancialTableData(document.id);
  }, [document.id]);

  // Initialize on first load
  if (tableData && state.selectedSheet === '') {
    const sheet = tableData.sheets[0];
    if (sheet) {
      setState((prev) => ({
        ...prev,
        selectedSheet: sheet.name,
        xAxis: sheet.columns[0]?.name || '',
        yAxes: sheet.columns
          .filter((c) => c.kind === 'numeric')
          .slice(0, 2)
          .map((c) => c.name),
      }));
    }
  }

  if (!tableData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load financial data</p>
      </div>
    );
  }

  const currentSheet = tableData.sheets.find((s) => s.name === state.selectedSheet);
  if (!currentSheet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No sheet selected</p>
      </div>
    );
  }

  // Convert rows to chart-compatible format
  const chartData = useMemo(() => {
    const xAxisIndex = currentSheet.columns.findIndex(
      (c) => c.name === state.xAxis
    );
    if (xAxisIndex === -1) return [];

    return currentSheet.rows.map((row) => {
      const obj: Record<string, any> = {};
      currentSheet.columns.forEach((col, idx) => {
        obj[col.name] = row[idx];
      });
      return obj;
    });
  }, [currentSheet, state.xAxis]);

  // Filter numeric columns for y-axis
  const numericColumns = currentSheet.columns.filter((c) => c.kind === 'numeric');
  const categoricalColumns = currentSheet.columns.filter(
    (c) => c.kind === 'categorical'
  );

  // Handle chart rendering based on type
  const renderChart = () => {
    if (chartData.length === 0) return null;

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    };

    switch (state.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={state.xAxis}
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload) return null;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow">
                      {payload.map((entry, idx) => (
                        <p key={idx} style={{ color: entry.color }}>
                          {entry.name}: {formatCurrency(Number(entry.value))}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              {state.yAxes.map((yAxis, idx) => (
                <Bar
                  key={yAxis}
                  dataKey={yAxis}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={state.xAxis}
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload) return null;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow">
                      {payload.map((entry, idx) => (
                        <p key={idx} style={{ color: entry.color }}>
                          {entry.name}: {formatCurrency(Number(entry.value))}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              {state.yAxes.map((yAxis, idx) => (
                <Line
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={state.xAxis}
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload) return null;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow">
                      {payload.map((entry, idx) => (
                        <p key={idx} style={{ color: entry.color }}>
                          {entry.name}: {formatCurrency(Number(entry.value))}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              {state.yAxes.map((yAxis, idx) => (
                <Area
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  isAnimationActive={false}
                  opacity={0.7}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={state.yAxes[0] || ''}
                nameKey={state.xAxis}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow">
                      <p>{payload[0].name}</p>
                      <p>{formatCurrency(Number(payload[0].value))}</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{document.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <StatementTypeIndicator
              type={document.statement_type}
              showIcon
            />
            {document.fiscal_year && (
              <span className="text-sm text-gray-600">
                FY {document.fiscal_year}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {document.file_name}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chart Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sheet Selector */}
            {tableData.sheets.length > 1 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Sheet
                </label>
                <Select
                  value={state.selectedSheet}
                  onValueChange={(value) =>
                    setState((prev) => ({ ...prev, selectedSheet: value }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tableData.sheets.map((sheet) => (
                      <SelectItem key={sheet.name} value={sheet.name}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* X-Axis Selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                X-Axis
              </label>
              <Select
                value={state.xAxis}
                onValueChange={(value) =>
                  setState((prev) => ({ ...prev, xAxis: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentSheet.columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chart Type Selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Chart Type
              </label>
              <Select
                value={state.chartType}
                onValueChange={(value: any) =>
                  setState((prev) => ({ ...prev, chartType: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Y-Axis Quick Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Y-Axes
              </label>
              <div className="text-xs text-gray-500 pt-2">
                {state.yAxes.length} selected
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {state.xAxis} vs {state.yAxes.join(', ')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Preview</CardTitle>
          <CardDescription>
            First 8 rows of {currentSheet.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {currentSheet.columns.map((col) => (
                    <th
                      key={col.name}
                      className="text-left py-2 px-3 font-medium text-gray-700 bg-gray-50"
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentSheet.rows.slice(0, 8).map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="py-2 px-3">
                        {typeof cell === 'number'
                          ? formatCurrency(cell)
                          : String(cell || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {numericColumns.slice(0, 4).map((col) => {
              const values = currentSheet.rows
                .map((row) => {
                  const idx = currentSheet.columns.findIndex(
                    (c) => c.name === col.name
                  );
                  return typeof row[idx] === 'number' ? row[idx] : 0;
                })
                .filter((v) => v !== 0);

              if (values.length === 0) return null;

              const total = values.reduce((a, b) => a + b, 0);
              const avg = total / values.length;
              const max = Math.max(...values);
              const min = Math.min(...values);

              return (
                <div key={col.name} className="p-3 border border-gray-200 rounded">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    {col.name}
                  </p>
                  <div className="space-y-1 text-xs">
                    <p>Total: <span className="font-semibold">{formatCurrency(total)}</span></p>
                    <p>Avg: <span className="font-semibold">{formatCurrency(avg)}</span></p>
                    <p>Max: <span className="font-semibold">{formatCurrency(max)}</span></p>
                    <p>Min: <span className="font-semibold">{formatCurrency(min)}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
