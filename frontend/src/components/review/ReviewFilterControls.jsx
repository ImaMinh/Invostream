import React from 'react';
import { Search, X, Copy, RefreshCw } from 'lucide-react';

/**
 * ReviewFilterControls: Streamlined 2-tier toolbar
 * - Tier 1: Search bar + Segmented View Switcher + Quick Actions
 * - Tier 2: 4-Column Dropdown Filter Bar (Status, Month, Vendor, Sort)
 */
export default function ReviewFilterControls({
  searchQuery,
  setSearchQuery,
  duplicateGroups,
  duplicateInvoicesCount,
  isDuplicateBannerDismissed,
  setIsDuplicateBannerDismissed,
  selectedStatus,
  setSelectedStatus,
  invoicesCount,
  stats,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  selectedVendor,
  setSelectedVendor,
  vendorOptions,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  onRefresh
}) {
  return (
    <div className="space-y-2.5">
      {/* Primary Toolbar: Search Bar + View Toggle + Actions */}
      <div className="mt-2.5 sm:mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative group flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-sky-400 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, vendor, file name, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-zinc-800/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action Controls: One single line on mobile with space in-between */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 flex-nowrap shrink-0">
          {/* Re-open Duplicate Banner Pill */}
          {duplicateGroups.length > 0 && isDuplicateBannerDismissed && (
            <button
              onClick={() => setIsDuplicateBannerDismissed(false)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
              title="Show Duplicate Alert"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{duplicateInvoicesCount} Duplicates</span>
            </button>
          )}

          {/* Segmented View Switcher */}
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] shadow-xs shrink-0">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                viewMode === 'grouped'
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Grouped
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                viewMode === 'flat'
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Flat List
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            title="Refresh Invoices"
            className="p-2 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-sky-500/40 transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Filter Dropdowns: Horizontally Scrollable on Mobile with Full Width, 4-Column Grid on Desktop */}
      <div className="flex flex-nowrap sm:grid sm:grid-cols-4 gap-2 overflow-x-auto pb-3.5 sm:pb-0 w-full">
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-[calc(50vw-1.5rem)] min-w-[160px] sm:w-full sm:min-w-0 bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors shadow-xs shrink-0 sm:shrink"
        >
          <option value="all">Status: All ({invoicesCount})</option>
          {duplicateInvoicesCount > 0 && (
            <option value="duplicates">Duplicates Only ({duplicateInvoicesCount})</option>
          )}
          <option value="review">Status: Needs Review ({stats.review})</option>
          <option value="failed">Status: Failed ({stats.failed})</option>
          <option value="success">Status: Approved ({stats.success})</option>
        </select>

        {/* Month Filter */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-[calc(50vw-1.5rem)] min-w-[160px] sm:w-full sm:min-w-0 bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors shadow-xs shrink-0 sm:shrink"
        >
          <option value="all">Month: All</option>
          {monthOptions.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>

        {/* Vendor Filter */}
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="w-[calc(50vw-1.5rem)] min-w-[160px] sm:w-full sm:min-w-0 bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors shadow-xs shrink-0 sm:shrink"
        >
          <option value="all">Vendor: All ({vendorOptions.length})</option>
          {vendorOptions.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Sort Filter */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-[calc(50vw-1.5rem)] min-w-[160px] sm:w-full sm:min-w-0 bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors shadow-xs shrink-0 sm:shrink"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="amount-high">Sort: Amount High-Low</option>
          <option value="amount-low">Sort: Amount Low-High</option>
          <option value="vendor">Sort: Vendor Name</option>
        </select>
      </div>
    </div>
  );
}
