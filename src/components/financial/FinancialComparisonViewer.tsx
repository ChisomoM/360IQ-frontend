/**
 * Financial Comparison Viewer Component
 * Compares 2-4 financial statements side-by-side with metrics and variance analysis
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatementTypeIndicator } from './StatementTypeIndicator';
import { getMockFinancialComparison, formatCurrency } from '@/lib/mocks/mockFinancialData';
import type { FinancialDocument } from '@/types/finance';
import { RotateCw, GitCompare } from '@/components/icons';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { formatDate } from '@/lib/format';
import type { Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

const INTERPRETATION: Record<'positive' | 'negative' | 'neutral', { tone: Tone; label: string }> = {
  positive: { tone: 'positive', label: 'Favourable' },
  negative: { tone: 'risk', label: 'Unfavourable' },
  neutral: { tone: 'neutral', label: 'Neutral' },
};

function SeriesDot({ index }: { index: number }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-pill"
      style={{ backgroundColor: seriesColor(index) }}
      aria-hidden="true"
    />
  );
}

const varianceClass = (value: number) =>
  value > 0 ? 'text-positive' : value < 0 ? 'text-risk' : 'text-text-secondary';

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
      <SectionCard>
        <EmptyState
          icon={<GitCompare size={24} />}
          title="Couldn't compare these statements"
          description="They may not be compatible. Clear the selection and choose others."
          action={{ label: 'Clear selection', onAction: onClearAll }}
        />
      </SectionCard>
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
      comparisonData.series.forEach((series) => {
        obj[series.title] = series.rows[idx]?.[1] || 0;
      });
      return obj;
    });
  }, [comparisonData]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <SectionCard
        title={`Comparing ${docs.length} statements`}
        actions={
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <RotateCw size={14} />
            Clear
          </Button>
        }
      >
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {docs.map((doc, idx) => (
            <li key={doc.id} className="flex items-center gap-1.5 text-sm text-text-secondary">
              <SeriesDot index={idx} />
              {doc.title}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Financial metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {comparisonData.financial_metrics.slice(0, 6).map((metric, idx) => {
          const isMultiValue = metric.values && Object.keys(metric.values).length > 1;
          const singleValue = metric.value ?? 0;
          const reading = INTERPRETATION[metric.interpretation] ?? INTERPRETATION.neutral;

          return (
            <SectionCard key={idx}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] text-text-secondary">{metric.metric}</p>
                <StatusBadge tone={reading.tone} label={reading.label} />
              </div>
              {isMultiValue ? (
                <div className="mt-2 space-y-1">
                  {Object.entries(metric.values || {}).map(([key, value]) => (
                    <p key={key} className="flex justify-between gap-2 text-xs text-text-muted">
                      <span className="min-w-0 truncate">{key}</span>
                      <span className="font-mono text-text-primary">{value.toFixed(1)}{metric.unit}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[28px] leading-8 font-semibold tracking-[-0.02em] text-text-primary">
                  {singleValue.toFixed(1)}{metric.unit}
                </p>
              )}
            </SectionCard>
          );
        })}
      </div>

      {/* Comparison chart */}
      <SectionCard eyebrow="Amounts in $, key line items" title="Amount comparison">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis
                {...axisProps}
                dataKey="account"
                angle={-45}
                textAnchor="end"
                height={110}
              />
              <YAxis {...axisProps} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip
                {...tooltipProps}
                cursor={barCursor}
                formatter={(value: number) => formatCurrency(Number(value))}
              />
              <Legend {...legendProps} verticalAlign="top" />
              {docs.map((doc, idx) => (
                <Bar
                  key={doc.id}
                  dataKey={doc.title}
                  fill={seriesColor(idx)}
                  radius={BAR_RADIUS}
                  maxBarSize={MAX_BAR_SIZE}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Variance analysis */}
      {comparisonData.variance_analysis && (
        <SectionCard eyebrow="Line by line" title="Variance analysis" padded={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  {Object.entries(comparisonData.variance_analysis.by_row[0]?.values || {}).map(
                    ([key]) => (
                      <TableHead key={key} className="text-right">
                        {key}
                      </TableHead>
                    )
                  )}
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Change (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.variance_analysis.by_row.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={cn(row.variance_percent > 10 && 'bg-surface-2')}
                  >
                    <TableCell className="font-semibold">{row.account}</TableCell>
                    {Object.entries(row.values).map(([key, value]) => (
                      <TableCell key={key} className="text-right font-mono text-xs text-text-secondary">
                        {formatCurrency(value)}
                      </TableCell>
                    ))}
                    <TableCell className={cn('text-right font-mono text-xs', varianceClass(row.variance))}>
                      {row.variance > 0 ? '+' : ''}
                      {formatCurrency(row.variance)}
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-xs', varianceClass(row.variance_percent))}>
                      {row.variance_percent > 0 ? '+' : ''}
                      {row.variance_percent.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* Document details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc, idx) => (
          <SectionCard key={doc.id} title={doc.title} actions={<SeriesDot index={idx} />}>
            <p className="mb-3 font-mono text-xs text-text-muted">{doc.file_name}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Statement type</dt>
                <dd><StatementTypeIndicator type={doc.statement_type} showIcon={false} /></dd>
              </div>
              {doc.fiscal_year && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">Fiscal year</dt>
                  <dd className="font-mono text-xs text-text-primary">{doc.fiscal_year}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Currency</dt>
                <dd className="font-mono text-xs text-text-primary">{doc.currency}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Uploaded</dt>
                <dd className="font-mono text-xs text-text-primary">{formatDate(doc.created_at)}</dd>
              </div>
            </dl>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
