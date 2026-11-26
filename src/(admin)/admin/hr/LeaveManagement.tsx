import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { CalendarDays, Plus, Loader2, CheckCircle, XCircle } from '@/components/icons';
import { useAuth } from '@/lib/context/useAuth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  listLeaveRequests, createLeaveRequest,
  approveLeaveRequest, rejectLeaveRequest,
} from '@/lib/api/hr';
import type { LeaveRequest, CreateLeaveRequestPayload, LeaveType, LeaveStatus } from '@/types/hr';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { formatDate as formatDisplayDate } from '@/lib/format';

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity',
  paternity: 'Paternity', compassionate: 'Compassionate', unpaid: 'Unpaid',
};

function formatDate(d?: string) {
  return formatDisplayDate(d) || 'N/A';
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
      toast.error('Choose a leave type, start date and end date.');
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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Leave management"
        description="Track and review staff leave requests."
        actions={canRequest && (
          <Button onClick={() => setShowRequest(true)}>
            <Plus /> Request leave
          </Button>
        )}
      />

      <SectionCard padded={false}>
        <div className="p-4 border-b border-line">
          <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              {STATUS_TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="No leave requests found"
            description="Requests appear here once they are submitted. Try another status."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Staff</TableHead>
                <TableHead scope="col">Leave type</TableHead>
                <TableHead scope="col">Start date</TableHead>
                <TableHead scope="col">End date</TableHead>
                <TableHead scope="col" className="text-right">Days</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Reason</TableHead>
                {canManage && <TableHead scope="col" className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    <p className="font-semibold text-text-primary">
                      {req.staff?.first_name} {req.staff?.last_name}
                    </p>
                    <p className="text-xs text-text-muted">{req.staff?.email}</p>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{formatDate(req.start_date)}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{formatDate(req.end_date)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-text-secondary">{req.total_days}</TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-text-secondary">
                    {req.reason ?? 'N/A'}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-positive hover:text-positive hover:bg-positive-tint"
                            title="Approve"
                            aria-label="Approve"
                            onClick={() => setActionTarget({ request: req, mode: 'approve' })}>
                            <CheckCircle />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-risk hover:text-risk hover:bg-risk-tint"
                            title="Reject"
                            aria-label="Reject"
                            onClick={() => setActionTarget({ request: req, mode: 'reject' })}>
                            <XCircle />
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
      </SectionCard>

      {/* Request Leave Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Leave type</Label>
              <Select
                value={requestForm.leave_type}
                onValueChange={v => setRequestForm(f => ({ ...f, leave_type: v as LeaveType }))}>
                <SelectTrigger aria-label="Leave type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" aria-label="Start date"
                  value={requestForm.start_date ?? ''}
                  onChange={e => setRequestForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" aria-label="End date"
                  value={requestForm.end_date ?? ''}
                  min={requestForm.start_date}
                  onChange={e => setRequestForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                rows={3}
                aria-label="Reason"
                value={requestForm.reason ?? ''}
                onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="secondary" onClick={() => setShowRequest(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting}>
              {requesting && <Loader2 className="animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject Dialog */}
      <Dialog open={!!actionTarget} onOpenChange={o => !o && setActionTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.mode === 'approve' ? 'Approve' : 'Reject'} leave request
            </DialogTitle>
          </DialogHeader>
          {actionTarget && (
            <div className="space-y-3 text-sm">
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">
                  {actionTarget.request.staff?.first_name} {actionTarget.request.staff?.last_name}
                </span>
                , {LEAVE_TYPE_LABELS[actionTarget.request.leave_type]} leave,{' '}
                {actionTarget.request.total_days} days,{' '}
                {formatDate(actionTarget.request.start_date)} to {formatDate(actionTarget.request.end_date)}.
              </p>
              <div className="space-y-1.5">
                <Label>Comment (optional)</Label>
                <Textarea
                  rows={3}
                  aria-label="Comment"
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="secondary" onClick={() => setActionTarget(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={actioning}
              variant={actionTarget?.mode === 'reject' ? 'destructive' : 'default'}>
              {actioning && <Loader2 className="animate-spin" />}
              {actionTarget?.mode === 'approve' ? 'Approve leave' : 'Reject leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
