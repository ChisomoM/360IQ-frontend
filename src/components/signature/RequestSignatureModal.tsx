import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PenLine, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData, fetchFileBuffer } from '@/lib/api/crud';
import { requestSignature } from '@/lib/api/signatures';
import type { SignatureRequest } from '@/types/signatures';
import PDFFieldPositioner, { type SignatureField } from './PDFFieldPositioner';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface RequestSignatureModalProps {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onClose: () => void;
  onRequested: (req: SignatureRequest) => void;
}

export default function RequestSignatureModal({
  documentId,
  documentTitle,
  open,
  onClose,
  onRequested,
}: RequestSignatureModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [signerId, setSignerId] = useState('');
  const [message, setMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [signOrder, setSignOrder] = useState('1');

  const [step, setStep] = useState<1 | 2>(1);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [field, setField] = useState<SignatureField | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    fetchData('USERS', 'GET')
      .then((res) => setUsers(Array.isArray(res) ? res : (res?.items ?? res?.data ?? [])))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const handleClose = () => {
    if (isSubmitting) return;
    setStep(1);
    setSignerId('');
    setMessage('');
    setExpiryDays('');
    setSignOrder('1');
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfBuffer(null);
    setField(undefined);
    onClose();
  };

  const handleNextStep = () => {
    if (!signerId) { toast.error('Please select a signer'); return; }
    setStep(2);
    if (!pdfUrl) {
      setLoadingPdf(true);
      fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: documentId })
        .then((buf) => {
          setPdfBuffer(buf);
          setPdfUrl(URL.createObjectURL(new Blob([buf], { type: 'application/pdf' })));
        })
        .catch(() => toast.error('Failed to load document preview'))
        .finally(() => setLoadingPdf(false));
    }
  };

  const handleSubmit = async () => {
    if (!field) { toast.error('Please place the signature field on the document'); return; }
    setIsSubmitting(true);
    try {
      const req = await requestSignature({
        document_id: documentId,
        signer_id: signerId,
        message: message.trim() || undefined,
        expiry_days: expiryDays ? parseInt(expiryDays) : undefined,
        sign_order: parseInt(signOrder) || 1,
        signature_page: field.page,
        signature_x: field.x,
        signature_y: field.y,
        signature_w: field.w,
        signature_h: field.h,
      });
      toast.success('Signature request sent');
      onRequested(req);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send signature request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className={`bg-white ${step === 2 ? 'max-w-3xl' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-[#1e3c21]" />
            Request Signature
            <span className="ml-auto text-xs font-normal text-gray-400">Step {step} of 2</span>
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? <span>Choose who should sign <strong>{documentTitle}</strong>.</span>
              : <span>Place the signature field on <strong>{documentTitle}</strong>.</span>}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Signer <span className="text-red-500">*</span></Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 h-10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : (
                <Select value={signerId} onValueChange={setSignerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to sign" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} - {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Add a note for the signer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sign Order</Label>
                <Input
                  type="number"
                  min={1}
                  value={signOrder}
                  onChange={(e) => setSignOrder(e.target.value)}
                  placeholder="1"
                />
                <p className="text-xs text-gray-400">For sequential multi-signer flows</p>
              </div>
              <div className="space-y-2">
                <Label>Expires In (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  placeholder="No expiry"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="py-2 space-y-3">
            {loadingPdf ? (
              <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading document...</span>
              </div>
            ) : pdfUrl ? (
              <PDFFieldPositioner
                file={pdfUrl}
                mode="place"
                field={field}
                onFieldChange={setField}
                fieldLabel={users.find((u) => u.id === signerId)
                  ? `${users.find((u) => u.id === signerId)!.first_name}'s signature`
                  : 'Signature field'}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-red-500 text-sm">
                Could not load document preview.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!signerId}
                className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
              >
                Next: Place Field
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !field}
                className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><PenLine className="mr-2 h-4 w-4" />Send Request</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
