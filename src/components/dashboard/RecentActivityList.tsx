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
      return <Download className="h-4 w-4 text-gray-600" />;
    case 'edited':
      return <Edit className="h-4 w-4 text-gray-600" />;
    case 'uploaded':
      return <UploadIcon className="h-4 w-4 text-gray-600" />;
    case 'viewed':
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
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
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't accessed any documents yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              <span className="cursor-pointer text-green-700 hover:underline" onClick={() => onViewAll?.()}>
                Upload one →
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Recent Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 divide-y divide-gray-200">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onDocumentClick?.(doc.id)}
              className="w-full py-4 text-left hover:bg-gray-50 transition-colors flex items-start gap-4 group"
            >
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(doc.lastAction)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-green-700 transition-colors truncate">
                  {doc.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {doc.department && (
                    <span className="text-sm text-gray-600">{doc.department}</span>
                  )}
                  {doc.category && (
                    <span className="text-xs text-gray-500">• {doc.category}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getActionLabel(doc.lastAction)} {dayjs(doc.actionAt).fromNow()}
                </p>
              </div>
            </button>
          ))}
        </div>

        {documents.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-green-700 hover:text-green-800"
            onClick={() => onViewAll?.()}
          >
            View all recent documents →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
