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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, PenLine, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignaturePad from './SignaturePad';
import type { SignaturePadHandle } from './SignaturePad';
import { signDocument } from '@/lib/api/signatures';
import { fetchFileBuffer } from '@/lib/api/crud';
import { fetchData } from '@/lib/api/crud';
import type { SignatureRequest } from '@/types/signatures';

interface SignDocumentModalProps {
  request: SignatureRequest;
  open: boolean;
  onClose: () => void;
  onSigned: () => void;
}

type ColPos = 'left' | 'center' | 'right';
type RowPos = 'top' | 'middle' | 'bottom';

// Map human-readable position to normalized PDF coords (origin: bottom-left)
const X_MAP: Record<ColPos, number> = { left: 0.05, center: 0.375, right: 0.70 };
const Y_MAP: Record<RowPos, number> = { top: 0.82, middle: 0.48, bottom: 0.05 };

function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function SignDocumentModal({ request, open, onClose, onSigned }: SignDocumentModalProps) {
  const sigPadRef = useRef<SignaturePadHandle>(null);
  const [page, setPage] = useState(1);
  const [colPos, setColPos] = useState<ColPos>('right');
  const [rowPos, setRowPos] = useState<RowPos>('bottom');
  const [isSigning, setIsSigning] = useState(false);

  const doc = request.document;
  const isPdf = doc?.file_type?.toLowerCase().includes('pdf') || doc?.file_name?.toLowerCase().endsWith('.pdf');

  const handleSign = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      toast.error('Please draw your signature first');
      return;
    }

    setIsSigning(true);
    try {
      let signedVersionId: string | undefined;

      if (isPdf && doc?.id) {
        // 1. Fetch the PDF bytes via the authenticated backend endpoint
        const pdfArrayBuffer = await fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: doc.id });

        // 2. Load and modify with pdf-lib
        const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
        const pages = pdfDoc.getPages();
        const targetPage = pages[Math.min(page - 1, pages.length - 1)];
        const { width, height } = targetPage.getSize();

        // 3. Embed signature PNG
        const sigDataUrl = sigPadRef.current.getDataURL();
        const pngBytes = base64ToUint8Array(sigDataUrl);
        const pngImage = await pdfDoc.embedPng(pngBytes);
        const pngDims = pngImage.scale(1);

        // Scale signature to 25% of page width, maintain aspect ratio
        const sigWidth = width * 0.25;
        const sigHeight = (pngDims.height / pngDims.width) * sigWidth;

        const x = X_MAP[colPos] * width;
        const y = Y_MAP[rowPos] * height;

        targetPage.drawImage(pngImage, { x, y, width: sigWidth, height: sigHeight });

        // 4. Save modified PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const file = new File([blob], `signed-${doc.file_name ?? 'document.pdf'}`, { type: 'application/pdf' });

        // 5. Upload as a new version
        const form = new FormData();
        form.append('file', file);
        form.append('change_notes', `Signed by user on page ${page}`);
        const versionRes = await fetchData('DOCUMENT_VERSIONS', 'POST', { id: request.document_id }, form);
        signedVersionId = versionRes?.id;
      }

      // 6. Record the signature on the backend
      await signDocument(request.id, {
        signed_version_id: signedVersionId,
        signature_page: page,
        signature_x: X_MAP[colPos],
        signature_y: Y_MAP[rowPos],
      });

      toast.success('Document signed successfully');
      onSigned();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign document');
    } finally {
      setIsSigning(false);
    }
  };

  const positionGrid: { col: ColPos; row: RowPos; label: string }[] = [
    { col: 'left',   row: 'top',    label: '↖' },
    { col: 'center', row: 'top',    label: '↑' },
    { col: 'right',  row: 'top',    label: '↗' },
    { col: 'left',   row: 'middle', label: '←' },
    { col: 'center', row: 'middle', label: '·' },
    { col: 'right',  row: 'middle', label: '→' },
    { col: 'left',   row: 'bottom', label: '↙' },
    { col: 'center', row: 'bottom', label: '↓' },
    { col: 'right',  row: 'bottom', label: '↘' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isSigning) onClose(); }}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-[#1e3c21]" />
            Sign Document
          </DialogTitle>
          <DialogDescription>
            Draw your signature, choose placement, then apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Document info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{doc?.title ?? 'Document'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
              </p>
            </div>
            {!isPdf && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 flex-shrink-0 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Click-to-sign only
              </Badge>
            )}
          </div>

          {request.message && (
            <p className="text-sm text-gray-600 italic border-l-2 border-[#1e3c21] pl-3">
              "{request.message}"
            </p>
          )}

          {/* Signature pad */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Your Signature</Label>
            <SignaturePad ref={sigPadRef} width={600} height={160} />
          </div>

          {/* PDF-only position controls */}
          {isPdf && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Page Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Position on Page</Label>
                <div className="grid grid-cols-3 gap-1 w-fit">
                  {positionGrid.map(({ col, row, label }) => (
                    <button
                      key={`${col}-${row}`}
                      type="button"
                      onClick={() => { setColPos(col); setRowPos(row); }}
                      className={cn(
                        'w-9 h-9 rounded text-sm font-mono transition-colors',
                        colPos === col && rowPos === row
                          ? 'bg-[#1e3c21] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSigning}>Cancel</Button>
          <Button
            onClick={handleSign}
            disabled={isSigning}
            className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
          >
            {isSigning ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing…</>
            ) : (
              <><PenLine className="mr-2 h-4 w-4" />Apply Signature</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
