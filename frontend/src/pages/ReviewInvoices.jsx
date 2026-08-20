import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useReviewInvoices } from '../hooks/review/useReviewInvoices';
import InvoiceTableBentoCard from '../components/general/InvoiceTableBentoCard';
import ReviewMetricsGrid from '../components/review/ReviewMetricsGrid';
import DuplicateAlertBanner from '../components/review/DuplicateAlertBanner';
import ReviewFilterControls from '../components/review/ReviewFilterControls';
import ActiveFilterChips from '../components/review/ActiveFilterChips';
import GroupedInvoiceList from '../components/review/GroupedInvoiceList';
import FlatInvoiceList from '../components/review/FlatInvoiceList';
import PaginationControls from '../components/review/PaginationControls';
import Toast from '../components/general/Toast';
import LoadingScreen from '../components/general/LoadingScreen';
import { RefreshCw, Search } from 'lucide-react';

/**
 * ReviewInvoices: Main page coordinating invoice metrics, duplicate alerts,
 * search & filters, and paginated table views.
 */
export default function ReviewInvoices() {
  const navigate = useNavigate();
  const { isScrolled } = useTheme();

  const {
    invoices,
    loading,
    fetchInvoices,
    stats,
    actionFeedback,

    // Search & filters
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedMonth,
    setSelectedMonth,
    selectedVendor,
    setSelectedVendor,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    handleResetFilters,
    hasActiveFilters,
    monthOptions,
    vendorOptions,
    filteredInvoices,

    // Duplicates
    duplicateGroups,
    duplicateInvoicesCount,
    showDuplicatesDrawer,
    setShowDuplicatesDrawer,
    isDuplicateBannerDismissed,
    setIsDuplicateBannerDismissed,

    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    safeCurrentPage,
    paginatedInvoices,

    // Grouping & Accordion
    groupedInvoices,
    collapsedMonths,
    collapsedDates,
    toggleMonthCollapse,
    toggleDateCollapse,

    // Actions
    handleApproveAndSave,
    handleApproveDuplicate,
    handleDeleteInvoice,
  } = useReviewInvoices();

  if (loading) {
    return <LoadingScreen title="Loading invoices..." />;
  }

  return (
    <div
      className={`relative min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 font-sans transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--page-bg)] text-[var(--page-text)] flex flex-col justify-between ${isScrolled ? 'theme-light' : 'theme-dark'
        }`}
    >
      {/* Layer 1: Solid matte background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--page-bg)] transition-colors duration-500" />

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-4 flex-1 flex flex-col justify-between">
        {/* Toast Notification Banner */}
        <Toast message={actionFeedback} type="success" />

        {/* 1. Metric Summary Cards */}
        <ReviewMetricsGrid stats={stats} isScrolled={isScrolled} />

        {/* 2. Duplicate Detection Banner & Comparison Drawer */}
        <DuplicateAlertBanner
          duplicateGroups={duplicateGroups}
          duplicateInvoicesCount={duplicateInvoicesCount}
          isDuplicateBannerDismissed={isDuplicateBannerDismissed}
          setIsDuplicateBannerDismissed={setIsDuplicateBannerDismissed}
          showDuplicatesDrawer={showDuplicatesDrawer}
          setShowDuplicatesDrawer={setShowDuplicatesDrawer}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          isScrolled={isScrolled}
          onNavigate={(id) => navigate(`/review/${id}`)}
          onApprove={handleApproveDuplicate}
        />

        {/* 3. Search Bar, Dropdown Filters & Segmented Switcher */}
        <ReviewFilterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          duplicateGroups={duplicateGroups}
          duplicateInvoicesCount={duplicateInvoicesCount}
          isDuplicateBannerDismissed={isDuplicateBannerDismissed}
          setIsDuplicateBannerDismissed={setIsDuplicateBannerDismissed}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          invoicesCount={invoices.length}
          stats={stats}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthOptions={monthOptions}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          vendorOptions={vendorOptions}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          hasActiveFilters={hasActiveFilters}
          handleResetFilters={handleResetFilters}
          onRefresh={fetchInvoices}
        />

        {/* 4. Active Filter Tags & Results Counter */}
        <ActiveFilterChips
          hasActiveFilters={hasActiveFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthOptions={monthOptions}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          filteredCount={filteredInvoices.length}
          handleResetFilters={handleResetFilters}
        />

        {/* 5. Main Invoices Table Bento Card */}
        <InvoiceTableBentoCard isScrolled={isScrolled}>
          {/* Top Pagination */}
          <PaginationControls
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />

          {/* Empty State vs Grouped Accordion vs Flat Card List */}
          {filteredInvoices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center my-auto gap-3">
              <div className="p-3 rounded-full bg-zinc-800/50 text-[var(--text-secondary)]">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">No matching invoices found</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                We couldn't find any invoices matching your search parameters or active filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-sm"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : viewMode === 'grouped' ? (
            <GroupedInvoiceList
              groupedInvoices={groupedInvoices}
              collapsedMonths={collapsedMonths}
              collapsedDates={collapsedDates}
              toggleMonthCollapse={toggleMonthCollapse}
              toggleDateCollapse={toggleDateCollapse}
              isScrolled={isScrolled}
              onNavigate={(id) => navigate(`/review/${id}`)}
              onApprove={handleApproveAndSave}
              onDelete={handleDeleteInvoice}
            />
          ) : (
            <FlatInvoiceList
              paginatedInvoices={paginatedInvoices}
              isScrolled={isScrolled}
              onNavigate={(id) => navigate(`/review/${id}`)}
              onApprove={handleApproveAndSave}
              onDelete={handleDeleteInvoice}
            />
          )}

          {/* Bottom Pagination: Page X of Y without options */}
          <PaginationControls
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            variant="bottom"
          />
        </InvoiceTableBentoCard>
      </div>
    </div>
  );
}
