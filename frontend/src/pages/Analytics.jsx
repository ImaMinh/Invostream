import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAnalytics } from '../hooks/analytics/useAnalytics';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import LoadingScreen from '../components/general/LoadingScreen';

// Modular Analytics Components
import AnalyticsHeader from '../components/analytics/AnalyticsHeader';
import AnalyticsKpiGrid from '../components/analytics/AnalyticsKpiGrid';
import LatencyAreaChart from '../components/analytics/LatencyAreaChart';
import ThroughputBarChart from '../components/analytics/ThroughputBarChart';
import HistoricalBreakdownTable from '../components/analytics/HistoricalBreakdownTable';
import PipelineDiagnosticsGrid from '../components/analytics/PipelineDiagnosticsGrid';

/**
 * Analytics Page:
 * Coordinates high-level KPIs, monthly latency & throughput charts,
 * historical performance tables, and pipeline execution details.
 */
export default function Analytics() {
  const { isScrolled } = useTheme();

  const {
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
  } = useAnalytics();

  return (
    <div
      className={`relative min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 font-sans transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--page-bg)] text-[var(--page-text)] ${
        isScrolled ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Background layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--page-bg)] transition-colors duration-500" />

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* Error Alert Banner */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Could not load analytics: {error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold cursor-pointer transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* 1. Header with 3D Grid & Refresh Control */}
        <AnalyticsHeader
          isScrolled={isScrolled}
          refreshing={refreshing}
          onRefresh={fetchData}
        />

        {/* 2. Top 4 KPI Metrics Grid */}
        <AnalyticsKpiGrid
          avgLatencyOverall={avgLatencyOverall}
          peakIpmOverall={peakIpmOverall}
          avgIpmOverall={avgIpmOverall}
          totalInvoicesSum={totalInvoicesSum}
          isScrolled={isScrolled}
          loading={loading}
        />

        {loading ? (
          <LoadingScreen
            fullPage={false}
            title="Loading analytics..."
          />
        ) : (
          <>
            {/* 3. Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LatencyAreaChart
                combinedMetrics={combinedMetrics}
                isScrolled={isScrolled}
              />
              <ThroughputBarChart
                combinedMetrics={combinedMetrics}
                isScrolled={isScrolled}
              />
            </div>

            {/* 4. Table & Pipeline Details */}
            <div className="space-y-3.5">
              {/* Segmented Tab Switcher */}
              <div className="flex items-center justify-between border-b border-[var(--bento-inner-border)] pb-2 flex-wrap gap-2">
                <div className="inline-flex p-1 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] shadow-sm">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeTab === 'overview'
                        ? isScrolled
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white/10 text-white shadow-sm border border-white/15'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Monthly Breakdown Table
                  </button>
                  <button
                    onClick={() => setActiveTab('pipeline')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeTab === 'pipeline'
                        ? isScrolled
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white/10 text-white shadow-sm border border-white/15'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Pipeline Stages & Details
                  </button>
                </div>
              </div>

              {/* Tab 1: Historical Breakdown Table */}
              {activeTab === 'overview' && (
                <HistoricalBreakdownTable
                  combinedMetrics={combinedMetrics}
                  isScrolled={isScrolled}
                />
              )}

              {/* Tab 2: Pipeline Diagnostics */}
              {activeTab === 'pipeline' && (
                <PipelineDiagnosticsGrid
                  isScrolled={isScrolled}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
