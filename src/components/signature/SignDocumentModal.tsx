import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, PenLine, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import SignaturePad from './SignaturePad';
import type { SignaturePadHandle } from './SignaturePad';
import PDFFieldPositioner from './PDFFieldPositioner';
import { signDocument } from '@/lib/api/signatures';
import { fetchFileBuffer, fetchData } from '@/lib/api/crud';
import type { SignatureRequest } from '@/types/signatures';

interface SignDocumentModalProps {
  request: SignatureRequest;
  open: boolean;
  onClose: () => void;
  onSigned: () => void;
}

function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function SignDocumentModal({ request, open, onClose, onSigned }: SignDocumentModalProps) {
  const sigPadRef = useRef<SignaturePadHandle>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [activeView, setActiveView] = useState<'sign' | 'signed'>('sign');
  const [signedPdfBuffer, setSignedPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);

  const doc = request.document;
  const isPdf = doc?.file_type?.toLowerCase().includes('pdf') || doc?.file_name?.toLowerCase().endsWith('.pdf');

  const loadPreview = async () => {
    if (!isPdf || !doc?.id) return;

    setLoadingPdf(true);
    setPreviewError(null);

    try {
      const buf = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: doc.id });
      setPdfBuffer(buf);
      setPdfUrl(URL.createObjectURL(new Blob([buf], { type: 'application/pdf' })));
      return;
    } catch (downloadErr: any) {
      if (doc.file_url) {
        try {
          const res = await fetch(doc.file_url);
          if (!res.ok) {
            throw new Error(`Preview fallback failed (${res.status})`);
          }
          const buf = await res.arrayBuffer();
          setPdfBuffer(buf);
          setPdfUrl(URL.createObjectURL(new Blob([buf], { type: 'application/pdf' })));
          return;
        } catch (fallbackErr: any) {
          setPreviewError(fallbackErr?.message || downloadErr?.message || 'Failed to load document preview');
        }
      } else {
        setPreviewError(downloadErr?.message || 'Failed to load document preview');
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setActiveView('sign');
      setSignedPdfBuffer(null);
      if (signedPdfUrl) {
         URL.revokeObjectURL(signedPdfUrl);
         setSignedPdfUrl(null);
      }
      setPreviewError(null);
      if (!pdfUrl && isPdf && doc?.id) {
        void loadPreview();
      }
    }
    if (!v) {
      if (activeView === 'signed') onSigned();
      else if (!isSigning) onClose();
      
      // Optional cleanup on full dismiss
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setPdfBuffer(null);
      }
      if (signedPdfUrl) {
        URL.revokeObjectURL(signedPdfUrl);
        setSignedPdfUrl(null);
        setSignedPdfBuffer(null);
      }
    }
  };

  const downloadSignedPdf = () => {
    if (!signedPdfBuffer) return;
    const blob = new Blob([signedPdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed-${doc?.file_name ?? 'document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Signature field position stored on the request by the requester
  const sigField = {
    page: request.signature_page ?? 1,
    x: request.signature_x ?? 0,
    y: request.signature_y ?? 0,
    w: request.signature_w ?? 0.25,
    h: request.signature_h ?? 0.06,
  };

  const handleSign = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      toast.error('Please draw your signature first');
      return;
    }

    setIsSigning(true);
    try {
      let signedVersionId: string | undefined;
      let signedBuf: ArrayBuffer | null = null;

      if (isPdf && doc?.id && pdfBuffer) {
        // Pass a copy to pdf-lib — PDFDocument.load() transfers/detaches the
        // ArrayBuffer it receives, which would corrupt pdfBuffer for the preview.
        const pdfDoc = await PDFDocument.load(pdfBuffer.slice(0));
        const pages = pdfDoc.getPages();
        const targetPage = pages[Math.min(sigField.page - 1, pages.length - 1)];
        const { width, height } = targetPage.getSize();

        const sigDataUrl = sigPadRef.current.getDataURL();
        const pngBytes = base64ToUint8Array(sigDataUrl);
        const pngImage = await pdfDoc.embedPng(pngBytes);

        const sigW = sigField.w * width;
        const sigH = sigField.h * height;
        const x = sigField.x * width;
        const y = (1 - sigField.y - sigField.h) * height;

        targetPage.drawImage(pngImage, { x, y, width: sigW, height: sigH });

        const modifiedPdfBytes = await pdfDoc.save();
        // Copy into a fresh owned ArrayBuffer — pdf-lib's internal allocator can
        // return a Uint8Array backed by a shared/detached buffer, which causes
        // "cannot perform construct on a detached ArrayBuffer" errors.
        const ownedBytes = new Uint8Array(modifiedPdfBytes.byteLength);
        ownedBytes.set(modifiedPdfBytes);
        signedBuf = ownedBytes.buffer;

        // Best-effort: upload signed version. Don't fail signing if this errors.
        try {
          const blob = new Blob([ownedBytes], { type: 'application/pdf' });
          const file = new File([blob], `signed-${doc.file_name ?? 'document.pdf'}`, { type: 'application/pdf' });
          const form = new FormData();
          form.append('file', file);
          form.append('change_notes', `Signed by signer on page ${sigField.page}`);
          const versionRes = await fetchData('DOCUMENT_VERSIONS', 'POST', { id: request.document_id }, form);
          signedVersionId = versionRes?.id;
          // Optionally notify the user the document version was updated!
          toast.success('Document updated with signed version');
        } catch (uploadErr: any) {
          console.warn('Signed version upload failed:', uploadErr);
          toast.error(`Failed to attach signed file to document versions: ${uploadErr.message}`);
        }
      }

      await signDocument(request.id, { signed_version_id: signedVersionId });

      if (signedBuf) {
        setSignedPdfBuffer(signedBuf);
        setSignedPdfUrl(URL.createObjectURL(new Blob([signedBuf], { type: 'application/pdf' })));
      }
      setActiveView('signed');
      toast.success('Document signed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign document');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeView === 'signed' ? (
              <><CheckCircle2 className="h-5 w-5 text-green-600" />Signing Complete</>
            ) : (
              <><PenLine className="h-5 w-5 text-[#1e3c21]" />Sign Document</>
            )}
          </DialogTitle>
          <DialogDescription>
            {activeView === 'signed'
              ? 'Your signature has been embedded and the signed document is ready.'
              : 'Review the signature field location, draw your signature, then apply.'}
          </DialogDescription>
        </DialogHeader>

        {activeView === 'signed' ? (
          <div className="space-y-4 py-2">
            {/* Success banner */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Signed successfully</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Your signature was embedded on page {sigField.page} of &ldquo;{doc?.title ?? 'Document'}&rdquo;
                </p>
              </div>
            </div>

            {/* Signed PDF preview */}
            {signedPdfUrl ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Signed document preview</p>
                <PDFFieldPositioner file={signedPdfUrl} mode="preview" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">Signature recorded successfully.</p>
            )}
          </div>
        ) : (
          <div className="flex gap-5 py-2">
            {/* Left column — PDF preview */}
            {isPdf && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Signature field location <span className="text-[#1e3c21]">(highlighted)</span>
                </p>
                {loadingPdf ? (
                  <div className="flex items-center justify-center h-64 gap-2 text-gray-400 border rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading document...</span>
                  </div>
                ) : pdfUrl ? (
                  <PDFFieldPositioner
                    file={pdfUrl}
                    mode="preview"
                    field={sigField}
                    fieldLabel="Your signature goes here"
                    pageWidth={420}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 border rounded-lg text-sm gap-2 px-4 text-center">
                    <span>Document preview unavailable</span>
                    {previewError && <span className="text-xs text-red-500">{previewError}</span>}
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadPreview()}>
                      Retry Preview
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Right column — doc info + signature pad */}
            <div className="flex flex-col gap-4" style={{ width: 340, flexShrink: 0 }}>
              {/* Document info */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{doc?.title ?? 'Document'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
                  </p>
                  {!isPdf && (
                    <Badge variant="outline" className="mt-1 text-amber-700 border-amber-300 bg-amber-50 flex items-center gap-1 w-fit">
                      <AlertCircle className="h-3 w-3" />
                      Non-PDF document
                    </Badge>
                  )}
                </div>
              </div>

              {request.message && (
                <p className="text-sm text-gray-600 italic border-l-2 border-[#1e3c21] pl-3">
                  &ldquo;{request.message}&rdquo;
                </p>
              )}

              {/* Signature pad */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Draw your signature</p>
                <SignaturePad ref={sigPadRef} width={340} height={160} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {activeView === 'signed' ? (
            <>
              {signedPdfBuffer && (
                <Button variant="outline" onClick={downloadSignedPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
              <Button onClick={onSigned} className="bg-[#1e3c21] hover:bg-[#2a5230] text-white">
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSigning}>Cancel</Button>
              <Button
                onClick={handleSign}
                disabled={isSigning}
                className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
              >
                {isSigning ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing...</>
                ) : (
                  <><PenLine className="mr-2 h-4 w-4" />Apply Signature</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
