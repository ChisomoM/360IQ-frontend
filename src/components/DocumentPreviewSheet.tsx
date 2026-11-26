import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  FileText,
  Download,
  Share2,
  Lock,
  Globe,
  Building,
  Tag,
} from '@/components/icons';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Document, Department, DocumentVersion } from '@/types/dms';

interface DocumentPreviewSheetProps {
  document: Document | null;
  department?: Department;
  ownerName?: string;
  versions?: DocumentVersion[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (doc: Document) => void;
  isLoading?: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getVisibilityLabel = (level: string) => {
  const labels: Record<string, { icon: React.ReactNode; label: string }> = {
    public: { icon: <Globe size={16} />, label: 'Public, all staff' },
    restricted: { icon: <Lock size={16} />, label: 'Restricted' },
    department: { icon: <Building size={16} />, label: 'Department only' },
  };
  return labels[level] || labels.department;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className="whitespace-nowrap text-xs text-text-muted">{label}</dt>
    <dd className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-text-primary">{children}</dd>
  </div>
);

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted">{title}</h3>
    <dl className="space-y-2">{children}</dl>
  </div>
);

export default function DocumentPreviewSheet({
  document,
  department,
  ownerName = 'Unknown',
  versions = [],
  isOpen,
  onOpenChange,
  onDownload = () => {},
  isLoading = false,
}: DocumentPreviewSheetProps) {
  if (!document) return null;

  const visibility = getVisibilityLabel(document.visibility_level);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto sm:w-[500px]">
        {isLoading ? (
          <TableSkeleton rows={8} columns={2} />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">Document preview</SheetTitle>
              <SheetDescription className="text-left">Details and metadata</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 py-4">
              {/* Document preview area */}
              <div className="flex h-40 items-center justify-center rounded-lg bg-field">
                <div className="text-center">
                  <FileText size={40} className="mx-auto mb-2 text-text-muted" />
                  <p className="font-mono text-xs text-text-muted">{formatBytes(document.file_size)}</p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => onDownload(document)}
                >
                  <Download />
                  Download
                </Button>
                <Button variant="secondary">
                  <Share2 />
                  Share
                </Button>
              </div>

              <Separator />

              {/* Document title and status */}
              <div>
                <h2 className="mb-1 text-xl font-semibold text-text-primary">{document.title}</h2>
                {document.description && (
                  <p className="text-sm text-text-secondary">{document.description}</p>
                )}
                <div className="mt-3">
                  <DocumentStatusBadge status={document.status} />
                </div>
              </div>

              <Separator />

              <Group title="File">
                <Row label="File type"><span className="truncate font-mono text-xs">{document.file_type}</span></Row>
                <Row label="File size"><span className="font-mono text-xs">{formatBytes(document.file_size)}</span></Row>
                <Row label="File name"><span className="truncate font-mono text-xs">{document.file_name}</span></Row>
              </Group>

              <Group title="Details">
                <Row label="Type"><span className="capitalize">{document.document_type}</span></Row>
                {document.category && (
                  <Row label="Category"><span className="capitalize">{document.category}</span></Row>
                )}
                {department && (
                  <Row label="Department"><Building size={16} />{department.name}</Row>
                )}
              </Group>

              <Group title="Access">
                <Row label="Visibility">{visibility.icon}{visibility.label}</Row>
                <Row label="Encrypted">{document.is_encrypted ? 'Yes' : 'No'}</Row>
                <Row label="Version"><span className="font-mono text-xs">v{document.version}</span></Row>
              </Group>

              <Group title="Ownership and dates">
                <Row label="Owner">{ownerName}</Row>
                <Row label="Created"><span className="font-mono text-xs">{formatDate(document.created_at)}</span></Row>
                <Row label="Modified"><span className="font-mono text-xs">{formatDate(document.updated_at)}</span></Row>
              </Group>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <StatusBadge key={tag} tone="neutral">
                        <Tag size={14} />
                        {tag}
                      </StatusBadge>
                    ))}
                  </div>
                </div>
              )}

              {versions && versions.length > 0 && (
                <>
                  <Separator />

                  {/* Version history */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text-primary">Version history</h3>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {versions.map((version) => (
                        <div key={version.id} className="rounded-md border border-line p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-mono text-xs font-medium text-text-primary">v{version.version_number}</span>
                            <span className="font-mono text-xs text-text-muted">{formatBytes(version.file_size)}</span>
                          </div>
                          <p className="mb-1 font-mono text-xs text-text-secondary">{formatDateTime(version.created_at)}</p>
                          {version.change_notes && (
                            <p className="text-xs text-text-secondary">"{version.change_notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
