import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MoreVertical,
  Play,
  Edit2,
  Trash2,
  Clock,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  Lock,
  Settings2,
  BarChart3,
  type LucideIcon,
} from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/format';
import type { Tone } from '@/lib/status';

interface SavedReport {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastRun?: string;
  status?: 'success' | 'error' | 'pending';
  documentCount?: number;
}

interface SavedReportsManagerProps {
  reports: SavedReport[];
  onRun: (reportId: string) => void;
  onEdit: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  loading?: boolean;
}

const typeIconMap: Record<string, LucideIcon> = {
  lifecycle: TrendingUp,
  financial: DollarSign,
  user_activity: Users,
  audit_trail: Lock,
  custom: Settings2,
};

const typeLabelMap: Record<string, string> = {
  lifecycle: 'Document lifecycle',
  financial: 'Financial',
  user_activity: 'Team activity',
  audit_trail: 'Audit trail',
  custom: 'Custom',
};

const statusMap: Record<NonNullable<SavedReport['status']>, { tone: Tone; label: string }> = {
  success: { tone: 'positive', label: 'Completed' },
  error: { tone: 'risk', label: 'Failed' },
  pending: { tone: 'caution', label: 'Pending' },
};

export const SavedReportsManager: React.FC<SavedReportsManagerProps> = ({
  reports,
  onRun,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.lastRun || b.createdAt).getTime() -
           new Date(a.lastRun || a.createdAt).getTime();
  });

  if (reports.length === 0) {
    return (
      <SectionCard title="Saved reports">
        <EmptyState
          icon={<Clock size={24} />}
          title="No saved reports yet"
          description="Generate a report and save it to run it again from here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard eyebrow={`${reports.length} saved`} title="Saved reports">
      {/* Search and sort */}
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            aria-label="Search reports"
            placeholder="Search reports"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'name')}>
          <SelectTrigger className="w-36" aria-label="Sort reports">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="name">Name A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ul className="divide-y divide-line">
        {sortedReports.map((report) => {
          const Icon = typeIconMap[report.type] || BarChart3;
          return (
            <li key={report.id} className="flex items-start justify-between gap-2 py-3">
              {/* Icon and details */}
              <button
                type="button"
                onClick={() => onRun(report.id)}
                disabled={loading}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-sm text-left transition-colors hover:bg-surface-2"
              >
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                  <Icon size={18} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary">{report.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-pill bg-field px-2.5 py-0.5 text-xs text-text-secondary">
                      {typeLabelMap[report.type] || report.type.replace(/_/g, ' ')}
                    </span>
                    {report.status && (
                      <StatusBadge tone={statusMap[report.status].tone} label={statusMap[report.status].label} />
                    )}
                  </span>
                  <span className="mt-1.5 block text-xs text-text-muted">
                    {report.lastRun
                      ? `Last run ${formatDate(report.lastRun)}`
                      : `Created ${formatDate(report.createdAt)}`
                    }
                    {report.documentCount ? `, ${report.documentCount.toLocaleString()} documents` : ''}
                  </span>
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" aria-label={`More actions for ${report.name}`}>
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onRun(report.id)}
                    className="cursor-pointer"
                  >
                    <Play size={16} className="mr-2" />
                    <span>Run now</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEdit(report.id)}
                    className="cursor-pointer"
                  >
                    <Edit2 size={16} className="mr-2" />
                    <span>Edit setup</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(report.id)}
                    className="cursor-pointer text-risk"
                  >
                    <Trash2 size={16} className="mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
};
