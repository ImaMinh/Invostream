import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

/**
 * InvoiceFieldInput Component:
 * Single editable field with label, OCR confidence pill, or "Not able to detect" badge.
 */
export default function InvoiceFieldInput({
  field,
  value,
  confidence,
  isScrolled,
  onChange,
}) {
  const isFieldEmpty =
    value === null ||
    value === undefined ||
    String(value).trim() === '' ||
    value === 'N/A';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[var(--text-secondary)] truncate">
          {field.label}
        </label>

        {/* Badge: "Not able to detect" if empty, otherwise OCR Confidence Pill */}
        {isFieldEmpty ? (
          <span
            title="Field value was not detected during extraction"
            className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 transition-colors ${
              isScrolled
                ? 'bg-white text-slate-700 border border-slate-400 shadow-xs'
                : 'bg-zinc-800/80 text-zinc-300 border border-zinc-600'
            }`}
          >
            <AlertCircle className={`w-2.5 h-2.5 shrink-0 ${isScrolled ? 'text-slate-600' : 'text-zinc-400'}`} />
            Not able to detect
          </span>
        ) : confidence !== null ? (
          <span
            title={`OCR Confidence: ${(confidence * 100).toFixed(1)}%`}
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
              confidence >= 0.9
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                : confidence >= 0.7
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
            }`}
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            {(confidence * 100).toFixed(1)}%
          </span>
        ) : null}
      </div>

      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={
          isFieldEmpty
            ? `Not detected — enter ${field.label.toLowerCase()}...`
            : `Enter ${field.label}...`
        }
        className="w-full bg-[var(--page-bg)] border border-[var(--bento-inner-border)] rounded-xl px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all font-sans"
      />
    </div>
  );
}
