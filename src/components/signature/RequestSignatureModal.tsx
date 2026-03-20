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
import { Loader2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { requestSignature } from '@/lib/api/signatures';
import type { SignatureRequest } from '@/types/signatures';

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
    setSignerId('');
    setMessage('');
    setExpiryDays('');
    setSignOrder('1');
    onClose();
  };

  const handleSubmit = async () => {
    if (!signerId) { toast.error('Please select a signer'); return; }
    setIsSubmitting(true);
    try {
      const req = await requestSignature({
        document_id: documentId,
        signer_id: signerId,
        message: message.trim() || undefined,
        expiry_days: expiryDays ? parseInt(expiryDays) : undefined,
        sign_order: parseInt(signOrder) || 1,
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
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-[#1e3c21]" />
            Request Signature
          </DialogTitle>
          <DialogDescription>
            Ask someone to sign <strong>{documentTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Signer <span className="text-red-500">*</span></Label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 h-10">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users…
              </div>
            ) : (
              <Select value={signerId} onValueChange={setSignerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to sign" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} — {u.email}
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
              placeholder="Add a note for the signer…"
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !signerId}
            className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
            ) : (
              <><PenLine className="mr-2 h-4 w-4" />Send Request</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
