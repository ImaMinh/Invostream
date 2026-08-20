import React from 'react';
import { NavLink } from 'react-router-dom';
import BentoCard from '../general/BentoCard';

/**
 * UploadResultsBreakdown Component:
 * 3 outcome metric cards with diamond-colored status widgets for Successful (green),
 * Needs Review (yellow), and Failed (red), with a review CTA banner.
 */
export default function UploadResultsBreakdown({
  metrics = {},
  isScrolled,
}) {
  const successful = metrics.successful_files || 0;
  const review = metrics.review_files || 0;
  const failed = metrics.failed_files || 0;
  const finished = metrics.finished_processed || 0;

  return (
    <div className="space-y-3">
      {/* 3 Outcome Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Successful */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[105px] relative ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="inline-block w-2 h-2 rotate-45 bg-emerald-500 rounded-[0.5px] shrink-0" />
              <span>Successful</span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {successful}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">invoices</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-sans">
                Extracted without errors
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Needs Review */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[105px] relative ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="inline-block w-2 h-2 rotate-45 bg-amber-400 rounded-[0.5px] shrink-0" />
              <span>Needs Review</span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {review}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">invoices</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-sans">
                Flagged for manual check
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Failed */}
        <BentoCard
          isScrolled={isScrolled}
          disableHover={true}
          className={!isScrolled ? 'border-slate-500/20 shadow-sm' : ''}
        >
          <div
            className={`p-4 flex flex-col justify-between h-full min-h-[105px] relative ${
              !isScrolled ? 'bg-gradient-to-br from-slate-400/[0.08] via-slate-500/[0.02] to-transparent' : 'bg-[var(--bento-inner-bg)]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="inline-block w-2 h-2 rotate-45 bg-rose-500 rounded-[0.5px] shrink-0" />
              <span>Failed</span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {failed}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">invoices</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-sans">
                Unreadable or corrupted files
              </p>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Review CTA Banner when batch has completed items */}
      {finished > 0 && (
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-4 sm:p-5 bg-[var(--bento-inner-bg)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-[var(--text-primary)] font-medium text-center sm:text-left">
              {finished} invoice{finished > 1 ? 's' : ''} processed and saved to database.
            </div>
            <NavLink
              to="/review"
              className="px-4 py-2 rounded-lg bg-[var(--btn-select-bg)] hover:bg-[var(--btn-select-hover-bg)] text-[var(--btn-select-text)] text-xs font-semibold shadow-sm transition-all no-underline shrink-0"
            >
              Open Invoice Review &rarr;
            </NavLink>
          </div>
        </BentoCard>
      )}
    </div>
  );
}
