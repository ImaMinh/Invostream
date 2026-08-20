import React from 'react';
import { ArrowLeft, Trash2, Eye, Save, Loader2, Check, X } from 'lucide-react';

/**
 * InvoiceDetailHeader Component:
 * Navigation back button, invoice identifier, status badge, and desktop action buttons.
 */
export default function InvoiceDetailHeader({
  invoice,
  saving,
  deleting,
  onBack,
  onDelete,
  onOpenPreview,
  onSave,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Back Button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] hover:border-sky-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm active:scale-95"
          title="Back to Review Queue"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Edit Invoice
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-sky-400 border border-white/5 font-semibold">
              {invoice?.id?.split('-')[0].toUpperCase()}
            </span>

            {/* Status Badge */}
            {invoice?.status === 'success' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                Approved
              </span>
            ) : invoice?.status === 'failed' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <X className="w-3 h-3 text-rose-400 stroke-[3]" />
                Failed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <span className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
                  <span className="halo-amber-diamond absolute inline-flex h-1 w-1 rounded-[0.3px] bg-amber-400"></span>
                  <span className="relative inline-flex h-1 w-1 rotate-45 rounded-[0.3px] bg-amber-500"></span>
                </span>
                Needs Review
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono truncate max-w-md">
            UUID: {invoice?.id}
          </p>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:flex items-center gap-2.5 shrink-0">
        <button
          onClick={onDelete}
          disabled={deleting}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
          title="Delete this invoice"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
          ) : (
            <Trash2 className="w-4 h-4 text-rose-400" />
          )}
          <span>Delete</span>
        </button>

        <button
          onClick={onOpenPreview}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bento-inner-bg)] hover:bg-zinc-800 border border-[var(--bento-inner-border)] hover:border-sky-500/40 text-[var(--text-primary)] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span>Preview Document</span>
        </button>

        <button
          onClick={onSave}
          disabled={saving || deleting}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-zinc-950" />
              <span>Approve & Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
