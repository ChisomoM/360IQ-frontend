import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Upload, Plus } from 'lucide-react';
import { DocumentCardV2 } from '@/components/documents/DocumentCardV2';
import type { Document } from '@/types/dms';
import type { RoleType } from './mockData';
import { fetchData } from '@/lib/api/crud';

// ── Local constants ───────────────────────────────────────────────────────────
const EASE_CUSTOM: [number, number, number, number] = [0.16, 1, 0.3, 1];
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const FADE_UP = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_CUSTOM } },
};
const SPRING_BTN = { type: 'spring', stiffness: 500, damping: 30 } as const;

// ── Upload Action Card ────────────────────────────────────────────────────────
function UploadActionCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="h-full w-full rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all duration-300 cursor-pointer"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
        <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center">
          <Plus size={24} className="text-slate-600" />
        </div>
        <p className="font-sans text-sm font-semibold text-slate-700">Upload Document</p>
      </div>
    </motion.button>
  );
}

// ── Recent Uploads Section ────────────────────────────────────────────────────
interface RecentUploadsSectionProps {
  primary: string;
  secondary: string;
  role: RoleType;
}

export function RecentUploadsSection({ primary: _primary, secondary: _secondary, role }: RecentUploadsSectionProps) {
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
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-xl text-gray-900">Recent Uploads</h2>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            {role === 'admin' ? 'Your latest uploads' : role === 'dept' ? 'Finance &amp; HR uploads' : 'Org-wide — latest documents'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate('/admin/documents?upload=true')}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-fg font-sans text-sm font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_BTN}
          >
            <Upload size={14} />
            Upload New
          </motion.button>
          <motion.button
            onClick={() => navigate('/admin/documents')}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl font-sans text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_BTN}
          >
            View All
            <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>

      {/* Grid — 4 columns with upload card as 5th */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100">
          <p className="font-sans text-sm font-semibold text-slate-500">Loading recent documents...</p>
        </div>
      ) : visibleDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100">
          <Upload size={32} className="text-slate-300 mb-3" />
          <p className="font-sans text-sm font-semibold text-slate-500">No recent uploads</p>
          <p className="font-sans text-xs text-slate-400 mt-1">Documents uploaded by your team will appear here</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-4 gap-4 auto-rows-fr"
          variants={STAGGER}
          initial="hidden"
          animate="visible"
        >
          {visibleDocuments.map((doc) => (
            <motion.div key={doc.id} variants={FADE_UP} className="h-full">
              <DocumentCardV2
                document={doc}
                onDownload={handleDownload}
                onView={handleView}
                onVersions={handleVersions}
              />
            </motion.div>
          ))}
          <motion.div variants={FADE_UP} className="h-full">
            <UploadActionCard onClick={handleUploadClick} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
