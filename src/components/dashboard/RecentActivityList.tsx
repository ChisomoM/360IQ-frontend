import { FileText, Download, Edit, Upload as UploadIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      return <Download className="h-4 w-4 text-blue-600" />;
    case 'edited':
      return <Edit className="h-4 w-4 text-amber-600" />;
    case 'uploaded':
      return <UploadIcon className="h-4 w-4 text-emerald-600" />;
    case 'viewed':
    default:
      return <FileText className="h-4 w-4 text-slate-600" />;
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
  if (isLoading) {
    return (
      <Card className="border-slate-200/50 shadow-premium-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-200/30 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-slate-200/50 shadow-premium-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-600 font-medium">No documents accessed yet</p>
            <p className="text-sm text-slate-500 mt-2">
              <span className="cursor-pointer text-primary hover:underline font-medium" onClick={() => onViewAll?.()}>
                Upload your first document →
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 shadow-premium-sm">
      <CardHeader className="border-b border-slate-200/50 pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 divide-y divide-slate-100/50">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onDocumentClick?.(doc.id)}
              className="w-full py-4 px-2 text-left hover:bg-primary/5 transition-all duration-200 flex items-start gap-4 group rounded-lg -mx-2 px-3"
            >
              <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-slate-50/50 group-hover:bg-primary/10 transition-colors">
                {getActionIcon(doc.lastAction)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                  {doc.title}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {doc.department && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-100/50 px-2 py-1 rounded">
                      {doc.department}
                    </span>
                  )}
                  {doc.category && (
                    <span className="text-xs text-slate-500">
                      {doc.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  <span className="font-medium text-slate-600">{getActionLabel(doc.lastAction)}</span> {dayjs(doc.actionAt).fromNow()}
                </p>
              </div>
            </button>
          ))}
        </div>

        {documents.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-6 text-primary hover:text-primary hover:bg-primary/5 font-medium"
            onClick={() => onViewAll?.()}
          >
            View all recent documents →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
