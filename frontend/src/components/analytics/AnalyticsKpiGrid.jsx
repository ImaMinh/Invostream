import React from 'react';
import BentoCard from '../general/BentoCard';

/**
 * AnalyticsKpiGrid Component:
 * Clean, distraction-free 4-card metric overview with theme-adaptive primary black/white numbers.
 */
export default function AnalyticsKpiGrid({
  avgLatencyOverall,
  peakIpmOverall,
  avgIpmOverall,
  totalInvoicesSum,
  isScrolled,
  loading,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile View: Clean summary table */}
      <div className="block sm:hidden">
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-3.5 bg-[var(--bento-inner-bg)]">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 pb-1.5 border-b border-[var(--bento-inner-border)]">
              Summary Overview
            </div>
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-[var(--bento-inner-border)]">
                <tr>
                  <td className="py-2.5 font-medium text-[var(--text-secondary)]">
                    Avg Processing Time
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-[var(--text-primary)]">
                    {avgLatencyOverall}s
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[var(--text-secondary)]">
                    Peak Rate
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-[var(--text-primary)]">
                    {peakIpmOverall} <span className="text-xs font-normal text-[var(--text-secondary)]">IPM</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[var(--text-secondary)]">
                    Average Rate
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-[var(--text-primary)]">
                    {avgIpmOverall} <span className="text-xs font-normal text-[var(--text-secondary)]">IPM</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[var(--text-secondary)]">
                    Total Invoices
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-[var(--text-primary)]">
                    {totalInvoicesSum.toLocaleString()} <span className="text-xs font-normal text-[var(--text-secondary)]">invoices</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* Desktop / Tablet View: 4 Bento Cards */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Avg Processing Time */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              Avg Processing Time
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {avgLatencyOverall}
                </span>
                <span className="text-sm font-bold text-[var(--text-secondary)] font-mono">sec</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-sans">
                Average seconds per invoice
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Peak Processing Rate */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              Peak Minute Rate
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {peakIpmOverall}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)] font-mono">IPM</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-sans">
                Most invoices handled in one minute
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Average Processing Rate */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              Average Rate
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {avgIpmOverall}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)] font-mono">IPM</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-sans">
                Average invoices processed per minute
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 4: Total Invoices */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              Total Invoices
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {totalInvoicesSum.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">invoices</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-sans">
                All-time processed invoices
              </p>
            </div>
          </div>
        </BentoCard>
      </div>
    </>
  );
}
