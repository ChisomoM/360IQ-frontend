import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
};

export interface SignatureField {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PreviewField extends SignatureField {
  id: string;
  label: string;
  status?: string;
}

interface PDFFieldPositionerProps {
  file: ArrayBuffer | string;
  mode: 'place' | 'preview';
  field?: SignatureField;
  previewFields?: PreviewField[];
  onFieldChange?: (field: SignatureField) => void;
  fieldLabel?: string;
  pageWidth?: number;
}

const DEFAULT_W = 0.25;
const DEFAULT_H = 0.06;

export default function PDFFieldPositioner({
  file,
  mode,
  field,
  previewFields,
  onFieldChange,
  fieldLabel = 'Sign here',
  pageWidth = 680,
}: PDFFieldPositionerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(field?.page ?? previewFields?.[0]?.page ?? 1);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<'se' | null>(null);
  const dragStart = useRef<{ mx: number; my: number; fx: number; fy: number } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; fw: number; fh: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (field?.page) setCurrentPage(field.page);
  }, [field?.page]);

  useEffect(() => {
    if (mode === 'preview' && !field && previewFields?.length && currentPage === 1) {
      setCurrentPage(previewFields[0].page);
    }
  }, [currentPage, field, mode, previewFields]);

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(null);
  };

  const handlePageLoad = (page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height });
  };

  const toNorm = useCallback(
    (clientX: number, clientY: number): { nx: number; ny: number } => {
      const el = containerRef.current;
      if (!el) return { nx: 0, ny: 0 };
      const rect = el.getBoundingClientRect();
      return {
        nx: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        ny: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    },
    [],
  );

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'place' || dragging || resizing) return;
    const { nx, ny } = toNorm(e.clientX, e.clientY);
    const x = Math.max(0, Math.min(1 - DEFAULT_W, nx - DEFAULT_W / 2));
    const y = Math.max(0, Math.min(1 - DEFAULT_H, ny - DEFAULT_H / 2));
    onFieldChange?.({ page: currentPage, x, y, w: DEFAULT_W, h: DEFAULT_H });
  };

  const handleFieldMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'place' || !field) return;
    e.stopPropagation();
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, fx: field.x, fy: field.y };
    setDragging(true);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'place' || !field) return;
    e.stopPropagation();
    e.preventDefault();
    resizeStart.current = { mx: e.clientX, my: e.clientY, fw: field.w, fh: field.h };
    setResizing('se');
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const onMove = (e: MouseEvent) => {
      if (dragging && dragStart.current && field) {
        const dx = (e.clientX - dragStart.current.mx) / rect.width;
        const dy = (e.clientY - dragStart.current.my) / rect.height;
        const x = Math.max(0, Math.min(1 - field.w, dragStart.current.fx + dx));
        const y = Math.max(0, Math.min(1 - field.h, dragStart.current.fy + dy));
        onFieldChange?.({ ...field, x, y });
      }
      if (resizing && resizeStart.current && field) {
        const dw = (e.clientX - resizeStart.current.mx) / rect.width;
        const dh = (e.clientY - resizeStart.current.my) / rect.height;
        const w = Math.max(0.05, Math.min(1 - field.x, resizeStart.current.fw + dw));
        const h = Math.max(0.02, Math.min(1 - field.y, resizeStart.current.fh + dh));
        onFieldChange?.({ ...field, w, h });
      }
    };
    const onUp = () => {
      setDragging(false);
      setResizing(null);
      dragStart.current = null;
      resizeStart.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, resizing, field, onFieldChange]);

  const renderedHeight = pageSize
    ? Math.round((pageSize.height / pageSize.width) * pageWidth)
    : undefined;

  const showField = !!field && field.page === currentPage;
  const activePreviewFields =
    mode === 'preview'
      ? (previewFields?.filter((previewField) => previewField.page === currentPage) ??
        (showField
          ? [{ id: 'preview-field', label: fieldLabel, status: 'pending', ...field }]
          : []))
      : [];

  const getPreviewFieldClasses = (status?: string) => {
    switch (status) {
      case 'signed':
        return {
          frame: 'border-positive bg-[color-mix(in_srgb,var(--positive)_10%,transparent)]',
          badge: 'bg-positive text-surface-1',
        };
      case 'declined':
        return {
          frame: 'border-risk bg-[color-mix(in_srgb,var(--risk)_10%,transparent)]',
          badge: 'bg-risk text-surface-1',
        };
      case 'expired':
        return {
          frame: 'border-line-strong bg-[color-mix(in_srgb,var(--line-strong)_10%,transparent)]',
          badge: 'bg-text-secondary text-surface-1',
        };
      default:
        return {
          frame: 'border-caution bg-[color-mix(in_srgb,var(--caution)_10%,transparent)]',
          badge: 'bg-caution text-surface-1',
        };
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-md bg-field px-3 py-1.5">
        <span className="text-xs font-medium text-text-secondary">
          Page <span className="font-mono">{currentPage}</span> of <span className="font-mono">{numPages || '…'}</span>
        </span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Previous page" title="Previous page" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Next page" title="Next page" disabled={currentPage >= numPages} onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Scrollable viewport — lets tall pages be scrolled within the modal */}
      <div
        className="overflow-auto rounded-sm border border-line bg-surface-2"
      >
        {/* Inner container sized exactly to the page so absolute overlays align.
            A PDF page is white in both themes, so its overlays use the paper tokens. */}
        <div
          data-theme="paper"
          className="relative select-none bg-surface-1"
          style={{ width: pageWidth, height: renderedHeight ?? 200 }}
        >
          {loadError ? (
            <div role="alert" className="flex h-48 flex-col items-center justify-center gap-2 text-risk">
              <AlertCircle size={24} />
              <p className="text-sm">{loadError}</p>
            </div>
          ) : (
            <Document
              file={file}
              options={pdfOptions}
              onLoadSuccess={handleDocumentLoad}
              onLoadError={(err) => setLoadError(err.message)}
              loading={
                <div role="status" className="flex h-48 items-center justify-center gap-2 text-text-muted">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Loading PDF</span>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={handlePageLoad}
              />
            </Document>
          )}

          {mode === 'place' && !loadError && (
            <div
              ref={containerRef}
              className={cn('absolute inset-0', !field ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-default')}
              onClick={handleOverlayClick}
              style={{ zIndex: 10 }}
            />
          )}

          {mode === 'preview' && !loadError && (
            <div ref={containerRef} className="absolute inset-0 pointer-events-none" />
          )}

          {showField && mode === 'place' && renderedHeight && (
            <div
              className={cn(
                'absolute border-2 rounded-xs flex items-center justify-center bg-[color-mix(in_srgb,var(--signal)_12%,transparent)]',
                mode === 'place' ? 'border-signal cursor-grab' : 'border-signal pointer-events-none',
              )}
              style={{
                left: `${field!.x * 100}%`,
                top: `${field!.y * 100}%`,
                width: `${field!.w * 100}%`,
                height: `${field!.h * 100}%`,
                zIndex: 20,
              }}
              onMouseDown={mode === 'place' ? handleFieldMouseDown : undefined}
            >
              <span className="text-[10px] font-semibold text-signal-text select-none pointer-events-none truncate px-1">
                {fieldLabel}
              </span>
              {mode === 'place' && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-signal rounded-tl-xs"
                  onMouseDown={handleResizeMouseDown}
                  style={{ zIndex: 30 }}
                />
              )}
            </div>
          )}

          {mode === 'preview' && renderedHeight && activePreviewFields.map((previewField) => {
            const previewStyles = getPreviewFieldClasses(previewField.status);
            return (
              <div
                key={previewField.id}
                className={cn(
                  'absolute rounded-xs border-2 pointer-events-none',
                  previewStyles.frame,
                )}
                style={{
                  left: `${previewField.x * 100}%`,
                  top: `${previewField.y * 100}%`,
                  width: `${previewField.w * 100}%`,
                  height: `${previewField.h * 100}%`,
                  zIndex: 20,
                }}
              >
                <span
                  className={cn(
                    'absolute left-1 top-1 max-w-[calc(100%-8px)] truncate rounded-pill px-2 py-0.5 text-[10px] font-semibold',
                    previewStyles.badge,
                  )}
                >
                  {previewField.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {mode === 'place' && (
        <p className="text-center text-xs text-text-muted">
          {field ? 'Drag to move the field, or drag its corner to resize' : 'Click anywhere on the page to place the signature field'}
        </p>
      )}
    </div>
  );
}
