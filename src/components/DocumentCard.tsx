import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  FileArchive,
  Eye,
  Download,
  MoreVertical,
  Lock,
  Globe,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  XCircle,
  Tag,
  User,
  Calendar,
} from 'lucide-react';
import { type Document, type Department } from '@/types/dms';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface DocumentCardProps {
  document: Document;
  department?: Department;
  ownerName?: string;
  onPreview?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onArchive?: (doc: Document) => void;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Status badge configuration with icons and colors
const getStatusConfig = (status: string) => {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
    active: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: 'Active',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
    },
    approved: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: 'Approved',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
    },
    pending: {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Pending',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
    },
    archived: {
      icon: <Archive className="h-3.5 w-3.5" />,
      label: 'Archived',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200',
    },
    rejected: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: 'Rejected',
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
    },
    deleted: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: 'Deleted',
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
    },
  };

  return config[status] || config.active;
};

// Visibility icon
const getVisibilityIcon = (level: string) => {
  switch (level) {
    case 'public':
      return <Globe className="h-3 w-3" />;
    case 'restricted':
      return <Lock className="h-3 w-3" />;
    default:
      return <Shield className="h-3 w-3" />;
  }
};

// Mini status dot for quick visual scan
const getStatusDot = (status: string) => {
  const dotColors: Record<string, string> = {
    active: 'bg-green-500',
    approved: 'bg-blue-500',
    pending: 'bg-amber-500',
    archived: 'bg-gray-400',
    rejected: 'bg-red-500',
    deleted: 'bg-red-500',
  };
  return dotColors[status] || 'bg-gray-400';
};

export default function DocumentCard({
  document,
  department,
  ownerName = 'Unknown',
  onPreview = () => {},
  onDownload = () => {},
  onDelete = () => {},
  onArchive = () => {},
}: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(document.status);

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-tenant-primary/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main content container */}
      <div className="p-4 flex gap-4">
        {/* Left: Document thumbnail/icon area */}
        <div className="relative flex-shrink-0">
          {/* Icon background */}
          <div className="w-16 h-16 bg-tenant-primary/10 rounded-lg flex items-center justify-center border border-tenant-primary/10">
            <FileText className="h-8 w-8 text-tenant-primary" />
          </div>

          {/* Status dot indicator */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusDot(document.status)} border-2 border-white shadow-sm`} />
        </div>

        {/* Center: Content area */}
        <div className="flex-1 min-w-0">
          {/* Title and metadata row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate hover:text-tenant-primary transition-colors">
                {document.title}
              </h3>
              {/* File metadata breadcrumb */}
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="uppercase font-mono tracking-tight">{document.file_type}</span>
                {' • '}
                <span>{formatBytes(document.file_size)}</span>
                {' • '}
                <span className="flex items-center gap-1 inline-flex">
                  <User className="h-3 w-3" />
                  {ownerName}
                </span>
              </p>
            </div>

            {/* Right side: Status and date */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {/* Status badge */}
              <Badge className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </Badge>

              {/* Date modified */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{dayjs(document.updated_at).format('MMM DD')}</span>
              </div>
            </div>
          </div>

          {/* Description (if exists) */}
          {document.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
              {document.description}
            </p>
          )}

          {/* Tags and metadata row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {document.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                    +{document.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Document type badge */}
            {document.document_type && (
              <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 bg-gray-50">
                {document.document_type}
              </Badge>
            )}

            {/* Department code badge */}
            {department && (
              <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 bg-gray-50">
                {department.code}
              </Badge>
            )}

            {/* Visibility indicator */}
            <div className="ml-auto flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
              {getVisibilityIcon(document.visibility_level)}
              <span className="text-xs text-gray-500 capitalize">{document.visibility_level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover action buttons */}
      <div
        className={`absolute bottom-0 right-0 p-2 flex gap-1 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-tenant-primary hover:text-white transition-colors"
          onClick={() => onPreview(document)}
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-Blue-100 hover:text-blue-600 transition-colors"
          onClick={() => onDownload(document)}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onPreview(document)} className="flex gap-2">
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)} className="flex gap-2">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {document.status !== 'archived' && (
              <DropdownMenuItem onClick={() => onArchive(document)} className="flex gap-2 text-amber-600">
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(document)} className="flex gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
