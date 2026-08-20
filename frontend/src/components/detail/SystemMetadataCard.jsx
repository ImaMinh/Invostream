import React from 'react';
import BentoCard from '../general/BentoCard';
import { FileText, ExternalLink, Eye, Clock, Save, Loader2, Trash2 } from 'lucide-react';

/**
 * SystemMetadataCard Component:
 * Right sidebar card displaying original document preview launcher, job ID, ingested timestamp,
 * and mobile action triggers.
 */
export default function SystemMetadataCard({
  invoice,
  documentUrl,
  isPdf,
  isScrolled,
  saving,
  deleting,
  onOpenPreview,
  onSave,
  onDelete,
}) {
  return (
    <div className="space-y-4">
      {/* Document Preview Card (Hidden on mobile, visible on tablet & desktop) */}
      <div className="hidden sm:block">
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-4 sm:p-5 space-y-3.5 bg-[var(--bento-inner-bg)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--bento-inner-border)]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Original Document
                </h3>
              </div>
              <button
                onClick={onOpenPreview}
                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" /> Expand
              </button>
            </div>

            {/* Clickable Preview Container */}
            <div
              onClick={onOpenPreview}
              className="group relative w-full h-44 sm:h-52 bg-black/40 border border-[var(--bento-inner-border)] rounded-xl overflow-hidden cursor-pointer flex items-center justify-center transition-all hover:border-sky-500/50"
            >
              {isPdf ? (
                <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="p-3 rounded-full bg-sky-500/10 text-sky-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-primary)] font-mono truncate max-w-[200px]">
                    {invoice?.file_name}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Click to view PDF document
                  </span>
                </div>
              ) : documentUrl ? (
                <img
                  src={documentUrl}
                  alt={invoice?.file_name || 'Invoice Document'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="text-xs text-[var(--text-secondary)]">No preview available</div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-xs">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Click to View Fullscreen</span>
              </div>
            </div>

            <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
              File: <strong className="text-[var(--text-primary)]">{invoice?.file_name || 'Unknown'}</strong>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* System Metadata Card */}
      <BentoCard isScrolled={isScrolled} disableHover={true}>
        <div className="p-4 sm:p-5 space-y-3 bg-[var(--bento-inner-bg)]">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--bento-inner-border)]">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              System Metadata
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[var(--text-secondary)] block text-[11px]">Job ID</span>
              <span className="font-mono text-[var(--text-primary)] font-medium break-all">
                {invoice?.job_id || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[var(--text-secondary)] block text-[11px]">Ingested At</span>
              <span className="text-[var(--text-primary)] font-medium">
                {invoice?.created_at
                  ? new Date(invoice.created_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Mobile Action Buttons (Positioned below System Metadata) */}
      <div className="flex sm:hidden items-center gap-2 w-full pt-1">
        <button
          onClick={onDelete}
          disabled={deleting}
          className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
          title="Delete invoice"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={onOpenPreview}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[var(--bento-inner-bg)] hover:bg-zinc-800 border border-[var(--bento-inner-border)] hover:border-sky-500/40 text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span>Preview</span>
        </button>

        <button
          onClick={onSave}
          disabled={saving || deleting}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
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
