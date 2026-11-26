import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, Plus } from '@/components/icons';
import { DocumentCardV2 } from '@/components/documents/DocumentCardV2';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Document } from '@/types/dms';
import type { RoleType } from './mockData';
import { fetchData } from '@/lib/api/crud';

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

// ── Upload action card ────────────────────────────────────────────────────────
function UploadActionCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[9rem] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface-1 px-4 py-6 text-center transition-colors hover:bg-surface-2"
    >
      <span className="grid h-12 w-12 place-items-center rounded-sm bg-field text-text-secondary">
        <Plus size={24} />
      </span>
      <span className="text-sm font-semibold text-text-primary">Add a document</span>
    </button>
  );
}

// ── Recent uploads section ────────────────────────────────────────────────────
interface RecentUploadsSectionProps {
  role: RoleType;
}

export function RecentUploadsSection({ role }: RecentUploadsSectionProps) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetchData('DOCUMENTS', 'GET');
        const apiDocuments = Array.isArray(response) ? response : (response?.items ?? []);

        if (!mounted) return;
        setDocuments(apiDocuments as Document[]);
      } catch {
        if (!mounted) return;
        setDocuments([]);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    loadDocuments();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleDocuments = useMemo(() => documents.slice(0, 5), [documents]);

  const handleDownload = (doc: Document) => {
    console.log('Download:', doc);
  };

  const handleView = (doc: Document) => {
    navigate(`/admin/documents/${doc.id}`);
  };

  const handleVersions = (doc: Document) => {
    console.log('Versions:', doc);
  };

  const handleUploadClick = () => {
    navigate('/admin/documents?upload=true');
  };

  return (
    <SectionCard
      eyebrow={role === 'admin' ? 'Your latest uploads' : role === 'dept' ? 'Finance and HR uploads' : 'Latest across the organisation'}
      title="Recent uploads"
      actions={
        <>
          <Button variant="ghost" onClick={() => navigate('/admin/documents')}>
            View all
            <ChevronRight size={16} />
          </Button>
          <Button onClick={handleUploadClick}>
            <Upload size={16} />
            Upload document
          </Button>
        </>
      }
    >
      <SectionBody
        loading={isLoading}
        skeleton={
          <div role="status" aria-busy="true" aria-label="Loading" className={GRID}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-36 rounded-lg" />)}
          </div>
        }
        isEmpty={visibleDocuments.length === 0}
        empty={
          <EmptyState
            icon={<Upload size={24} />}
            title="No recent uploads"
            description="Documents uploaded by your team appear here."
          />
        }
      >
        <div className={`${GRID} auto-rows-fr`}>
          {visibleDocuments.map((doc) => (
            <div key={doc.id} className="h-full min-w-0">
              <DocumentCardV2
                document={doc}
                onDownload={handleDownload}
                onView={handleView}
                onVersions={handleVersions}
              />
            </div>
          ))}
          <UploadActionCard onClick={handleUploadClick} />
        </div>
      </SectionBody>
    </SectionCard>
  );
}
