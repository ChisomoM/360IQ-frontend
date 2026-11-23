/**
 * Financial Charts Page
 * Allows viewing and comparing financial statements (P&L, Cash Flow, etc)
 * Structure mirrors DocumentCharts but optimized for financial data
 */

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  BarChart2,
  TableProperties,
  GitCompare,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  getMockFinancialDocuments,
  getMockFinancialTableData,
  getMockFinancialComparison,
} from '@/lib/mocks/mockFinancialData';
import { FinancialChartViewer } from '@/components/financial/FinancialChartViewer';
import { FinancialComparisonViewer } from '@/components/financial/FinancialComparisonViewer';
import { StatementTypeIndicator } from '@/components/financial/StatementTypeIndicator';
import type { FinancialDocument } from '@/types/finance';
import { toast } from 'sonner';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatementBadgeColor(statementType: string): string {
  switch (statementType) {
    case 'profit_loss':
      return 'bg-caution-tint text-caution';
    case 'cash_flow':
      return 'bg-positive-tint text-positive';
    case 'invoice_list':
      return 'bg-signal-tint text-signal-text';
    case 'payment_list':
      return 'bg-surface-2 text-sky-text';
    case 'balance_sheet':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStatementLabel(statementType: string): string {
  switch (statementType) {
    case 'profit_loss':
      return 'P&L';
    case 'cash_flow':
      return 'C/F';
    case 'invoice_list':
      return 'Invoices';
    case 'payment_list':
      return 'Payments';
    case 'balance_sheet':
      return 'B/S';
    default:
      return 'Other';
  }
}

// ─── Document list item ───────────────────────────────────────────────────────

function DocListItem({
  doc,
  isSelected,
  onSelect,
  isCompareMode,
  compareIndex,
  onCompareToggle,
}: {
  doc: FinancialDocument;
  isSelected: boolean;
  onSelect: () => void;
  isCompareMode: boolean;
  compareIndex: number;
  onCompareToggle: () => void;
}) {
  const active = isCompareMode ? compareIndex !== -1 : isSelected;
  const color =
    compareIndex >= 0
      ? CHART_COLORS[compareIndex % CHART_COLORS.length]
      : undefined;

  return (
    <button
      onClick={isCompareMode ? onCompareToggle : onSelect}
      className={`w-full text-left px-3 py-3 rounded-lg border transition-all group ${
        active
          ? 'border-primary bg-signal-tint shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Colour dot in compare mode, folder icon otherwise */}
        {isCompareMode ? (
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 border-2 border-white ring-1 ring-gray-200"
            style={{ backgroundColor: color ?? '#d1d5db' }}
          />
        ) : (
          <FileSpreadsheet
            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${active ? 'text-signal-text' : 'text-gray-400 group-hover:text-gray-600'}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${active ? 'text-gray-900' : 'text-gray-700'}`}
          >
            {doc.title}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{doc.file_name}</p>
        </div>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${getStatementBadgeColor(doc.statement_type)}`}
        >
          {getStatementLabel(doc.statement_type)}
        </span>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialCharts() {
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Single-view mode
  const [selected, setSelected] = useState<FinancialDocument | null>(null);

  // Compare mode
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<FinancialDocument[]>(
    []
  );

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const docs = getMockFinancialDocuments();
        setDocuments(docs);
      } catch (error) {
        toast.error('Failed to load financial documents');
      } finally {
        setIsLoading(false);
      }
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleCompareMode = () => {
    setIsCompareMode((prev) => !prev);
    setCompareSelected([]);
    setSelected(null);
  };

  const toggleCompareDoc = (doc: FinancialDocument) => {
    setCompareSelected((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) return prev.filter((d) => d.id !== doc.id);
      if (prev.length >= 4) {
        toast.error('Maximum 4 documents can be compared at once');
        return prev;
      }
      return [...prev, doc];
    });
  };

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.file_name?.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 bg-gray-50">
      {/* ── Left: document list ─────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-orange-600" />
              <h1 className="text-base font-semibold text-gray-900">
                Financial Charts
              </h1>
            </div>
            <Button
              variant={isCompareMode ? 'default' : 'outline'}
              size="sm"
              className={`h-7 px-2 gap-1 text-xs ${
                isCompareMode
                  ? 'bg-orange-600 text-white hover:bg-orange-700 border-orange-600'
                  : 'text-gray-500'
              }`}
              onClick={toggleCompareMode}
              title="Toggle compare mode"
            >
              <GitCompare className="h-3.5 w-3.5" />
              {isCompareMode ? 'Done' : 'Compare'}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search statements…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
            />
          </div>
          {isCompareMode && (
            <p className="text-xs text-gray-400 mt-2">
              Select 2–4 documents to compare
            </p>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 gap-2 text-gray-400">
              <FileSpreadsheet className="h-8 w-8 opacity-40" />
              <p className="text-xs text-center">
                {search ? 'No matches found' : 'No financial documents available'}
              </p>
            </div>
          ) : (
            filtered.map((doc) => {
              const compareIndex = compareSelected.findIndex(
                (d) => d.id === doc.id
              );
              return (
                <DocListItem
                  key={doc.id}
                  doc={doc}
                  isSelected={selected?.id === doc.id}
                  onSelect={() => setSelected(doc)}
                  isCompareMode={isCompareMode}
                  compareIndex={compareIndex}
                  onCompareToggle={() => toggleCompareDoc(doc)}
                />
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>
              {filtered.length} of {documents.length} statement
              {documents.length !== 1 ? 's' : ''}
            </span>
            {isCompareMode && compareSelected.length > 0 && (
              <span className="font-medium text-gray-600">
                {compareSelected.length}/4 selected
              </span>
            )}
          </div>
        )}
      </aside>

      {/* ── Right: viewer ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Compare mode: waiting for selection */}
        {isCompareMode && compareSelected.length < 2 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <GitCompare className="h-8 w-8 opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">
                Compare mode active
              </p>
              <p className="text-xs mt-1 max-w-xs">
                {compareSelected.length === 0
                  ? 'Select 2 to 4 financial statements from the left panel to begin.'
                  : 'Select one more document to start comparing.'}
              </p>
            </div>
          </div>
        )}

        {/* Compare mode: ready */}
        {isCompareMode && compareSelected.length >= 2 && (
          <div className="p-6">
            <FinancialComparisonViewer
              docs={compareSelected}
              onClearAll={() => setCompareSelected([])}
            />
          </div>
        )}

        {/* Single-view mode */}
        {!isCompareMode && selected && (
          <div className="p-6">
            <FinancialChartViewer
              document={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}

        {/* Single-view mode: nothing selected */}
        {!isCompareMode && !selected && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <TableProperties className="h-8 w-8 opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">
                Select a financial statement
              </p>
              <p className="text-xs mt-1 max-w-xs">
                Choose a document from the left panel to visualise its data as
                interactive charts.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
