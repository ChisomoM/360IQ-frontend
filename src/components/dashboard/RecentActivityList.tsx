import { FileText, Download, Edit, Upload as UploadIcon, ChevronRight } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type DocumentAction = 'viewed' | 'downloaded' | 'edited' | 'uploaded';

interface RecentDocument {
  id: string;
  title: string;
  department?: string;
  category?: string;
  lastAction: DocumentAction;
  actionAt: Date;
  fileType?: string;
}

interface RecentActivityListProps {
  documents?: RecentDocument[];
  isLoading?: boolean;
  onDocumentClick?: (id: string) => void;
  onViewAll?: () => void;
}

function getActionIcon(action: DocumentAction) {
  switch (action) {
    case 'downloaded':
      return <Download size={18} />;
    case 'edited':
      return <Edit size={18} />;
    case 'uploaded':
      return <UploadIcon size={18} />;
    case 'viewed':
    default:
      return <FileText size={18} />;
  }
}

function getActionLabel(action: DocumentAction) {
  switch (action) {
    case 'downloaded':
      return 'Downloaded';
    case 'edited':
      return 'Edited';
    case 'uploaded':
      return 'Uploaded';
    case 'viewed':
    default:
      return 'Viewed';
  }
}

export function RecentActivityList({
  documents = [],
  isLoading = false,
  onDocumentClick,
  onViewAll,
}: RecentActivityListProps) {
  return (
    <SectionCard
      title="Recent documents"
      padded={false}
      actions={
        !isLoading && (
          <Button variant="ghost" size="sm" onClick={() => onViewAll?.()}>
            View all
            <ChevronRight size={14} />
          </Button>
        )
      }
    >
      <SectionBody
        loading={isLoading}
        skeleton={<TableSkeleton rows={4} columns={3} />}
        isEmpty={documents.length === 0}
        empty={
          <EmptyState
            title="No documents opened yet"
            description="Documents you view, edit or upload appear here."
          />
        }
      >
        <ul className="divide-y divide-line">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onDocumentClick?.(doc.id)}
                className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-surface-2"
              >
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                  {getActionIcon(doc.lastAction)}
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary">{doc.title}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {[doc.department, doc.category].filter(Boolean).join(', ')}
                  </span>
                </span>
                <span className="flex-shrink-0 text-right text-xs text-text-muted">
                  <span className="text-text-secondary">{getActionLabel(doc.lastAction)}</span> {dayjs(doc.actionAt).fromNow()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SectionBody>
    </SectionCard>
  );
}
