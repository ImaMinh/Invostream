import React from 'react';

/**
 * Custom Recharts Tooltip for Monthly Processing Latency
 * Styled with sharp corners (rounded-none) matching the BentoCard theme.
 */
export const CustomTooltipLatency = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-none p-3.5 shadow-2xl text-xs space-y-2 font-sans min-w-[190px] z-50">
        {/* Header */}
        <div className="font-semibold text-[var(--text-primary)] border-b border-[var(--bento-inner-border)] pb-1.5 flex items-center justify-between gap-3">
          <span className="font-mono text-sm tracking-tight">{label}</span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">Monthly Avg</span>
        </div>

        {/* Data Rows */}
        <div className="space-y-1.5 pt-0.5 font-sans">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Avg Time:</span>
            <span className="font-mono font-bold text-[var(--text-primary)] text-xs">
              {Number(data.avg_processing_time_seconds || 0).toFixed(2)}s
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Invoices:</span>
            <span className="font-mono font-semibold text-[var(--text-primary)] text-xs">
              {(data.total_invoices || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Custom Recharts Tooltip for Throughput & Burst Rates
 * Styled with sharp corners (rounded-none) matching the BentoCard theme.
 */
export const CustomTooltipIPM = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-none p-3.5 shadow-2xl text-xs space-y-2 font-sans min-w-[190px] z-50">
        {/* Header */}
        <div className="font-semibold text-[var(--text-primary)] border-b border-[var(--bento-inner-border)] pb-1.5 flex items-center justify-between gap-3">
          <span className="font-mono text-sm tracking-tight">{label}</span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">Throughput</span>
        </div>

        {/* Data Rows */}
        <div className="space-y-1.5 pt-0.5 font-sans">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Average Rate:</span>
            <span className="font-mono font-bold text-[var(--text-primary)] text-xs">
              {data.avg_ipm || 0} IPM
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Peak Rate:</span>
            <span className="font-mono font-bold text-[var(--text-primary)] text-xs">
              {data.peak_ipm || 0} IPM
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-[var(--text-secondary)]">Invoices:</span>
            <span className="font-mono font-semibold text-[var(--text-primary)] text-xs">
              {(data.total_invoices || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
