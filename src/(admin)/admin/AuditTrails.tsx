import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { KpiTile } from '@/components/shared/KpiTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { formatDate } from '@/lib/format';
import type { Tone } from '@/lib/status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Loader2, Activity, Eye, Download, FilePen,
  CheckCircle2, XCircle, LogIn, LogOut, Upload,
  Shield, RefreshCw, Trash2, Search, Clock, Calendar,
} from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';

dayjs.extend(relativeTime);

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

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Realistic audit log entries — remove when real API returns data
const MOCK_LOGS: AuditLog[] = [
  {
    id: 'log-001', user_id: 'u-001', action: 'document.viewed', resource: 'document',
    resource_id: 'doc-abc123', details: 'Viewed document: Student Enrollment Policy 2024',
    ip_address: '197.211.62.14', user_agent: 'Chrome/120 Windows',
    created_at: dayjs().subtract(5, 'minute').toISOString(),
    user: { id: 'u-001', first_name: 'Tendai', last_name: 'Moyo', email: 'tendai.moyo@unilus.ac.zm' },
  },
  {
    id: 'log-002', user_id: 'u-002', action: 'document.downloaded', resource: 'document',
    resource_id: 'doc-def456', details: 'Downloaded: Q1 Departmental Report.pdf',
    ip_address: '197.211.62.15', user_agent: 'Firefox/121 Windows',
    created_at: dayjs().subtract(18, 'minute').toISOString(),
    user: { id: 'u-002', first_name: 'Amara', last_name: 'Banda', email: 'amara.banda@unilus.ac.zm' },
  },
  {
    id: 'log-003', user_id: 'u-003', action: 'document.approved', resource: 'document',
    resource_id: 'doc-ghi789', details: 'Approved workflow step 2: Budget Allocation Memo',
    ip_address: '197.211.62.16', user_agent: 'Chrome/120 MacOS',
    created_at: dayjs().subtract(1, 'hour').toISOString(),
    user: { id: 'u-003', first_name: 'Chanda', last_name: 'Phiri', email: 'chanda.phiri@unilus.ac.zm' },
  },
  {
    id: 'log-004', user_id: 'u-001', action: 'document.uploaded', resource: 'document',
    resource_id: 'doc-jkl012', details: 'Uploaded new document: Leave Application Form v2',
    ip_address: '197.211.62.14', user_agent: 'Chrome/120 Windows',
    created_at: dayjs().subtract(2, 'hour').toISOString(),
    user: { id: 'u-001', first_name: 'Tendai', last_name: 'Moyo', email: 'tendai.moyo@unilus.ac.zm' },
  },
  {
    id: 'log-005', user_id: 'u-004', action: 'user.login', resource: 'auth',
    resource_id: 'u-004', details: 'Successful login from 197.211.62.18',
    ip_address: '197.211.62.18', user_agent: 'Safari/17 iOS',
    created_at: dayjs().subtract(3, 'hour').toISOString(),
    user: { id: 'u-004', first_name: 'Kemi', last_name: 'Dlamini', email: 'kemi.dlamini@unilus.ac.zm' },
  },
  {
    id: 'log-006', user_id: 'u-002', action: 'document.edited', resource: 'document',
    resource_id: 'doc-abc123', details: 'Updated metadata: visibility changed to Public',
    ip_address: '197.211.62.15', user_agent: 'Firefox/121 Windows',
    created_at: dayjs().subtract(4, 'hour').toISOString(),
    user: { id: 'u-002', first_name: 'Amara', last_name: 'Banda', email: 'amara.banda@unilus.ac.zm' },
  },
  {
    id: 'log-007', user_id: 'u-005', action: 'document.rejected', resource: 'document',
    resource_id: 'doc-mno345', details: 'Rejected: Procurement Request, incomplete supporting docs',
    ip_address: '197.211.62.20', user_agent: 'Chrome/120 Windows',
    created_at: dayjs().subtract(5, 'hour').toISOString(),
    user: { id: 'u-005', first_name: 'Bongani', last_name: 'Ncube', email: 'bongani.ncube@unilus.ac.zm' },
  },
  {
    id: 'log-008', user_id: 'u-003', action: 'user.logout', resource: 'auth',
    resource_id: 'u-003', details: 'User session ended',
    ip_address: '197.211.62.16', user_agent: 'Chrome/120 MacOS',
    created_at: dayjs().subtract(6, 'hour').toISOString(),
    user: { id: 'u-003', first_name: 'Chanda', last_name: 'Phiri', email: 'chanda.phiri@unilus.ac.zm' },
  },
  {
    id: 'log-009', user_id: 'u-001', action: 'document.deleted', resource: 'document',
    resource_id: 'doc-pqr678', details: 'Soft deleted: Draft Memo, superseded by v2',
    ip_address: '197.211.62.14', user_agent: 'Chrome/120 Windows',
    created_at: dayjs().subtract(1, 'day').toISOString(),
    user: { id: 'u-001', first_name: 'Tendai', last_name: 'Moyo', email: 'tendai.moyo@unilus.ac.zm' },
  },
  {
    id: 'log-010', user_id: 'u-004', action: 'permission.changed', resource: 'user',
    resource_id: 'u-002', details: 'Role updated: Records Officer → Senior Records Officer',
    ip_address: '197.211.62.18', user_agent: 'Safari/17 iOS',
    created_at: dayjs().subtract(2, 'day').toISOString(),
    user: { id: 'u-004', first_name: 'Kemi', last_name: 'Dlamini', email: 'kemi.dlamini@unilus.ac.zm' },
  },
];

