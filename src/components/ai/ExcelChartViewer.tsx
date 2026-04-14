import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart2, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon, TableIcon, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { list } from '@/lib/api/crud';
import type { Document, SpreadsheetData, SheetData, ColumnMeta } from '@/types/dms';

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

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
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="even:bg-gray-50/50">
              {headers.map((_, ci) => (
                <td key={ci} className="px-3 py-1.5 text-gray-700 whitespace-nowrap border-b border-gray-50">
                  {row[ci] ?? <span className="text-gray-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sheet.rows.length > maxRows && (
        <p className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
          Showing {maxRows} of {sheet.rows.length} rows
        </p>
      )}
    </div>
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
      const message = err?.message || 'Failed to load spreadsheet data';
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
      if (xKey === '' && currentSheet) message = 'Please select an X axis column';
      if (yKeys.length === 0 && currentSheet && xKey) message = 'Please select at least one Y axis column';
      
      console.log('ExcelChartViewer: Showing fallback message', { message });
      
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
          <BarChart2 className="h-12 w-12 opacity-20" />
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
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const sharedAxisProps = {
      xAxis: <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval="preserveStartEnd" />,
      yAxis: <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => v.toLocaleString()} />,
      cartesian: <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />,
      tooltip: <Tooltip formatter={(v: number) => v.toLocaleString()} />,
      legend: <Legend />,
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
              <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
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
              <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={chartData.length <= 30} />
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
              {yKeys.map((k, i) => (
                <linearGradient key={k} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {sharedAxisProps.cartesian}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.tooltip}
            {sharedAxisProps.legend}
            {yKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#grad-${i})`} strokeWidth={2} />
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
      <div className="flex flex-col items-center justify-center h-72 gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#febb00]" />
        <p className="text-sm">Extracting spreadsheet data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4 text-gray-500">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-center max-w-xs text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchChartData}>
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight">{document.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono uppercase">
            {document.file_name} · {data?.sheets.length ?? 0} sheet{(data?.sheets.length ?? 0) !== 1 ? 's' : ''} · {currentSheet?.rows.length ?? 0} rows
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Controls */}
      <Card className="border border-gray-100 shadow-none bg-gray-50/60">
        <CardContent className="p-4 space-y-4">
          {/* Row 1: sheet + chart type */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Sheet selector — only shown for multi-sheet files */}
            {(data?.sheets.length ?? 0) > 1 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sheet</span>
                <Select value={selectedSheet} onValueChange={handleSheetChange}>
                  <SelectTrigger className="h-8 w-44 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data!.sheets.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chart type toggle */}
            <div className="flex items-center gap-1 ml-auto">
              {CHART_TYPES.map(({ type, label, Icon }) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 px-2.5 gap-1.5 text-xs ${chartType === type ? 'bg-[#1e3c21] text-white hover:bg-[#1e3c21]' : ''}`}
                  onClick={() => setChartType(type)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Row 2: axis selectors */}
          <div className="flex flex-wrap gap-3 items-start">
            {/* X axis */}
            <div className="space-y-1 flex-shrink-0">
              <p className="text-xs font-medium text-gray-500">X Axis {chartType === 'pie' ? '(Label)' : ''}</p>
              <Select value={xKey} onValueChange={setXKey}>
                <SelectTrigger className="h-8 w-44 text-xs bg-white">
                  <SelectValue placeholder="Select column…" />
                </SelectTrigger>
                <SelectContent>
                  {allColNames.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Y axis — multi-select via toggle badges (hidden for pie multi-series) */}
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500">
                {chartType === 'pie' ? 'Value' : 'Y Axis'} {chartType !== 'pie' && '(click to toggle)'}
              </p>
              {chartType === 'pie' ? (
                <Select value={yKeys[0] ?? ''} onValueChange={(v) => setYKeys([v])}>
                  <SelectTrigger className="h-8 w-44 text-xs bg-white">
                    <SelectValue placeholder="Select column…" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.length > 0
                      ? numericColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)
                      : allColNames.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(numericColumns.length > 0 ? numericColumns : allColNames.filter((c) => c !== xKey)).map((col, i) => (
                    <button
                      key={col}
                      onClick={() => toggleYKey(col)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        yKeys.includes(col)
                          ? 'text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                      style={yKeys.includes(col) ? { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] } : undefined}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border border-gray-100 shadow-none w-full overflow-visible">
        <CardContent className="p-4 pt-5 w-full min-h-96 overflow-visible">
          {renderChart()}
        </CardContent>
      </Card>

      {/* Data preview toggle */}
      <div>
        <button
          onClick={() => setShowTable((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <TableIcon className="h-3.5 w-3.5" />
          {showTable ? 'Hide' : 'Show'} raw data preview
        </button>
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
            <Badge
              key={col.name}
              variant="outline"
              className={`text-xs px-2 py-0.5 ${col.kind === 'numeric' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-600'}`}
            >
              {col.name}
              <span className="ml-1 opacity-50">{col.kind === 'numeric' ? '#' : 'Aa'}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
