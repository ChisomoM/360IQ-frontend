import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from '@/components/icons';
import { toast } from 'sonner';

export interface MakerCheckerRequest {
  id: string;
  actionCode: string;
  resourceType: string;
  description: string;
  initiatorId: string;
  initiatorName: string;
  requiredApprovals: number;
  currentApprovals: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface MakerCheckerRequestCardProps {
  request: MakerCheckerRequest;
  currentUserId: string;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
}

export function MakerCheckerRequestCard({
  request,
  currentUserId,
  onApprove,
  onReject,
}: MakerCheckerRequestCardProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInitiator = currentUserId === request.initiatorId;
  const progressText = `${request.currentApprovals} / ${request.requiredApprovals} approved`;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      onApprove(request.id, comment);
      toast.success('Request approved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (comment.length < 5) {
      setErrors({ comment: 'Enter a comment of at least 5 characters.' });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      onReject(request.id, comment);
      toast.success('Request rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 border border-line rounded-lg shadow-card p-4 bg-surface-1 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-text-primary">{request.description}</p>
          <p className="font-mono text-xs text-text-muted">
            {request.actionCode} · {request.resourceType}
          </p>
          <p className="text-sm text-text-secondary">Requested by {request.initiatorName}</p>
        </div>
        <StatusBadge tone="caution" label={progressText} />
      </div>

      <div
        role="meter"
        aria-label="Approvals"
        aria-valuemin={0}
        aria-valuemax={request.requiredApprovals}
        aria-valuenow={request.currentApprovals}
        className="w-full bg-surface-2 rounded-pill h-1.5 overflow-hidden"
      >
        <div
          className="bg-signal h-full rounded-pill transition-all"
          style={{ width: `${(request.currentApprovals / request.requiredApprovals) * 100}%` }}
        />
      </div>

      <div>
        <Input
          type="text"
          aria-label="Comment"
          placeholder="Comment, required to reject"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting || isInitiator}
          aria-invalid={!!errors.comment}
        />
        {errors.comment && (
          <p className="flex items-center gap-1 text-xs text-risk mt-1">
            <AlertCircle size={14} />
            {errors.comment}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handleApprove}
          disabled={isSubmitting || isInitiator}
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <><CheckCircle /> Approve</>
          )}
        </Button>
        <Button
          onClick={handleReject}
          disabled={isSubmitting || isInitiator}
          variant="destructive"
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <><XCircle /> Reject</>
          )}
        </Button>
      </div>

      {isInitiator && (
        <p className="text-xs text-text-muted text-center">
          You cannot approve or reject your own request.
        </p>
      )}
    </div>
  );
}