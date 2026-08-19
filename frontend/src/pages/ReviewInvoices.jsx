import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { fetchWithAuth } from '../lib/apiClient';
import BentoCard from '../components/ui/BentoCard';
import InvoiceTableBentoCard from '../components/ui/InvoiceTableBentoCard';
import {
  Search, X, Calendar, ChevronDown, ChevronRight, ChevronLeft,
  Layers, List, ArrowRight, FileText, AlertTriangle, XCircle, CheckCircle, RefreshCw,
  Sparkles, Filter, Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ReviewInvoices() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { isScrolled } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'flat'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Accordion Collapsed States
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [collapsedDates, setCollapsedDates] = useState({});

  // Action Notification State
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  // Helper to parse date details from item
  const getInvoiceDateDetails = (inv) => {
    let dateObj = null;
    if (inv.created_at) {
      dateObj = new Date(inv.created_at);
    } else if (inv.date && inv.date !== 'N/A') {
      dateObj = new Date(inv.date);
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      return {
        monthKey: 'Unknown',
        monthLabel: 'Unknown Upload Date',
        dateKey: 'Unknown Date',
        dateLabel: 'Date Not Available'
      };
    }

    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const dateKey = `${monthKey}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    return { monthKey, monthLabel, dateKey, dateLabel };
  };

  // Extract unique Month and Vendor options for filters
  const monthOptions = useMemo(() => {
    const monthsMap = new Map();
    invoices.forEach(inv => {
      const { monthKey, monthLabel } = getInvoiceDateDetails(inv);
      if (monthKey !== 'Unknown' && !monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, monthLabel);
      }
    });
    return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
  }, [invoices]);

  const vendorOptions = useMemo(() => {
    const vendors = new Set();
    invoices.forEach(inv => {
      if (inv.vendor && inv.vendor !== 'Unknown') {
        vendors.add(inv.vendor);
      }
    });
    return Array.from(vendors).sort();
  }, [invoices]);

  // Combined Search & Filtering Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchDisplayId = inv.display_id?.toLowerCase().includes(q);
        const matchId = inv.id?.toLowerCase().includes(q);
        const matchVendor = inv.vendor?.toLowerCase().includes(q);
        const matchReason = inv.reason?.toLowerCase().includes(q);
        const matchStatus = inv.status?.toLowerCase().includes(q);
        const matchDate = inv.date?.toLowerCase().includes(q);
        const matchTotal = inv.total?.toLowerCase().includes(q);

        if (!matchDisplayId && !matchId && !matchVendor && !matchReason && !matchStatus && !matchDate && !matchTotal) {
          return false;
        }
      }

      // 2. Status Filter
      if (selectedStatus !== 'all' && inv.status !== selectedStatus) {
        return false;
      }

      // 3. Month Filter
      if (selectedMonth !== 'all') {
        const { monthKey } = getInvoiceDateDetails(inv);
        if (monthKey !== selectedMonth) return false;
      }

      // 4. Vendor Filter
      if (selectedVendor !== 'all' && inv.vendor !== selectedVendor) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.created_at || a.date).getTime() || 0;
      const timeB = new Date(b.created_at || b.date).getTime() || 0;

      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'amount-high') return (b.raw_total || 0) - (a.raw_total || 0);
      if (sortBy === 'amount-low') return (a.raw_total || 0) - (b.raw_total || 0);
      if (sortBy === 'vendor') return (a.vendor || '').localeCompare(b.vendor || '');
      return 0;
    });
  }, [invoices, searchQuery, selectedStatus, selectedMonth, selectedVendor, sortBy]);

  // Reset to page 1 on filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedMonth, selectedVendor, sortBy, pageSize]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, safeCurrentPage, pageSize]);

  // Grouping logic (Groups by Month, then Upload Date)
  const groupedInvoices = useMemo(() => {
    const itemsToGroup = viewMode === 'grouped' ? paginatedInvoices : filteredInvoices;
    const monthMap = {};

    itemsToGroup.forEach(inv => {
      const { monthKey, monthLabel, dateKey, dateLabel } = getInvoiceDateDetails(inv);

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          monthKey,
          monthLabel,
          count: 0,
          totalAmount: 0,
          statusCounts: { review: 0, failed: 0, success: 0 },
          datesMap: {}
        };
      }

      const mGroup = monthMap[monthKey];
      mGroup.count += 1;
      mGroup.totalAmount += (inv.raw_total || 0);
      mGroup.statusCounts[inv.status] = (mGroup.statusCounts[inv.status] || 0) + 1;

      if (!mGroup.datesMap[dateKey]) {
        mGroup.datesMap[dateKey] = {
          dateKey,
          dateLabel,
          count: 0,
          totalAmount: 0,
          invoices: []
        };
      }

      const dGroup = mGroup.datesMap[dateKey];
      dGroup.count += 1;
      dGroup.totalAmount += (inv.raw_total || 0);
      dGroup.invoices.push(inv);
    });

    return Object.values(monthMap).map(m => ({
      ...m,
      dateList: Object.values(m.datesMap)
    }));
  }, [paginatedInvoices, filteredInvoices, viewMode]);

  // Quick Approve Action Handler
  const handleApprove = (invoiceId, e) => {
    e.stopPropagation();
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'success', reason: '' } : inv));
    setActionFeedback(`Approved invoice ${invoiceId.slice(0, 8).toUpperCase()}`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Toggle Collapse States
  const toggleMonthCollapse = (monthKey) => {
    setCollapsedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const toggleDateCollapse = (dateKey) => {
    setCollapsedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedMonth('all');
    setSelectedVendor('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== 'all' || selectedMonth !== 'all' || selectedVendor !== 'all';

  // Overall Statistics summary counts
  const stats = useMemo(() => {
    return {
      total: invoices.length,
      review: invoices.filter(i => i.status === 'review').length,
      failed: invoices.filter(i => i.status === 'failed').length,
      success: invoices.filter(i => i.status === 'success').length,
    };
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-sky-400 animate-pulse">
        <RefreshCw className="w-10 h-10 animate-spin text-sky-400" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Loading invoice queue...</p>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 font-sans transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--page-bg)] text-[var(--page-text)] flex flex-col justify-between ${isScrolled ? 'theme-light' : 'theme-dark'}`}
    >
      {/* Layer 1: Solid matte background with no gradient or glow */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--page-bg)] transition-colors duration-500" />

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-4 flex-1 flex flex-col justify-between">

        {/* Toast Notification Banner */}
        {actionFeedback && (
          <div className="fixed bottom-6 right-6 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-emerald-400/30 flex items-center gap-2.5 font-semibold text-sm z-50 animate-bounce">
            <CheckCircle className="w-5 h-5 text-white" />
            {actionFeedback}
          </div>
        )}

        {/* 1. TOP METRIC CARDS (Mobile: Centralized Table Bento Card | Desktop: 4 Cards Grid) */}

        {/* Mobile View: Centralized Metrics Table Bento Card */}
        <div className="block sm:hidden">
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-3.5">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-[var(--bento-inner-border)]">
                  <tr>
                    <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                      <span className="w-1.5 h-3.5 rounded-full bg-slate-400 shrink-0" />
                      Total Invoices
                    </td>
                    <td className="py-2.5 text-right font-bold font-mono text-base text-[var(--text-primary)]">
                      {stats.total}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                      {stats.review > 0 ? (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      ) : (
                        <span className="w-1.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                      )}
                      Needs Review
                    </td>
                    <td className="py-2.5 text-right font-bold font-mono text-base text-amber-500">
                      {stats.review}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                      {stats.failed > 0 ? (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      ) : (
                        <span className="w-1.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                      )}
                      Failed
                    </td>
                    <td className="py-2.5 text-right font-bold font-mono text-base text-rose-500">
                      {stats.failed}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                      <span className="w-1.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                      Approved
                    </td>
                    <td className="py-2.5 text-right font-bold font-mono text-base text-emerald-500">
                      {stats.success}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* Desktop / Tablet View: 4 Bento Cards Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Invoices */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="w-1 h-5 rounded-full bg-slate-400 shrink-0" />
                <span>Total Invoices</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono">
                  {stats.total}
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Needs Review */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="w-1 h-5 rounded-full bg-amber-500 shrink-0" />
                  <span>Needs Review</span>
                </div>
                {stats.review > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
                  {stats.review}
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Failed */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="w-1 h-5 rounded-full bg-rose-500 shrink-0" />
                  <span>Failed</span>
                </div>
                {stats.failed > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono">
                  {stats.failed}
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Approved */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-4 flex flex-col justify-between h-full min-h-[110px] relative group hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="w-1 h-5 rounded-full bg-emerald-500 shrink-0" />
                <span>Approved</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500 font-mono">
                  {stats.success}
                </span>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* 2. SEARCH BAR */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-sky-400 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, vendor, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-zinc-800/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 3. FILTER DROPDOWNS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors"
          >
            <option value="all">Status: All ({invoices.length})</option>
            <option value="review">Status: Needs Review ({stats.review})</option>
            <option value="failed">Status: Failed ({stats.failed})</option>
            <option value="success">Status: Approved ({stats.success})</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors"
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
            className="w-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors"
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
            className="w-full bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer hover:border-sky-500/40 focus:border-sky-500/60 transition-colors"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="amount-high">Sort: Amount High-Low</option>
            <option value="amount-low">Sort: Amount Low-High</option>
          </select>
        </div>

        {/* 4. CONTROL BAR (Segmented Toggle, Clear Filters, Refresh) */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Segmented View Switcher */}
          <div className="inline-flex p-1 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)]">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 ${viewMode === 'grouped'
                  ? 'bg-zinc-800 text-white shadow-md scale-[1.02]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              Grouped
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 ${viewMode === 'flat'
                  ? 'bg-zinc-800 text-white shadow-md scale-[1.02]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              Flat List
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-sky-400 hover:text-sky-300 underline font-medium transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={fetchInvoices}
              title="Refresh Invoices"
              className="p-1.5 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-sky-500/40 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* 5. ACTIVE FILTERS & SUMMARY MATCH COUNT */}
        {(hasActiveFilters || filteredInvoices.length >= 0) && (
          <div className="space-y-2 pt-1">
            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Search: "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={() => setSearchQuery('')} />
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Status: {selectedStatus}
                    <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedStatus('all')} />
                  </span>
                )}
                {selectedMonth !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Month: {monthOptions.find(m => m.key === selectedMonth)?.label || selectedMonth}
                    <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedMonth('all')} />
                  </span>
                )}
                {selectedVendor !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Vendor: {selectedVendor}
                    <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedVendor('all')} />
                  </span>
                )}
              </div>
            )}

            {/* Match Counter */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Found <strong className="text-[var(--text-primary)] font-bold">{filteredInvoices.length}</strong> matches needing processing</span>
            </div>
          </div>
        )}

        {/* 6. SPECIALIZED INVOICE TABLE BENTO CARD (Spans full vertical free space) */}
        <InvoiceTableBentoCard isScrolled={isScrolled}>
          {/* TOP PAGINATION CONTROLS */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--bento-inner-border)] text-xs text-[var(--text-secondary)]">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="flex items-center gap-1 hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] transition-colors cursor-pointer font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> prev
            </button>

            <div className="flex items-center gap-3">
              <span>
                Page <strong className="text-[var(--text-primary)]">{safeCurrentPage}</strong> of {totalPages}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 disabled:opacity-30 disabled:hover:text-sky-400 transition-colors cursor-pointer font-medium"
            >
              next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {filteredInvoices.length === 0 ? (
            /* Empty State */
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
            /* Grouped View Accordion */
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {groupedInvoices.map(mGroup => {
                const isMonthCollapsed = !!collapsedMonths[mGroup.monthKey];

                return (
                  <div key={mGroup.monthKey} className="space-y-2">
                    {/* Month Accordion Header */}
                    <div
                      onClick={() => toggleMonthCollapse(mGroup.monthKey)}
                      className="flex items-center justify-between py-2 px-2 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer select-none border-b border-[var(--bento-inner-border)] group"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-sky-400 transition-transform duration-300 ${isMonthCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                        <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-sky-400 transition-colors">
                          {mGroup.monthLabel} <span className="text-xs font-normal text-[var(--text-secondary)]">({mGroup.count})</span>
                        </span>
                      </div>
                      <div className="text-sm font-mono font-bold text-sky-400">
                        ${mGroup.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Month Body */}
                    {!isMonthCollapsed && (
                      <div className="space-y-3 pl-1 sm:pl-2">
                        {mGroup.dateList.map(dGroup => {
                          const isDateCollapsed = !!collapsedDates[dGroup.dateKey];

                          return (
                            <div key={dGroup.dateKey} className="space-y-2">
                              {/* Date Subheader */}
                              <div
                                onClick={() => toggleDateCollapse(dGroup.dateKey)}
                                className="flex items-center justify-between text-xs text-[var(--text-secondary)] py-1 px-1 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Upload: {dGroup.dateLabel} — {dGroup.count} Invoice{dGroup.count > 1 ? 's' : ''}</span>
                                </div>
                                <span>${dGroup.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>

                              {/* Invoice Bento Cards */}
                              {!isDateCollapsed && (
                                <div className="space-y-2.5">
                                  {dGroup.invoices.map(inv => (
                                    <BentoInvoiceCard
                                      key={inv.id}
                                      inv={inv}
                                      isScrolled={isScrolled}
                                      onNavigate={() => navigate(`/review/${inv.id}`)}
                                      onApprove={(e) => handleApprove(inv.id, e)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat View Cards List */
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {paginatedInvoices.map(inv => (
                <BentoInvoiceCard
                  key={inv.id}
                  inv={inv}
                  isScrolled={isScrolled}
                  onNavigate={() => navigate(`/review/${inv.id}`)}
                  onApprove={(e) => handleApprove(inv.id, e)}
                />
              ))}
            </div>
          )}

          {/* 7. MINIMALIST BOTTOM PAGINATION (Anchored at the bottom of InvoiceTableBentoCard) */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-[var(--bento-inner-border)] text-xs text-[var(--text-secondary)]">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="flex items-center gap-1 hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> prev
            </button>

            <div className="flex items-center gap-3">
              <span>
                Page <strong className="text-[var(--text-primary)]">{safeCurrentPage}</strong> of {totalPages}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 disabled:opacity-30 disabled:hover:text-sky-400 transition-colors cursor-pointer font-medium"
            >
              next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </InvoiceTableBentoCard>

      </div>
    </div>
  );
}

// Subcomponent: Individual Bento Invoice Card with Lively Hover Micro-Interactions
function BentoInvoiceCard({ inv, isScrolled, onNavigate, onApprove }) {
  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div
        onClick={onNavigate}
        className="group p-3.5 sm:p-4 flex flex-col gap-3 cursor-pointer hover:bg-white/[0.02] transition-all duration-300 rounded-xl"
      >
        {/* Top Row: ID & Vendor on Left, Amount & Date on Right */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold tracking-tight text-[var(--text-primary)] group-hover:text-sky-400 transition-colors font-mono">
              {inv.display_id}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              {inv.vendor}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
              {inv.total}
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {inv.date}
            </p>
          </div>
        </div>

 

        {/* Bottom Row: Status Badge on Left, Action Button on Right */}
        <div className="flex items-center justify-between pt-1">
          {/* Status Badge with Live Indicator Dot */}
          {inv.status === 'review' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Needs Review
            </span>
          ) : inv.status === 'failed' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              Approved
            </span>
          )}

          {/* Action Button with Hover Chevron Slide */}
          {inv.status === 'review' ? (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
              className="group/btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all duration-300 flex items-center gap-1 shadow-sm hover:shadow-md"
            >
              Review <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
              className="group/btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all duration-300 flex items-center gap-1 border border-zinc-700"
            >
              View <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
