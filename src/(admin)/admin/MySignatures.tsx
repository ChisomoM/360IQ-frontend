import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, PenLine, FileText, XCircle, Clock, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { getMySignatureRequests, declineSignature } from '@/lib/api/signatures';
import type { SignatureRequest } from '@/types/signatures';
import SignDocumentModal from '@/components/signature/SignDocumentModal';

dayjs.extend(relativeTime);

const statusBadge = (status: SignatureRequest['status']) => {
  const map = {
    pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-300',  label: 'Pending',  icon: <Clock className="h-3 w-3" /> },
    signed:   { cls: 'bg-green-50 text-green-700 border-green-300',  label: 'Signed',   icon: <CheckCircle className="h-3 w-3" /> },
    declined: { cls: 'bg-red-50 text-red-700 border-red-300',        label: 'Declined', icon: <XCircle className="h-3 w-3" /> },
    expired:  { cls: 'bg-gray-100 text-gray-500 border-gray-300',    label: 'Expired',  icon: <X className="h-3 w-3" /> },
  };
  return map[status] ?? map.pending;
};

export default function MySignatures() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [signTarget, setSignTarget] = useState<SignatureRequest | null>(null);
  const [declineTarget, setDeclineTarget] = useState<SignatureRequest | null>(null);
  const [isDeclinig, setIsDeclining] = useState(false);

  const load = () => {
    setLoading(true);
    getMySignatureRequests()
      .then(setRequests)
      .catch(() => toast.error('Failed to load signature requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDecline = async () => {
    if (!declineTarget) return;
    setIsDeclining(true);
    try {
      await declineSignature(declineTarget.id);
      toast.success('Request declined');
      setDeclineTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline');
    } finally {
      setIsDeclining(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const completed = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Signatures</h1>
        <p className="text-gray-500 text-sm mt-0.5">Documents waiting for your signature</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-[#1e5631]" />
        </div>
      ) : (
        <>
          {/* Pending */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Awaiting Your Signature
                {pending.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-0 ml-1">{pending.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-1">No pending signature requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((req) => (
                    <SignatureRequestCard
                      key={req.id}
                      request={req}
                      onSign={() => setSignTarget(req)}
                      onDecline={() => setDeclineTarget(req)}
                      onViewDocument={() => navigate(`/admin/documents/${req.document_id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          {completed.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completed.map((req) => (
                    <SignatureRequestCard
                      key={req.id}
                      request={req}
                      onViewDocument={() => navigate(`/admin/documents/${req.document_id}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sign modal */}
      {signTarget && (
        <SignDocumentModal
          request={signTarget}
          open={!!signTarget}
          onClose={() => setSignTarget(null)}
          onSigned={() => { setSignTarget(null); load(); }}
        />
      )}

      {/* Decline confirmation */}
      <AlertDialog open={!!declineTarget} onOpenChange={(v) => { if (!v) setDeclineTarget(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Signature Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline signing{' '}
              <strong>"{declineTarget?.document?.title}"</strong>?
              The requester will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeclinig}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              disabled={isDeclinig}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeclinig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Card sub-component ───────────────────────────────────────────────────────

interface CardProps {
  request: SignatureRequest;
  onSign?: () => void;
  onDecline?: () => void;
  onViewDocument: () => void;
}

function SignatureRequestCard({ request, onSign, onDecline, onViewDocument }: CardProps) {
  const badge = statusBadge(request.status);
  const isPending = request.status === 'pending';
  const isExpired = request.status === 'expired';

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isPending ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg border border-gray-100 flex-shrink-0">
          <FileText className="h-4 w-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={cn('border text-xs flex items-center gap-1', badge.cls)}>
              {badge.icon} {badge.label}
            </Badge>
            {request.expires_at && isPending && (
              <span className="text-xs text-gray-500">
                Expires {dayjs(request.expires_at).fromNow()}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              Order #{request.sign_order}
            </span>
          </div>
          <p className="font-medium text-gray-900 truncate">{request.document?.title ?? 'Document'}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
            {' · '}{dayjs(request.created_at).fromNow()}
          </p>
          {request.message && (
            <p className="text-xs text-gray-500 italic mt-1 border-l-2 border-gray-300 pl-2">
              {request.message}
            </p>
          )}
          {request.signed_at && (
            <p className="text-xs text-green-600 mt-1">
              Signed {dayjs(request.signed_at).format('MMM DD, YYYY HH:mm')}
            </p>
          )}
          {request.decline_note && (
            <p className="text-xs text-red-500 mt-1">Declined: {request.decline_note}</p>
          )}
        </div>
      </div>

      {(isPending || !isExpired) && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="text-gray-600"
            onClick={onViewDocument}
          >
            View Document
          </Button>
          {isPending && onSign && (
            <Button
              size="sm"
              className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
              onClick={onSign}
            >
              <PenLine className="h-3.5 w-3.5 mr-1.5" />
              Sign
            </Button>
          )}
          {isPending && onDecline && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
              onClick={onDecline}
            >
              Decline
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
