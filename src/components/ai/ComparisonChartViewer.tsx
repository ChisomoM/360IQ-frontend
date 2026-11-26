import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { SectionCard } from '@/components/shared/SectionCard';
import { Loader2, BarChart2, LineChart as LineIcon, AreaChart as AreaIcon, X, AlertTriangle, RefreshCw } from '@/components/icons';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { post } from '@/lib/api/crud';
import type { Document, ComparisonData } from '@/types/dms';

// ─── Constants ────────────────────────────────────────────────────────────────

type ChartType = 'bar' | 'line' | 'area';

const CHART_TYPES: { type: ChartType; label: string; Icon: React.ElementType }[] = [
  { type: 'bar',  label: 'Bar',  Icon: BarChart2 },
  { type: 'line', label: 'Line', Icon: LineIcon },
  { type: 'area', label: 'Area', Icon: AreaIcon },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ComparisonChartViewerProps {
  docs: Document[];
  onClearAll: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined): string {
  if (v == null) return 'n/a';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function SeriesDot({ index }: { index: number }) {
  return (
    <span
      className="h-2.5 w-2.5 flex-shrink-0 rounded-pill"
      style={{ backgroundColor: seriesColor(index) }}
      aria-hidden="true"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComparisonChartViewer({ docs, onClearAll }: ComparisonChartViewerProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xKey, setXKey] = useState('');
  const [yKey, setYKey] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Stable key so effect only re-runs when the set of selected doc IDs changes
  const docIdsKey = docs.map((d) => d.id).join(',');

  const fetchComparison = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await post('DOCUMENT_COMPARE', { document_ids: docs.map((d) => d.id) });
      const comparison = result as ComparisonData;

      console.log('ComparisonChartViewer: Comparison data loaded', {
        sharedColumnCount: comparison.shared_columns.length,
        columns: comparison.shared_columns.map(c => ({ name: c.name, kind: c.kind })),
        seriesCount: comparison.series.length,
        series: comparison.series.map(s => ({ title: s.title, rowCount: s.rows.length }))
      });

      setData(comparison);
      // Auto-select sensible axis defaults
      const cats = comparison.shared_columns.filter((c) => c.kind === 'categorical');
      const nums = comparison.shared_columns.filter((c) => c.kind === 'numeric');
      const newXKey = cats[0]?.name ?? comparison.shared_columns[0]?.name ?? '';
      const newYKey = nums[0]?.name ?? comparison.shared_columns.find((c) => c.name !== (cats[0]?.name ?? ''))?.name ?? '';

      console.log('ComparisonChartViewer: Axes auto-selected', {
        xKey: newXKey,
        yKey: newYKey,
        categoricalColumns: cats.map(c => c.name),
        numericColumns: nums.map(c => c.name)
      });

      setXKey(newXKey);
      setYKey(newYKey);
    } catch (err: any) {
      const message = err?.message || "Couldn't compare these documents";
      console.error('ComparisonChartViewer: Error loading comparison', { error: message, fullError: err });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchComparison(); }, [docIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ─────────────────────────────────────────────────────────

  const allCols = data?.shared_columns ?? [];
  const numericCols = allCols.filter((c) => c.kind === 'numeric');

  /**
   * Merge per-series rows into flat recharts objects aligned by row index.
   * { __x: <xValue from first series>, [doc.title]: <yValue>, ... }
   */
  const mergedData = useMemo(() => {
    if (!data || !xKey || !yKey) return [];
    const xIdx = data.shared_columns.findIndex((c) => c.name === xKey);
    const yIdx = data.shared_columns.findIndex((c) => c.name === yKey);
    if (xIdx === -1 || yIdx === -1) return [];

    const maxRows = Math.max(...data.series.map((s) => s.rows.length));
    return Array.from({ length: maxRows }, (_, rowIdx) => {
      const point: Record<string, string | number | null> = {};
      // X value: use first series that has this row
      for (const s of data.series) {
        if (rowIdx < s.rows.length) {
          point['__x'] = s.rows[rowIdx][xIdx] as string | number;
          break;
        }
      }
      // Y value per series
      for (const s of data.series) {
        point[s.title] = rowIdx < s.rows.length
          ? (s.rows[rowIdx][yIdx] as number | null)
          : null;
      }
      return point;
    });
  }, [data, xKey, yKey]);

  /** Per-series min/max/avg for the selected Y metric. */
  const seriesStats = useMemo(() => {
    if (!data || !yKey) return [];
    const yIdx = data.shared_columns.findIndex((c) => c.name === yKey);
    if (yIdx === -1) return [];
    return data.series.map((s) => {
      const vals = s.rows
        .map((r) => r[yIdx])
        .filter((v): v is number => typeof v === 'number');
      return {
        title: s.title,
        count: vals.length,
        min: vals.length ? Math.min(...vals) : null,
        max: vals.length ? Math.max(...vals) : null,
        avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      };
    });
  }, [data, yKey]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SectionCard>
        <div role="status" className="flex flex-col items-center justify-center h-72 gap-3 text-text-secondary">
          <Loader2 size={32} className="animate-spin text-signal-text" />
          <p className="text-sm">Aligning {docs.length} documents…</p>
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard>
        <div role="alert" className="flex flex-col items-center justify-center h-72 gap-4">
          <AlertTriangle size={24} className="text-risk" />
          <p className="text-sm text-center max-w-xs text-text-secondary">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchComparison}>
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      </SectionCard>
    );
  }

  // ── Chart rendering ───────────────────────────────────────────────────────

  const renderChart = () => {
    const canRender = data && xKey !== '' && yKey !== '' && mergedData.length > 0;

    console.log('ComparisonChartViewer: renderChart conditions', {
      hasData: !!data,
      xKeySet: xKey !== '',
      yKeySet: yKey !== '',
      mergedDataLength: mergedData.length,
      conditions: { data: !!data, xKey, yKey, mergedDataLength: mergedData.length }
    });

    if (!canRender) {
      console.log('ComparisonChartViewer: Showing fallback');
      return (
        <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-2">
          <BarChart2 size={32} />
          <p className="text-sm">Select X and Y axes to draw the comparison chart</p>
        </div>
      );
    }

    const commonProps = {
      data: mergedData,
      margin: { top: 10, right: 20, left: 0, bottom: 5 },
    };
    const sharedElements = (
      <>
        <CartesianGrid {...gridProps} />
        <XAxis {...axisProps} dataKey="__x" interval="preserveStartEnd" />
        <YAxis {...axisProps} tickFormatter={(v: number) => v.toLocaleString()} />
        <Tooltip {...tooltipProps} cursor={chartType === 'bar' ? barCursor : lineCursor} formatter={(v: number) => v.toLocaleString()} />
        <Legend {...legendProps} />
      </>
    );

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart {...commonProps}>
            {sharedElements}
            {data.series.map((s, i) => (
              <Bar key={s.document_id} dataKey={s.title} fill={seriesColor(i)} radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart {...commonProps}>
            {sharedElements}
            {data.series.map((s, i) => (
              <Line key={s.document_id} type="monotone" dataKey={s.title} stroke={seriesColor(i)} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart {...commonProps}>
            {sharedElements}
            {data.series.map((s, i) => (
              <Area key={s.document_id} type="monotone" dataKey={s.title} stroke={seriesColor(i)} fill={seriesColor(i)} fillOpacity={0.12} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 w-full">

      {/* Controls */}
      <SectionCard
        title={`Comparing ${docs.length} documents`}
        actions={
          <Button variant="ghost" size="sm" onClick={onClearAll} className="flex-shrink-0">
            <X size={14} /> Clear
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {docs.map((d, i) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1.5 rounded-pill bg-field px-2.5 py-0.5 text-xs text-text-primary"
              >
                <SeriesDot index={i} />
                {d.title.length > 24 ? d.title.slice(0, 24) + '…' : d.title}
              </span>
            ))}
          </div>
          {data && (
            <p className="text-xs text-text-muted">
              {data.shared_columns.length} shared column{data.shared_columns.length !== 1 ? 's' : ''}, aligned by row number
            </p>
          )}

          {/* Row 1: chart type */}
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <TabsList aria-label="Chart type">
              {CHART_TYPES.map(({ type, label, Icon }) => (
                <TabsTrigger key={type} value={type} className="gap-1.5">
                  <Icon size={14} />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Row 2: axis selectors */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">X axis</span>
              <Select value={xKey} onValueChange={setXKey}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="X axis column"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCols.filter((c) => !!c.name).map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">Y measure</span>
              <Select value={yKey} onValueChange={setYKey}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="Y measure column"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(numericCols.length > 0 ? numericCols : allCols).filter((c) => !!c.name).map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Chart */}
      <SectionCard eyebrow={yKey || undefined} className="w-full" bodyClassName="min-h-96">
        {renderChart()}
      </SectionCard>

      {/* Per-series summary stats */}
      {seriesStats.length > 0 && yKey && (
        <SectionCard title={`${yKey} by document`} padded={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seriesStats.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <SeriesDot index={i} />
                        {s.title}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-text-secondary">{s.count}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-text-secondary">{fmt(s.min)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-text-secondary">{fmt(s.max)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-text-secondary">{fmt(s.avg)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

    </div>
  );
}
