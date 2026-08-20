import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * PaginationControls: Reusable pagination controls for top and bottom of invoice table.
 * - Top: Displays prev/next, Page X of Y, and page-size options dropdown.
 * - Bottom: Displays prev/next and Page X of Y with extra breathing room, without dropdown options.
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  variant = 'top' // 'top' | 'bottom'
}) {
  const containerClasses =
    variant === 'top'
      ? 'flex items-center justify-between pb-3 mb-2 border-b border-[var(--bento-inner-border)] text-xs text-[var(--text-secondary)]'
      : 'flex items-center justify-between pt-5 mt-6 border-t border-[var(--bento-inner-border)] text-xs text-[var(--text-secondary)]';

  return (
    <div className={containerClasses}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] transition-colors cursor-pointer font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> prev
      </button>

      <div className="flex items-center gap-3">
        <span>
          Page <strong className="text-[var(--text-primary)]">{currentPage}</strong> of {totalPages}
        </span>
        {variant === 'top' && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        )}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 text-[var(--text-primary)] hover:opacity-75 disabled:opacity-30 transition-colors cursor-pointer font-medium"
      >
        next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
