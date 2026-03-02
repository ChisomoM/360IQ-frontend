/**
 * Analytics API Client
 * Provides methods to fetch analytics data from the backend
 */

import { apiClient } from './client';
import type {
  StudentStatusDistribution,
  EnrollmentTrendData,
  ApplicationVolumeMetrics,
  ApprovalRateReport,
  ProgramPopularityData,
  ApplicationFunnelData,
  ApiResponse,
  AnalyticsFilters,
} from '@/types/analytics';

/**
 * Base path for analytics endpoints
 */
const ANALYTICS_BASE = '/api/v1/analytics';

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Build query string from filters
 */
function buildQueryString(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();

  if (filters.start_date) {
    params.append('start_date', formatDate(filters.start_date));
  }
  if (filters.end_date) {
    params.append('end_date', formatDate(filters.end_date));
  }
  if (filters.granularity) {
    params.append('granularity', filters.granularity);
  }
  if (filters.department_id) {
    params.append('department_id', filters.department_id);
  }
  if (filters.programme) {
    params.append('programme', filters.programme);
  }
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }

  return params.toString();
}

/**
 * Get student enrollment status distribution
 * 
 * @param filters - Optional filters (department_id)
 * @returns Promise resolving to status distribution data
 */
export async function getStudentStatusDistribution(
  filters?: Partial<AnalyticsFilters>
): Promise<StudentStatusDistribution> {
  const query = filters ? buildQueryString(filters) : '';
  const url = query ? `${ANALYTICS_BASE}/students/status-distribution?${query}` : `${ANALYTICS_BASE}/students/status-distribution`;
  
  const response = await apiClient.get<ApiResponse<StudentStatusDistribution>>(url);
  return response.data.data as StudentStatusDistribution;
}

/**
 * Get enrollment trends over time
 * 
 * @param filters - Optional filters (start_date, end_date, granularity, department_id)
 * @returns Promise resolving to enrollment trend data
 */
export async function getEnrollmentTrends(
  filters?: Partial<AnalyticsFilters>
): Promise<EnrollmentTrendData> {
  const query = filters ? buildQueryString(filters) : '';
  const url = query ? `${ANALYTICS_BASE}/students/enrollment-trends?${query}` : `${ANALYTICS_BASE}/students/enrollment-trends`;
  
  const response = await apiClient.get<ApiResponse<EnrollmentTrendData>>(url);
  return response.data.data as EnrollmentTrendData;
}

/**
 * Get application volume metrics
 * 
 * @param filters - Optional filters (start_date, end_date, granularity, department_id, programme)
 * @returns Promise resolving to application volume data
 */
export async function getApplicationVolumeMetrics(
  filters?: Partial<AnalyticsFilters>
): Promise<ApplicationVolumeMetrics> {
  const query = filters ? buildQueryString(filters) : '';
  const url = query ? `${ANALYTICS_BASE}/applications/volume-metrics?${query}` : `${ANALYTICS_BASE}/applications/volume-metrics`;
  
  const response = await apiClient.get<ApiResponse<ApplicationVolumeMetrics>>(url);
  return response.data.data as ApplicationVolumeMetrics;
}

/**
 * Get approval rate analysis
 * 
 * @param filters - Optional filters (start_date, end_date, department_id, programme)
 * @returns Promise resolving to approval rate report
 */
export async function getApprovalRates(
  filters?: Partial<AnalyticsFilters>
): Promise<ApprovalRateReport> {
  const query = filters ? buildQueryString(filters) : '';
  const url = query ? `${ANALYTICS_BASE}/applications/approval-rates?${query}` : `${ANALYTICS_BASE}/applications/approval-rates`;
  
  const response = await apiClient.get<ApiResponse<ApprovalRateReport>>(url);
  return response.data.data as ApprovalRateReport;
}

/**
 * Get application funnel with stage progression
 * 
 * @param filters - Optional filters (start_date, end_date, department_id, programme)
 * @returns Promise resolving to funnel data
 */
export async function getApplicationFunnel(
  filters?: Partial<AnalyticsFilters>
): Promise<ApplicationFunnelData> {
  const query = filters ? buildQueryString(filters) : '';
  const url = query ? `${ANALYTICS_BASE}/applications/funnel?${query}` : `${ANALYTICS_BASE}/applications/funnel`;
  
  const response = await apiClient.get<ApiResponse<ApplicationFunnelData>>(url);
  return response.data.data as ApplicationFunnelData;
}

/**
 * Get program popularity ranking
 * 
 * @param filters - Optional filters (limit, start_date, end_date, department_id)
 * @returns Promise resolving to program popularity data
 */
export async function getProgramPopularityRanking(
  filters?: Partial<AnalyticsFilters>
): Promise<ProgramPopularityData> {
  const query = filters ? buildQueryString(filters) : '';
  const url = query ? `${ANALYTICS_BASE}/programs/popularity-ranking?${query}` : `${ANALYTICS_BASE}/programs/popularity-ranking`;
  
  const response = await apiClient.get<ApiResponse<ProgramPopularityData>>(url);
  return response.data.data as ProgramPopularityData;
}

/**
 * Export analytics data (if implemented in backend)
 * 
 * @param reportType - Type of report to export
 * @param format - Export format (csv, excel, pdf)
 * @param filters - Optional filters
 * @returns Promise resolving to blob (file data)
 */
export async function exportAnalyticsData(
  reportType: 'enrollment' | 'applications' | 'programs' | 'all',
  format: 'csv' | 'excel' | 'pdf' = 'csv',
  filters?: Partial<AnalyticsFilters>
): Promise<Blob> {
  let query = `format=${format}`;
  
  if (filters) {
    const filterQuery = buildQueryString(filters);
    if (filterQuery) query += `&${filterQuery}`;
  }

  const url = `${ANALYTICS_BASE}/export/${reportType}?${query}`;
  
  const response = await apiClient.get<Blob>(url, {
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Application lifecycle hook for analytics
 * Provides methods to fetch and cache analytics data
 */
export function useAnalytics() {
  const getStatusDistribution = async (departmentId?: string) => {
    return getStudentStatusDistribution(departmentId ? { department_id: departmentId } : undefined);
  };

  const getTrends = async (startDate?: string, endDate?: string, granularity?: 'day' | 'week' | 'month') => {
    return getEnrollmentTrends({ start_date: startDate, end_date: endDate, granularity });
  };

  const getVolume = async (
    startDate?: string,
    endDate?: string,
    granularity?: 'day' | 'week' | 'month',
    programme?: string
  ) => {
    return getApplicationVolumeMetrics({ start_date: startDate, end_date: endDate, granularity, programme });
  };

  const getApprovals = async (startDate?: string, endDate?: string, programme?: string) => {
    return getApprovalRates({ start_date: startDate, end_date: endDate, programme });
  };

  const getFunnel = async (startDate?: string, endDate?: string, programme?: string) => {
    return getApplicationFunnel({ start_date: startDate, end_date: endDate, programme });
  };

  const getPopularity = async (limit?: number, startDate?: string, endDate?: string) => {
    return getProgramPopularityRanking({ limit, start_date: startDate, end_date: endDate });
  };

  return {
    getStatusDistribution,
    getTrends,
    getVolume,
    getApprovals,
    getFunnel,
    getPopularity,
    exportData: exportAnalyticsData,
  };
}
