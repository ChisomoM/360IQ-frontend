import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileSpreadsheet, Search, BarChart2, TableProperties, GitCompare, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchData } from '@/lib/api/crud';
import { ExcelChartViewer } from '@/components/ai/ExcelChartViewer';
import { ComparisonChartViewer } from '@/components/ai/ComparisonChartViewer';
import { PredictiveAnalysisPanel } from '@/components/ai/PredictiveAnalysisPanel';
import { generatePredictiveAnalysis } from '@/lib/api/ai';
import type { Document } from '@/types/dms';
import { toast } from 'sonner';

// ─── Animated section component ──────────────────────────────────────────────

function ScrollAnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SPREADSHEET_EXTS = ['.xlsx', '.xls', '.csv'];

function isSpreadsheet(doc: Document): boolean {
  const name = (doc.file_name ?? '').toLowerCase();
  return SPREADSHEET_EXTS.some((ext) => name.endsWith(ext));
}

function extBadgeColor(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.csv')) return 'bg-signal-tint text-signal-text';
  if (lower.endsWith('.xls')) return 'bg-positive-tint text-positive';
  return 'bg-surface-2 text-sky-text';
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
        toast.error('Failed to load documents');
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
        toast.error('Maximum 4 documents can be compared at once');
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
        toast.error('Please select a document or documents to analyze');
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
      toast.success('Predictive analysis generated successfully');
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to generate predictive analysis';
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


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full min-h-0 bg-gray-50"
    >

      {/* ── Top Navigation Bar ──────────────────────────────── */}
      <nav className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + Icon */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <BarChart2 className="h-5 w-5 text-signal-text" />
              <h1 className="text-lg font-semibold text-gray-900">Document Charts</h1>
            </div>

            {/* Middle: Search */}
            <div className="flex-1 min-w-0 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search spreadsheets…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 text-sm text-gray-600 hover:bg-signal-tint hover:text-signal-text border-gray-300"
                  onClick={handleGeneratePredictiveAnalysis}
                  disabled={isPredictiveLoading || (!selected && !isCompareMode) || (isCompareMode && compareSelected.length < 2)}
                  title="Generate AI-powered predictive analysis from chart data"
                >
                  <Sparkles className="h-4 w-4" />
                  {isPredictiveLoading ? 'Analyzing...' : 'Predict'}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isCompareMode ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-3 gap-2 text-sm ${isCompareMode ? 'bg-primary text-on-signal hover:bg-signal-hover border-primary' : 'text-gray-600'}`}
                  onClick={toggleCompareMode}
                  title="Toggle compare mode"
                >
                  <GitCompare className="h-4 w-4" />
                  {isCompareMode ? 'Done' : 'Compare'}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Document Selector Row */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-100 bg-gray-50 px-6 py-3"
        >
          <div className="flex items-center gap-3">
            {isCompareMode ? (
              <>
                <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                  Selected: {compareSelected.length}/4
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto pb-1">
                  {compareSelected.length === 0 ? (
                    <p className="text-sm text-gray-400">Select 2-4 spreadsheets to compare</p>
                  ) : (
                    compareSelected.map((doc, idx) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 flex-shrink-0"
                        style={{ borderLeftColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                          {doc.title}
                        </span>
                        <button
                          onClick={() => toggleCompareDoc(doc)}
                          className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                          title="Remove from comparison"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700 flex-shrink-0">Current:</span>
                {selected ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-signal-tint border border-primary flex-shrink-0"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-signal-text flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {selected.title}
                    </span>
                    <button
                      onClick={() => setSelected(null)}
                      className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      title="Clear selection"
                    >
                      ×
                    </button>
                  </motion.div>
                ) : (
                  <p className="text-sm text-gray-400">Choose a spreadsheet below to visualize</p>
                )}
              </>
            )}
          </div>
        </motion.div>
      </nav>

      {/* ── Document List Panel (Drawer/Collapsible) ──────── */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 border-b border-gray-200 bg-white max-h-40 overflow-y-auto"
      >
        <div className="px-6 py-3">
          {isLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-10 w-40 rounded-lg bg-gray-100 animate-pulse flex-shrink-0"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-2 text-gray-400 py-2"
            >
              <FileSpreadsheet className="h-5 w-5 opacity-40" />
              <p className="text-sm">
                {search ? 'No matches found' : 'No spreadsheet documents uploaded yet'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="flex gap-2 flex-wrap"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {filtered.map((doc, idx) => {
                const compareIndex = compareSelected.findIndex((d) => d.id === doc.id);
                const isSelectedSingle = selected?.id === doc.id;
                const isActive = isCompareMode ? compareIndex !== -1 : isSelectedSingle;

                return (
                  <motion.button
                    key={doc.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    onClick={isCompareMode ? () => toggleCompareDoc(doc) : () => setSelected(doc)}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center gap-2 flex-shrink-0 ${
                      isActive
                        ? isCompareMode
                          ? 'border-gray-300 bg-white shadow-sm'
                          : 'border-primary bg-signal-tint shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isCompareMode && compareIndex >= 0 ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[compareIndex % CHART_COLORS.length] }}
                      />
                    ) : (
                      <FileSpreadsheet className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-signal-text' : 'text-gray-400'}`} />
                    )}
                    <span className="truncate max-w-[150px]">{doc.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${extBadgeColor(doc.file_name)}`}>
                      {getExt(doc.file_name)}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Main Content Area ────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Compare mode: waiting for selection */}
        {isCompareMode && compareSelected.length < 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 min-h-[400px]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"
            >
              <GitCompare className="h-8 w-8 opacity-50" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="text-sm font-medium text-gray-500">Comparison Ready</p>
              <p className="text-xs mt-1 max-w-xs text-gray-400">
                {compareSelected.length === 0
                  ? 'Select 2 to 4 spreadsheets above to begin comparing.'
                  : 'Select one more document to start comparing.'}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Compare mode: ready */}
        {isCompareMode && compareSelected.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 flex flex-col space-y-6"
          >
            <ScrollAnimatedSection delay={0}>
              <ComparisonChartViewer
                docs={compareSelected}
                onClearAll={() => setCompareSelected([])}
              />
            </ScrollAnimatedSection>
            {(predictiveResult || isPredictiveLoading || predictiveError) && (
              <ScrollAnimatedSection delay={0.15}>
                <PredictiveAnalysisPanel
                  result={predictiveResult}
                  isLoading={isPredictiveLoading}
                  error={predictiveError}
                  onClose={() => {
                    setPredictiveResult(null);
                    setPredictiveError(null);
                  }}
                />
              </ScrollAnimatedSection>
            )}
          </motion.div>
        )}

        {/* Single-view mode */}
        {!isCompareMode && selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 flex flex-col space-y-6"
          >
            <ScrollAnimatedSection delay={0}>
              <ExcelChartViewer
                document={selected}
                onClose={() => setSelected(null)}
              />
            </ScrollAnimatedSection>
            {(predictiveResult || isPredictiveLoading || predictiveError) && (
              <ScrollAnimatedSection delay={0.15}>
                <PredictiveAnalysisPanel
                  result={predictiveResult}
                  isLoading={isPredictiveLoading}
                  error={predictiveError}
                  onClose={() => {
                    setPredictiveResult(null);
                    setPredictiveError(null);
                  }}
                />
              </ScrollAnimatedSection>
            )}
          </motion.div>
        )}

        {/* Single-view mode: nothing selected */}
        {!isCompareMode && !selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 min-h-[400px]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"
            >
              <TableProperties className="h-8 w-8 opacity-50" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="text-sm font-medium text-gray-500">Select a Spreadsheet</p>
              <p className="text-xs mt-1 max-w-xs text-gray-400">
                Choose a document from the list above to visualize its data as interactive charts.
              </p>
            </motion.div>
          </motion.div>
        )}
      </main>

    </motion.div>
  );
}
