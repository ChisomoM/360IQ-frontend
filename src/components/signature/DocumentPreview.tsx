import { useEffect, useMemo, useState } from 'react';
import { fetchFileBuffer } from '@/lib/api/crud';
import type { Document } from '@/types/dms';
import type { SignatureRequest } from '@/types/signatures';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PDFFieldPositioner, { type PreviewField } from './PDFFieldPositioner';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface DocumentPreviewProps {
  document: Document;
  signatureRequests: SignatureRequest[];
  loadingSignatures?: boolean;
}

const getSignerName = (request: SignatureRequest) => {
  if (!request.signer) return 'Unknown signer';
  return `${request.signer.first_name} ${request.signer.last_name}`.trim();
};

const getStatusConfig = (status: SignatureRequest['status']) => {
  switch (status) {
    case 'signed':
      return {
        badge: 'bg-green-50 text-green-700 border-green-300',
        icon: <CheckCircle className="h-3 w-3" />,
      };
    case 'declined':
      return {
        badge: 'bg-red-50 text-red-700 border-red-300',
        icon: <XCircle className="h-3 w-3" />,
      };
    case 'expired':
      return {
        badge: 'bg-slate-100 text-slate-600 border-slate-300',
        icon: <AlertCircle className="h-3 w-3" />,
      };
    default:
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-300',
        icon: <PenLine className="h-3 w-3" />,
      };
  }
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
        const buffer = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: document.id });
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

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
              <FileText className="h-4 w-4" />
              Document Preview with Signatures
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Review the current PDF, signature fields, signer order, and signing notes in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="outline" className="text-xs">v{document.version}</Badge>
            <Badge variant="outline" className="text-xs">{previewFields.length} field{previewFields.length === 1 ? '' : 's'}</Badge>
            <Badge variant="outline" className="text-xs">{signedCount}/{signatureRequests.length} signed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPdf ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Preview unavailable for this file type</p>
            <p className="text-xs text-gray-400 mt-1">
              Signature overlays are only shown for PDF documents. Current file: {document.file_type || document.file_name}
            </p>
          </div>
        ) : loadingPdf ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading document preview...</span>
          </div>
        ) : pdfUrl ? (
          <div className="overflow-x-auto">
            <PDFFieldPositioner
              file={pdfUrl}
              mode="preview"
              previewFields={previewFields}
              pageWidth={640}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Document preview unavailable</p>
            <p className="text-xs text-red-500 mt-1">{previewError ?? 'Failed to load document preview'}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setPdfUrl(null);
                setPreviewError(null);
                setPreviewAttempt((attempt) => attempt + 1);
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh Preview
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loadingSignatures ? (
            <div className="md:col-span-2 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-6 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading signature requests...</span>
            </div>
          ) : signatureRequests.length === 0 ? (
            <div className="md:col-span-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-600">No signature requests yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Once requests are created, signer badges and notes will appear here and on the PDF preview.
              </p>
            </div>
          ) : (
            signatureRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              return (
                <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{getSignerName(request)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Page {request.signature_page} • Order #{request.sign_order || 1}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('border text-xs flex items-center gap-1 flex-shrink-0 capitalize', statusConfig.badge)}
                    >
                      {statusConfig.icon}
                      <span>{request.status}</span>
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Note</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {request.message?.trim() || 'No signer note was added for this request.'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
