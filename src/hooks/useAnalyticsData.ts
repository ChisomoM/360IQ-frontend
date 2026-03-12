import { useState, useEffect } from 'react';
// Firebase removed: Analytics data hook now returns empty data and logs a warning.

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  province?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface JoinApplicationFormData {
  fullName?: string;
  school?: string;
  poBox?: string;
  applicationDate?: string;
  tsManNo?: string;
  employmentNo?: string;
  salaryScale?: string;
  district?: string;
  province?: string;
  payPoint?: string;
  payPointDistrict?: string;
  applicantSignature?: string;
  nrc?: string;
  contactNumber?: string;
}

export interface AnalyticsData extends JoinApplicationFormData {
  id: string;
}

export const useAnalyticsData = (filters: AnalyticsFilters = {}, collectionName: string = 'join_requests') => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Firebase removed — return empty dataset
        console.warn('Firebase removed: analytics hook will return empty data');
        setData([]);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        // already set above when Firebase removed
      }
    };

    fetchData();
  }, [filters.startDate, filters.endDate, filters.status, collectionName]);

  return { data, loading, error };
};