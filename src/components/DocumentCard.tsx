import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Eye,
  Download,
  MoreVertical,
  Lock,
  Globe,
  Shield,
  Archive,
  XCircle,
  Tag,
  User,
  Calendar,
} from '@/components/icons';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Document, type Department } from '@/types/dms';

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

// Visibility icon
const getVisibilityIcon = (level: string) => {
  switch (level) {
    case 'public':
      return <Globe size={14} />;
    case 'restricted':
      return <Lock size={14} />;
    default:
      return <Shield size={14} />;
  }
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

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card transition-shadow hover:shadow-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main content container */}
      <div className="flex gap-4 p-4">
        {/* Left: Document icon */}
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
          <FileText size={28} />
        </div>

        {/* Center: Content area */}
        <div className="min-w-0 flex-1">
          {/* Title and metadata row */}
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {document.title}
              </h3>
              {/* File metadata line */}
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-text-muted">
                <span className="font-mono uppercase">{document.file_type}</span>
                <span className="font-mono">{formatBytes(document.file_size)}</span>
                <span className="inline-flex items-center gap-1">
                  <User size={14} />
                  {ownerName}
                </span>
              </p>
            </div>

            {/* Right side: Status and date */}
            <div className="flex shrink-0 flex-col items-end gap-2">
              <DocumentStatusBadge status={document.status} />
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar size={14} />
                <span className="font-mono">{formatDate(document.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Description (if exists) */}
          {document.description && (
            <p className="mb-2 line-clamp-1 text-xs text-text-secondary">
              {document.description}
            </p>
          )}

          {/* Tags and metadata row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {document.tags.slice(0, 2).map((tag) => (
                  <StatusBadge key={tag} tone="neutral">
                    <Tag size={14} />
                    {tag}
                  </StatusBadge>
                ))}
                {document.tags.length > 2 && (
                  <StatusBadge tone="neutral">+{document.tags.length - 2}</StatusBadge>
                )}
              </div>
            )}

            {/* Document type */}
            {document.document_type && (
              <StatusBadge tone="neutral">{document.document_type}</StatusBadge>
            )}

            {/* Department code */}
            {department && (
              <StatusBadge tone="neutral"><span className="font-mono">{department.code}</span></StatusBadge>
            )}

            {/* Visibility indicator */}
            <div className="ml-auto flex items-center gap-1 text-text-muted">
              {getVisibilityIcon(document.visibility_level)}
              <span className="text-xs capitalize">{document.visibility_level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover action buttons */}
      <div
        className={cn(
          'absolute bottom-0 right-0 flex gap-1 rounded-tl-md bg-surface-1 p-2 transition-opacity duration-200 focus-within:pointer-events-auto focus-within:opacity-100',
          isHovered ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPreview(document)}
          title="Preview"
          aria-label="Preview"
        >
          <Eye />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDownload(document)}
          title="Download"
          aria-label="Download"
        >
          <Download />
        </Button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="More actions"
              aria-label="More actions"
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onPreview(document)} className="flex gap-2">
              <Eye size={16} />
              <span>View details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)} className="flex gap-2">
              <Download size={16} />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {document.status !== 'archived' && (
              <DropdownMenuItem onClick={() => onArchive(document)} className="flex gap-2">
                <Archive size={16} />
                <span>Archive</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(document)} className="flex gap-2 text-risk focus:text-risk">
              <XCircle size={16} />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
