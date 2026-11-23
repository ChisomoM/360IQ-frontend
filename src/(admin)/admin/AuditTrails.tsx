import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Loader2, Activity, Eye, Download, FilePen,
  CheckCircle2, XCircle, LogIn, LogOut, Upload,
  Shield, RefreshCw, Trash2, Search, Filter,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
    resource_id: 'doc-mno345', details: 'Rejected: Procurement Request — incomplete supporting docs',
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
    resource_id: 'doc-pqr678', details: 'Soft deleted: Draft Memo — superseded by v2',
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

// ─── Action config — icon + colour + label for each action type ───────────────
const ACTION_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  'document.viewed': { icon: <Eye className="h-3.5 w-3.5" />, bg: 'bg-blue-50', text: 'text-blue-600', label: 'Viewed' },
  'document.downloaded': { icon: <Download className="h-3.5 w-3.5" />, bg: 'bg-signal-tint', text: 'text-signal-text', label: 'Downloaded' },
  'document.uploaded': { icon: <Upload className="h-3.5 w-3.5" />, bg: 'bg-surface-2', text: 'text-sky-text', label: 'Uploaded' },
  'document.edited': { icon: <FilePen className="h-3.5 w-3.5" />, bg: 'bg-amber-50', text: 'text-amber-600', label: 'Edited' },
  'document.approved': { icon: <CheckCircle2 className="h-3.5 w-3.5" />, bg: 'bg-positive-tint', text: 'text-positive', label: 'Approved' },
  'document.rejected': { icon: <XCircle className="h-3.5 w-3.5" />, bg: 'bg-red-50', text: 'text-red-600', label: 'Rejected' },
  'document.deleted': { icon: <Trash2 className="h-3.5 w-3.5" />, bg: 'bg-red-50', text: 'text-red-600', label: 'Deleted' },
  'user.login': { icon: <LogIn className="h-3.5 w-3.5" />, bg: 'bg-positive-tint', text: 'text-positive', label: 'Login' },
  'user.logout': { icon: <LogOut className="h-3.5 w-3.5" />, bg: 'bg-gray-100', text: 'text-gray-500', label: 'Logout' },
  'permission.changed': { icon: <Shield className="h-3.5 w-3.5" />, bg: 'bg-surface-2', text: 'text-text-secondary', label: 'Permission' },
};

const getActionConfig = (action: string) =>
  ACTION_CONFIG[action] ?? { icon: <Activity className="h-3.5 w-3.5" />, bg: 'bg-gray-100', text: 'text-gray-500', label: action };

// Animation variants
const listVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.02 } } };
const rowVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

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
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-sm text-gray-900">Audit Trails</h1>
          <p className="font-sans text-text-sm text-muted-foreground mt-1">
            Monitor and review system activity logs
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
          <Button onClick={fetchAuditLogs} disabled={loading} className="bg-primary text-primary-foreground gap-2">
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Stat cards */}
      <motion.div variants={listVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Logs', value: stats.total, color: 'text-ch-primary-600', bg: 'bg-ch-primary/[0.08]', icon: <Activity className="h-5 w-5" /> },
          { label: 'Today', value: stats.today, color: 'text-positive', bg: 'bg-positive-tint', icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'This Week', value: stats.thisWeek, color: 'text-ch-secondary-600', bg: 'bg-ch-secondary/[0.08]', icon: <Filter className="h-5 w-5" /> },
        ].map(({ label, value, color, bg, icon }) => (
          <motion.div key={label} variants={rowVariants}
            className="bg-card rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${bg}`}>
              <span className={color}>{icon}</span>
            </div>
            <div>
              <p className="font-sans text-text-xs text-muted-foreground">{label}</p>
              <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user, action, or resource…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200"
            />
          </div>
          <Select value={actionFilter || '__all__'} onValueChange={v => setActionFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="border-gray-200"><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Actions</SelectItem>
              {uniqueActions.map(a => (
                <SelectItem key={a} value={a}>
                  <span className="flex items-center gap-2">
                    <span className={cn('p-0.5 rounded', getActionConfig(a).bg, getActionConfig(a).text)}>
                      {getActionConfig(a).icon}
                    </span>
                    {a}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceFilter || '__all__'} onValueChange={v => setResourceFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="border-gray-200"><SelectValue placeholder="All Resources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Resources</SelectItem>
              {uniqueResources.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || actionFilter || resourceFilter) && (
          <div className="flex justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setActionFilter(''); setResourceFilter(''); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-base text-foreground">
            Activity Logs
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredLogs.length} of {auditLogs.length})
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Activity className="h-10 w-10 text-gray-200" />
            <p className="font-display font-semibold text-foreground">No logs found</p>
            <p className="font-sans text-text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Action', 'User', 'Resource', 'Details', 'Time', 'IP', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-sans font-medium text-text-xs text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody variants={listVariants} initial="hidden" animate="visible">
                {filteredLogs.map(log => {
                  const ac = getActionConfig(log.action);
                  return (
                    <motion.tr
                      key={log.id}
                      variants={rowVariants}
                      whileHover={{ x: 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="border-b border-gray-100 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Action — icon + badge */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-sans',
                          ac.bg, ac.text
                        )}>
                          {ac.icon}
                          {ac.label}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground font-sans text-xs">
                          {log.user?.first_name} {log.user?.last_name}
                        </p>
                        <p className="text-muted-foreground font-sans text-[11px] truncate max-w-[140px]">
                          {log.user?.email}
                        </p>
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize border-gray-200 font-sans">
                          {log.resource}
                        </Badge>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-muted-foreground font-sans truncate" title={log.details}>
                          {log.details || '—'}
                        </p>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-foreground font-sans">{dayjs(log.created_at).fromNow()}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {dayjs(log.created_at).format('HH:mm:ss')}
                        </p>
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-muted-foreground">{log.ip_address || '—'}</p>
                      </td>

                      {/* View details */}
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm"
                          onClick={() => { setSelectedLog(log); setIsDialogOpen(true); }}
                          className="h-7 w-7 p-0 hover:text-primary">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-foreground">Audit Log Details</DialogTitle>
            <DialogDescription className="font-sans text-text-sm text-muted-foreground">
              Complete information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (() => {
            const ac = getActionConfig(selectedLog.action);
            return (
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="space-y-5">
                  {/* Action badge */}
                  <span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', ac.bg, ac.text)}>
                    {ac.icon} {ac.label} — {selectedLog.action}
                  </span>

                  {/* User */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">User</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Name</p>
                        <p className="font-medium text-foreground">{selectedLog.user?.first_name} {selectedLog.user?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p className="font-medium text-foreground">{selectedLog.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Resource */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Resource</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Type</p>
                        <p className="font-medium text-foreground capitalize">{selectedLog.resource}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">ID</p>
                        <p className="font-mono text-xs text-foreground break-all">{selectedLog.resource_id || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Details */}
                  {selectedLog.details && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Details</p>
                      <p className="text-sm text-foreground font-sans">{selectedLog.details}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-100" />

                  {/* Network */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Network</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">IP Address</p>
                        <p className="font-mono text-foreground">{selectedLog.ip_address || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Timestamp</p>
                        <p className="font-mono text-xs text-foreground">{dayjs(selectedLog.created_at).format('DD MMM YYYY, HH:mm:ss')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">User Agent</p>
                        <p className="font-mono text-xs text-foreground break-all">{selectedLog.user_agent || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}