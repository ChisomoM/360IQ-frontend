import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardCheck, Loader2, CheckCircle, XCircle, Eye, Copy, Search,
} from '@/components/icons';
import { useAuth } from '@/lib/context/useAuth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  listApplications, getApplication, approveApplication, rejectApplication,
} from '@/lib/api/hr';
import type { StaffApplication, ApplicationStatus, ApproveApplicationPayload } from '@/types/hr';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { formatDate as formatDisplayDate } from '@/lib/format';

function formatDate(d?: string) {
  return formatDisplayDate(d) || 'N/A';
}

function formatType(type?: string) {
  const words = type?.replace('_', ' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'N/A';
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words font-medium text-text-primary ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

type StatusFilter = 'all' | ApplicationStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function StaffApplications() {
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.HR_APPLICATIONS_MANAGE);

  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // Detail / Approve / Reject dialogs
  const [detailApp, setDetailApp] = useState<StaffApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<StaffApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StaffApplication | null>(null);
  const [approveForm, setApproveForm] = useState<ApproveApplicationPayload>({ temp_password: '', reviewer_notes: '' });
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [approveResult, setApproveResult] = useState<{ temp_password: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listApplications(statusFilter === 'all' ? undefined : statusFilter)
      .then(setApplications)
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const visible = applications.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.position ?? '').toLowerCase().includes(q)
    );
  });

  const openDetail = (app: StaffApplication) => {
    getApplication(app.id).then(setDetailApp).catch(() => toast.error('Failed to load application details'));
  };

  const openApprove = (app: StaffApplication) => {
    setApproveTarget(app);
    setApproveForm({ temp_password: '', reviewer_notes: '' });
    setApproveResult(null);
  };

  const openReject = (app: StaffApplication) => {
    setRejectTarget(app);
    setRejectNotes('');
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    if (!approveForm.temp_password) {
      toast.error('Set a temporary password.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await approveApplication(approveTarget.id, approveForm);
      setApproveResult(result as { temp_password: string });
      toast.success('Application approved. User account created.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await rejectApplication(rejectTarget.id, rejectNotes);
      toast.success('Application rejected');
      setRejectTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Staff applications"
        description="Review staff onboarding applications."
      />

      <SectionCard padded={false}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-line">
          <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              {STATUS_TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              className="pl-9"
              aria-label="Search applications"
              placeholder="Search by name, email or position"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={24} />}
            title="No applications found"
            description="Change your search or status filter to see more."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Applicant</TableHead>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Position</TableHead>
                <TableHead scope="col">Type</TableHead>
                <TableHead scope="col">Applied</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(app => (
                <TableRow key={app.id}>
                  <TableCell className="font-semibold">{app.first_name} {app.last_name}</TableCell>
                  <TableCell className="text-text-secondary">{app.email}</TableCell>
                  <TableCell className="text-text-secondary">{app.position || 'N/A'}</TableCell>
                  <TableCell className="text-text-secondary">{formatType(app.employment_type)}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{formatDate(app.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDetail(app)} title="View details" aria-label="View details">
                        <Eye />
                      </Button>
                      {canManage && app.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-positive hover:text-positive hover:bg-positive-tint" onClick={() => openApprove(app)} title="Approve" aria-label="Approve">
                            <CheckCircle />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-risk hover:text-risk hover:bg-risk-tint" onClick={() => openReject(app)} title="Reject" aria-label="Reject">
                            <XCircle />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {/* Detail Dialog */}
      <Dialog open={!!detailApp} onOpenChange={open => !open && setDetailApp(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application details</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                <Detail label="Name" value={`${detailApp.first_name} ${detailApp.last_name}`} />
                <Detail label="Email" value={detailApp.email} />
                <Detail label="Phone" mono value={detailApp.contact_number || 'N/A'} />
                <Detail label="National ID" mono value={detailApp.national_id || 'N/A'} />
                <Detail label="Position" value={detailApp.position || 'N/A'} />
                <Detail label="Type" value={formatType(detailApp.employment_type)} />
                <Detail label="Staff number" mono value={detailApp.employment_number || 'N/A'} />
                <Detail label="Salary scale" mono value={detailApp.salary_scale || 'N/A'} />
                <Detail label="Status" value={<StatusBadge status={detailApp.status} />} />
                <Detail label="Applied" mono value={formatDate(detailApp.created_at)} />
              </dl>
              {detailApp.reason_for_joining && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Reason for joining</p>
                  <p className="rounded-md bg-field p-3 text-text-primary">{detailApp.reason_for_joining}</p>
                </div>
              )}
              {detailApp.qualifications && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Qualifications</p>
                  <p className="rounded-md bg-field p-3 text-text-primary">{detailApp.qualifications}</p>
                </div>
              )}
              {detailApp.reviewer_notes && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Reviewer notes</p>
                  <p className="rounded-md bg-field p-3 text-text-primary">{detailApp.reviewer_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDetailApp(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={open => { if (!open) { setApproveTarget(null); setApproveResult(null); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
          </DialogHeader>
          {approveResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-positive">
                <CheckCircle size={20} />
                <span className="font-semibold">Account created</span>
              </div>
              <p className="text-sm text-text-secondary">
                Share the temporary password with the new staff member. They should change it the first time they sign in.
              </p>
              <div className="flex items-center gap-2 bg-field rounded-md p-3">
                <code className="flex-1 break-all text-sm font-mono text-text-primary">{approveResult.temp_password}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Copy password" title="Copy password" onClick={() => copyToClipboard(approveResult.temp_password)}>
                  <Copy />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setApproveTarget(null); setApproveResult(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Approving creates a user account for{' '}
                <strong className="text-text-primary">{approveTarget?.first_name} {approveTarget?.last_name}</strong>.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="temp_pw">Temporary password</Label>
                <Input
                  id="temp_pw"
                  type="text"
                  className="font-mono"
                  value={approveForm.temp_password}
                  onChange={e => setApproveForm(p => ({ ...p, temp_password: e.target.value }))}
                />
                <p className="text-xs text-text-muted">The staff member uses this to sign in for the first time.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role_sel">Role</Label>
                <Select value={approveForm.role_id ?? '__none__'} onValueChange={v => setApproveForm(p => ({ ...p, role_id: v === '__none__' ? undefined : v }))}>
                  <SelectTrigger id="role_sel"><SelectValue placeholder="Default (HR officer)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Default (HR officer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="approve_notes">Reviewer notes (optional)</Label>
                <Textarea
                  id="approve_notes"
                  value={approveForm.reviewer_notes}
                  onChange={e => setApproveForm(p => ({ ...p, reviewer_notes: e.target.value }))}
                  rows={2}
                />
              </div>
              <DialogFooter className="gap-3">
                <Button variant="secondary" onClick={() => setApproveTarget(null)}>Cancel</Button>
                <Button onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="animate-spin" />}
                  Approve and create account
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={open => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            You are rejecting the application from{' '}
            <strong className="text-text-primary">{rejectTarget?.first_name} {rejectTarget?.last_name}</strong>.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reject_notes">Reason (optional)</Label>
            <Textarea
              id="reject_notes"
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="animate-spin" />}
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
