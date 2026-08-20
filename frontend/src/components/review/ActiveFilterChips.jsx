import React from 'react';
import { X, Copy } from 'lucide-react';

/**
 * ActiveFilterChips: Removable active filter tags & matched invoices counter
 */
export default function ActiveFilterChips({
  hasActiveFilters,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  selectedVendor,
  setSelectedVendor,
  filteredCount,
  handleResetFilters
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 text-xs text-[var(--text-secondary)]">
      {/* Match Counter */}
      <div className="flex items-center gap-2 font-medium shrink-0">
        <span className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
          <span className="halo-amber-diamond absolute inline-flex h-1 w-1 rounded-[0.3px] bg-amber-400"></span>
          <span className="relative inline-flex h-1 w-1 rotate-45 rounded-[0.3px] bg-amber-500"></span>
        </span>
        <span>
          Found <strong className="text-[var(--text-primary)] font-bold">{filteredCount}</strong>{' '}
          {selectedStatus === 'duplicates' ? 'duplicate ' : ''}matches needing processing
        </span>
      </div>

      {/* Active Filter Tags & Clear All */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20">
              Search: "{searchQuery}"
              <X
                className="w-3 h-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSearchQuery('')}
              />
            </span>
          )}
          {selectedStatus === 'duplicates' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30">
              <Copy className="w-3 h-3" />
              Duplicates Only
              <X
                className="w-3 h-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSelectedStatus('all')}
              />
            </span>
          )}
          {selectedStatus !== 'all' && selectedStatus !== 'duplicates' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20">
              Status: {selectedStatus}
              <X
                className="w-3 h-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSelectedStatus('all')}
              />
            </span>
          )}
          {selectedMonth !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20">
              Month: {monthOptions.find(m => m.key === selectedMonth)?.label || selectedMonth}
              <X
                className="w-3 h-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSelectedMonth('all')}
              />
            </span>
          )}
          {selectedVendor !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20">
              Vendor: {selectedVendor}
              <X
                className="w-3 h-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSelectedVendor('all')}
              />
            </span>
          )}

          {handleResetFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-sky-500 hover:text-sky-400 font-medium ml-1 underline transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
