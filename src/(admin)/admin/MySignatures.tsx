import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Button, buttonVariants } from '@/components/ui/button';
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
import { Loader2, PenLine, FileText, CheckCircle } from '@/components/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { formatDateTime } from '@/lib/format';

import { getMySignatureRequests, declineSignature } from '@/lib/api/signatures';
import type { SignatureRequest } from '@/types/signatures';
import SignDocumentModal from '@/components/signature/SignDocumentModal';
import SavedSignatureManager from '@/components/signature/SavedSignatureManager';

dayjs.extend(relativeTime);

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
    <div className="flex w-full flex-col gap-5">
      {/* Header */}
      <PageHeader title="My signatures" description="Documents waiting for your signature." />

      {loading ? (
        <SectionCard title="Awaiting your signature" padded={false}>
          <TableSkeleton rows={4} columns={3} />
        </SectionCard>
      ) : (
        <>
          {/* Pending */}
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                Awaiting your signature
                {pending.length > 0 && (
                  <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs font-medium text-text-secondary">{pending.length}</span>
                )}
              </span>
            }
          >
            {pending.length === 0 ? (
              <EmptyState
                className="py-6"
                icon={<CheckCircle size={24} />}
                title="Nothing to sign"
                description="Requests for your signature appear here."
              />
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
          </SectionCard>

          {/* Completed */}
          {completed.length > 0 && (
            <SectionCard title="Completed">
              <div className="space-y-3">
                {completed.map((req) => (
                  <SignatureRequestCard
                    key={req.id}
                    request={req}
                    onViewDocument={() => navigate(`/admin/documents/${req.document_id}`)}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Saved signature manager */}
      <SavedSignatureManager />

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
        <AlertDialogContent className="max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this signature request?</AlertDialogTitle>
            <AlertDialogDescription>
              You will not sign <strong>"{declineTarget?.document?.title}"</strong>. The requester will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeclinig}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              disabled={isDeclinig}
              className={buttonVariants({ variant: 'destructive' })}
            >
              {isDeclinig && <Loader2 className="animate-spin" />}
              Decline request
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
  const isPending = request.status === 'pending';
  const isExpired = request.status === 'expired';

  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
          <FileText size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <DocumentStatusBadge status={request.status} />
            {request.expires_at && isPending && (
              <StatusBadge tone="caution">
                <span title={formatDateTime(request.expires_at)}>Expires {dayjs(request.expires_at).fromNow()}</span>
              </StatusBadge>
            )}
            <span className="ml-auto text-xs text-text-muted">
              Order <span className="font-mono">#{request.sign_order}</span>
            </span>
          </div>
          <p className="truncate text-sm font-semibold text-text-primary">{request.document?.title ?? 'Document'}</p>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
            {' · '}
            <span title={formatDateTime(request.created_at)}>{dayjs(request.created_at).fromNow()}</span>
          </p>
          {request.message && (
            <p className="mt-1 text-xs text-text-muted">
              "{request.message}"
            </p>
          )}
          {request.signed_at && (
            <p className="mt-1 text-xs text-positive">
              Signed <span className="font-mono">{formatDateTime(request.signed_at)}</span>
            </p>
          )}
          {request.decline_note && (
            <p className="mt-1 text-xs text-risk">Declined: {request.decline_note}</p>
          )}
        </div>
      </div>

      {(isPending || !isExpired) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {isPending && onSign && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSign}
            >
              <PenLine />
              Sign
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewDocument}
          >
            View document
          </Button>
          {isPending && onDecline && (
            <Button
              size="sm"
              variant="ghost"
              className="text-risk hover:text-risk"
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
