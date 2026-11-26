import { useEffect, useMemo, useState } from 'react';
import { fetchFileBuffer } from '@/lib/api/crud';
import type { Document } from '@/types/dms';
import type { SignatureRequest } from '@/types/signatures';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SectionBody } from '@/components/shared/SectionBody';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import PDFFieldPositioner, { type PreviewField } from './PDFFieldPositioner';
import { Loader2 } from '@/components/icons';

interface DocumentPreviewProps {
  document: Document;
  signatureRequests: SignatureRequest[];
  loadingSignatures?: boolean;
}

const getSignerName = (request: SignatureRequest) => {
  if (!request.signer) return 'Unknown signer';
  return `${request.signer.first_name} ${request.signer.last_name}`.trim();
};

export default function DocumentPreview({
  document,
  signatureRequests,
  loadingSignatures = false,
}: DocumentPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewAttempt, setPreviewAttempt] = useState(0);

  const isPdf = useMemo(() => {
    const fileType = document.file_type?.toLowerCase() ?? '';
    const fileName = document.file_name?.toLowerCase() ?? '';
    return fileType.includes('pdf') || fileName.endsWith('.pdf');
  }, [document.file_name, document.file_type]);

  const previewFields = useMemo<PreviewField[]>(
    () =>
      signatureRequests
        .map((request) => ({
          id: request.id,
          page: request.signature_page ?? 1,
          x: request.signature_x ?? 0,
          y: request.signature_y ?? 0,
          w: request.signature_w ?? 0.25,
          h: request.signature_h ?? 0.06,
          label: `${request.sign_order > 0 ? `#${request.sign_order} ` : ''}${getSignerName(request)}`,
          status: request.status,
        }))
        .sort((a, b) => (a.page - b.page) || a.label.localeCompare(b.label)),
    [signatureRequests],
  );

  const signedCount = useMemo(
    () => signatureRequests.filter((request) => request.status === 'signed').length,
    [signatureRequests],
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      if (!isPdf) {
        setPreviewError(null);
        setPdfUrl(null);
        return;
      }

      setLoadingPdf(true);
      setPreviewError(null);

      try {
        const { buffer } = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: document.id });
        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));

        if (!cancelled) {
          setPdfUrl(objectUrl);
        }
        return;
      } catch (downloadError) {
        if (document.file_url) {
          try {
            const response = await fetch(document.file_url);
            if (!response.ok) {
              throw new Error(`Preview fallback failed (${response.status})`);
            }

            const buffer = await response.arrayBuffer();
            objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
            if (!cancelled) {
              setPdfUrl(objectUrl);
            }
            return;
          } catch (fallbackError) {
            const errorMessage =
              fallbackError instanceof Error
                ? fallbackError.message
                : downloadError instanceof Error
                  ? downloadError.message
                  : 'Failed to load document preview';
            if (!cancelled) {
              setPreviewError(errorMessage);
              setPdfUrl(null);
            }
          }
        } else if (!cancelled) {
          setPreviewError(downloadError instanceof Error ? downloadError.message : 'Failed to load document preview');
          setPdfUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPdf(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document.file_url, document.id, isPdf, previewAttempt]);

  const retryPreview = () => {
    setPdfUrl(null);
    setPreviewError(null);
    setPreviewAttempt((attempt) => attempt + 1);
  };

  const spinner = (label: string) => (
    <div role="status" className="flex items-center justify-center gap-2 rounded-md bg-field py-16 text-text-muted">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <SectionCard
      title="Preview and signatures"
      actions={
        <>
          <StatusBadge tone="neutral"><span className="font-mono">v{document.version}</span></StatusBadge>
          <StatusBadge tone="neutral">{previewFields.length} field{previewFields.length === 1 ? '' : 's'}</StatusBadge>
          <StatusBadge tone="neutral">{signedCount} of {signatureRequests.length} signed</StatusBadge>
        </>
      }
      bodyClassName="space-y-4"
    >
      {!isPdf ? (
        <EmptyState
          className="py-8"
          title="No preview for this file type"
          description={`Signature fields are shown on PDF documents. This file is ${document.file_type || document.file_name}.`}
        />
      ) : (
        <SectionBody
          loading={loadingPdf}
          skeleton={spinner('Loading document preview')}
          error={!pdfUrl ? (previewError ?? 'Failed to load document preview') : undefined}
          onRetry={retryPreview}
        >
          {pdfUrl && (
            <div className="overflow-x-auto">
              <PDFFieldPositioner
                file={pdfUrl}
                mode="preview"
                previewFields={previewFields}
                pageWidth={640}
              />
            </div>
          )}
        </SectionBody>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {loadingSignatures ? (
          <div className="md:col-span-2">{spinner('Loading signature requests')}</div>
        ) : signatureRequests.length === 0 ? (
          <div className="rounded-md bg-field px-4 py-6 text-center md:col-span-2">
            <p className="text-sm font-semibold text-text-primary">No signature requests yet</p>
            <p className="mt-1 text-xs text-text-muted">
              Signers and their notes appear here and on the preview after you request a signature.
            </p>
          </div>
        ) : (
          signatureRequests.map((request) => (
            <div key={request.id} className="rounded-md border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{getSignerName(request)}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Page <span className="font-mono">{request.signature_page}</span> · Order <span className="font-mono">#{request.sign_order || 1}</span>
                  </p>
                </div>
                <DocumentStatusBadge status={request.status} className="shrink-0" />
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-xs text-text-muted">Note</p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {request.message?.trim() || 'No note was added for this signer.'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
