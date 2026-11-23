import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/context/useAuth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  listLeaveRequests, createLeaveRequest,
  approveLeaveRequest, rejectLeaveRequest,
} from '@/lib/api/hr';
import type { LeaveRequest, CreateLeaveRequestPayload, LeaveType, LeaveStatus } from '@/types/hr';
import { toast } from 'sonner';

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity',
  paternity: 'Paternity', compassionate: 'Compassionate', unpaid: 'Unpaid',
};

const STATUS_BADGE: Record<LeaveStatus, string> = {
  pending: 'bg-caution-tint text-caution',
  approved: 'bg-positive-tint text-positive',
  rejected: 'bg-risk-tint text-risk',
  cancelled: 'bg-gray-100 text-gray-600',
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZM', { year: 'numeric', month: 'short', day: 'numeric' });
}

type StatusFilter = 'all' | LeaveStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function LeaveManagement() {
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.HR_LEAVE_MANAGE);
  const canRequest = hasPermission(user, PERMISSIONS.HR_LEAVE_REQUEST);

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Request submission
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState<Partial<CreateLeaveRequestPayload>>({
    leave_type: 'annual',
  });
  const [requesting, setRequesting] = useState(false);

  // Approve/Reject dialog
  const [actionTarget, setActionTarget] = useState<{
    request: LeaveRequest; mode: 'approve' | 'reject'
  } | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actioning, setActioning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    listLeaveRequests(params)
      .then(setRequests)
      .catch(() => toast.error('Failed to load leave requests'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async () => {
    if (!requestForm.leave_type || !requestForm.start_date || !requestForm.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setRequesting(true);
    try {
      await createLeaveRequest(requestForm as CreateLeaveRequestPayload);
      toast.success('Leave request submitted');
      setShowRequest(false);
      setRequestForm({ leave_type: 'annual' });
      load();
    } catch {
      toast.error('Failed to submit leave request');
    } finally {
      setRequesting(false);
    }
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setActioning(true);
    try {
      if (actionTarget.mode === 'approve') {
        await approveLeaveRequest(actionTarget.request.id, actionComment);
        toast.success('Leave request approved');
      } else {
        await rejectLeaveRequest(actionTarget.request.id, actionComment);
        toast.success('Leave request rejected');
      }
      setActionTarget(null);
      setActionComment('');
      load();
    } catch {
      toast.error(`Failed to ${actionTarget.mode} request`);
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Track and manage staff leave requests</p>
        </div>
        {canRequest && (
          <Button onClick={() => setShowRequest(true)} className="bg-primary hover:bg-signal-hover text-on-signal">
            <Plus className="mr-2 h-4 w-4" /> Request Leave
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> Leave Requests
          </CardTitle>
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
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <p className="font-medium text-gray-900">
                        {req.staff?.first_name} {req.staff?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{req.staff?.email}</p>
                    </TableCell>
                    <TableCell>
                      {LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type}
                    </TableCell>
                    <TableCell>{formatDate(req.start_date)}</TableCell>
                    <TableCell>{formatDate(req.end_date)}</TableCell>
                    <TableCell>{req.total_days}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[req.status]}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-gray-600">
                      {req.reason ?? '—'}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-positive border-line hover:bg-positive-tint"
                              onClick={() => setActionTarget({ request: req, mode: 'approve' })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-risk border-line hover:bg-risk-tint"
                              onClick={() => setActionTarget({ request: req, mode: 'reject' })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Leave Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Leave Type <span className="text-red-500">*</span></Label>
              <Select
                value={requestForm.leave_type}
                onValueChange={v => setRequestForm(f => ({ ...f, leave_type: v as LeaveType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date <span className="text-red-500">*</span></Label>
                <Input type="date"
                  value={requestForm.start_date ?? ''}
                  onChange={e => setRequestForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date <span className="text-red-500">*</span></Label>
                <Input type="date"
                  value={requestForm.end_date ?? ''}
                  min={requestForm.start_date}
                  onChange={e => setRequestForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Textarea
                rows={3}
                placeholder="Optional reason for leave request"
                value={requestForm.reason ?? ''}
                onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting} className="bg-primary hover:bg-signal-hover text-on-signal">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject Dialog */}
      <Dialog open={!!actionTarget} onOpenChange={o => !o && setActionTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionTarget?.mode} Leave Request
            </DialogTitle>
          </DialogHeader>
          {actionTarget && (
            <div className="space-y-3 py-2 text-sm">
              <p>
                <span className="font-medium">
                  {actionTarget.request.staff?.first_name} {actionTarget.request.staff?.last_name}
                </span>{' '}
                — {LEAVE_TYPE_LABELS[actionTarget.request.leave_type]}{' '}
                ({actionTarget.request.total_days} days,{' '}
                {formatDate(actionTarget.request.start_date)} – {formatDate(actionTarget.request.end_date)})
              </p>
              <div className="space-y-1">
                <Label>Comment (optional)</Label>
                <Textarea
                  rows={3}
                  placeholder="Add a comment..."
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={actioning}
              className={actionTarget?.mode === 'approve'
                ? 'bg-positive hover:opacity-90 text-white'
                : 'bg-risk hover:opacity-90 text-white'}>
              {actioning
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : actionTarget?.mode === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
