import React from 'react';
import BentoCard from '../general/BentoCard';
import { ArrowUpRightFromCircle, CheckCircle2 } from 'lucide-react';

/**
 * UploadMetricsGrid Component:
 * Displays live progress and batch metrics with clean modern icons and theme-adaptive numbers.
 */
export default function UploadMetricsGrid({
  metrics = {},
  isScrolled,
}) {
  const total = metrics.total_files || 0;
  const underProcess = metrics.under_process || 0;
  const finished = metrics.finished_processed || 0;
  const percent = total > 0 ? Math.min(100, Math.round((finished / total) * 100)) : 0;

  return (
    <div className="space-y-3">
      {/* Top Progress Bar Bento Card */}
      <BentoCard isScrolled={isScrolled} disableHover={true}>
        <div className="p-4 sm:p-5 bg-[var(--bento-inner-bg)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              Batch Ingestion Progress:
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {percent}% ({finished}/{total} processed)
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 rounded-none bg-black/10 dark:bg-white/10 overflow-hidden border border-[var(--bento-inner-border)]">
            <div
              className="h-full bg-[var(--text-primary)] transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </BentoCard>

      {/* 2 Side-by-Side Detail Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Processing */}
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
              <ArrowUpRightFromCircle className="w-3.5 h-3.5 text-[var(--text-primary)] shrink-0 stroke-[1.75]" />
              <span>Currently Processing</span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {underProcess}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">files active</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-sans">
                Extracting text and tables
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Completed */}
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
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Extraction Completed</span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight leading-tight">
                  {finished}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">files saved</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-sans">
                Verified and persisted to database
              </p>
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
