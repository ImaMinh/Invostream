import React from 'react';
import BentoCard from '../general/BentoCard';
import { ListOrdered, Plus, Trash2, Calculator } from 'lucide-react';

/**
 * LineItemsTable Component:
 * Interactive line-item table with row editing, dynamic quantity/price calculation,
 * row removal/addition, and live subtotal synchronization.
 */
export default function LineItemsTable({
  lineItems,
  currency,
  subtotal,
  computedSubtotal,
  isScrolled,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onApplyComputedSubtotal,
}) {
  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="p-4 sm:p-5 space-y-4 bg-[var(--bento-inner-bg)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--bento-inner-border)] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <ListOrdered className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Line Items & Breakdown
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-sky-400 border border-white/5 font-semibold">
              {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <button
            type="button"
            onClick={onAddLineItem}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Line Items Table */}
        {lineItems.length > 0 ? (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/10 border-b border-[var(--bento-inner-border)] text-[var(--text-secondary)] uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Item Name / Description</th>
                  <th className="py-2.5 px-3 w-20">Qty</th>
                  <th className="py-2.5 px-3 w-28">Unit Price</th>
                  <th className="py-2.5 px-3 w-28">Amount</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bento-inner-border)] font-sans">
                {lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-white/[0.015] transition-colors">
                    {/* # Index */}
                    <td className="py-2.5 px-3 text-[var(--text-secondary)] font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Description / Item Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => onLineItemChange(idx, 'description', e.target.value)}
                        placeholder="Item description or service name..."
                        className="w-full bg-[var(--page-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => onLineItemChange(idx, 'quantity', e.target.value)}
                        placeholder="1"
                        className="w-full bg-[var(--page-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all text-center"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.unit_price}
                        onChange={(e) => onLineItemChange(idx, 'unit_price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[var(--page-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all"
                      />
                    </td>

                    {/* Total Amount */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) => onLineItemChange(idx, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[var(--page-bg)] border border-[var(--bento-inner-border)] rounded-lg px-2 py-1.5 text-xs font-mono font-semibold text-sky-400 placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all"
                      />
                    </td>

                    {/* Delete Row Action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveLineItem(idx)}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2 border border-dashed border-[var(--bento-inner-border)] rounded-xl bg-black/5">
            <p className="text-xs text-[var(--text-secondary)]">No line items extracted for this invoice.</p>
            <button
              type="button"
              onClick={onAddLineItem}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Line Item
            </button>
          </div>
        )}

        {/* Auto-Subtotal Calculation Footer */}
        <div className="pt-3 border-t border-[var(--bento-inner-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--page-bg)] p-3 rounded-xl border">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                Auto-Calculated Subtotal
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                Sum of {lineItems.length} line {lineItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono tracking-tight">
                {currency ? `${currency} ` : '$'}
                {computedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {subtotal !== String(computedSubtotal.toFixed(2)) && computedSubtotal > 0 && (
              <button
                type="button"
                onClick={onApplyComputedSubtotal}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-xs"
                title="Sync this calculated amount to the Invoice Subtotal field above"
              >
                Sync Subtotal
              </button>
            )}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
