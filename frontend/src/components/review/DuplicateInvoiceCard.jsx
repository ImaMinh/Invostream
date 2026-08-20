import React from 'react';
import { Check, X, ExternalLink } from 'lucide-react';

/**
 * DuplicateInvoiceCard Component:
 * Compact side-by-side card representing an individual duplicate invoice copy.
 *
 * @param {Object} invCopy - The invoice object for this duplicate copy
 * @param {number} copyIndex - 0-indexed position in the duplicate cluster
 * @param {boolean} isScrolled - Dark/light theme state
 * @param {Function} onNavigate - Navigation callback to open invoice detail view
 * @param {Function} [onApprove] - Callback to mark invoice as approved
 */
export default function DuplicateInvoiceCard({
  invCopy,
  copyIndex,
  isScrolled,
  onNavigate,
  onApprove,
}) {
  return (
    <div
      onClick={() => onNavigate && onNavigate(invCopy.id)}
      className={`group/copy p-2.5 rounded-md border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
        isScrolled
          ? 'bg-white hover:bg-slate-50 border-slate-400 hover:border-amber-500 shadow-md shadow-slate-200/90'
          : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-700/60 hover:border-amber-500/50 shadow-md'
      }`}
    >
      {/* Top Section: Display ID, Copy Badge, File Name, and Total Amount */}
      <div className="flex items-start justify-between gap-1.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono text-[var(--text-primary)] group-hover/copy:text-sky-400 transition-colors">
              {invCopy.display_id}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                isScrolled
                  ? 'bg-slate-100 text-slate-700 border-slate-400'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              Copy #{copyIndex + 1}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[170px] mt-0.5" title={invCopy.file_name}>
            {invCopy.file_name}
          </p>
        </div>
        <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
          {invCopy.total}
        </span>
      </div>

      {/* Bottom Footer: Date, Quick Decline/Approve buttons, and Inspect Link */}
      <div
        className={`flex items-center justify-between pt-1.5 border-t text-[10px] gap-1 ${
          isScrolled ? 'border-slate-300' : 'border-zinc-800'
        }`}
      >
        <span className="text-[var(--text-secondary)]">
          {invCopy.date}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95 border ${
              isScrolled
                ? 'bg-rose-500/15 text-rose-800 hover:bg-rose-500 hover:text-white border-rose-500/30'
                : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border-rose-500/40'
            }`}
            title="Decline invoice"
          >
            <X className="w-3 h-3" />
            <span>Decline</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onApprove) onApprove(invCopy.id, e);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95 border ${
              isScrolled
                ? 'bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500 hover:text-white border-emerald-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950 border-emerald-500/40'
            }`}
            title="Approve invoice"
          >
            <Check className="w-3 h-3" />
            <span>Approve</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) onNavigate(invCopy.id);
            }}
            className={`p-1 rounded transition-colors ${
              isScrolled
                ? 'text-sky-600 hover:text-sky-700 hover:bg-sky-50'
                : 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10'
            }`}
            title="Inspect Invoice"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
