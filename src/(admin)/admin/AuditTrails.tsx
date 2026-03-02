import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { list } from '@/lib/api/crud';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Loader2, Activity, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AuditTrails() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await list('AUDIT_LOGS');
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs. You may not have permission to view them.');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter logs based on search and filters
  const filterLogs = useCallback(() => {
    let filtered = auditLogs;

    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Filter by resource
    if (resourceFilter) {
      filtered = filtered.filter(log => log.resource === resourceFilter);
    }

    // Filter by search query (user name, email, or resource ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        log =>
          (log.user?.first_name?.toLowerCase().includes(query) ||
            log.user?.last_name?.toLowerCase().includes(query) ||
            log.user?.email?.toLowerCase().includes(query) ||
            log.resource_id?.toLowerCase().includes(query) ||
            log.resource?.toLowerCase().includes(query)) ??
          false
      );
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchQuery, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  //.../

  // Get unique actions and resources for filters
  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action))).sort();
  const uniqueResources = Array.from(new Set(auditLogs.map(log => log.resource))).sort();

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return 'bg-[#1e3c21]/10 text-[#1e3c21]';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('delete')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('approve')) return 'bg-[#febb00]/20 text-[#1e3c21]';
    if (actionLower.includes('reject')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('login')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY HH:mm:ss');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('HH:mm:ss');
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('');
    setResourceFilter('');
  };

  const stats = {
    total: auditLogs.length,
    today: auditLogs.filter(log => dayjs(log.created_at).isSame(dayjs(), 'day')).length,
    thisWeek: auditLogs.filter(log => dayjs(log.created_at).isSame(dayjs(), 'week')).length,
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Audit Trails</h1>
          <p className="text-gray-600">Monitor and review system activity logs</p>
        </div>
        <Button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="bg-gradient-to-r from-\[#D70F0E\] to-\[#E5600B\] hover:from-\[#C00E0D\] hover:to-\[#D5500A\] text-white"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.thisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <Input
                placeholder="User name, email, or resource ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border-gray-300"
              />
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Action</label>
              <Select value={actionFilter || '__all__'} onValueChange={(val) => setActionFilter(val === '__all__' ? '' : val)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Resource</label>
              <Select value={resourceFilter || '__all__'} onValueChange={(val) => setResourceFilter(val === '__all__' ? '' : val)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Resources</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!searchQuery && !actionFilter && !resourceFilter}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Activity Logs ({filteredLogs.length} of {auditLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found. You may not have permission to view them.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Resource</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No logs match your filters
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {log.user?.first_name} {log.user?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{log.user?.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 capitalize">
                              {log.resource || 'N/A'}
                            </div>
                            {log.resource_id && (
                              <div className="text-xs text-gray-500 truncate">{log.resource_id}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">{formatDate(log.created_at)}</div>
                            <div className="text-xs text-gray-500">{formatTime(log.created_at)}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-600 font-mono">{log.ip_address || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDetails(log)}
                            className="border-gray-300 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this activity</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="h-full pr-4 space-y-6">
              {/* User Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">User</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Name</div>
                      <div className="text-gray-900 font-medium">
                        {selectedLog.user?.first_name} {selectedLog.user?.last_name}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Email</div>
                      <div className="text-gray-900 font-medium">{selectedLog.user?.email}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">User ID</div>
                      <div className="text-gray-900 font-mono text-xs break-all">{selectedLog.user_id}</div>
                    </div>
                  </div>
                </div>

                {/* Action Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Action</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Action</div>
                      <Badge className={getActionBadgeColor(selectedLog.action)}>
                        {selectedLog.action}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-gray-600">Timestamp</div>
                      <div className="text-gray-900 font-medium">
                        {formatDateTime(selectedLog.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resource Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Resource</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Resource Type</div>
                      <div className="text-gray-900 font-medium capitalize">{selectedLog.resource}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Resource ID</div>
                      <div className="text-gray-900 font-mono text-xs break-all">
                        {selectedLog.resource_id || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Network Information</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-600">IP Address</div>
                      <div className="text-gray-900 font-mono">{selectedLog.ip_address || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">User Agent</div>
                      <div className="text-gray-900 font-mono text-xs break-all">
                        {selectedLog.user_agent || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {selectedLog.details && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <pre className="text-xs overflow-auto max-h-64 text-gray-900 font-mono">
                        {typeof selectedLog.details === 'string'
                          ? selectedLog.details
                          : JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}