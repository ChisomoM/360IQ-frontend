import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MoreVertical,
  Play,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const typeIconMap: Record<string, string> = {
  lifecycle: '📄',
  financial: '💰',
  user_activity: '👥',
  audit_trail: '🔒',
  custom: '⚙️',
};

const typeColorMap: Record<string, string> = {
  lifecycle: 'bg-blue-100 text-blue-700',
  financial: 'bg-green-100 text-green-700',
  user_activity: 'bg-purple-100 text-purple-700',
  audit_trail: 'bg-red-100 text-red-700',
  custom: 'bg-gray-100 text-gray-700',
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
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Saved Reports</CardTitle>
          <CardDescription>Your custom reports will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              No saved reports yet. Create one to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-gray-200">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle className="text-lg">Saved Reports & Templates</CardTitle>
            <CardDescription>
              {reports.length} saved • Click to run, or use menu for options
            </CardDescription>
          </div>

          {/* Search and Sort */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {sortedReports.map((report) => (
          <div
            key={report.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/2 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Icon + Info */}
              <button
                onClick={() => onRun(report.id)}
                disabled={loading}
                className="flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-lg mt-0.5 flex-shrink-0">
                    {typeIconMap[report.type] || '📊'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {report.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${typeColorMap[report.type] || typeColorMap.custom}`}
                      >
                        {report.type.replace(/_/g, ' ')}
                      </Badge>
                      {report.status && (
                        <div className="flex items-center gap-1">
                          {report.status === 'success' && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                          {report.status === 'error' && (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {report.lastRun 
                        ? `Last run: ${new Date(report.lastRun).toLocaleDateString()}`
                        : `Created: ${new Date(report.createdAt).toLocaleDateString()}`
                      }
                      {report.documentCount && ` • ${report.documentCount.toLocaleString()} docs`}
                    </p>
                  </div>
                </div>
              </button>

              {/* Right: Quick Action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRun(report.id)}
                  disabled={loading}
                  className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Run this report"
                >
                  <Play className="h-3 w-3" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onRun(report.id)}
                      className="cursor-pointer"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      <span>Run Now</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit(report.id)}
                      className="cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      <span>Edit Configuration</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(report.id)}
                      className="cursor-pointer text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
