import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchWithAuth } from '../../lib/apiClient';
import { combineTelemetryMetrics } from '../../utils/analytics/analyticsUtils';

/**
 * Custom hook managing telemetry fetching, combined metrics,
 * and high-level KPIs for the Analytics dashboard.
 */
export function useAnalytics() {
  const { getToken } = useAuth();

  const [latencyData, setLatencyData] = useState([]);
  const [ipmData, setIpmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pipeline'

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [latencyRes, ipmRes] = await Promise.all([
        fetchWithAuth('http://localhost:8000/api/telemetry/system/monthly-latency', {}, getToken),
        fetchWithAuth('http://localhost:8000/api/telemetry/system/monthly-ipm', {}, getToken)
      ]);

      if (!latencyRes.ok || !ipmRes.ok) {
        throw new Error(`Failed to load telemetry endpoints (Status: ${latencyRes.status}/${ipmRes.status})`);
      }

      const latencyJson = await latencyRes.json();
      const ipmJson = await ipmRes.json();

      // Reverse so chronological order (oldest to newest) renders left-to-right on charts
      const sortedLatency = Array.isArray(latencyJson) ? [...latencyJson].reverse() : [];
      const sortedIpm = Array.isArray(ipmJson) ? [...ipmJson].reverse() : [];

      setLatencyData(sortedLatency);
      setIpmData(sortedIpm);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Unable to connect to telemetry service');
      setLatencyData([]);
      setIpmData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine datasets for unified charts and tables
  const combinedMetrics = useMemo(() => {
    return combineTelemetryMetrics(latencyData, ipmData);
  }, [latencyData, ipmData]);

  // Calculate aggregated stats
  const totalInvoicesSum = useMemo(() => {
    return combinedMetrics.reduce((sum, d) => sum + (d.total_invoices || 0), 0);
  }, [combinedMetrics]);

  const avgLatencyOverall = useMemo(() => {
    return combinedMetrics.length > 0
      ? (combinedMetrics.reduce((sum, d) => sum + (d.avg_processing_time_seconds || 0), 0) / combinedMetrics.length).toFixed(2)
      : '0.00';
  }, [combinedMetrics]);

  const peakIpmOverall = useMemo(() => {
    return combinedMetrics.length > 0
      ? Math.max(...combinedMetrics.map((d) => d.peak_ipm || 0))
      : 0;
  }, [combinedMetrics]);

  const avgIpmOverall = useMemo(() => {
    return combinedMetrics.length > 0
      ? (combinedMetrics.reduce((sum, d) => sum + (d.avg_ipm || 0), 0) / combinedMetrics.length).toFixed(1)
      : '0.0';
  }, [combinedMetrics]);

  return {
    loading,
    refreshing,
    error,
    activeTab,
    setActiveTab,
    combinedMetrics,
    totalInvoicesSum,
    avgLatencyOverall,
    peakIpmOverall,
    avgIpmOverall,
    fetchData,
  };
}
