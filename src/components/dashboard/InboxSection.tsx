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
    <div className="p-4 bg-surface-1 border border-line rounded-lg transition-colors duration-150 hover:bg-surface-2">
      <div className="flex items-start gap-3 mb-3">
        {getApprovalIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="bg-caution-tint text-caution border-transparent font-medium">
              {getApprovalLabel()}
            </Badge>
            {isOverdue && (
              <Badge variant="outline" className="bg-risk-tint text-risk border-transparent text-xs font-semibold">
                {item.daysOverdue} days overdue
              </Badge>
            )}
          </div>
          <p className="font-semibold text-slate-900 truncate">{item.title}</p>
          <p className="text-sm text-slate-600 mt-1">{item.requesterName}</p>
          {item.reason && <p className="text-xs text-slate-600 mt-2 line-clamp-1">{item.reason}</p>}
          <p className="text-xs text-slate-500 mt-2">
            {dayjs(item.requestedAt).fromNow()}
          </p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-slate-200/50 text-slate-700 hover:bg-slate-100/50"
          onClick={() => item.type === 'signature' && onSignatureClick ? onSignatureClick() : onReview(item.id)}
        >
          Review
        </Button>
        {item.type === 'deletion' && onApprove && (
          <Button
            size="sm"
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
      className="w-full p-4 bg-surface-1 border border-line rounded-lg transition-colors duration-150 hover:bg-surface-2 text-left"
    >
      <div className="flex items-start gap-3">
        <Share2 className="h-5 w-5 text-sky-text flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
          <p className="text-sm text-slate-600 mt-1">Shared by {doc.sharedBy}</p>
          {doc.department && <p className="text-xs text-slate-500 mt-1">{doc.department}</p>}
          <p className="text-xs text-slate-500 mt-2">
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
      <Card className="border-slate-200/50 shadow-premium-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-200/30 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card className="border-slate-200/50 shadow-premium-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">All caught up!</p>
            <p className="text-sm text-slate-400 mt-2">No pending approvals or shared items</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 shadow-premium-sm">
      <CardHeader className="border-b border-slate-200/50 pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Your Inbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Pending Approvals */}
        {approvalCount > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Waiting for your action
              </h3>
              <Badge className="bg-primary/10 text-primary border-0">
                {approvalCount}
              </Badge>
            </div>
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
                className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/5 font-medium"
                onClick={() => onViewAll?.('approvals')}
              >
                View all approvals ({approvalCount}) →
              </Button>
            )}
          </div>
        )}

        {/* Divider */}
        {approvalCount > 0 && sharedCount > 0 && (
          <div className="border-t border-slate-200/50" />
        )}

        {/* Shared Documents */}
        {sharedCount > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Recently shared with you
              </h3>
              <Badge className="bg-blue-100/60 text-blue-700 border-0">
                {sharedCount}
              </Badge>
            </div>
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
                className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 font-medium"
                onClick={() => onViewAll?.('shared')}
              >
                View all shared ({sharedCount}) →
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
