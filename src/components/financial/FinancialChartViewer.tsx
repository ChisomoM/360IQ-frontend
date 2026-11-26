/**
 * Financial Chart Viewer Component
 * Displays a single financial statement with interactive charting
 * User can select sheet, axes, and chart type
 */

import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
import type { FinancialDocument, FinancialChartState } from '@/types/finance';
import { X } from '@/components/icons';
import { SectionCard } from '@/components/shared/SectionCard';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { cn } from '@/lib/utils';

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
        <p className="text-sm text-text-secondary">Couldn't load the financial data. Select the statement again.</p>
      </div>
    );
  }

  const currentSheet = tableData.sheets.find((s) => s.name === state.selectedSheet);
  if (!currentSheet) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-secondary">No sheet selected</p>
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

  // Amounts are shown with the formatter's currency code
  const valueTooltip = (
    <Tooltip
      {...tooltipProps}
      cursor={state.chartType === 'bar' ? barCursor : lineCursor}
      formatter={(value: number) => formatCurrency(Number(value))}
    />
  );

  const categoryAxis = (
    <XAxis
      {...axisProps}
      dataKey={state.xAxis}
      angle={-45}
      textAnchor="end"
      height={120}
    />
  );

  const amountAxis = (
    <YAxis {...axisProps} tickFormatter={(v: number) => formatCurrency(v)} />
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
              <CartesianGrid {...gridProps} />
              {categoryAxis}
              {amountAxis}
              {valueTooltip}
              <Legend {...legendProps} verticalAlign="top" />
              {state.yAxes.map((yAxis, idx) => (
                <Bar
                  key={yAxis}
                  dataKey={yAxis}
                  fill={seriesColor(idx)}
                  radius={BAR_RADIUS}
                  maxBarSize={MAX_BAR_SIZE}
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
              <CartesianGrid {...gridProps} />
              {categoryAxis}
              {amountAxis}
              {valueTooltip}
              <Legend {...legendProps} verticalAlign="top" />
              {state.yAxes.map((yAxis, idx) => (
                <Line
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  stroke={seriesColor(idx)}
                  strokeWidth={2}
                  dot={false}
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
              <CartesianGrid {...gridProps} />
              {categoryAxis}
              {amountAxis}
              {valueTooltip}
              <Legend {...legendProps} verticalAlign="top" />
              {state.yAxes.map((yAxis, idx) => (
                <Area
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  fill={seriesColor(idx)}
                  fillOpacity={0.12}
                  stroke={seriesColor(idx)}
                  strokeWidth={2}
                  isAnimationActive={false}
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
                    fill={seriesColor(index)}
                    stroke="var(--surface-1)"
                  />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(value: number) => formatCurrency(Number(value))} />
              <Legend {...legendProps} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and controls */}
      <SectionCard
        title={document.title}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close statement"
          >
            <X size={18} />
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatementTypeIndicator
              type={document.statement_type}
              showIcon
            />
            {document.fiscal_year && (
              <span className="text-sm text-text-secondary">
                FY {document.fiscal_year}
              </span>
            )}
            <span className="font-mono text-xs text-text-muted">
              {document.file_name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sheet Selector */}
            {tableData.sheets.length > 1 && (
              <div>
                <span className="text-xs font-medium text-text-secondary block mb-1.5">
                  Sheet
                </span>
                <Select
                  value={state.selectedSheet}
                  onValueChange={(value) =>
                    setState((prev) => ({ ...prev, selectedSheet: value }))
                  }
                >
                  <SelectTrigger aria-label="Sheet">
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
              <span className="text-xs font-medium text-text-secondary block mb-1.5">
                X axis
              </span>
              <Select
                value={state.xAxis}
                onValueChange={(value) =>
                  setState((prev) => ({ ...prev, xAxis: value }))
                }
              >
                <SelectTrigger aria-label="X axis column">
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
              <span className="text-xs font-medium text-text-secondary block mb-1.5">
                Chart type
              </span>
              <Select
                value={state.chartType}
                onValueChange={(value: any) =>
                  setState((prev) => ({ ...prev, chartType: value }))
                }
              >
                <SelectTrigger aria-label="Chart type">
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
              <span className="text-xs font-medium text-text-secondary block mb-1.5">
                Y axes
              </span>
              <div className="text-xs text-text-muted pt-2">
                {state.yAxes.length} selected
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Chart */}
      <SectionCard
        eyebrow="Amounts in $"
        title={`${state.xAxis} by ${state.yAxes.join(', ')}`}
      >
        <div className="w-full h-[400px]">
          {renderChart()}
        </div>
      </SectionCard>

      {/* Data Preview Table */}
      <SectionCard
        eyebrow={`First 8 rows of ${currentSheet.name}`}
        title="Data preview"
        padded={false}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {currentSheet.columns.map((col) => (
                  <TableHead
                    key={col.name}
                    className={cn(col.kind === 'numeric' && 'text-right')}
                  >
                    {col.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSheet.rows.slice(0, 8).map((row, idx) => (
                <TableRow key={idx}>
                  {row.map((cell, cellIdx) => (
                    <TableCell
                      key={cellIdx}
                      className={cn(
                        'text-[13px] text-text-secondary',
                        typeof cell === 'number' && 'text-right font-mono text-xs',
                      )}
                    >
                      {typeof cell === 'number'
                        ? formatCurrency(cell)
                        : String(cell || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/* Summary Statistics */}
      <SectionCard title="Summary figures">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                <div key={col.name} className="rounded-md border border-line p-3">
                  <p className="text-xs font-semibold text-text-primary mb-2">
                    {col.name}
                  </p>
                  <dl className="space-y-1 text-xs">
                    {[
                      ['Total', total],
                      ['Average', avg],
                      ['Max', max],
                      ['Min', min],
                    ].map(([label, amount]) => (
                      <div key={label} className="flex justify-between gap-2">
                        <dt className="text-text-muted">{label}</dt>
                        <dd className="font-mono text-text-primary">{formatCurrency(Number(amount))}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
      </SectionCard>
    </div>
  );
}
