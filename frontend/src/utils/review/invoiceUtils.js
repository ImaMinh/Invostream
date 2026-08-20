/**
 * Pure helper utilities for invoice date parsing, grouping, filtering, and duplicate clustering.
 */

/**
 * Extracts and formats month and date keys/labels for hierarchical accordion grouping.
 *
 * @param {Object} inv - Invoice record
 * @returns {Object} { monthKey, monthLabel, dateKey, dateLabel }
 */
export function getInvoiceDateDetails(inv) {
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
}

/**
 * Groups duplicate invoices into clusters indexed by duplicate_group_id.
 *
 * @param {Array} invoices - List of all invoices
 * @returns {Array} List of duplicate group cluster objects
 */
export function computeDuplicateGroups(invoices) {
  const groupsMap = new Map();
  invoices.forEach(inv => {
    if (inv.is_duplicate && inv.duplicate_group_id) {
      if (!groupsMap.has(inv.duplicate_group_id)) {
        groupsMap.set(inv.duplicate_group_id, {
          groupId: inv.duplicate_group_id,
          type: inv.duplicate_type || 'exact_file',
          vendor: inv.vendor,
          invoiceNumber: inv.invoice_number,
          fileName: inv.file_name,
          total: inv.total,
          rawTotal: inv.raw_total,
          invoices: []
        });
      }
      groupsMap.get(inv.duplicate_group_id).invoices.push(inv);
    }
  });
  return Array.from(groupsMap.values());
}

/**
 * Extracts unique month options for filter dropdowns.
 *
 * @param {Array} invoices - List of all invoices
 * @returns {Array} List of { key, label }
 */
export function computeMonthOptions(invoices) {
  const monthsMap = new Map();
  invoices.forEach(inv => {
    const { monthKey, monthLabel } = getInvoiceDateDetails(inv);
    if (monthKey !== 'Unknown' && !monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, monthLabel);
    }
  });
  return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
}

/**
 * Extracts sorted unique vendor names for filter dropdowns.
 *
 * @param {Array} invoices - List of all invoices
 * @returns {Array} Sorted list of vendor strings
 */
export function computeVendorOptions(invoices) {
  const vendors = new Set();
  invoices.forEach(inv => {
    if (inv.vendor && inv.vendor !== 'Unknown') {
      vendors.add(inv.vendor);
    }
  });
  return Array.from(vendors).sort();
}

/**
 * Filters and sorts invoice records based on user search query and filter criteria.
 *
 * @param {Array} invoices - Raw invoice list
 * @param {Object} filters - { searchQuery, selectedStatus, selectedMonth, selectedVendor, sortBy }
 * @returns {Array} Filtered and sorted invoice records
 */
export function filterAndSortInvoices(invoices, { searchQuery, selectedStatus, selectedMonth, selectedVendor, sortBy }) {
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
      const matchFileName = inv.file_name?.toLowerCase().includes(q);
      const matchInvoiceNum = inv.invoice_number?.toLowerCase().includes(q);

      if (!matchDisplayId && !matchId && !matchVendor && !matchReason && !matchStatus && !matchDate && !matchTotal && !matchFileName && !matchInvoiceNum) {
        return false;
      }
    }

    // 2. Status / Duplicate Filter
    if (selectedStatus === 'duplicates') {
      if (!inv.is_duplicate) return false;
    } else if (selectedStatus !== 'all' && inv.status !== selectedStatus) {
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
}

/**
 * Transforms a flat invoice list into a nested month/date hierarchy with subtotals.
 *
 * @param {Array} invoices - Invoices to group
 * @returns {Array} List of Month groups with nested Date groups
 */
export function groupInvoicesByDate(invoices) {
  const monthMap = {};

  invoices.forEach(inv => {
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
}
