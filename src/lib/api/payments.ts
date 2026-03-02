// Mock API for Finance Module - Replace with real API calls when backend is ready

import type { Payment, PaymentFilters, DashboardData, VerifyPaymentRequest, RejectPaymentRequest } from '@/types/finance';
import { getMockPayments, getDashboardData, updatePaymentStatus } from '@/utils/mockFinanceData';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get dashboard statistics and charts data
 */
export async function getFinanceDashboard(): Promise<DashboardData> {
  await delay(800);
  const payments = getMockPayments();
  return getDashboardData(payments);
}

/**
 * Get all payments with optional filters
 */
export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  await delay(600);
  let payments = getMockPayments();
  
  // Apply filters
  if (filters) {
    if (filters.status && filters.status !== 'all') {
      payments = payments.filter(p => p.status === filters.status);
    }
    
    if (filters.payment_type && filters.payment_type !== 'all') {
      payments = payments.filter(p => p.payment_type === filters.payment_type);
    }
    
    if (filters.payment_method && filters.payment_method !== 'all') {
      payments = payments.filter(p => p.payment_method === filters.payment_method);
    }
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      payments = payments.filter(p => new Date(p.payment_date) >= startDate);
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      payments = payments.filter(p => new Date(p.payment_date) <= endDate);
    }
    
    if (filters.min_amount !== undefined) {
      payments = payments.filter(p => p.amount >= filters.min_amount!);
    }
    
    if (filters.max_amount !== undefined) {
      payments = payments.filter(p => p.amount <= filters.max_amount!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      payments = payments.filter(p => 
        p.student_name.toLowerCase().includes(searchLower) ||
        p.payment_ref.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower)
      );
    }
  }
  
  return payments;
}

/**
 * Get a single payment by ID
 */
export async function getPayment(paymentId: string): Promise<Payment | null> {
  await delay(400);
  const payments = getMockPayments();
  return payments.find(p => p.id === paymentId) || null;
}

/**
 * Verify a payment
 */
export async function verifyPayment(request: VerifyPaymentRequest): Promise<Payment | null> {
  await delay(1000);
  return updatePaymentStatus(request.payment_id, 'verified');
}

/**
 * Reject a payment
 */
export async function rejectPayment(request: RejectPaymentRequest): Promise<Payment | null> {
  await delay(1000);
  return updatePaymentStatus(request.payment_id, 'rejected', request.reason);
}

/**
 * Bulk verify payments
 */
export async function bulkVerifyPayments(paymentIds: string[]): Promise<{ success: number; failed: number }> {
  await delay(1500);
  
  let success = 0;
  let failed = 0;
  
  for (const id of paymentIds) {
    const result = updatePaymentStatus(id, 'verified');
    if (result) success++;
    else failed++;
  }
  
  return { success, failed };
}

/**
 * Export payments to CSV format
 */
export function exportPaymentsToCSV(payments: Payment[]): string {
  const headers = [
    'Payment ID',
    'Student Name',
    'Student Email',
    'Amount',
    'Currency',
    'Payment Date',
    'Payment Type',
    'Payment Method',
    'Status',
    'Reference',
    'Verified By',
    'Verified At',
    'Rejection Reason'
  ];
  
  const rows = payments.map(p => [
    p.id,
    p.student_name,
    p.student_email,
    p.amount.toString(),
    p.currency,
    new Date(p.payment_date).toLocaleDateString(),
    p.payment_type,
    p.payment_method,
    p.status,
    p.payment_ref,
    p.verified_by_name || '',
    p.verified_at ? new Date(p.verified_at).toLocaleDateString() : '',
    p.rejection_reason || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'payments_export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
