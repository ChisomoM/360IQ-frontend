import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { SectionCard } from '@/components/shared/SectionCard';
import { Loader2, BarChart2, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon, TableIcon, X, AlertTriangle, RefreshCw, Check } from '@/components/icons';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor, seriesColor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import { list } from '@/lib/api/crud';
import { cn } from '@/lib/utils';
import type { Document, SpreadsheetData, SheetData, ColumnMeta } from '@/types/dms';

// ─── Constants ───────────────────────────────────────────────────────────────

type ChartType = 'bar' | 'line' | 'area' | 'pie';

const CHART_TYPES: { type: ChartType; label: string; Icon: React.ElementType }[] = [
  { type: 'bar',  label: 'Bar',  Icon: BarChart2 },
  { type: 'line', label: 'Line', Icon: LineIcon },
  { type: 'area', label: 'Area', Icon: AreaIcon },
  { type: 'pie',  label: 'Pie',  Icon: PieIcon },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface ExcelChartViewerProps {
  document: Document;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a SheetData into the flat-object array recharts expects. */
/** Attempt to parse a value as a number, handling Excel comma-formatted strings like '45,000'. */
function parseNumericValue(v: unknown): number | string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/,/g, '').replace(/[$€£¥%]/g, '').trim();
    // Handle accounting negative: (45,000) → -45000
    const accounting = cleaned.match(/^\((.+)\)$/);
    const toParse = accounting ? `-${accounting[1]}` : cleaned;
    const parsed = parseFloat(toParse);
    if (!isNaN(parsed) && toParse !== '') return parsed;
    return v; // return original string if not numeric
  }
  return null;
}

function sheetToChartData(sheet: SheetData): Record<string, string | number | null>[] {
  const headers = sheet.columns.map((c) => c.name);
  return sheet.rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => {
      const raw = row[i] ?? null;
      return [h, parseNumericValue(raw)];
    }))
  );
}

/** Return only columns whose kind is 'numeric'. */
function numericCols(columns: ColumnMeta[]): string[] {
  return columns.filter((c) => c.kind === 'numeric').map((c) => c.name);
}

/**
 * Detect columns that look numeric by inspecting actual row values.
 * Used as a fallback when the backend tags everything as categorical
 * (e.g. comma-formatted numbers like '45,000' fool the server-side inference).
 */
function detectNumericColsFromData(
  columns: ColumnMeta[],
  rows: unknown[][]
): string[] {
  const sample = rows.slice(0, 8);
  return columns
    .map((col, i) => {
      const values = sample
        .map((r) => r[i])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
      if (values.length === 0) return null;
      const numericCount = values.filter((v) => {
        const parsed = parseNumericValue(v);
        return typeof parsed === 'number';
      }).length;
      return numericCount / values.length >= 0.6 ? col.name : null;
    })
    .filter((n): n is string => n !== null);
}

/** Return only columns whose kind is 'categorical'. */
function categoricalCols(columns: ColumnMeta[]): string[] {
  return columns.filter((c) => c.kind === 'categorical').map((c) => c.name);
}

/**
 * Choose sensible defaults for a sheet:
 *   x-axis   → first categorical col (or first col if none)
 *   y-axis   → first numeric col; falls back to data-detected numeric cols
 */
