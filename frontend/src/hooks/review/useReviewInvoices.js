import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchWithAuth } from '../../lib/apiClient';
import {
  computeDuplicateGroups,
  computeMonthOptions,
  computeVendorOptions,
  filterAndSortInvoices,
  groupInvoicesByDate
} from '../../utils/review/invoiceUtils';

/**
 * Custom hook encapsulating data management, filtering, duplicate grouping,
 * pagination, and accordion toggle logic for the ReviewInvoices page.
 */
export function useReviewInvoices() {
  const { getToken } = useAuth();

  // =========================================================================
  // 1. Core Data Fetching & Authentication
  // =========================================================================
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = () => {
    setLoading(true);
    fetchWithAuth('http://localhost:8000/api/invoices/review-invoices', {}, getToken)
      .then(res => res.json())
      .then(data => {
        setInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch review invoices", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Summary statistics for top metric cards
  const stats = useMemo(() => {
    return {
      total: invoices.length,
      review: invoices.filter(i => i.status === 'review').length,
      failed: invoices.filter(i => i.status === 'failed').length,
      success: invoices.filter(i => i.status === 'success').length,
    };
  }, [invoices]);

  // =========================================================================
  // 2. Action Notifications & Feedback
  // =========================================================================
  const [actionFeedback, setActionFeedback] = useState(null);
  const feedbackTimerRef = useRef(null);

  const handleApproveAndSave = (invoiceId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setInvoices(prev =>
      prev.map(inv => (inv.id === invoiceId ? { ...inv, status: 'success', reason: '' } : inv))
    );
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setActionFeedback(`Approved invoice ${invoiceId.slice(0, 8).toUpperCase()}`);
    feedbackTimerRef.current = setTimeout(() => setActionFeedback(null), 3800);
  };

  const handleApproveDuplicate = async (invoiceId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'review',
              is_duplicate: false,
              is_duplicate_resolved: true,
              duplicate_type: null,
              duplicate_group_id: null,
              duplicate_count: 0,
              matching_duplicate_ids: []
            }
          : inv
      )
    );
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setActionFeedback(`Approved duplicate copy ${(invoiceId || '').slice(0, 8).toUpperCase()}`);
    feedbackTimerRef.current = setTimeout(() => setActionFeedback(null), 3800);

    try {
      await fetchWithAuth(
        `http://localhost:8000/api/invoices/invoice/${invoiceId}/resolve-duplicate`,
        { method: 'POST' },
        getToken
      );
    } catch (err) {
      console.error('Failed to persist duplicate resolution to database:', err);
    }
  };

  const handleDeleteInvoice = async (invoiceId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/invoices/invoice/${invoiceId}`, {
        method: 'DELETE'
      }, getToken);
      if (res.ok) {
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        setActionFeedback(`Deleted invoice ${invoiceId.slice(0, 8).toUpperCase()}`);
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert("Failed to delete invoice.");
      }
    } catch (err) {
      console.error("Error deleting invoice", err);
      alert("Error deleting invoice: " + err.message);
    }
  };

  // =========================================================================
  // 3. Duplicate Detection & Notification Drawer
  // =========================================================================
  const [showDuplicatesDrawer, setShowDuplicatesDrawer] = useState(false);
  const [isDuplicateBannerDismissed, setIsDuplicateBannerDismissed] = useState(false);

  // Group duplicate clusters by group ID
  const duplicateGroups = useMemo(() => computeDuplicateGroups(invoices), [invoices]);

  // Total count of duplicate invoice records
  const duplicateInvoicesCount = useMemo(() => {
    return invoices.filter(inv => inv.is_duplicate).length;
  }, [invoices]);

  // =========================================================================
  // 4. Search, Filtering & Sorting
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'duplicates' | 'review' | 'failed' | 'success'
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'flat'

  // Dropdown filter options
  const monthOptions = useMemo(() => computeMonthOptions(invoices), [invoices]);
  const vendorOptions = useMemo(() => computeVendorOptions(invoices), [invoices]);

  // Filtered & sorted invoice records
  const filteredInvoices = useMemo(() => {
    return filterAndSortInvoices(invoices, {
      searchQuery,
      selectedStatus,
      selectedMonth,
      selectedVendor,
      sortBy
    });
  }, [invoices, searchQuery, selectedStatus, selectedMonth, selectedVendor, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedMonth('all');
    setSelectedVendor('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'all' ||
    selectedMonth !== 'all' ||
    selectedVendor !== 'all';

  // =========================================================================
  // 5. Pagination Engine
  // =========================================================================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedMonth, selectedVendor, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, safeCurrentPage, pageSize]);

  // =========================================================================
  // 6. Hierarchical Date Grouping & Accordion State
  // =========================================================================
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [collapsedDates, setCollapsedDates] = useState({});

  const toggleMonthCollapse = (monthKey) => {
    setCollapsedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const toggleDateCollapse = (dateKey) => {
    setCollapsedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // Nested Month -> Date tree hierarchy
  const groupedInvoices = useMemo(() => {
    const itemsToGroup = viewMode === 'grouped' ? paginatedInvoices : filteredInvoices;
    return groupInvoicesByDate(itemsToGroup);
  }, [paginatedInvoices, filteredInvoices, viewMode]);

  // =========================================================================
  // 7. Return Hook Interface
  // =========================================================================
  return {
    // Core data
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
  };
}
