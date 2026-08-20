import React from 'react';
import { AlertTriangle, X, Eye } from 'lucide-react';

/**
 * InvoiceDetailFloatingActions Component:
 * Mobile floating action buttons (review reasons dropdown trigger + quick document preview eye).
 */
export default function InvoiceDetailFloatingActions({
  invoice,
  reviewReasons,
  isMobileReasonOpen,
  setIsMobileReasonOpen,
  isScrolled,
  onOpenPreview,
}) {
  return (
    <div className="fixed top-36 right-4 z-40 sm:hidden flex flex-col items-end gap-2.5">
      {/* 1. Floating Needs Review Quick-Access Circle (if reasons exist) */}
      {reviewReasons.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsMobileReasonOpen(!isMobileReasonOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md border transition-all duration-300 active:scale-95 cursor-pointer ${
              invoice?.status === 'failed'
                ? 'bg-rose-500/90 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-amber-500/90 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
            }`}
            title="Toggle Review Reasons"
            aria-label="Toggle Review Reasons"
          >
            {isMobileReasonOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                {reviewReasons.length > 1 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-950 text-white text-[9px] font-bold font-mono flex items-center justify-center border border-white/20">
                    {reviewReasons.length}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Floating Dropdown Card for Mobile */}
          {isMobileReasonOpen && (
            <div className="absolute right-0 top-12 w-72 max-w-[calc(100vw-2rem)] p-3.5 rounded-xl bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] shadow-2xl backdrop-blur-xl animate-fadeIn space-y-2.5">
              <div className="flex items-center justify-between border-b border-[var(--bento-inner-border)] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Review Notes ({reviewReasons.length})</span>
                </div>
                <button
                  onClick={() => setIsMobileReasonOpen(false)}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {reviewReasons.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5 ${
                      invoice?.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current mt-1 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Floating Document Preview Circle */}
      <button
        onClick={onOpenPreview}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md border transition-all duration-300 active:scale-95 cursor-pointer ${
          isScrolled
            ? 'bg-white text-zinc-950 border-slate-300 hover:border-slate-400 shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)]'
            : 'bg-white text-sky-500 border-white/80 shadow-[0_4px_20px_rgba(255,255,255,0.25)]'
        }`}
        title="Preview Original Document"
        aria-label="Preview Original Document"
      >
        <Eye className={`w-4 h-4 ${isScrolled ? 'text-zinc-950' : 'text-sky-500'}`} />
      </button>
    </div>
  );
}
