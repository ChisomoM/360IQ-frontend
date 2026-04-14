import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart2, LineChart as LineIcon, AreaChart as AreaIcon, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { post } from '@/lib/api/crud';
import type { Document, ComparisonData } from '@/types/dms';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

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
  if (v == null) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
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
      const message = err?.message || 'Comparison failed';
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
    return data.series.map((s, i) => {
      const vals = s.rows
        .map((r) => r[yIdx])
        .filter((v): v is number => typeof v === 'number');
      return {
        title: s.title,
        color: CHART_COLORS[i % CHART_COLORS.length],
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
      <div className="flex flex-col items-center justify-center h-72 gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#febb00]" />
        <p className="text-sm">Aligning {docs.length} documents…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-center max-w-xs text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchComparison}>
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
      </div>
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
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
          <BarChart2 className="h-12 w-12 opacity-20" />
          <p className="text-sm">Select X and Y axes to render the comparison chart</p>
        </div>
      );
    }

    const commonProps = {
      data: mergedData,
      margin: { top: 10, right: 20, left: 0, bottom: 5 },
    };
    const sharedElements = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="__x" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => v.toLocaleString()} />
        <Tooltip formatter={(v: number) => v.toLocaleString()} />
        <Legend />
      </>
    );

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart {...commonProps}>
            {sharedElements}
            {data.series.map((s, i) => (
              <Bar key={s.document_id} dataKey={s.title} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
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
              <Line key={s.document_id} type="monotone" dataKey={s.title} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={mergedData.length <= 30} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart {...commonProps}>
            <defs>
              {data.series.map((s, i) => (
                <linearGradient key={s.document_id} id={`cgrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {sharedElements}
            {data.series.map((s, i) => (
              <Area key={s.document_id} type="monotone" dataKey={s.title} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#cgrad-${i})`} strokeWidth={2} />
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

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Comparing {docs.length} Documents</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {docs.map((d, i) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              >
                {d.title.length > 24 ? d.title.slice(0, 24) + '…' : d.title}
              </span>
            ))}
          </div>
          {data && (
            <p className="text-xs text-gray-400 mt-1">
              {data.shared_columns.length} shared column{data.shared_columns.length !== 1 ? 's' : ''} · row-index aligned
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-gray-400 hover:text-gray-700 flex-shrink-0 gap-1">
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>

      {/* Controls */}
      <Card className="border border-gray-100 shadow-none bg-gray-50/60">
        <CardContent className="p-4 space-y-3">
          {/* Row 1: chart type */}
          <div className="flex items-center gap-1">
            {CHART_TYPES.map(({ type, label, Icon }) => (
              <Button
                key={type}
                variant={chartType === type ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-2 gap-1 text-xs ${chartType === type ? 'bg-[#febb00] text-black hover:bg-[#febb00]/90' : 'text-gray-500'}`}
                onClick={() => setChartType(type)}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
          {/* Row 2: axis selectors */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">X Axis</span>
              <Select value={xKey} onValueChange={setXKey}>
                <SelectTrigger className="h-8 w-44 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCols.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Y Metric</span>
              <Select value={yKey} onValueChange={setYKey}>
                <SelectTrigger className="h-8 w-44 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(numericCols.length > 0 ? numericCols : allCols).map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border border-gray-100 shadow-none w-full overflow-visible">
        <CardContent className="p-4 w-full min-h-96 overflow-visible">
          {renderChart()}
        </CardContent>
      </Card>

      {/* Per-series summary stats */}
      {seriesStats.length > 0 && yKey && (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-100">Document</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b border-gray-100">Rows</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b border-gray-100">Min</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b border-gray-100">Max</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b border-gray-100">Average</th>
              </tr>
            </thead>
            <tbody>
              {seriesStats.map((s, i) => (
                <tr key={i} className="even:bg-gray-50/50">
                  <td className="px-3 py-2 border-b border-gray-50">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      {s.title}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 border-b border-gray-50">{s.count}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 border-b border-gray-50">{fmt(s.min)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 border-b border-gray-50">{fmt(s.max)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 border-b border-gray-50">{fmt(s.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
