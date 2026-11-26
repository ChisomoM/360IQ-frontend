import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader2, FileText, PenLine, CheckCircle2, Download, ChevronDown } from '@/components/icons';
import SignaturePad from './SignaturePad';
import type { SignaturePadHandle } from './SignaturePad';
import PDFFieldPositioner from './PDFFieldPositioner';
import { signDocument, listMySignatures } from '@/lib/api/signatures';
import { fetchFileBuffer, fetchData } from '@/lib/api/crud';
import type { SignatureRequest, UserSignature } from '@/types/signatures';

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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

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
  const [savedSigs, setSavedSigs] = useState<UserSignature[]>([]);
  const [savedSigsOpen, setSavedSigsOpen] = useState(false);
  // Holds the data URL of a saved signature that was applied — bypasses canvas entirely
  const [appliedSigDataUrl, setAppliedSigDataUrl] = useState<string | null>(null);

  const doc = request.document;
  const isPdf = doc?.file_type?.toLowerCase().includes('pdf') || doc?.file_name?.toLowerCase().endsWith('.pdf');

  // Load saved signatures once when modal opens; auto-apply the default
  useEffect(() => {
    if (!open) return;
    setAppliedSigDataUrl(null);
    listMySignatures().then(data => {
      setSavedSigs(data);
      const def = data.find(s => s.is_default) ?? data[0];
      if (def) setAppliedSigDataUrl(def.signature_data);
    }).catch(() => { /* silently ignore */ });
  }, [open]);

  const loadPreview = async () => {
    if (!isPdf || !doc?.id) return;

    setLoadingPdf(true);
    setPreviewError(null);

    try {
      const { buffer, contentType } = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: doc.id });
      if (!contentType.startsWith('application/pdf')) {
        throw new Error('Only PDF documents can be signed');
      }
      setPdfBuffer(buffer);
      setPdfUrl(URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' })));
      return;
    } catch (downloadErr) {
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
        } catch (fallbackErr) {
          setPreviewError(getErrorMessage(fallbackErr, getErrorMessage(downloadErr, 'Failed to load document preview')));
        }
      } else {
        setPreviewError(getErrorMessage(downloadErr, 'Failed to load document preview'));
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
    const sigDataUrl = appliedSigDataUrl ?? (sigPadRef.current?.isEmpty() === false ? sigPadRef.current.getDataURL() : null);
    if (!sigDataUrl) {
      toast.error('Draw or choose your signature first.');
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
        } catch (uploadErr) {
          console.warn('Signed version upload failed:', uploadErr);
          toast.error(`Failed to attach signed file to document versions: ${getErrorMessage(uploadErr, 'Upload failed')}`);
        }
      }

      await signDocument(request.id, { signed_version_id: signedVersionId });

      if (signedBuf) {
        setSignedPdfBuffer(signedBuf);
        setSignedPdfUrl(URL.createObjectURL(new Blob([signedBuf], { type: 'application/pdf' })));
      }
      setActiveView('signed');
      toast.success('Document signed');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to sign document'));
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activeView === 'signed' ? 'Document signed' : 'Sign document'}
          </DialogTitle>
          <DialogDescription>
            {activeView === 'signed'
              ? 'Your signature is recorded.'
              : 'Check where the signature goes, draw or choose your signature, then apply it.'}
          </DialogDescription>
        </DialogHeader>

        {activeView === 'signed' ? (
          <div className="space-y-4 py-2">
            {/* Success banner */}
            <div role="status" className="flex items-center gap-3 rounded-md bg-positive-tint p-3 text-positive">
              <CheckCircle2 size={20} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold">Signed</p>
                <p className="mt-0.5 text-xs">
                  Signature on page <span className="font-mono">{sigField.page}</span> of &ldquo;{doc?.title ?? 'Document'}&rdquo;
                </p>
              </div>
            </div>

            {/* Signed PDF preview */}
            {signedPdfUrl ? (
              <div>
                <p className="mb-2 text-sm font-medium text-text-secondary">Signed document preview</p>
                <div className="overflow-x-auto">
                  <PDFFieldPositioner file={signedPdfUrl} mode="preview" />
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-text-muted">No preview is available for this file.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-2 lg:flex-row">
            {/* Left column — PDF preview */}
            {isPdf && (
              <div className="min-w-0 flex-1 overflow-x-auto">
                <p className="mb-2 text-sm font-medium text-text-secondary">
                  Signature field location (highlighted)
                </p>
                {loadingPdf ? (
                  <div role="status" className="flex h-64 items-center justify-center gap-2 rounded-md bg-field text-text-muted">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Loading document</span>
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
                  <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-md bg-field px-4 text-center text-sm text-text-muted">
                    <span>Document preview unavailable</span>
                    {previewError && <span className="text-xs text-risk">{previewError}</span>}
                    <Button type="button" variant="secondary" size="sm" onClick={() => void loadPreview()}>
                      Try again
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Right column — doc info + signature pad */}
            <div className="flex w-full max-w-[340px] shrink-0 flex-col gap-4">
              {/* Document info */}
              <div className="flex items-start gap-3 rounded-md bg-field p-3">
                <FileText size={20} className="mt-0.5 shrink-0 text-text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{doc?.title ?? 'Document'}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
                  </p>
                  {!isPdf && (
                    <StatusBadge tone="caution" className="mt-1">Not a PDF</StatusBadge>
                  )}
                </div>
              </div>

              {request.message && (
                <p className="text-sm text-text-secondary">
                  &ldquo;{request.message}&rdquo;
                </p>
              )}

              {/* Signature pad */}
              <div className="flex-1">
                {/* Saved signatures picker */}
                {savedSigs.length > 0 && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setSavedSigsOpen(v => !v)}
                      aria-expanded={savedSigsOpen}
                      className="mb-2 flex items-center gap-1.5 rounded-xs text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <motion.span animate={{ rotate: savedSigsOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                        <ChevronDown size={16} />
                      </motion.span>
                      Saved signatures
                    </button>
                    <AnimatePresence>
                      {savedSigsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 flex-wrap pb-2">
                            {savedSigs.map(sig => (
                              <motion.button
                                key={sig.id}
                                type="button"
                                onClick={() => {
                                  setAppliedSigDataUrl(sig.signature_data);
                                  setSavedSigsOpen(false);
                                  sigPadRef.current?.clear();
                                }}
                                className="flex flex-col items-center gap-1 rounded-md border border-line bg-surface-1 p-1.5 transition-colors hover:border-line-strong"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                title={`Apply "${sig.label}"`}
                              >
                                {/* White ground in both themes so black ink stays visible */}
                                <span data-theme="paper" className="rounded-xs bg-surface-1 px-1">
                                  <img src={sig.signature_data} alt={sig.label} className="h-10 max-w-[90px] object-contain" />
                                </span>
                                <span className="max-w-[90px] truncate text-xs text-text-secondary">{sig.label}</span>
                                {sig.is_default && (
                                  <span className="text-xs font-medium text-signal-text">Default</span>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Show saved sig as image OR the drawable canvas */}
                {appliedSigDataUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Your signature</p>
                    <div data-theme="paper" className="flex items-center justify-center rounded-md border-2 border-dashed border-line-strong bg-surface-1" style={{ height: 160 }}>
                      <img src={appliedSigDataUrl} alt="Saved signature" className="max-h-32 max-w-full object-contain p-3" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted">Saved signature applied</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAppliedSigDataUrl(null)}
                      >
                        Draw instead
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-medium text-text-secondary">Draw your signature</p>
                    <SignaturePad ref={sigPadRef} width={340} height={160} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {activeView === 'signed' ? (
            <>
              {signedPdfBuffer && (
                <Button variant="secondary" onClick={downloadSignedPdf}>
                  <Download />
                  Download
                </Button>
              )}
              <Button onClick={onSigned}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose} disabled={isSigning}>Cancel</Button>
              <Button
                onClick={handleSign}
                disabled={isSigning}
              >
                {isSigning ? (
                  <><Loader2 className="animate-spin" />Signing</>
                ) : (
                  <><PenLine />Apply signature</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
