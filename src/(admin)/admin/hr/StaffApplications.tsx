import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ClipboardCheck, Loader2, CheckCircle, XCircle, Eye, Copy,
} from 'lucide-react';
import { useAuth } from '@/lib/context/useAuth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  listApplications, getApplication, approveApplication, rejectApplication,
} from '@/lib/api/hr';
import type { StaffApplication, ApplicationStatus, ApproveApplicationPayload } from '@/types/hr';
import { toast } from 'sonner';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: 'bg-caution-tint text-caution',
  approved: 'bg-positive-tint text-positive',
  rejected: 'bg-risk-tint text-risk',
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZM', { year: 'numeric', month: 'short', day: 'numeric' });
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
      toast.error('Temporary password is required');
      return;
    }
    setActionLoading(true);
    try {
      const result = await approveApplication(approveTarget.id, approveForm);
      setApproveResult(result as { temp_password: string });
      toast.success('Application approved — user account created');
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-signal-text" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Applications</h1>
            <p className="text-sm text-gray-500">Review and manage staff onboarding applications</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Applications</CardTitle>
            <Input
              className="sm:w-64"
              placeholder="Search by name, email, position..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              {STATUS_TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : visible.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No applications found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(app => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.first_name} {app.last_name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{app.email}</TableCell>
                    <TableCell>{app.position || '—'}</TableCell>
                    <TableCell className="capitalize">{app.employment_type?.replace('_', ' ') || '—'}</TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[app.status]}>{app.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(app)} title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && app.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" className="text-positive hover:text-positive" onClick={() => openApprove(app)} title="Approve">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-risk hover:text-risk" onClick={() => openReject(app)} title="Reject">
                              <XCircle className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailApp} onOpenChange={open => !open && setDetailApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Name:</span> <strong>{detailApp.first_name} {detailApp.last_name}</strong></div>
                <div><span className="text-gray-500">Email:</span> {detailApp.email}</div>
                <div><span className="text-gray-500">Phone:</span> {detailApp.contact_number || '—'}</div>
                <div><span className="text-gray-500">National ID:</span> {detailApp.national_id || '—'}</div>
                <div><span className="text-gray-500">Position:</span> {detailApp.position || '—'}</div>
                <div><span className="text-gray-500">Type:</span> <span className="capitalize">{detailApp.employment_type?.replace('_', ' ') || '—'}</span></div>
                <div><span className="text-gray-500">Staff No.:</span> {detailApp.employment_number || '—'}</div>
                <div><span className="text-gray-500">Salary Scale:</span> {detailApp.salary_scale || '—'}</div>
                <div><span className="text-gray-500">Status:</span> <Badge className={STATUS_BADGE[detailApp.status]}>{detailApp.status}</Badge></div>
                <div><span className="text-gray-500">Applied:</span> {formatDate(detailApp.created_at)}</div>
              </div>
              {detailApp.reason_for_joining && (
                <div>
                  <p className="text-gray-500 mb-1">Reason for Joining:</p>
                  <p className="bg-gray-50 rounded border p-2">{detailApp.reason_for_joining}</p>
                </div>
              )}
              {detailApp.qualifications && (
                <div>
                  <p className="text-gray-500 mb-1">Qualifications:</p>
                  <p className="bg-gray-50 rounded border p-2">{detailApp.qualifications}</p>
                </div>
              )}
              {detailApp.reviewer_notes && (
                <div>
                  <p className="text-gray-500 mb-1">Reviewer Notes:</p>
                  <p className="bg-gray-50 rounded border p-2">{detailApp.reviewer_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailApp(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={open => { if (!open) { setApproveTarget(null); setApproveResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
          </DialogHeader>
          {approveResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-positive">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Account created successfully</span>
              </div>
              <p className="text-sm text-gray-600">
                Share the temporary password with the new staff member. They should change it on first login.
              </p>
              <div className="flex items-center gap-2 bg-gray-100 rounded p-3">
                <code className="flex-1 text-sm font-mono">{approveResult.temp_password}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(approveResult.temp_password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setApproveTarget(null); setApproveResult(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Approving this application will create a user account for{' '}
                <strong>{approveTarget?.first_name} {approveTarget?.last_name}</strong>.
              </p>
              <div className="space-y-1">
                <Label htmlFor="temp_pw">Temporary Password <span className="text-red-500">*</span></Label>
                <Input
                  id="temp_pw"
                  type="text"
                  value={approveForm.temp_password}
                  onChange={e => setApproveForm(p => ({ ...p, temp_password: e.target.value }))}
                  placeholder="Set a temporary password"
                />
                <p className="text-xs text-gray-400">The staff member will use this to log in for the first time.</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="role_sel">Role</Label>
                <Select value={approveForm.role_id ?? '__none__'} onValueChange={v => setApproveForm(p => ({ ...p, role_id: v === '__none__' ? undefined : v }))}>
                  <SelectTrigger id="role_sel"><SelectValue placeholder="Leave blank for default (HR Officer)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Default (HR Officer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="approve_notes">Reviewer Notes</Label>
                <Textarea
                  id="approve_notes"
                  value={approveForm.reviewer_notes}
                  onChange={e => setApproveForm(p => ({ ...p, reviewer_notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
                <Button onClick={handleApprove} disabled={actionLoading} className="bg-primary hover:bg-signal-hover text-on-signal">
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Approve &amp; Create Account
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
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Rejecting the application from{' '}
            <strong>{rejectTarget?.first_name} {rejectTarget?.last_name}</strong>.
          </p>
          <div className="space-y-1">
            <Label htmlFor="reject_notes">Reason / Notes</Label>
            <Textarea
              id="reject_notes"
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Explain the reason for rejection (optional)..."
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
