import { AlertCircle, FileCheck, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ApprovalItem {
  id: string;
  type: 'deletion' | 'policy_change' | 'signature';
  title: string;
  department?: string;
  requesterName: string;
  requestedAt: Date;
  daysOverdue?: number;
  reason?: string;
}

interface SharedDocument {
  id: string;
  title: string;
  sharedBy: string;
  sharedAt: Date;
  department?: string;
}

interface InboxSectionProps {
  approvals?: ApprovalItem[];
  sharedDocuments?: SharedDocument[];
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onReview?: (id: string) => void;
  onDocumentClick?: (id: string) => void;
  onViewAll?: (type: 'approvals' | 'shared') => void;
  onSignatureClick?: () => void;
}

function ApprovalCard({ item, onReview, onApprove, onSignatureClick }: { item: ApprovalItem; onReview: (id: string) => void; onApprove?: (id: string) => void; onSignatureClick?: () => void }) {
  const getApprovalIcon = () => {
    if (item.type === 'signature') return <FileCheck className="h-5 w-5 text-amber-600" />;
    return <AlertCircle className="h-5 w-5 text-amber-600" />;
  };

  const getApprovalLabel = () => {
    if (item.type === 'signature') return 'Signature Needed';
    if (item.type === 'deletion') return 'Deletion Request';
    return 'Policy Change';
  };

  const isOverdue = item.daysOverdue && item.daysOverdue > 0;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        {getApprovalIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              {getApprovalLabel()}
            </Badge>
            {isOverdue && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                {item.daysOverdue} days overdue
              </Badge>
            )}
          </div>
          <p className="font-medium text-gray-900 truncate">{item.title}</p>
          <p className="text-sm text-gray-600 mt-1">{item.requesterName}</p>
          {item.reason && <p className="text-xs text-gray-600 mt-1">{item.reason}</p>}
          <p className="text-xs text-gray-500 mt-2">
            {dayjs(item.requestedAt).fromNow()}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => item.type === 'signature' && onSignatureClick ? onSignatureClick() : onReview(item.id)}
        >
          Review
        </Button>
        {item.type === 'deletion' && onApprove && (
          <Button
            size="sm"
            className="bg-green-700 hover:bg-green-800 text-white"
            onClick={() => onApprove(item.id)}
          >
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

function SharedDocumentCard({ doc, onDocumentClick }: { doc: SharedDocument; onDocumentClick: (id: string) => void }) {
  return (
    <button
      onClick={() => onDocumentClick(doc.id)}
      className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        <Share2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{doc.title}</p>
          <p className="text-sm text-gray-600 mt-1">Shared by {doc.sharedBy}</p>
          {doc.department && <p className="text-xs text-gray-500 mt-1">{doc.department}</p>}
          <p className="text-xs text-gray-500 mt-2">
            {dayjs(doc.sharedAt).fromNow()}
          </p>
        </div>
      </div>
    </button>
  );
}

export function InboxSection({
  approvals = [],
  sharedDocuments = [],
  isLoading = false,
  onApprove,
  onReview,
  onDocumentClick,
  onViewAll,
  onSignatureClick,
}: InboxSectionProps) {
  const approvalCount = approvals.length;
  const sharedCount = sharedDocuments.length;
  const hasContent = approvalCount > 0 || sharedCount > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No pending approvals or shared items</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Inbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Approvals */}
        {approvalCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Waiting for your action ({approvalCount})
            </h3>
            <div className="space-y-3">
              {approvals.slice(0, 3).map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  item={approval}
                  onReview={onReview || (() => {})}
                  onApprove={onApprove}
                  onSignatureClick={onSignatureClick}
                />
              ))}
            </div>
            {approvalCount > 3 && (
              <Button
                variant="ghost"
                className="w-full mt-3 text-green-700 hover:text-green-800"
                onClick={() => onViewAll?.('approvals')}
              >
                View all approvals →
              </Button>
            )}
          </div>
        )}

        {/* Shared Documents */}
        {sharedCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Recently shared with you ({sharedCount})
            </h3>
            <div className="space-y-3">
              {sharedDocuments.slice(0, 3).map((doc) => (
                <SharedDocumentCard
                  key={doc.id}
                  doc={doc}
                  onDocumentClick={onDocumentClick || (() => {})}
                />
              ))}
            </div>
            {sharedCount > 3 && (
              <Button
                variant="ghost"
                className="w-full mt-3 text-green-700 hover:text-green-800"
                onClick={() => onViewAll?.('shared')}
              >
                View all shared →
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