function defaultAxes(
  columns: ColumnMeta[],
  rows?: unknown[][]
): { xKey: string; yKeys: string[] } {
  const cats = categoricalCols(columns);
  let nums = numericCols(columns);
  // Fallback: if backend found no numeric columns, detect from actual data
  if (nums.length === 0 && rows && rows.length > 0) {
    nums = detectNumericColsFromData(columns, rows);
  }
  const xKey = cats[0] ?? columns[0]?.name ?? '';
  const yKeys = nums.length > 0
    ? [nums[0]]
    : columns.filter((c) => c.name !== xKey).slice(0, 1).map((c) => c.name);
  return { xKey, yKeys };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DataPreviewTable({ sheet, maxRows = 8 }: { sheet: SheetData; maxRows?: number }) {
  const headers = sheet.columns.map((c) => c.name);
  const rows = sheet.rows.slice(0, maxRows);

  return (
    <SectionCard padded={false}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {headers.map((_, ci) => (
                  <TableCell key={ci} className="whitespace-nowrap font-mono text-xs text-text-secondary">
                    {row[ci] ?? <span className="text-text-muted">Empty</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {sheet.rows.length > maxRows && (
        <p className="border-t border-line px-4 py-3 text-xs text-text-muted">
          Showing {maxRows} of {sheet.rows.length} rows
        </p>
      )}
    </SectionCard>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ExcelChartViewer({ document, onClose }: ExcelChartViewerProps) {
  const [data, setData] = useState<SpreadsheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sheet / axis / chart-type selections
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [xKey, setXKey] = useState<string>('');
  const [yKeys, setYKeys] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [showTable, setShowTable] = useState(false);

  // ── fetch ────────────────────────────────────────────────────────────────

  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await list('DOCUMENT_CHART_DATA', { id: document.id });
      const spreadsheet = result as SpreadsheetData;
      
      console.log('ExcelChartViewer: Sheet data loaded', {
        sheetCount: spreadsheet.sheets.length,
        sheets: spreadsheet.sheets.map(s => ({ name: s.name, columns: s.columns.length, rows: s.rows.length }))
      });
      
      setData(spreadsheet);

      // Auto-select first sheet and sensible axes
      if (spreadsheet.sheets.length > 0) {
        const first = spreadsheet.sheets[0];
        console.log('ExcelChartViewer: Processing first sheet', {
          name: first.name,
          columns: first.columns.map(c => ({ name: c.name, kind: c.kind })),
          rowCount: first.rows.length
        });
        
        setSelectedSheet(first.name);
        const { xKey: ax, yKeys: ay } = defaultAxes(first.columns, first.rows);
        console.log('ExcelChartViewer: Axes inferred', { xKey: ax, yKeys: ay });
        setXKey(ax);
        setYKeys(ay);
      }
    } catch (err: any) {
      const message = err?.message || "Couldn't load the spreadsheet data";
      console.error('ExcelChartViewer: Error loading data', { error: message, fullError: err });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchChartData(); }, [document.id]);

  // ── derived state ────────────────────────────────────────────────────────

  const currentSheet: SheetData | null = useMemo(
    () => data?.sheets.find((s) => s.name === selectedSheet) ?? null,
    [data, selectedSheet]
  );

  const chartData = useMemo(
    () => {
      if (!currentSheet) return [];
      const data = sheetToChartData(currentSheet);
      console.log('ExcelChartViewer: Transformed chart data sample', {
        totalRows: data.length,
        sampleRow: data[0] ? Object.fromEntries(Object.entries(data[0]).slice(0, 5)) : null,
        yKeyValue: data[0] && yKeys[0] ? data[0][yKeys[0]] : null,
        yKeyType: data[0] && yKeys[0] ? typeof data[0][yKeys[0]] : null
      });
      return data;
    },
    [currentSheet, yKeys]
  );

  const allColNames = currentSheet?.columns.map((c) => c.name) ?? [];
  // Use data-based detection as fallback if backend tagged everything as categorical
  const numericColumns = currentSheet
    ? (numericCols(currentSheet.columns).length > 0
        ? numericCols(currentSheet.columns)
        : detectNumericColsFromData(currentSheet.columns, currentSheet.rows))
    : [];

  // When sheet changes, reset axes to smart defaults
  const handleSheetChange = (name: string) => {
    setSelectedSheet(name);
    const sheet = data?.sheets.find((s) => s.name === name);
    if (sheet) {
      const { xKey: ax, yKeys: ay } = defaultAxes(sheet.columns, sheet.rows);
      setXKey(ax);
      setYKeys(ay);
    }
  };

  const toggleYKey = (col: string) => {
    setYKeys((prev) =>
      prev.includes(col) ? prev.filter((k) => k !== col) : [...prev, col]
    );
  };

  // ── chart rendering ──────────────────────────────────────────────────────

  const renderChart = () => {
    const currentSheet = data?.sheets.find(s => s.name === selectedSheet);
    const hasData = currentSheet && chartData.length > 0;
    const hasAxes = xKey !== '' && yKeys.length > 0;
    
    console.log('ExcelChartViewer: renderChart conditions', {
      hasSheet: !!currentSheet,
      hasChartData: chartData.length > 0,
      xKeySet: xKey !== '',
      yKeysSet: yKeys.length > 0,
      conditions: { currentSheet, chartData: chartData.length, xKey, yKeys }
    });
    
    if (!hasData || !hasAxes) {
      let message = 'Select X and Y axes to render the chart';
      if (!currentSheet) message = 'No sheet selected or data not loaded';
      if (chartData.length === 0 && currentSheet) message = 'Sheet has no data rows';
      if (xKey === '' && currentSheet) message = 'Select an X axis column';
      if (yKeys.length === 0 && currentSheet && xKey) message = 'Select at least one Y axis column';

      console.log('ExcelChartViewer: Showing fallback message', { message });

      return (
        <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-2">
          <BarChart2 size={32} />
          <p className="text-sm">{message}</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 20, left: 0, bottom: 5 },
    };

    if (chartType === 'pie') {
      // Pie: use x for label, first y for value
      const yKey = yKeys[0];
      const pieData = chartData.map((row) => ({
        name: String(row[xKey] ?? ''),
        value: Number(row[yKey] ?? 0),
      }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={seriesColor(i)} stroke="var(--surface-1)" />
              ))}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(v: number) => v.toLocaleString()} />
            <Legend {...legendProps} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const sharedAxisProps = {
      xAxis: <XAxis {...axisProps} dataKey={xKey} interval="preserveStartEnd" />,
      yAxis: <YAxis {...axisProps} tickFormatter={(v: number) => v.toLocaleString()} />,
      cartesian: <CartesianGrid {...gridProps} />,
      tooltip: <Tooltip {...tooltipProps} cursor={chartType === 'bar' ? barCursor : lineCursor} formatter={(v: number) => v.toLocaleString()} />,
      legend: <Legend {...legendProps} />,
    };

    if (chartType === 'bar') {
      console.log('ExcelChartViewer: Rendering BarChart with data', {
        dataLength: chartData.length,
        sampleData: chartData.slice(0, 2),
        yKeys: yKeys
      });
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart {...commonProps}>
            {sharedAxisProps.cartesian}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.tooltip}
            {sharedAxisProps.legend}
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={seriesColor(i)} radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart {...commonProps}>
            {sharedAxisProps.cartesian}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.tooltip}
            {sharedAxisProps.legend}
            {yKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={seriesColor(i)} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart {...commonProps}>
            {sharedAxisProps.cartesian}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.tooltip}
            {sharedAxisProps.legend}
            {yKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={seriesColor(i)} fill={seriesColor(i)} fillOpacity={0.12} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // ── loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SectionCard>
        <div role="status" className="flex flex-col items-center justify-center h-72 gap-3 text-text-secondary">
          <Loader2 size={32} className="animate-spin text-signal-text" />
          <p className="text-sm">Reading the spreadsheet…</p>
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
          <Button variant="secondary" size="sm" onClick={fetchChartData}>
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      </SectionCard>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Controls */}
      <SectionCard
        title={document.title}
        actions={
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close spreadsheet" className="flex-shrink-0">
            <X size={18} />
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="font-mono text-xs text-text-muted">
            {document.file_name}, {data?.sheets.length ?? 0} sheet{(data?.sheets.length ?? 0) !== 1 ? 's' : ''}, {currentSheet?.rows.length ?? 0} rows
          </p>

          {/* Row 1: sheet + chart type */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Sheet selector — only shown for multi-sheet files */}
            {(data?.sheets.length ?? 0) > 1 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-text-secondary whitespace-nowrap">Sheet</span>
                <Select value={selectedSheet} onValueChange={handleSheetChange}>
                  <SelectTrigger className="h-8 w-44 text-xs" aria-label="Sheet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data!.sheets.filter((s) => !!s.name).map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chart type toggle */}
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)} className="ml-auto">
              <TabsList aria-label="Chart type">
                {CHART_TYPES.map(({ type, label, Icon }) => (
                  <TabsTrigger key={type} value={type} className="gap-1.5">
                    <Icon size={14} />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Row 2: axis selectors */}
          <div className="flex flex-wrap gap-3 items-start">
            {/* X axis */}
            <div className="space-y-1 flex-shrink-0">
              <p className="text-xs font-medium text-text-secondary">X axis {chartType === 'pie' ? '(label)' : ''}</p>
              <Select value={xKey} onValueChange={setXKey}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="X axis column">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {allColNames.filter((col) => !!col).map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Y axis — multi-select via toggle badges (hidden for pie multi-series) */}
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs font-medium text-text-secondary">
                {chartType === 'pie' ? 'Value' : 'Y axis'} {chartType !== 'pie' && '(select one or more)'}
              </p>
              {chartType === 'pie' ? (
                <Select value={yKeys[0] ?? ''} onValueChange={(v) => setYKeys([v])}>
                  <SelectTrigger className="h-8 w-44 text-xs" aria-label="Value column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.length > 0
                      ? numericColumns.filter((col) => !!col).map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)
                      : allColNames.filter((col) => !!col).map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(numericColumns.length > 0 ? numericColumns : allColNames.filter((c) => c !== xKey)).map((col) => {
                    const seriesIndex = yKeys.indexOf(col);
                    const active = seriesIndex !== -1;
                    return (
                      <button
                        type="button"
                        key={col}
                        onClick={() => toggleYKey(col)}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium transition-colors',
                          active ? 'bg-surface-2 font-semibold text-text-primary' : 'bg-field text-text-secondary hover:bg-field-hover',
                        )}
                      >
                        {active && (
                          <>
                            <span className="h-2 w-2 rounded-pill" style={{ backgroundColor: seriesColor(seriesIndex) }} aria-hidden="true" />
                            <Check size={12} />
                          </>
                        )}
                        {col}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Chart */}
      <SectionCard className="w-full" bodyClassName="min-h-96">
        {renderChart()}
      </SectionCard>

      {/* Data preview toggle */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => setShowTable((p) => !p)} aria-expanded={showTable}>
          <TableIcon size={14} />
          {showTable ? 'Hide' : 'Show'} raw data preview
        </Button>
        {showTable && currentSheet && (
          <div className="mt-2">
            <DataPreviewTable sheet={currentSheet} maxRows={10} />
          </div>
        )}
      </div>

      {/* Sheet info badges */}
      {currentSheet && (
        <div className="flex flex-wrap gap-2">
          {currentSheet.columns.map((col) => (
            <span
              key={col.name}
              className="inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2.5 py-0.5 text-xs text-text-secondary"
            >
              {col.name}
              <span className="font-mono text-text-muted">{col.kind === 'numeric' ? '#' : 'Aa'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
