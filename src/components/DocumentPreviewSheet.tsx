import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  MoreVertical,
  Lock,
  Globe,
  Shield,
  Calendar,
  User,
  Building,
  Tag,
  Eye,
  Loader2,
} from 'lucide-react';
import type { Document, Department, DocumentVersion } from '@/types/dms';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    approved: 'bg-blue-100 text-blue-800 border-blue-300',
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    archived: 'bg-gray-100 text-gray-800 border-gray-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    deleted: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status] || colors.active;
};

const getVisibilityLabel = (level: string) => {
  const labels: Record<string, { icon: React.ReactNode; label: string }> = {
    public: { icon: <Globe className="h-4 w-4" />, label: 'Public (All Staff)' },
    restricted: { icon: <Lock className="h-4 w-4" />, label: 'Restricted (Private)' },
    department: { icon: <Building className="h-4 w-4" />, label: 'Department Only' },
  };
  return labels[level] || labels.department;
};

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
      <SheetContent side="right" className="w-full sm:w-[500px] max-w-lg overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">Document Preview</SheetTitle>
              <SheetDescription className="text-left">View full details and metadata</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-4">
              {/* Document preview area */}
              <div className="bg-gradient-to-br from-tenant-primary/10 to-tenant-primary/5 rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-tenant-primary/20">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-tenant-primary mx-auto mb-2 opacity-60" />
                  <p className="text-sm text-gray-600">Document Preview</p>
                  <p className="text-xs text-gray-500 mt-1">{formatBytes(document.file_size)}</p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-tenant-primary hover:bg-tenant-primary/90 text-white gap-2"
                  onClick={() => onDownload(document)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <Separator />

              {/* Document title and status */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{document.title}</h2>
                {document.description && (
                  <p className="text-sm text-gray-600">{document.description}</p>
                )}

                {/* Status badge */}
                <div className="mt-3">
                  <Badge className={`${getStatusColor(document.status)} border`}>
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Metadata grid */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-900">Metadata</h3>

                <div className="grid grid-cols-1 gap-3">
                  {/* File Information */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">File Information</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Type:</span>
                        <span className="font-mono font-medium text-gray-900">{document.file_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <span className="font-medium text-gray-900">{formatBytes(document.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Name:</span>
                        <span className="font-medium text-gray-900 truncate">{document.file_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Details</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {document.document_type}
                        </Badge>
                      </div>
                      {document.category && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium text-gray-900 capitalize">{document.category}</span>
                        </div>
                      )}
                      {department && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Department:</span>
                          <div className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" />
                            <span className="font-medium text-gray-900">{department.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Access & Visibility */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Access & Visibility</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Visibility:</span>
                        <div className="flex items-center gap-1">
                          {visibility.icon}
                          <span className="font-medium text-gray-900">{visibility.label}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Encrypted:</span>
                        <span className={`font-medium ${document.is_encrypted ? 'text-green-600' : 'text-gray-600'}`}>
                          {document.is_encrypted ? '✓ Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version:</span>
                        <span className="font-medium text-gray-900">v{document.version}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ownership & Dates */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ownership & Dates</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Owner:</span>
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium text-gray-900">{ownerName}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Created:</span>
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <Calendar className="h-3 w-3" />
                          <span>{dayjs(document.created_at).format('MMM DD, YYYY')}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Modified:</span>
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <Calendar className="h-3 w-3" />
                          <span>{dayjs(document.updated_at).format('MMM DD, YYYY')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {document.tags && document.tags.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {document.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {versions && versions.length > 0 && (
                <>
                  <Separator />

                  {/* Version history */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-900">Version History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {versions.map((version) => (
                        <div key={version.id} className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">v{version.version_number}</span>
                            <span className="text-xs text-gray-500">{formatBytes(version.file_size)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{dayjs(version.created_at).format('MMM DD, YYYY HH:mm')}</p>
                          {version.change_notes && (
                            <p className="text-xs text-gray-700 italic">"{version.change_notes}"</p>
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
