import React from 'react';
import BentoCard from '../general/BentoCard';

/**
 * PipelineDiagnosticsGrid Component:
 * Clean, genuine breakdown of how the invoice processing pipeline works step-by-step without icons or decorative dots.
 */
export default function PipelineDiagnosticsGrid({ isScrolled }) {
  return (
    <div className="space-y-4">
      {/* 1. Time Breakdown Bar */}
      <BentoCard isScrolled={isScrolled} disableHover={true}>
        <div className="p-4 sm:p-5 bg-[var(--bento-inner-bg)] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-sans">
                Processing Time Breakdown
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Where time is spent during the extraction of each invoice (~1.5s total average)
              </p>
            </div>
          </div>

          {/* Segmented Waterfall Progress Bar */}
          <div className="w-full h-3 rounded-full bg-black/20 dark:bg-white/5 p-0.5 border border-[var(--bento-inner-border)] flex overflow-hidden">
            <div 
              className="h-full bg-cyan-400 rounded-l-full transition-all duration-500 hover:opacity-80"
              style={{ width: '12%' }}
              title="Stage 1: Image Preparation (~12%)"
            />
            <div 
              className="h-full bg-emerald-400 transition-all duration-500 hover:opacity-80"
              style={{ width: '75%' }}
              title="Stage 2: OCR Extraction (~75%)"
            />
            <div 
              className="h-full bg-violet-400 rounded-r-full transition-all duration-500 hover:opacity-80"
              style={{ width: '13%' }}
              title="Stage 3: Validation & Saving (~13%)"
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
            <div className="text-[var(--text-secondary)]">
              Image Prep: <strong className="text-[var(--text-primary)]">~12%</strong> (~180ms)
            </div>
            <div className="text-[var(--text-secondary)]">
              Azure OCR: <strong className="text-[var(--text-primary)]">~75%</strong> (~1,125ms)
            </div>
            <div className="text-[var(--text-secondary)]">
              Saving: <strong className="text-[var(--text-primary)]">~13%</strong> (~195ms)
            </div>
          </div>
        </div>
      </BentoCard>

      {/* 2. 3 Stage Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Stage 1 */}
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-4 sm:p-5 space-y-3 bg-[var(--bento-inner-bg)] h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] font-sans">
                  1. Image Preparation
                </h4>
                <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">
                  ~12%
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Adjusts DPI resolution, converts the file to grayscale, and sharpens contrast so text is clearly readable.
              </p>
            </div>

            <div className="pt-2.5 border-t border-[var(--bento-inner-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
              <span>Runs on server</span>
              <span className="text-[var(--text-primary)] font-bold">&le; 0.2s</span>
            </div>
          </div>
        </BentoCard>

        {/* Stage 2 */}
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-4 sm:p-5 space-y-3 bg-[var(--bento-inner-bg)] h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] font-sans">
                  2. Data Extraction
                </h4>
                <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">
                  ~75%
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Sends the image to Azure Document Intelligence to identify vendor info, line items, dates, and total amounts.
              </p>
            </div>

            <div className="pt-2.5 border-t border-[var(--bento-inner-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
              <span>Azure AI model</span>
              <span className="text-[var(--text-primary)] font-bold">&le; 1.2s</span>
            </div>
          </div>
        </BentoCard>

        {/* Stage 3 */}
        <BentoCard isScrolled={isScrolled} disableHover={true}>
          <div className="p-4 sm:p-5 space-y-3 bg-[var(--bento-inner-bg)] h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] font-sans">
                  3. Validation & Saving
                </h4>
                <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">
                  ~13%
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Checks for duplicate invoices using file hashes, formats numbers, and stores the invoice in PostgreSQL.
              </p>
            </div>

            <div className="pt-2.5 border-t border-[var(--bento-inner-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
              <span>PostgreSQL write</span>
              <span className="text-[var(--text-primary)] font-bold">&le; 0.2s</span>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* 3. System Components Summary */}
      <BentoCard isScrolled={isScrolled} disableHover={true}>
        <div className="p-4 sm:p-5 bg-[var(--bento-inner-bg)]">
          <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--bento-inner-border)] pb-2">
            Connected Services
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
            <div className="p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--bento-inner-border)]">
              <div className="text-[var(--text-secondary)] text-[11px]">Primary Database</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">PostgreSQL</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Stores invoices, line items, and processing logs.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--bento-inner-border)]">
              <div className="text-[var(--text-secondary)] text-[11px]">OCR Engine</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">Azure Document Intelligence</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Pre-trained model specialized in invoice extraction.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--bento-inner-border)]">
              <div className="text-[var(--text-secondary)] text-[11px]">Authorization</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">Clerk</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Secures user authentication and session management.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--bento-inner-border)]">
              <div className="text-[var(--text-secondary)] text-[11px]">Performance Monitoring</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">Built-in Telemetry System</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Tracks processing speeds, latency, and throughput per user.
              </div>
            </div>
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
