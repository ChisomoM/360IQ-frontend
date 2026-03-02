/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Payment, PaymentStatus, PaymentMethod, PaymentType, PaymentStats, DashboardData } from '@/types/finance';

// Mock student names for realistic data
const STUDENT_NAMES = [
  'John Mwamba', 'Mary Banda', 'Peter Phiri', 'Grace Tembo', 'Joseph Daka',
  'Elizabeth Mulenga', 'David Sakala', 'Sarah Zulu', 'Michael Kaunda', 'Ruth Chanda',
  'Christopher Lungu', 'Agnes Mutale', 'Patrick Ngoma', 'Faith Sichone', 'Daniel Musonda',
  'Esther Kabwe', 'George Chola', 'Beatrice Nkole', 'Richard Banda', 'Martha Phiri',
  'Emmanuel Mwale', 'Catherine Zimba', 'Francis Kasonde', 'Joyce Mbewe', 'Vincent Tembo',
  'Alice Hamukoma', 'Thomas Sililo', 'Rose Mwanza', 'Andrew Kunda', 'Mercy Siame',
  'Stephen Mumba', 'Priscilla Banda', 'Simon Mulenga', 'Charity Lubasi', 'Moses Chishimba',
  'Eunice Kaponda', 'Isaac Lupiya', 'Dorothy Mwape', 'Samuel Katongo', 'Janet Chilufya'
];

const PAYMENT_TYPES: PaymentType[] = ['application_fee', 'tuition_fee', 'registration_fee', 'accommodation_fee', 'custom'];
const PAYMENT_METHODS: PaymentMethod[] = ['bank_transfer', 'online', 'cash', 'mobile_money'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'verified', 'rejected'];

// Helper to generate random date in the last 12 months
function getRandomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Helper to generate payment amount based on type
function getAmountForType(type: PaymentType): number {
  switch (type) {
    case 'application_fee':
      return 150 + Math.floor(Math.random() * 50); // K150-200
    case 'tuition_fee':
      return 5000 + Math.floor(Math.random() * 3000); // K5000-8000
    case 'registration_fee':
      return 500 + Math.floor(Math.random() * 300); // K500-800
    case 'accommodation_fee':
      return 2000 + Math.floor(Math.random() * 1000); // K2000-3000
    case 'custom':
      return 100 + Math.floor(Math.random() * 500); // K100-600
    default:
      return 500;
  }
}

// Generate a single payment
function generatePayment(index: number, daysAgo: number): Payment {
  const paymentDate = getRandomDate(daysAgo);
  const createdDate = new Date(paymentDate);
  createdDate.setHours(createdDate.getHours() - Math.floor(Math.random() * 24));
  
  const studentName = STUDENT_NAMES[index % STUDENT_NAMES.length];
  const paymentType = PAYMENT_TYPES[Math.floor(Math.random() * PAYMENT_TYPES.length)];
  const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
  
  // 60% verified, 30% pending, 10% rejected
  const rand = Math.random();
  let status: PaymentStatus;
  if (rand < 0.6) status = 'verified';
  else if (rand < 0.9) status = 'pending';
  else status = 'rejected';
  
  const amount = getAmountForType(paymentType);
  
  const payment: Payment = {
    id: `PAY-${String(index + 1).padStart(6, '0')}`,
    student_id: `STU-${String((index % 40) + 1).padStart(4, '0')}`,
    student_name: studentName,
    student_email: `${studentName.toLowerCase().replace(' ', '.')}@student.unilus.ac.zm`,
    amount,
    currency: 'ZMW',
    payment_date: paymentDate.toISOString(),
    payment_method: paymentMethod,
    payment_type: paymentType,
    payment_ref: `REF${Date.now()}${index}`.substring(0, 15),
    status,
    notes: Math.random() > 0.7 ? 'Payment verified successfully' : '',
    proof_document_url: `/mock-receipts/receipt-${index + 1}.pdf`,
    created_at: createdDate.toISOString(),
    updated_at: paymentDate.toISOString(),
  };
  
  // Add verification details if verified or rejected
  if (status === 'verified' || status === 'rejected') {
    const verifiedDate = new Date(paymentDate);
    verifiedDate.setHours(verifiedDate.getHours() + Math.floor(Math.random() * 72)); // 0-3 days later
    payment.verified_at = verifiedDate.toISOString();
    payment.verified_by_id = 'USR-001';
    payment.verified_by_name = 'Finance Officer';
    
    if (status === 'rejected') {
      const reasons = [
        'Invalid payment reference',
        'Amount mismatch',
        'Duplicate payment',
        'Unclear proof of payment',
        'Wrong account details'
      ];
      payment.rejection_reason = reasons[Math.floor(Math.random() * reasons.length)];
    }
  }
  
  return payment;
}