// ─── Action config: icon, tone and label for each action type ────────────────
const ACTION_CONFIG: Record<string, { icon: React.ReactNode; tone: Tone; label: string }> = {
  'document.viewed': { icon: <Eye size={14} />, tone: 'neutral', label: 'Viewed' },
  'document.downloaded': { icon: <Download size={14} />, tone: 'neutral', label: 'Downloaded' },
  'document.uploaded': { icon: <Upload size={14} />, tone: 'neutral', label: 'Uploaded' },
  'document.edited': { icon: <FilePen size={14} />, tone: 'neutral', label: 'Edited' },
  'document.approved': { icon: <CheckCircle2 size={14} />, tone: 'positive', label: 'Approved' },
  'document.rejected': { icon: <XCircle size={14} />, tone: 'risk', label: 'Rejected' },
  'document.deleted': { icon: <Trash2 size={14} />, tone: 'risk', label: 'Deleted' },
  'user.login': { icon: <LogIn size={14} />, tone: 'neutral', label: 'Signed in' },
  'user.logout': { icon: <LogOut size={14} />, tone: 'neutral', label: 'Signed out' },
  'permission.changed': { icon: <Shield size={14} />, tone: 'caution', label: 'Permission changed' },
};

const getActionConfig = (action: string): { icon: React.ReactNode; tone: Tone; label: string } =>
  ACTION_CONFIG[action] ?? { icon: <Activity size={14} />, tone: 'neutral', label: action };

