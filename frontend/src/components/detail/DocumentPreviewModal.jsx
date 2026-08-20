import React from 'react';
import { FileText, ExternalLink, X } from 'lucide-react';

/**
 * DocumentPreviewModal Component:
 * Fullscreen document preview modal for viewing extracted PDFs and invoice images.
 */
export default function DocumentPreviewModal({
  isOpen,
  fileName,
  documentUrl,
  isPdf,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fadeIn">
      {/* Modal Header */}
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-950/80">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-white font-mono truncate">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {documentUrl && (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="flex-1 p-2 sm:p-6 flex items-center justify-center overflow-auto">
        {isPdf ? (
          <iframe
            src={documentUrl}
            title="Invoice Document Full"
            className="w-full h-full max-w-5xl rounded-xl border border-white/10 bg-white shadow-2xl"
          />
        ) : documentUrl ? (
          <img
            src={documentUrl}
            alt="Invoice Document Full"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        ) : (
          <div className="text-zinc-400 text-sm">Document could not be loaded.</div>
        )}
      </div>
    </div>
  );
}
