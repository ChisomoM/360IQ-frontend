// Finance Module Type Definitions

export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type PaymentMethod = 'bank_transfer' | 'online' | 'cash' | 'mobile_money';
export type PaymentType = 'application_fee' | 'tuition_fee' | 'registration_fee' | 'accommodation_fee' | 'custom';

export interface Payment {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  payment_ref: string;
  status: PaymentStatus;
  verified_by_id?: string;
  verified_by_name?: string;
  verified_at?: string;
  rejection_reason?: string;
  notes?: string;
  proof_document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFilters {
  status?: PaymentStatus | 'all';
  payment_type?: PaymentType | 'all';
  payment_method?: PaymentMethod | 'all';
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface PaymentStats {
  total_revenue: number;
  pending_revenue: number;
  monthly_revenue: number;
  payment_count: number;
  pending_count: number;
  verified_count: number;
  rejected_count: number;
  success_rate: number;
  average_payment: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  count: number;
}

export interface PaymentTypeBreakdown {
  type: PaymentType;
  count: number;
  total: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  count: number;
  total: number;
  percentage: number;
}

export interface DashboardData {
  stats: PaymentStats;
  revenue_trend: RevenueByMonth[];
  payment_type_breakdown: PaymentTypeBreakdown[];
  payment_method_breakdown: PaymentMethodBreakdown[];
  recent_activities: Payment[];
}

export interface VerifyPaymentRequest {
  payment_id: string;
  notes?: string;
}

export interface RejectPaymentRequest {
  payment_id: string;
  reason: string;
}
