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
import { Loader2, PenLine, ArrowLeft, ArrowRight } from '@/components/icons';
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
    if (!signerId) { toast.error('Choose a signer first.'); return; }
    setStep(2);
    if (!pdfUrl) {
      setLoadingPdf(true);
      fetchFileBuffer('DOCUMENT_DOWNLOAD', { id: documentId })
        .then(({ buffer, contentType }) => {
          if (!contentType.startsWith('application/pdf')) {
            throw new Error('Only PDF documents can be signed');
          }
          setPdfBuffer(buffer);
          setPdfUrl(URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' })));
        })
        .catch((err) => {
          toast.error(err.message || 'Failed to load document preview');
        })
        .finally(() => setLoadingPdf(false));
    }
  };

  const handleSubmit = async () => {
    if (!field) { toast.error('Place the signature field on the document first.'); return; }
    if (!signerId) { toast.error('Choose a signer first.'); return; }
    
    // Verify tenant context is still set
    const { useTenantStore } = await import('@/lib/store/tenantStore');
    const tenantId = useTenantStore.getState().currentTenantId;
    if (!tenantId) {
      toast.error('Tenant context lost. Please log in again.');
      return;
    }
    
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
      <DialogContent className={`${step === 2 ? 'max-w-3xl' : 'max-w-[480px]'} flex max-h-[90vh] flex-col overflow-hidden`}>
        <DialogHeader>
          <DialogTitle>Send document for signature</DialogTitle>
          <p className="text-xs text-text-muted">Step <span className="font-mono">{step}</span> of <span className="font-mono">2</span></p>
          <DialogDescription>
            {step === 1
              ? <span>Choose who should sign <strong>{documentTitle}</strong>.</span>
              : <span>Place the signature field on <strong>{documentTitle}</strong>.</span>}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label>Signer (required)</Label>
              {loadingUsers ? (
                <div role="status" className="flex h-10 items-center gap-2 text-sm text-text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Loading people
                </div>
              ) : (
                <Select value={signerId} onValueChange={setSignerId}>
                  <SelectTrigger aria-label="Signer">
                    <SelectValue placeholder="Choose who signs" />
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
                placeholder="Please sign before Friday"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Signing order</Label>
                <Input
                  type="number"
                  min={1}
                  value={signOrder}
                  onChange={(e) => setSignOrder(e.target.value)}
                  placeholder="1"
                />
                <p className="text-xs text-text-muted">Used when several people sign in turn</p>
              </div>
              <div className="space-y-2">
                <Label>Expires in (days)</Label>
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
          <div className="py-2 space-y-3 flex-1 min-h-0 overflow-y-auto">
            {loadingPdf ? (
              <div role="status" className="flex h-48 items-center justify-center gap-2 text-text-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading document</span>
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
              <div role="alert" className="flex h-48 items-center justify-center text-sm text-risk">
                Could not load the document preview. Go back and try again.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!signerId}
              >
                Place signature field
                <ArrowRight />
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                <ArrowLeft />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !field}
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin" />Sending</>
                ) : (
                  <><PenLine />Send for signature</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
