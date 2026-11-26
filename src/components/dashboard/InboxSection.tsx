import { AlertCircle, FileCheck, Share2, ChevronRight, Inbox } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
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

const SUBHEADING = 'mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary';
const COUNT = 'rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-secondary';

function ApprovalCard({ item, onReview, onApprove, onSignatureClick }: { item: ApprovalItem; onReview: (id: string) => void; onApprove?: (id: string) => void; onSignatureClick?: () => void }) {
  const getApprovalLabel = () => {
    if (item.type === 'signature') return 'Signature needed';
    if (item.type === 'deletion') return 'Deletion request';
    return 'Policy change';
  };

  const isOverdue = item.daysOverdue && item.daysOverdue > 0;
  const Icon = item.type === 'signature' ? FileCheck : AlertCircle;

  return (
    <li className="flex flex-wrap items-start gap-3 py-4">
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
        <Icon size={18} />
      </span>
      <div className="min-w-[12rem] flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge tone="caution" label={getApprovalLabel()} />
          {isOverdue && (
            <StatusBadge tone="risk" label={`${item.daysOverdue} days overdue`} />
          )}
        </div>
        <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{item.requesterName}</p>
        {item.reason && <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{item.reason}</p>}
        <p className="mt-1 text-xs text-text-muted">
          {dayjs(item.requestedAt).fromNow()}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => item.type === 'signature' && onSignatureClick ? onSignatureClick() : onReview(item.id)}
        >
          Review
        </Button>
        {item.type === 'deletion' && onApprove && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onApprove(item.id)}
          >
            Approve
          </Button>
        )}
      </div>
    </li>
  );
}

function SharedDocumentCard({ doc, onDocumentClick }: { doc: SharedDocument; onDocumentClick: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onDocumentClick(doc.id)}
        className="flex w-full items-start gap-3 py-4 text-left transition-colors hover:bg-surface-2"
      >
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
          <Share2 size={18} />
        </span>
        <span className="block min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text-primary">{doc.title}</span>
          <span className="mt-0.5 block text-xs text-text-secondary">Shared by {doc.sharedBy}</span>
          {doc.department && <span className="mt-0.5 block text-xs text-text-muted">{doc.department}</span>}
          <span className="mt-1 block text-xs text-text-muted">
            {dayjs(doc.sharedAt).fromNow()}
          </span>
        </span>
      </button>
    </li>
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

  return (
    <SectionCard title="Your inbox">
      <SectionBody
        loading={isLoading}
        skeleton={
          <div role="status" aria-busy="true" aria-label="Loading" className="grid gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-md" />)}
          </div>
        }
        isEmpty={!hasContent}
        empty={
          <EmptyState
            icon={<Inbox size={24} />}
            title="You're up to date"
            description="Approvals and documents shared with you appear here."
          />
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pending approvals */}
          {approvalCount > 0 && (
            <div className="min-w-0">
              <h3 className={SUBHEADING}>
                Waiting for your action
                <span className={COUNT}>{approvalCount}</span>
              </h3>
              <ul className="divide-y divide-line">
                {approvals.slice(0, 3).map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    item={approval}
                    onReview={onReview || (() => {})}
                    onApprove={onApprove}
                    onSignatureClick={onSignatureClick}
                  />
                ))}
              </ul>
              {approvalCount > 3 && (
                <Button
                  variant="ghost"
                  className="mt-3 w-full"
                  onClick={() => onViewAll?.('approvals')}
                >
                  View all approvals ({approvalCount})
                  <ChevronRight size={14} />
                </Button>
              )}
            </div>
          )}

          {/* Shared documents */}
          {sharedCount > 0 && (
            <div className="min-w-0">
              <h3 className={SUBHEADING}>
                Recently shared with you
                <span className={COUNT}>{sharedCount}</span>
              </h3>
              <ul className="divide-y divide-line">
                {sharedDocuments.slice(0, 3).map((doc) => (
                  <SharedDocumentCard
                    key={doc.id}
                    doc={doc}
                    onDocumentClick={onDocumentClick || (() => {})}
                  />
                ))}
              </ul>
              {sharedCount > 3 && (
                <Button
                  variant="ghost"
                  className="mt-3 w-full"
                  onClick={() => onViewAll?.('shared')}
                >
                  View all shared ({sharedCount})
                  <ChevronRight size={14} />
                </Button>
              )}
            </div>
          )}
        </div>
      </SectionBody>
    </SectionCard>
  );
}
