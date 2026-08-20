import React, { useMemo } from 'react';
import BentoCard from '../general/BentoCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { CustomTooltipIPM } from './AnalyticsTooltips';

/**
 * ThroughputBarChart Component:
 * Compares average invoices processed per minute against the highest peak minute each month.
 */
export default function ThroughputBarChart({
  combinedMetrics = [],
  isScrolled,
}) {
  const hasData = combinedMetrics && combinedMetrics.length > 0;

  const stats = useMemo(() => {
    if (!hasData) return null;
    const peakValues = combinedMetrics.map(d => d.peak_ipm || 0);
    const avgValues = combinedMetrics.map(d => d.avg_ipm || 0);

    const maxPeak = Math.max(...peakValues, 0);
    const maxAvg = Math.max(...avgValues, 0);

    return {
      maxPeak,
      maxAvg: maxAvg.toFixed(1),
    };
  }, [combinedMetrics, hasData]);

  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="p-4 sm:p-6 flex flex-col justify-between space-y-4 bg-[var(--bento-inner-bg)] h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--bento-inner-border)] pb-3 flex-wrap gap-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] font-sans">
              Invoices Processed per Minute (IPM)
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans">
              Monthly average rate compared to the highest minute peak
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[11px] font-mono">
              <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Average IPM
            </span>
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[11px] font-mono">
              <span className="w-2 h-2 rounded-sm bg-violet-500 inline-block" /> Peak IPM
            </span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-64 sm:h-72 w-full pt-1 flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={combinedMetrics} margin={{ top: 12, right: 12, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--bento-inner-border)" vertical={false} strokeOpacity={0.7} />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-secondary)"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--bento-inner-border)', strokeOpacity: 0.8 }}
                  style={{ fontSize: '11px', fontFamily: 'monospace' }}
                  dy={4}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: '11px', fontFamily: 'monospace' }}
                  unit=" IPM"
                />
                <Tooltip 
                  content={<CustomTooltipIPM />} 
                  cursor={{ fill: 'transparent', stroke: 'var(--bento-inner-border)', strokeWidth: 1 }} 
                />
                <Bar dataKey="avg_ipm" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="peak_ipm" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-2.5 p-6">
              <div className="p-3 rounded-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] text-emerald-400">
                <BarChart3 className="w-5 h-5 opacity-80" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">No throughput data yet</p>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mt-0.5">
                  Process batches of invoices to see your throughput rates over time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {stats && (
          <div className="pt-2.5 border-t border-[var(--bento-inner-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <div className="flex items-center gap-4">
              <span>Best monthly average: <strong className="text-emerald-400 font-bold">{stats.maxAvg} IPM</strong></span>
              <span>All-time peak minute: <strong className="text-violet-400 font-bold">{stats.maxPeak} IPM</strong></span>
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
