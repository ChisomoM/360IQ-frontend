import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { getPayments, verifyPayment, rejectPayment, bulkVerifyPayments, exportPaymentsToCSV, downloadCSV } from '@/lib/api/payments';
import type { Payment, PaymentFilters } from '@/types/finance';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';

export default function PaymentManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'all',
    payment_type: 'all',
    payment_method: 'all',
    search: '',
  });

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, payments]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.payment_type && filters.payment_type !== 'all') {
      filtered = filtered.filter(p => p.payment_type === filters.payment_type);
    }

    if (filters.payment_method && filters.payment_method !== 'all') {
      filtered = filtered.filter(p => p.payment_method === filters.payment_method);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.student_name.toLowerCase().includes(searchLower) ||
        p.payment_ref.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
  };

  const handleVerify = async (payment: Payment) => {
    // Check permissions
    const canProcessSmall = hasPermission(user, PERMISSIONS.PROCESS_PAYMENT_SMALL);
    const canProcessLarge = hasPermission(user, PERMISSIONS.PROCESS_PAYMENT_LARGE);
    
    if (payment.amount > 3000 && !canProcessLarge) {
      toast.error('You do not have permission to verify payments over K3,000');
      return;
    }
    
    if (payment.amount <= 3000 && !canProcessSmall && !canProcessLarge) {
      toast.error('You do not have permission to verify payments');
      return;
    }

    try {
      setActionLoading(true);
      await verifyPayment({ payment_id: payment.id });
      toast.success(`Payment ${payment.id} verified successfully`);
      loadPayments();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await rejectPayment({ 
        payment_id: selectedPayment.id, 
        reason: rejectReason 
      });
      toast.success(`Payment ${selectedPayment.id} rejected`);
      loadPayments();
      setShowRejectDialog(false);
      setShowDetailsDialog(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) {
      toast.error('No payments selected');
      return;
    }

    // Check if all selected payments can be verified
    const selectedPayments = payments.filter(p => selectedIds.has(p.id));
    const canProcessSmall = hasPermission(user, PERMISSIONS.PROCESS_PAYMENT_SMALL);
    const canProcessLarge = hasPermission(user, PERMISSIONS.PROCESS_PAYMENT_LARGE);
    
    const hasLargePayments = selectedPayments.some(p => p.amount > 3000);
    if (hasLargePayments && !canProcessLarge) {
      toast.error('Cannot verify: Some selected payments exceed K3,000 and require higher permissions');
      return;
    }
    
    if (!canProcessSmall && !canProcessLarge) {
      toast.error('You do not have permission to verify payments');
      return;
    }

    try {
      setActionLoading(true);
      const result = await bulkVerifyPayments(Array.from(selectedIds));
      toast.success(`Verified ${result.success} payments successfully`);
      if (result.failed > 0) {
        toast.warning(`Failed to verify ${result.failed} payments`);
      }
      loadPayments();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk verifying:', error);
      toast.error('Failed to verify payments');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const csv = exportPaymentsToCSV(filteredPayments);
    const filename = `payments_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csv, filename);
    toast.success('Payments exported successfully');
  };

  const toggleSelection = (paymentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedIds(newSelected);
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const canManagePayments = hasPermission(user, PERMISSIONS.PROCESS_PAYMENT_SMALL) || 
                           hasPermission(user, PERMISSIONS.PROCESS_PAYMENT_LARGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Manage and verify student payments</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Student name, ref..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Type Filter */}
            <div>
              <Label>Payment Type</Label>
              <Select
                value={filters.payment_type}
                onValueChange={(value) => setFilters({ ...filters, payment_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="application_fee">Application Fee</SelectItem>
                  <SelectItem value="tuition_fee">Tuition Fee</SelectItem>
                  <SelectItem value="registration_fee">Registration Fee</SelectItem>
                  <SelectItem value="accommodation_fee">Accommodation Fee</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <Label>Payment Method</Label>
              <Select
                value={filters.payment_method}
                onValueChange={(value) => setFilters({ ...filters, payment_method: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {filteredPayments.length} of {payments.length} payments
            </p>
            <Button
              variant="ghost"
              onClick={() => setFilters({
                status: 'all',
                payment_type: 'all',
                payment_method: 'all',
                search: '',
              })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && canManagePayments && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {selectedIds.size} payment{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleBulkVerify}
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-blue" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow>
                    {canManagePayments && (
                      <TableHead className="text-white w-12">
                        <Checkbox
                          checked={selectedIds.size === filteredPayments.filter(p => p.status === 'pending').length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds(new Set(filteredPayments.filter(p => p.status === 'pending').map(p => p.id)));
                            } else {
                              setSelectedIds(new Set());
                            }
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead className="text-white">Payment ID</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Student</TableHead>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Method</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      {canManagePayments && (
                        <TableCell>
                          {payment.status === 'pending' && (
                            <Checkbox
                              checked={selectedIds.has(payment.id)}
                              onCheckedChange={() => toggleSelection(payment.id)}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.student_name}</p>
                          <p className="text-xs text-gray-500">{payment.student_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {payment.payment_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {payment.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        K{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Full information for payment {selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Student Name</Label>
                  <p className="font-medium">{selectedPayment.student_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Student Email</Label>
                  <p className="font-medium text-sm">{selectedPayment.student_email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Amount</Label>
                  <p className="font-bold text-lg">K{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Payment Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedPayment.payment_date), 'PPP')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Payment Type</Label>
                  <p className="font-medium capitalize">
                    {selectedPayment.payment_type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Payment Method</Label>
                  <p className="font-medium capitalize">
                    {selectedPayment.payment_method.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Reference</Label>
                  <p className="font-mono text-sm">{selectedPayment.payment_ref}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {selectedPayment.verified_at && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500">Verification Details</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      Verified by: <span className="font-medium">{selectedPayment.verified_by_name}</span>
                    </p>
                    <p className="text-sm">
                      Date: <span className="font-medium">
                        {format(new Date(selectedPayment.verified_at), 'PPP')}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {selectedPayment.rejection_reason && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500">Rejection Reason</Label>
                  <p className="mt-2 text-sm text-red-600">{selectedPayment.rejection_reason}</p>
                </div>
              )}

              {selectedPayment.notes && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500">Notes</Label>
                  <p className="mt-2 text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedPayment?.status === 'pending' && canManagePayments && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowRejectDialog(true);
                  }}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerify(selectedPayment)}
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Payment
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
