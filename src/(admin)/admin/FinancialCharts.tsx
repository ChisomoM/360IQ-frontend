/**
 * Financial Charts Page
 * Allows viewing and comparing financial statements (P&L, Cash Flow, etc)
 * Structure mirrors DocumentCharts but optimized for financial data
 */

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  TableProperties,
  GitCompare,
} from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { seriesColor } from '@/components/dashboard/chartTheme';
import { getMockFinancialDocuments } from '@/lib/mocks/mockFinancialData';
import { FinancialChartViewer } from '@/components/financial/FinancialChartViewer';
import { FinancialComparisonViewer } from '@/components/financial/FinancialComparisonViewer';
import type { FinancialDocument } from '@/types/finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    compareIndex >= 0 ? seriesColor(compareIndex) : undefined;

  return (
    <button
      type="button"
      onClick={isCompareMode ? onCompareToggle : onSelect}
      aria-pressed={active}
      className={cn(
        'w-full rounded-md border px-3 py-3 text-left transition-colors',
        active ? 'border-signal bg-surface-2' : 'border-line bg-surface-1 hover:bg-surface-2',
      )}
    >
      <span className="flex items-start gap-2.5">
        {/* Colour dot in compare mode, file icon otherwise */}
        {isCompareMode ? (
          <span
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-pill border border-line-strong"
            style={color ? { backgroundColor: color } : undefined}
            aria-hidden="true"
          />
        ) : (
          <FileSpreadsheet
            size={16}
            className={cn('mt-0.5 flex-shrink-0', active ? 'text-signal-text' : 'text-text-muted')}
          />
        )}
        <span className="block min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text-primary">
            {doc.title}
          </span>
          <span className="mt-0.5 block truncate font-mono text-xs text-text-muted">{doc.file_name}</span>
        </span>
        <span className="flex-shrink-0 rounded-pill bg-field px-2 py-0.5 text-xs text-text-secondary">
          {getStatementLabel(doc.statement_type)}
        </span>
      </span>
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
        toast.error("Couldn't load financial documents");
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
        toast.error('Compare up to 4 documents at once');
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
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <PageHeader
        crumb="Reports"
        title="Financial charts"
        description="Chart a financial statement, or compare up to four."
        actions={
          <Button
            variant="secondary"
            className={cn(isCompareMode && 'bg-surface-2')}
            aria-pressed={isCompareMode}
            onClick={toggleCompareMode}
          >
            <GitCompare size={16} />
            {isCompareMode ? 'Finish comparing' : 'Compare statements'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      {/* ── Left: document list ─────────────────────────────── */}
      <aside className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card lg:max-h-[75vh]">
        {/* Header */}
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search statements"
              placeholder="Search statements"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isCompareMode && (
            <p className="mt-2 text-xs text-text-muted">
              Select 2 to 4 documents to compare
            </p>
          )}
        </div>

        {/* List */}
        <div className="max-h-72 flex-1 space-y-1.5 overflow-y-auto p-3 lg:max-h-none">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-md" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-text-muted">
              <FileSpreadsheet size={24} />
              <p className="text-center text-xs">
                {search ? 'No statements match your search.' : 'No financial documents yet.'}
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
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-text-muted">
            <span>
              {filtered.length} of {documents.length} statement
              {documents.length !== 1 ? 's' : ''}
            </span>
            {isCompareMode && compareSelected.length > 0 && (
              <span className="font-semibold text-text-secondary">
                {compareSelected.length} of 4 selected
              </span>
            )}
          </div>
        )}
      </aside>

      {/* ── Right: viewer ───────────────────────────────────── */}
      <div className="min-w-0">
        {/* Compare mode: waiting for selection */}
        {isCompareMode && compareSelected.length < 2 && (
          <SectionCard>
            <EmptyState
              icon={<GitCompare size={24} />}
              title="Compare statements"
              description={compareSelected.length === 0
                ? 'Select 2 to 4 financial statements from the list to start.'
                : 'Select one more statement to start comparing.'}
            />
          </SectionCard>
        )}

        {/* Compare mode: ready */}
        {isCompareMode && compareSelected.length >= 2 && (
          <FinancialComparisonViewer
            docs={compareSelected}
            onClearAll={() => setCompareSelected([])}
          />
        )}

        {/* Single-view mode */}
        {!isCompareMode && selected && (
          <FinancialChartViewer
            document={selected}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Single-view mode: nothing selected */}
        {!isCompareMode && !selected && (
          <SectionCard>
            <EmptyState
              icon={<TableProperties size={24} />}
              title="Select a financial statement"
              description="Choose one from the list to see its data as charts."
            />
          </SectionCard>
        )}
      </div>
      </div>
    </div>
  );
}
