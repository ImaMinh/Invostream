import React, { useMemo } from 'react';
import BentoCard from '../general/BentoCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { Clock } from 'lucide-react';
import { CustomTooltipLatency } from './AnalyticsTooltips';

/**
 * LatencyAreaChart Component:
 * Shows monthly average invoice processing time in seconds.
 */
export default function LatencyAreaChart({
  combinedMetrics = [],
  isScrolled,
}) {
  const hasData = combinedMetrics && combinedMetrics.length > 0;

  const stats = useMemo(() => {
    if (!hasData) return null;
    const latencies = combinedMetrics
      .map(d => parseFloat(d.avg_processing_time_seconds || 0))
      .filter(l => l > 0);
    
    if (latencies.length === 0) return null;

    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const latest = latencies[latencies.length - 1];

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      latest: latest.toFixed(2),
    };
  }, [combinedMetrics, hasData]);

  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="p-4 sm:p-6 flex flex-col justify-between space-y-4 bg-[var(--bento-inner-bg)] h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--bento-inner-border)] pb-3 flex-wrap gap-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] font-sans">
              Average Processing Time
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans">
              Average seconds needed to extract and save each invoice per month
            </p>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-64 sm:h-72 w-full pt-1 flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedMetrics} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                  unit="s"
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  content={<CustomTooltipLatency />} 
                  cursor={{ stroke: 'var(--bento-inner-border)', strokeWidth: 1, strokeDasharray: '3 3' }} 
                />
                <Area
                  type="monotone"
                  dataKey="avg_processing_time_seconds"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#latencyGradient)"
                  activeDot={{ r: 4.5, fill: '#38bdf8', stroke: 'var(--bento-inner-bg)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-2.5 p-6">
              <div className="p-3 rounded-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] text-cyan-400">
                <Clock className="w-5 h-5 opacity-80" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">No processing data yet</p>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mt-0.5">
                  Upload invoices to start tracking how quickly your documents are processed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {stats && (
          <div className="pt-2.5 border-t border-[var(--bento-inner-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <div className="flex items-center gap-4">
              <span>Fastest month: <strong className="text-emerald-400 font-bold">{stats.min}s</strong></span>
              <span>Slowest month: <strong className="text-amber-400 font-bold">{stats.max}s</strong></span>
            </div>
            <div className="text-[var(--text-primary)]">
              Latest: <strong className="text-cyan-400">{stats.latest}s</strong>
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
