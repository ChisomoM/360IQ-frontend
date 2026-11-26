import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Search, TableProperties, GitCompare, Sparkles, X } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { EmptyState } from '@/components/shared/EmptyState';
import { seriesColor } from '@/components/dashboard/chartTheme';
import { fetchData } from '@/lib/api/crud';
import { ExcelChartViewer } from '@/components/ai/ExcelChartViewer';
import { ComparisonChartViewer } from '@/components/ai/ComparisonChartViewer';
import { PredictiveAnalysisPanel } from '@/components/ai/PredictiveAnalysisPanel';
import { generatePredictiveAnalysis } from '@/lib/api/ai';
import type { Document } from '@/types/dms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SPREADSHEET_EXTS = ['.xlsx', '.xls', '.csv'];

function isSpreadsheet(doc: Document): boolean {
  const name = (doc.file_name ?? '').toLowerCase();
  return SPREADSHEET_EXTS.some((ext) => name.endsWith(ext));
}

function getExt(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toUpperCase()}` : '';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentCharts() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Single-view mode
  const [selected, setSelected] = useState<Document | null>(null);

  // Compare mode
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Document[]>([]);

  // Predictive analysis mode
  const [predictiveResult, setPredictiveResult] = useState<any>(null);
  const [isPredictiveLoading, setIsPredictiveLoading] = useState(false);
  const [predictiveError, setPredictiveError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchData('DOCUMENTS', 'GET');
        const all: Document[] = Array.isArray(data) ? data : (data?.items ?? []);
        setDocuments(all.filter(isSpreadsheet));
      } catch {
        toast.error("Couldn't load documents");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleCompareMode = () => {
    setIsCompareMode((prev) => !prev);
    setCompareSelected([]);
    setSelected(null);
  };

  const toggleCompareDoc = (doc: Document) => {
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

  const handleGeneratePredictiveAnalysis = async () => {
    setPredictiveError(null);
    setPredictiveResult(null);
    setIsPredictiveLoading(true);

    try {
      // Collect data from either single or compare mode
      let chartData: any = {};
      let docTitle = '';

      if (isCompareMode && compareSelected.length > 0) {
        // Compare mode: collect data from multiple documents
        docTitle = `Comparison: ${compareSelected.map((d) => d.title).join(', ')}`;

        // Try to fetch comparison data
        try {
          const comparisonData = await fetchData('DOCUMENT_COMPARE', 'POST', {}, {
            document_ids: compareSelected.map((d) => d.id),
          });
          chartData = comparisonData;
        } catch (err) {
          // If comparison API fails, just send basic info
          chartData = {
            documents: compareSelected.map((d) => ({
              id: d.id,
              title: d.title,
              file_name: d.file_name,
            })),
            mode: 'comparison',
          };
        }
      } else if (!isCompareMode && selected) {
        // Single mode: collect data from selected document
        docTitle = selected.title;

        try {
          const chartDataResult = await fetchData('DOCUMENT_CHART_DATA', 'GET', { id: selected.id });
          chartData = chartDataResult;
        } catch (err) {
          // If chart data API fails, just send basic info
          chartData = {
            document: {
              id: selected.id,
              title: selected.title,
              file_name: selected.file_name,
            },
            mode: 'single',
          };
        }
      } else {
        toast.error('Select a document to analyse');
        setIsPredictiveLoading(false);
        return;
      }

      // Call predictive analysis API
      const analysis = await generatePredictiveAnalysis(
        chartData,
        docTitle,
        'Document spreadsheet metrics - analyzing trends and patterns',
        isCompareMode ? `Comparing ${compareSelected.length} documents` : 'Single document analysis'
      );

      setPredictiveResult(analysis);
      toast.success('Predictive analysis ready');
    } catch (error: any) {
      const errorMsg = error?.message || "Couldn't generate the predictive analysis";
      setPredictiveError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsPredictiveLoading(false);
    }
  };

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    return d.title?.toLowerCase().includes(q) || d.file_name?.toLowerCase().includes(q);
  });

  const predictivePanel = (predictiveResult || isPredictiveLoading || predictiveError) && (
    <PredictiveAnalysisPanel
      result={predictiveResult}
      isLoading={isPredictiveLoading}
      error={predictiveError}
      onClose={() => {
        setPredictiveResult(null);
        setPredictiveError(null);
      }}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-5"
    >
      <PageHeader
        crumb="Reports"
        title="Document charts"
        description="Chart the data in your spreadsheets, compare up to four and ask for a forecast."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={toggleCompareMode}
              aria-pressed={isCompareMode}
              className={cn(isCompareMode && 'bg-surface-2')}
            >
              <GitCompare size={16} />
              {isCompareMode ? 'Finish comparing' : 'Compare spreadsheets'}
            </Button>
            <Button
              onClick={handleGeneratePredictiveAnalysis}
              disabled={isPredictiveLoading || (!selected && !isCompareMode) || (isCompareMode && compareSelected.length < 2)}
            >
              <Sparkles size={16} />
              {isPredictiveLoading ? 'Analysing' : 'Predict trends'}
            </Button>
          </>
        }
      />

      {/* ── Document list ──────── */}
      <SectionCard
        eyebrow={isCompareMode ? `${compareSelected.length} of 4 selected` : undefined}
        title="Spreadsheets"
        actions={
          <div className="relative w-64 max-w-full">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search spreadsheets"
              placeholder="Search spreadsheets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      >
        {/* Compare mode selection */}
        {isCompareMode && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {compareSelected.length === 0 ? (
              <p className="text-sm text-text-muted">Select 2 to 4 spreadsheets to compare.</p>
            ) : (
              compareSelected.map((doc, idx) => (
                <span
                  key={doc.id}
                  className="inline-flex items-center gap-2 rounded-pill bg-field py-1 pl-3 pr-1.5"
                >
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-pill"
                    style={{ backgroundColor: seriesColor(idx) }}
                    aria-hidden="true"
                  />
                  <span className="max-w-[160px] truncate text-xs font-medium text-text-primary">{doc.title}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompareDoc(doc)}
                    aria-label={`Remove ${doc.title} from comparison`}
                    className="grid h-5 w-5 place-items-center rounded-pill text-text-muted hover:bg-field-hover"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        )}

        <div className="max-h-44 overflow-y-auto">
          <SectionBody
            loading={isLoading}
            skeleton={
              <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 w-40 rounded-md" />
                ))}
              </div>
            }
            isEmpty={filtered.length === 0}
            empty={
              <p className="flex items-center justify-center gap-2 py-2 text-sm text-text-muted">
                <FileSpreadsheet size={18} />
                {search ? 'No spreadsheets match your search.' : 'No spreadsheets yet. Upload one to chart it.'}
              </p>
            }
          >
            <div className="flex flex-wrap gap-2 p-0.5">
              {filtered.map((doc) => {
                const compareIndex = compareSelected.findIndex((d) => d.id === doc.id);
                const isSelectedSingle = selected?.id === doc.id;
                const isActive = isCompareMode ? compareIndex !== -1 : isSelectedSingle;

                return (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={isCompareMode ? () => toggleCompareDoc(doc) : () => setSelected(doc)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-text-primary transition-colors',
                      isActive ? 'border-signal bg-surface-2' : 'border-line bg-surface-1 hover:bg-surface-2',
                    )}
                  >
                    {isCompareMode && compareIndex >= 0 ? (
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-pill"
                        style={{ backgroundColor: seriesColor(compareIndex) }}
                        aria-hidden="true"
                      />
                    ) : (
                      <FileSpreadsheet size={16} className={cn('flex-shrink-0', isActive ? 'text-signal-text' : 'text-text-muted')} />
                    )}
                    <span className="max-w-[180px] truncate">{doc.title}</span>
                    <span className="flex-shrink-0 rounded-xs bg-field px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                      {getExt(doc.file_name)}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionBody>
        </div>
      </SectionCard>

      {/* ── Main content ────────────────────────────────── */}
      {/* Compare mode: waiting for selection */}
      {isCompareMode && compareSelected.length < 2 && (
        <SectionCard>
          <EmptyState
            icon={<GitCompare size={24} />}
            title="Compare spreadsheets"
            description={compareSelected.length === 0
              ? 'Select 2 to 4 spreadsheets above to start comparing.'
              : 'Select one more spreadsheet to start comparing.'}
          />
        </SectionCard>
      )}

      {/* Compare mode: ready */}
      {isCompareMode && compareSelected.length >= 2 && (
        <>
          <ComparisonChartViewer
            docs={compareSelected}
            onClearAll={() => setCompareSelected([])}
          />
          {predictivePanel}
        </>
      )}

      {/* Single-view mode */}
      {!isCompareMode && selected && (
        <>
          <ExcelChartViewer
            document={selected}
            onClose={() => setSelected(null)}
          />
          {predictivePanel}
        </>
      )}

      {/* Single-view mode: nothing selected */}
      {!isCompareMode && !selected && (
        <SectionCard>
          <EmptyState
            icon={<TableProperties size={24} />}
            title="Select a spreadsheet"
            description="Choose one from the list above to see its data as charts."
          />
        </SectionCard>
      )}
    </motion.div>
  );
}
