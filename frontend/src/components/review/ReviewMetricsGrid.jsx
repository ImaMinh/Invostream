import React from 'react';
import BentoCard from '../general/BentoCard';

/**
 * ReviewMetricsGrid: Top metric overview cards
 * - Mobile: Centralized metrics table
 * - Desktop: 4 compact, responsive Bento cards (Ambient gradients in Dark theme, Clean matte in Light theme)
 */
export default function ReviewMetricsGrid({ stats, isScrolled }) {
  return (
    <>
      {/* Mobile View: Centralized Metrics Table Bento Card */}
      <div className="block sm:hidden">
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-3.5">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-[var(--bento-inner-border)]">
                <tr>
                  <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                    <span className="w-1.5 h-3.5 rounded-full bg-slate-400 shrink-0" />
                    Total Invoices
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-[var(--text-primary)]">
                    {stats.total}{' '}
                    <span className="text-xs font-normal text-[var(--text-secondary)]">
                      Invoices
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                    {stats.review > 0 ? (
                      <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                        <span className="halo-amber-diamond absolute inline-flex h-1 w-1 rounded-[0.3px] bg-amber-400"></span>
                        <span className="relative inline-flex h-1 w-1 rotate-45 rounded-[0.3px] bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className="w-1.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                    )}
                    Needs Review
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-amber-500">
                    {stats.review}{' '}
                    <span className="text-xs font-normal text-amber-500/80">
                      Invoices
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                    {stats.failed > 0 ? (
                      <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                        <span className="halo-rose-dot absolute inline-flex h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                        <span className="relative inline-flex rounded-full h-1 w-1 bg-rose-500"></span>
                      </span>
                    ) : (
                      <span className="w-1.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                    )}
                    Failed
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-rose-500">
                    {stats.failed}{' '}
                    <span className="text-xs font-normal text-rose-500/80">
                      Invoices
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                    <span className="w-1.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                    Approved
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-base text-emerald-500">
                    {stats.success}{' '}
                    <span className="text-xs font-normal text-emerald-500/80">
                      Invoices
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* Desktop / Tablet View: 4 Compact Bento Cards Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Invoices */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/30 shadow-md' : ''}
        >
          <div
            className={`p-3.5 sm:p-4 flex flex-col gap-2.5 relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.12] via-slate-500/[0.05] to-transparent' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="w-1 h-4 rounded-full bg-slate-400 shrink-0" />
              <span>Total Invoices</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                {stats.total}
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Invoices
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Needs Review */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-amber-500/30 shadow-md' : ''}
        >
          <div
            className={`p-3.5 sm:p-4 flex flex-col gap-2.5 relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="w-1 h-4 rounded-full bg-amber-500 shrink-0" />
                <span>Needs Review</span>
              </div>
              {stats.review > 0 && (
                <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="halo-amber-diamond absolute inline-flex h-1.5 w-1.5 rounded-[0.4px] bg-amber-400"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rotate-45 rounded-[0.4px] bg-amber-500 shadow-sm"></span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono tracking-tight leading-tight">
                {stats.review}
              </span>
              <span className="text-xs font-medium text-amber-500/80 dark:text-amber-400/80">
                Invoices
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Failed */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-rose-500/30 shadow-md' : ''}
        >
          <div
            className={`p-3.5 sm:p-4 flex flex-col gap-2.5 relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-transparent' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="w-1 h-4 rounded-full bg-rose-500 shrink-0" />
                <span>Failed</span>
              </div>
              {stats.failed > 0 && (
                <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="halo-rose-dot absolute inline-flex h-2 w-2 rounded-full bg-rose-400"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono tracking-tight leading-tight">
                {stats.failed}
              </span>
              <span className="text-xs font-medium text-rose-500/80 dark:text-rose-400/80">
                Invoices
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Approved */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-emerald-500/30 shadow-md' : ''}
        >
          <div
            className={`p-3.5 sm:p-4 flex flex-col gap-2.5 relative group hover:scale-[1.01] transition-transform duration-300 ${
              !isScrolled ? 'bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.03] to-transparent' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
              <span>Approved</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500 font-mono tracking-tight leading-tight">
                {stats.success}
              </span>
              <span className="text-xs font-medium text-emerald-500/80 dark:text-emerald-400/80">
                Invoices
              </span>
            </div>
          </div>
        </BentoCard>
      </div>
    </>
  );
}
