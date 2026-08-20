import React from 'react';
import BentoCard from '../general/BentoCard';
import { Copy, ArrowRight, Trash2, Check, X } from 'lucide-react';

/**
 * BentoInvoiceCard: Compact Bento Invoice Card with responsive dark/light styling
 */
export default function BentoInvoiceCard({ inv, isScrolled, onNavigate, onApprove, onDelete }) {
  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div
        onClick={onNavigate}
        className="group p-2.5 sm:p-3 flex flex-col gap-2 cursor-pointer hover:bg-white/[0.02] transition-all duration-300 rounded-lg"
      >
        {/* Top Row: ID & Vendor on Left, Amount & Date on Right */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-primary)] group-hover:text-sky-400 transition-colors font-mono">
                {inv.display_id}
              </h4>
              {inv.is_duplicate && (
                <span
                  title={inv.duplicate_type === 'exact_file' ? 'Identical file content detected' : 'Matching vendor & invoice number'}
                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30"
                >
                  <Copy className="w-2.5 h-2.5" />
                  Duplicate ({inv.duplicate_count}x)
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium truncate mt-0.5">
              {inv.vendor}
            </p>
            {inv.file_name && (
              <p className="text-[10px] text-[var(--text-secondary)] opacity-70 font-mono truncate max-w-xs mt-0.5">
                {inv.file_name}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs sm:text-sm font-bold font-mono text-[var(--text-primary)]">
              {inv.total}
            </span>
            <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-0.5">
              {inv.date}
            </p>
          </div>
        </div>

        {/* Bottom Row: Status Badge on Left, Action Buttons on Right */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Status Badge with Live Indicator Dot */}
          {inv.status === 'review' ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                isScrolled
                  ? 'bg-amber-500/15 text-amber-900 border-amber-500/40 shadow-xs'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
                <span className="halo-amber-diamond absolute inline-flex h-1 w-1 rounded-[0.3px] bg-amber-400"></span>
                <span className="relative inline-flex h-1 w-1 rotate-45 rounded-[0.3px] bg-amber-500"></span>
              </span>
              Needs Review
            </span>
          ) : inv.status === 'failed' ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                isScrolled
                  ? 'bg-rose-500/15 text-rose-900 border-rose-500/40 shadow-xs'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              <X className="w-2.5 h-2.5 text-rose-500 shrink-0 stroke-[3]" />
              Failed
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                isScrolled
                  ? 'bg-emerald-500/15 text-emerald-900 border-emerald-500/40 shadow-xs'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0 stroke-[3]" />
              Approved
            </span>
          )}

          {/* Action Buttons: Delete with Surrounding Border + Review/View */}
          <div className="flex items-center gap-1.5">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(inv.id, e); }}
                className="p-1.5 rounded-lg border border-[var(--bento-inner-border)] bg-[var(--bento-inner-bg)] text-[var(--text-secondary)] hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Delete invoice"
                aria-label="Delete invoice"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {inv.status === 'review' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                className="group/btn px-3 py-1 rounded-md text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all duration-300 flex items-center gap-1 shadow-xs hover:shadow-sm cursor-pointer"
              >
                Review <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                className="group/btn px-3 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all duration-300 flex items-center gap-1 border border-zinc-700 cursor-pointer"
              >
                View <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
