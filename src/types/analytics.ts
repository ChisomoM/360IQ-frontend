/**
 * Analytics API Type Definitions
 * Auto-generated from OpenAPI spec: Backend/docs/analytics_api.openapi.yaml
 */

/**
 * Status count breakdown
 */
export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Student enrollment status distribution
 */
export interface StudentStatusDistribution {
  status_counts: StatusCount[];
  total: number;
}

/**
 * Single data point in enrollment trend
 */
export interface EnrollmentDataPoint {
  period: string; // Format: YYYY-MM or YYYY-MM-DD
  count: number;
  change_pct: number; // Period-over-period change percentage
  cumulative: number; // Cumulative enrollment up to this period
  timestamp: string; // ISO 8601 datetime
}

/**
 * Summary statistics for enrollment trends
 */
export interface EnrollmentSummary {
  total: number;
  average_per_period: number;
  period_count: number;
  growth_rate: number; // Overall growth rate percentage
}

/**
 * Complete enrollment trend data with time series
 */
export interface EnrollmentTrendData {
  series: EnrollmentDataPoint[];
  summary: EnrollmentSummary;
}

/**
 * Application data point for volume metrics
 */
export interface ApplicationDataPoint {
  period: string; // Format: YYYY-MM or YYYY-MM-DD
  status_counts: Record<string, number>; // e.g., { pending: 20, approved: 15, rejected: 5 }
  total: number;
  timestamp: string; // ISO 8601 datetime
}

/**
 * Application volume metrics over time
 */
export interface ApplicationVolumeMetrics {
  series: ApplicationDataPoint[];
  status_summary: Record<string, number>; // Overall count by status
  total: number;
}

/**
 * Approval rate data
 */
export interface ApprovalRateData {
  total_reviewed: number;
  approved: number;
  rejected: number;
  approval_rate: number; // Percentage
  rejection_rate: number; // Percentage
}

/**
 * Approval rate breakdown by program
 */
export interface ProgramApprovalRate {
  programme: string;
  total_applications: number;
  approved: number;
  rejected: number;
  approval_rate: number; // Percentage
}

/**
 * Approval rate breakdown by reviewer
 */
export interface ReviewerApprovalRate {
  reviewer_id: string; // UUID
  reviewer_name: string;
  total_reviewed: number;
  approved: number;
  rejected: number;
  approval_rate: number; // Percentage
  avg_processing_days: number; // Average days to process an application
}

/**
 * Complete approval rate report with multiple breakdowns
 */
export interface ApprovalRateReport {
  overall: ApprovalRateData;
  by_program: ProgramApprovalRate[];
  by_reviewer: ReviewerApprovalRate[];
  time_period: string; // e.g., "2025-01-01 to 2026-01-31"
}

/**
 * Program metrics for popularity ranking
 */
export interface ProgramMetrics {
  programme: string;
  department_id: string; // UUID
  department_name: string;
  total_applications: number;
  approved: number;
  enrolled: number;
  conversion_rate: number; // Percentage (enrolled/applications)
  rank: number; // 1-based ranking
}

/**
 * Program popularity ranking data
 */
export interface ProgramPopularityData {
  programs: ProgramMetrics[];
  total: number; // Total applications across all programs
}

/**
 * Single funnel stage
 */
export interface FunnelStage {
  stage: 'pending' | 'under_review' | 'approved' | 'enrolled';
  count: number; // Number of applications at this stage
  percentage: number; // Percentage of all started applications
  drop_off_count: number; // Number that dropped off to next stage
  drop_off_pct: number; // Percentage that dropped off
  conversion_pct: number; // Percentage that converted (made it to this stage)
}

/**
 * Application funnel with stage progression and drop-off analysis
 */
export interface ApplicationFunnelData {
  stages: FunnelStage[];
  total_started: number;
  total_enrolled: number;
  overall_conversion: number; // Percentage
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

/**
 * Query parameters for analytics endpoints
 */
export interface AnalyticsFilters {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  granularity?: 'day' | 'week' | 'month'; // Default: month
  department_id?: string; // UUID
  programme?: string;
  limit?: number; // Default: 20
  offset?: number; // Default: 0
}

/**
 * Type for enrollment trends query
 */
export interface EnrollmentTrendsParams extends AnalyticsFilters {
  granularity?: 'day' | 'week' | 'month';
}

/**
 * Type for application volume query
 */
export interface ApplicationVolumeParams extends AnalyticsFilters {
  granularity?: 'day' | 'week' | 'month';
}

/**
 * Type for approval rate query
 */
export interface ApprovalRateParams extends AnalyticsFilters {
  // Inherits start_date, end_date, department_id, programme
}

/**
 * Type for application funnel query
 */
export interface ApplicationFunnelParams extends AnalyticsFilters {
  // Inherits start_date, end_date, department_id, programme
}

/**
 * Type for program popularity query
 */
export interface ProgramPopularityParams extends AnalyticsFilters {
  limit?: number; // Default: 20, typically 5-20 for rankings
}

/**
 * Dashboard data aggregating multiple reports
 */
export interface AnalyticsDashboard {
  statusDistribution?: StudentStatusDistribution;
  enrollmentTrends?: EnrollmentTrendData;
  applicationVolume?: ApplicationVolumeMetrics;
  approvalRates?: ApprovalRateReport;
  programPopularity?: ProgramPopularityData;
  applicationFunnel?: ApplicationFunnelData;
  lastUpdated: string; // ISO 8601 datetime
}

/**
 * Filter state for analytics UI components
 */
export interface AnalyticsFilterState {
  startDate?: Date;
  endDate?: Date;
  granularity: 'day' | 'week' | 'month';
  departmentId?: string;
  programme?: string;
  limit: number;
}

/**
 * Chart data format for visualization libraries
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Time series chart data
 */
export interface TimeSeriesChartData {
  title: string;
  series: ChartDataPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
}

/**
 * Comparison chart data
 */
export interface ComparisonChartData {
  title: string;
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}
