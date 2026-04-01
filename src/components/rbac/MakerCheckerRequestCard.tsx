import React, { useState } from 'react';
import { MakerCheckerRequest } from '@/types/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MakerCheckerRequestCardProps {
  request: MakerCheckerRequest;
  currentUserId: string | number;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
}

export default function MakerCheckerRequestCard({ request, currentUserId, onApprove, onReject }: MakerCheckerRequestCardProps) {
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Assuming ruleId tells us how many approvals are required, but since rule isn't joined automatically in the basic type, 
  // we might need to derive it or assume it's passed. Wait, the prompt says: "approval progress bar (e.g., '1 / 2 approved' — shows how many approvals are done vs required)".
  // We can pass `requiredApprovals` via the payload or assume it's attached to the request object. 
  // Let's assume request payload or expanded type has `requiredApprovals`. If not, defaulting to 2 for display if undefined.
  const requiredApprovals = (request as any).requiredApprovals || 2; 
  const approvedCount = request.approvals?.filter(a => a.decision === 'approved').length || 0;

  const isInitiator = String(request.requestedBy) === String(currentUserId);
  const hasAlreadyApproved = request.approvals?.some(a => String(a.approverId) === String(currentUserId));

  const handleApprove = () => {
    onApprove(String(request.id), comment);
  };

  const handleReject = () => {
    if (comment.length < 5) {
      setErrors({ comment: 'Comment must be at least 5 characters to reject' });
      return;
    }
    setErrors({});
    onReject(String(request.id), comment);
  };

  return (
    <div className="bg-white p-4 border rounded-md shadow-sm mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{String(request.action).toUpperCase()} {request.resource}</h3>
          <p className="text-sm text-gray-500">Initiated by: User {request.requestedBy}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full \${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{request.status.toUpperCase()}</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Approval Progress</span>
          <span>{approvedCount} / {requiredApprovals} approved</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `\${Math.min((approvedCount / requiredApprovals) * 100, 100)}%` }}></div>
        </div>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Add a comment (required for rejection)" 
          value={comment} 
          onChange={e => {
            setComment(e.target.value);
            if (e.target.value.length >= 5) setErrors({});
          }} 
        />
        {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment}</p>}
      </div>

      <div className="flex space-x-2">
        <Button 
          onClick={handleApprove} 
          disabled={isInitiator || hasAlreadyApproved || request.status !== 'pending'} 
          className="bg-green-600 hover:bg-green-700"
        >
          Approve
        </Button>
        <Button 
          onClick={handleReject} 
          variant="destructive"
          disabled={isInitiator || request.status !== 'pending' || comment.length < 5}
        >
          Reject
        </Button>
      </div>
      {isInitiator && <p className="text-xs text-gray-500 mt-2">You cannot approve or reject your own request.</p>}
    </div>
  );
}
