import React, { useMemo } from 'react';
import BentoCard from '../general/BentoCard';

/**
 * HistoricalBreakdownTable Component:
 * Clean, minimal month-by-month table of invoice counts, average processing times, and processing rates.
 */
export default function HistoricalBreakdownTable({
  combinedMetrics = [],
  isScrolled,
}) {
  const hasData = combinedMetrics && combinedMetrics.length > 0;

  // Compute table aggregates for footer
  const totals = useMemo(() => {
    if (!hasData) return null;
    const totalDocs = combinedMetrics.reduce((sum, r) => sum + (r.total_invoices || 0), 0);
    const avgLatency = (
      combinedMetrics.reduce((sum, r) => sum + (r.avg_processing_time_seconds || 0), 0) / combinedMetrics.length
    ).toFixed(2);
    const avgIpm = (
      combinedMetrics.reduce((sum, r) => sum + (r.avg_ipm || 0), 0) / combinedMetrics.length
    ).toFixed(1);
    const maxPeakIpm = Math.max(...combinedMetrics.map(r => r.peak_ipm || 0));

    return {
      totalDocs,
      avgLatency,
      avgIpm,
      maxPeakIpm,
    };
  }, [combinedMetrics, hasData]);

  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="overflow-x-auto bg-[var(--bento-inner-bg)]">
        <table className="w-full text-left text-xs sm:text-sm">
          {/* Table Header */}
          <thead className="bg-black/[0.03] dark:bg-white/[0.02] border-b border-[var(--bento-inner-border)] text-[var(--text-secondary)] font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 sm:px-6 font-semibold">Month</th>
              <th className="py-3 px-4 sm:px-6 font-semibold">Invoices Processed</th>
              <th className="py-3 px-4 sm:px-6 font-semibold">Avg Processing Time</th>
              <th className="py-3 px-4 sm:px-6 font-semibold">Average Rate</th>
              <th className="py-3 px-4 sm:px-6 font-semibold">Peak Rate</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--bento-inner-border)] font-mono">
            {!hasData ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="text-xs font-semibold font-sans text-[var(--text-primary)]">
                      No monthly records found
                    </p>
                    <p className="text-[11px] font-sans text-[var(--text-secondary)] max-w-sm">
                      Monthly summaries will appear here once you upload and process invoices.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              combinedMetrics.map((row, idx) => {
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    {/* Month */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-[var(--text-primary)]">
                      {row.month}
                    </td>

                    {/* Invoices Processed */}
                    <td className="py-3.5 px-4 sm:px-6 text-[var(--text-primary)]">
                      <span className="font-bold font-mono">{(row.total_invoices || 0).toLocaleString()}</span>{' '}
                      <span className="text-[10px] text-[var(--text-secondary)] font-sans">invoices</span>
                    </td>

                    {/* Avg Latency */}
                    <td className="py-3.5 px-4 sm:px-6 text-[var(--text-primary)] font-bold">
                      {row.avg_processing_time_seconds}s
                    </td>

                    {/* Avg IPM */}
                    <td className="py-3.5 px-4 sm:px-6 text-[var(--text-primary)] font-medium">
                      {row.avg_ipm} <span className="text-[10px] text-[var(--text-secondary)]">IPM</span>
                    </td>

                    {/* Peak IPM */}
                    <td className="py-3.5 px-4 sm:px-6 text-[var(--text-primary)] font-medium">
                      {row.peak_ipm} <span className="text-[10px] text-[var(--text-secondary)]">IPM</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {totals && (
            <tfoot className="bg-black/[0.04] dark:bg-white/[0.02] border-t-2 border-[var(--bento-inner-border)] font-mono text-xs">
              <tr className="font-semibold text-[var(--text-primary)]">
                <td className="py-3 px-4 sm:px-6">
                  Total
                </td>
                <td className="py-3 px-4 sm:px-6">
                  {totals.totalDocs.toLocaleString()} <span className="text-[10px] text-[var(--text-secondary)] font-sans">invoices</span>
                </td>
                <td className="py-3 px-4 sm:px-6 text-[var(--text-primary)] font-bold">
                  {totals.avgLatency}s <span className="text-[10px] text-[var(--text-secondary)] font-sans font-normal">(avg)</span>
                </td>
                <td className="py-3 px-4 sm:px-6 text-[var(--text-primary)]">
                  {totals.avgIpm} <span className="text-[10px] text-[var(--text-secondary)]">IPM</span>
                </td>
                <td className="py-3 px-4 sm:px-6 text-[var(--text-primary)]">
                  {totals.maxPeakIpm} <span className="text-[10px] text-[var(--text-secondary)]">IPM</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </BentoCard>
  );
}
