import React from 'react';
import BentoCard from '../general/BentoCard';
import DuplicateInvoiceCard from './DuplicateInvoiceCard';
import { Copy, X, SlidersHorizontal, ChevronUp, ChevronDown, Filter } from 'lucide-react';

/**
 * DuplicateAlertBanner: Notification banner with expandable comparison drawer
 * for inspecting and filtering duplicate invoice clusters.
 */
export default function DuplicateAlertBanner({
  duplicateGroups,
  duplicateInvoicesCount,
  isDuplicateBannerDismissed,
  setIsDuplicateBannerDismissed,
  showDuplicatesDrawer,
  setShowDuplicatesDrawer,
  selectedStatus,
  setSelectedStatus,
  isScrolled,
  onNavigate,
  onApprove
}) {
  if (duplicateGroups.length === 0 || isDuplicateBannerDismissed) {
    return null;
  }

  return (
    <BentoCard
      isScrolled={isScrolled}
      disableHover={true}
      className={`border-amber-500/35 animate-fadeIn ${isScrolled ? 'shadow-lg shadow-amber-950/10' : 'shadow-lg'}`}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-3.5 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-violet-500/[0.03] dark:from-amber-500/[0.12] dark:via-orange-500/[0.06] dark:to-transparent">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 sm:p-2.5 rounded-lg border shrink-0 mt-0.5 ${
                isScrolled
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Duplicate Invoices Detected
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                    isScrolled
                      ? 'bg-amber-500/15 text-amber-900 border-amber-500/40 shadow-xs'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
                    <span className="halo-amber-diamond absolute inline-flex h-1 w-1 rounded-[0.3px] bg-amber-400"></span>
                    <span className="relative inline-flex h-1 w-1 rotate-45 rounded-[0.3px] bg-amber-500"></span>
                  </span>
                  {duplicateInvoicesCount} Invoices in {duplicateGroups.length} Group{duplicateGroups.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
                We found identical invoices uploaded to your account (identical file fingerprints or matching vendor and invoice numbers). All copies have been preserved for your comparison.
              </p>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsDuplicateBannerDismissed(true)}
            title="Dismiss alert"
            className="w-7 h-7 rounded-full border border-[var(--bento-inner-border)] bg-[var(--bento-inner-bg)] text-[var(--text-secondary)] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Bar with Generous Spacing */}
        <div className="flex items-center justify-between gap-3 pt-3.5 mt-1 border-t border-[var(--bento-inner-border)] flex-wrap">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowDuplicatesDrawer(prev => !prev)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--bento-inner-bg)] hover:bg-amber-500/10 border border-[var(--bento-inner-border)] hover:border-amber-500/40 text-[var(--text-primary)] hover:text-amber-800 dark:hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isScrolled ? 'text-amber-700' : 'text-amber-400'}`} />
              <span>{showDuplicatesDrawer ? 'Hide Comparison Drawer' : 'Review & Compare Groups'}</span>
              {showDuplicatesDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setSelectedStatus(prev => prev === 'duplicates' ? 'all' : 'duplicates')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                selectedStatus === 'duplicates'
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  : isScrolled
                  ? 'bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 border border-amber-500/40'
                  : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
              }`}
            >
              <Filter className={`w-3.5 h-3.5 ${selectedStatus === 'duplicates' ? 'text-zinc-950' : isScrolled ? 'text-amber-800' : 'text-amber-400'}`} />
              <span>{selectedStatus === 'duplicates' ? 'Show All Invoices' : 'Filter Table to Duplicates'}</span>
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-secondary)]">
            {selectedStatus === 'duplicates' ? 'Filtering duplicate invoices in queue' : 'Click "Review & Compare" to inspect side-by-side'}
          </div>
        </div>

        {/* Expandable Comparison Drawer */}
        {showDuplicatesDrawer && (
          <div className="mt-2 pt-3 border-t border-[var(--bento-inner-border)] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Duplicated Groups ({duplicateGroups.length})
            </h4>

            <div className="space-y-3">
              {duplicateGroups.map((group, gIdx) => (
                <div
                  key={group.groupId}
                  className={`p-3 sm:p-3.5 rounded-lg border space-y-2.5 shadow-inner ${
                    isScrolled
                      ? 'bg-slate-100/80 border-slate-400/80'
                      : 'bg-zinc-950/70 border-zinc-800'
                  }`}
                >
                  {/* Group Title Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Cluster #{gIdx + 1}: {group.vendor}
                      </span>
                      {group.invoiceNumber && group.invoiceNumber !== 'N/A' && (
                        <span className="text-xs font-mono text-sky-400 font-semibold">
                          #{group.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2.5 w-full sm:w-auto">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400 border border-violet-500/30 font-medium">
                        {group.type === 'exact_file' ? 'Identical File (SHA-256)' : 'Matching Invoice # & Vendor'}
                      </span>
                      <span className={`text-xs font-mono font-bold whitespace-nowrap ${isScrolled ? 'text-amber-800' : 'text-amber-400'}`}>
                        {group.invoices.length} Copies
                      </span>
                    </div>
                  </div>

                  {/* Side-by-side copies list using isolated DuplicateInvoiceCard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {group.invoices.map((invCopy, cIdx) => (
                      <DuplicateInvoiceCard
                        key={invCopy.id}
                        invCopy={invCopy}
                        copyIndex={cIdx}
                        isScrolled={isScrolled}
                        onNavigate={onNavigate}
                        onApprove={onApprove}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
