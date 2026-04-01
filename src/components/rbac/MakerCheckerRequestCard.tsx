import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
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
      setErrors({ comment: 'Comment must be at least 5 characters' });
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
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{request.description}</p>
          <p className="text-sm text-gray-500">
            {request.actionCode} · {request.resourceType}
          </p>
          <p className="text-sm text-gray-500">Initiated by: {request.initiatorName}</p>
        </div>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          {progressText}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all"
          style={{ width: `${(request.currentApprovals / request.requiredApprovals) * 100}%` }}
        />
      </div>

      <div>
        <input
          type="text"
          title="Comment"
          placeholder="Add a comment (required for rejection)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting || isInitiator}
          className="w-full h-9 border border-gray-300 rounded-md px-3 text-sm"
        />
        {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment}</p>}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={isSubmitting || isInitiator}
          className="flex-1 bg-green-700 hover:bg-green-800 text-white"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>
          )}
        </Button>
        <Button
          onClick={handleReject}
          disabled={isSubmitting || isInitiator}
          variant="outline"
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><XCircle className="h-4 w-4 mr-1" /> Reject</>
          )}
        </Button>
      </div>

      {isInitiator && (
        <p className="text-xs text-gray-400 text-center">
          You cannot approve or reject your own request
        </p>
      )}
    </div>
  );
}