// Generate all mock payments
export function generateMockPayments(count: number = 150): Payment[] {
  const payments: Payment[] = [];
  
  for (let i = 0; i < count; i++) {
    payments.push(generatePayment(i, 365)); // Last 365 days
  }
  
  // Sort by payment date descending (newest first)
  return payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
}

// Calculate payment statistics
export function calculatePaymentStats(payments: Payment[]): PaymentStats {
  const verified = payments.filter(p => p.status === 'verified');
  const pending = payments.filter(p => p.status === 'pending');
  const rejected = payments.filter(p => p.status === 'rejected');
  
  const totalRevenue = verified.reduce((sum, p) => sum + p.amount, 0);
  const pendingRevenue = pending.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate this month's revenue
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthVerified = verified.filter(p => new Date(p.payment_date) >= thisMonthStart);
  const monthlyRevenue = thisMonthVerified.reduce((sum, p) => sum + p.amount, 0);
  
  const successRate = payments.length > 0 
    ? ((verified.length / (verified.length + rejected.length)) * 100) 
    : 0;
  
  const averagePayment = verified.length > 0 
    ? totalRevenue / verified.length 
    : 0;
  
  return {
    total_revenue: totalRevenue,
    pending_revenue: pendingRevenue,
    monthly_revenue: monthlyRevenue,
    payment_count: payments.length,
    pending_count: pending.length,
    verified_count: verified.length,
    rejected_count: rejected.length,
    success_rate: successRate,
    average_payment: averagePayment,
  };
}

// Generate revenue trend for last 6 months
export function generateRevenueTrend(payments: Payment[]) {
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return p.status === 'verified' && 
             paymentDate >= monthDate && 
             paymentDate <= monthEnd;
    });
    
    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    months.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue,
      count: monthPayments.length,
    });
  }
  
  return months;
}

// Generate payment type breakdown
export function generatePaymentTypeBreakdown(payments: Payment[]) {
  const verified = payments.filter(p => p.status === 'verified');
  const totalRevenue = verified.reduce((sum, p) => sum + p.amount, 0);
  
  const breakdown = PAYMENT_TYPES.map(type => {
    const typePayments = verified.filter(p => p.payment_type === type);
    const total = typePayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      type,
      count: typePayments.length,
      total,
      percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0,
    };
  });
  
  return breakdown.filter(b => b.count > 0);
}

// Generate payment method breakdown
export function generatePaymentMethodBreakdown(payments: Payment[]) {
  const verified = payments.filter(p => p.status === 'verified');
  const totalRevenue = verified.reduce((sum, p) => sum + p.amount, 0);
  
  const breakdown = PAYMENT_METHODS.map(method => {
    const methodPayments = verified.filter(p => p.payment_method === method);
    const total = methodPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      method,
      count: methodPayments.length,
      total,
      percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0,
    };
  });
  
  return breakdown.filter(b => b.count > 0);
}

// Get dashboard data
export function getDashboardData(payments: Payment[]): DashboardData {
  return {
    stats: calculatePaymentStats(payments),
    revenue_trend: generateRevenueTrend(payments),
    payment_type_breakdown: generatePaymentTypeBreakdown(payments),
    payment_method_breakdown: generatePaymentMethodBreakdown(payments),
    recent_activities: payments.slice(0, 10),
  };
}

// Singleton instance
let mockPayments: Payment[] | null = null;

export function getMockPayments(): Payment[] {
  if (!mockPayments) {
    mockPayments = generateMockPayments(150);
  }
  return mockPayments;
}

// Update payment status (for UI demo)
export function updatePaymentStatus(
  paymentId: string, 
  status: PaymentStatus, 
  reason?: string
): Payment | null {
  const payments = getMockPayments();
  const payment = payments.find(p => p.id === paymentId);
  
  if (!payment) return null;
  
  payment.status = status;
  payment.verified_at = new Date().toISOString();
  payment.verified_by_name = 'Current User';
  payment.updated_at = new Date().toISOString();
  
  if (status === 'rejected' && reason) {
    payment.rejection_reason = reason;
  }
  
  return payment;
}