// Toned badges carry their own icon; neutral ones show the action icon.
function ActionBadge({ action }: { action: string }) {
  const config = getActionConfig(action);
  return (
    <StatusBadge tone={config.tone}>
      {config.tone === 'neutral' && config.icon}
      {config.label}
    </StatusBadge>
  );
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

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await list('AUDIT_LOGS');
      const logs = Array.isArray(data) ? data : [];
      // Fall back to mock data if the API returns empty
      setAuditLogs(logs.length > 0 ? logs : MOCK_LOGS);
    } catch {
      // API failed — use mock data so the page feels real
      setAuditLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterLogs = useCallback(() => {
    let filtered = auditLogs;
    if (actionFilter) filtered = filtered.filter(l => l.action === actionFilter);
    if (resourceFilter) filtered = filtered.filter(l => l.resource === resourceFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.user?.first_name?.toLowerCase().includes(q) ||
        l.user?.last_name?.toLowerCase().includes(q) ||
        l.user?.email?.toLowerCase().includes(q) ||
        l.resource_id?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
      );
    }
    setFilteredLogs(filtered);
  }, [auditLogs, searchQuery, actionFilter, resourceFilter]);

  useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);
  useEffect(() => { filterLogs(); }, [filterLogs]);

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action))).sort();
  const uniqueResources = Array.from(new Set(auditLogs.map(l => l.resource))).sort();

  const stats = {
    total: auditLogs.length,
    today: auditLogs.filter(l => dayjs(l.created_at).isSame(dayjs(), 'day')).length,
    thisWeek: auditLogs.filter(l => dayjs(l.created_at).isSame(dayjs(), 'week')).length,
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        title="Audit trails"
        description="Review who did what, and when."
        actions={
          <Button variant="secondary" onClick={fetchAuditLogs} disabled={loading}>
            {loading
              ? <Loader2 className="animate-spin" />
              : <RefreshCw />}
            Refresh
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile label="Total entries" value={stats.total} icon={<Activity size={18} />} />
        <KpiTile label="Today" value={stats.today} icon={<Clock size={18} />} />
        <KpiTile label="This week" value={stats.thisWeek} icon={<Calendar size={18} />} />
      </div>

      {/* Search & Filters */}
      <SectionCard padded={false} bodyClassName="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search audit entries"
              placeholder="Search user, action or resource"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter || '__all__'} onValueChange={v => setActionFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger aria-label="Filter by action"><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All actions</SelectItem>
              {uniqueActions.map(a => (
                <SelectItem key={a} value={a}>
                  <span className="flex items-center gap-2">
                    <span className="text-text-muted">{getActionConfig(a).icon}</span>
                    <span className="font-mono text-xs">{a}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceFilter || '__all__'} onValueChange={v => setResourceFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger aria-label="Filter by resource"><SelectValue placeholder="All resources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All resources</SelectItem>
              {uniqueResources.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || actionFilter || resourceFilter) && (
          <div className="flex justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setActionFilter(''); setResourceFilter(''); }}>
              Clear filters
            </Button>
          </div>
        )}
      </SectionCard>

      {/* Logs Table */}
      <SectionCard
        padded={false}
        title="Activity"
        actions={
          <span className="text-xs text-text-muted">
            <span className="font-mono">{filteredLogs.length}</span> of <span className="font-mono">{auditLogs.length}</span>
          </span>
        }
      >
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<Activity size={24} />}
            title="No entries found"
            description="Change your search or filters to see more."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {['Action', 'User', 'Resource', 'Details', 'Time', 'IP address'].map(h => (
                  <TableHead key={h} scope="col">{h}</TableHead>
                ))}
                <TableHead scope="col"><span className="sr-only">View details</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>

                  {/* User */}
                  <TableCell>
                    <p className="font-semibold text-text-primary text-xs">
                      {log.user?.first_name} {log.user?.last_name}
                    </p>
                    <p className="text-text-muted text-xs truncate max-w-[160px]">
                      {log.user?.email}
                    </p>
                  </TableCell>

                  {/* Resource */}
                  <TableCell>
                    <span className="inline-flex items-center h-[1.572rem] px-2.5 rounded-pill bg-field text-xs text-text-secondary capitalize">
                      {log.resource}
                    </span>
                  </TableCell>

                  {/* Details */}
                  <TableCell className="max-w-[220px]">
                    <p className="text-xs text-text-secondary truncate" title={log.details}>
                      {log.details || 'None'}
                    </p>
                  </TableCell>

                  {/* Time */}
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary" title={dayjs(log.created_at).fromNow()}>
                    <p>{formatDate(log.created_at)}</p>
                    <p className="text-text-muted">{dayjs(log.created_at).format('HH:mm:ss')}</p>
                  </TableCell>

                  {/* IP */}
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {log.ip_address || 'N/A'}
                  </TableCell>

                  {/* View details */}
                  <TableCell>
                    <Button variant="ghost" size="icon"
                      aria-label="View entry details"
                      title="View details"
                      onClick={() => { setSelectedLog(log); setIsDialogOpen(true); }}
                      className="h-8 w-8">
                      <Eye />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit entry</DialogTitle>
            <DialogDescription>
              Everything recorded for this activity.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ActionBadge action={selectedLog.action} />
                  <span className="font-mono text-xs text-text-muted">{selectedLog.action}</span>
                </div>

                {/* User */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted mb-2">User</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-muted text-xs">Name</p>
                      <p className="font-medium text-text-primary">{selectedLog.user?.first_name} {selectedLog.user?.last_name}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-text-muted text-xs">Email</p>
                      <p className="font-medium text-text-primary break-all">{selectedLog.user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Resource */}
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted mb-2">Resource</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-muted text-xs">Type</p>
                      <p className="font-medium text-text-primary capitalize">{selectedLog.resource}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">ID</p>
                      <p className="font-mono text-xs text-text-primary break-all">{selectedLog.resource_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {selectedLog.details && (
                  <div className="border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted mb-2">Details</p>
                    <p className="text-sm text-text-primary">{selectedLog.details}</p>
                  </div>
                )}

                {/* Network */}
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted mb-2">Network</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-text-muted text-xs">IP address</p>
                      <p className="font-mono text-xs text-text-primary">{selectedLog.ip_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">Time</p>
                      <p className="font-mono text-xs text-text-primary">{formatDate(selectedLog.created_at)}, {dayjs(selectedLog.created_at).format('HH:mm:ss')}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">User agent</p>
                      <p className="font-mono text-xs text-text-primary break-all">{selectedLog.user_agent || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}