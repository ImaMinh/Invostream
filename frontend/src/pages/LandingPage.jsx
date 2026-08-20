import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import heroBannerTexture from '../../images/hero_banner_texture.jpeg';

/**
 * CvsInvoiceCard:
 * Practical CVS Pharmacy invoice document with optical tracking bounding boxes,
 * corner brackets, line-item extractions, and highlighted grand total.
 */
function CvsInvoiceCard({ isMobileFrame = false }) {
  return (
    <div
      className={`relative z-10 w-full rounded-xl border border-white/15 bg-[#171922] ${
        isMobileFrame ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
      } shadow-2xl ${
        isMobileFrame ? '' : 'transform lg:rotate-1 lg:hover:rotate-0 transition-transform duration-500'
      } font-mono text-xs text-white`}
    >
      {/* 1. Header: CVS Pharmacy & INVOICE Tag */}
      <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          {/* CVS Health Red Heart Logo */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="#EF4444"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-wider">
              CVS PHARMACY #04821
            </h3>
            <p className="text-[10px] text-white/50 mt-0.5">
              Ref: #RX-2026-8921 // STORE 1400 MAIN ST
            </p>
          </div>
        </div>

        <span className="text-[10.5px] font-bold text-white/60 tracking-widest uppercase pt-0.5">
          INVOICE
        </span>
      </div>

      {/* 2. Metadata Block */}
      <div className="grid grid-cols-2 gap-2 text-[10.5px] text-white/60 mb-5">
        <div>
          <span className="text-white/40 block text-[9px] uppercase tracking-wider">PATIENT / BILL TO</span>
          <span className="text-white font-semibold">GLOBAL LABS INC (CO-PAY)</span>
        </div>
        <div className="text-right">
          <span className="text-white/40 block text-[9px] uppercase tracking-wider">TX DATE</span>
          <span className="text-white font-semibold">12 / 02 / 2026</span>
        </div>
      </div>

      {/* 3. Itemized Extraction Table */}
      <div className="border-t border-white/10 pt-3 mb-5 space-y-2">
        <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-wider px-2.5 pb-1">
          <span>ITEM</span>
          <span>TOTAL</span>
        </div>

        {/* Optical Tracking Bounding Box Extracting Line Item 1 */}
        <div className="relative px-2.5 py-2 border-[1.5px] border-white bg-white/10 rounded-sm flex items-center justify-between text-[11px] text-white shadow-sm">
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

          <span className="truncate pr-2 font-medium">01. Rx Amoxicillin 500mg (30ct)</span>
          <span className="text-white font-bold shrink-0">$14.20</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/80 px-2.5 py-1">
          <span className="truncate pr-2">02. First Aid Diagnostic Kit</span>
          <span className="text-white font-semibold shrink-0">$28.50</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/80 px-2.5 py-1">
          <span className="truncate pr-2">03. Daily Immune Vitamin C (60ct)</span>
          <span className="text-white font-semibold shrink-0">$12.00</span>
        </div>
      </div>

      {/* 4. Grand Total Section with Matching Optical Bounding Box */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4 mb-3 px-2.5">
        <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">
          GRAND TOTAL
        </span>

        {/* Optical Highlight Box with Matching Corner Bracket Geometry */}
        <div className="relative px-3.5 py-1.5 border-[1.5px] border-white bg-white/10 rounded-sm shadow-sm">
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

          <span className="text-base sm:text-lg font-bold text-white tracking-tight">
            $54.70
          </span>
        </div>
      </div>

      {/* 5. Fake QR Code Verification Block */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between px-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 p-0.5 bg-white rounded-sm shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="#171922">
              <rect x="2" y="2" width="7" height="7" rx="0.5" fill="#171922" />
              <rect x="3.5" y="3.5" width="4" height="4" fill="white" />
              <rect x="4.5" y="4.5" width="2" height="2" fill="#171922" />
              <rect x="15" y="2" width="7" height="7" rx="0.5" fill="#171922" />
              <rect x="16.5" y="3.5" width="4" height="4" fill="white" />
              <rect x="17.5" y="4.5" width="2" height="2" fill="#171922" />
              <rect x="2" y="15" width="7" height="7" rx="0.5" fill="#171922" />
              <rect x="3.5" y="16.5" width="4" height="4" fill="white" />
              <rect x="4.5" y="17.5" width="2" height="2" fill="#171922" />
              <rect x="11" y="2" width="2" height="2" fill="#171922" />
              <rect x="11" y="6" width="2" height="2" fill="#171922" />
              <rect x="10" y="10" width="4" height="4" fill="#171922" />
              <rect x="16" y="11" width="3" height="2" fill="#171922" />
              <rect x="5" y="11" width="3" height="2" fill="#171922" />
              <rect x="11" y="16" width="2" height="4" fill="#171922" />
              <rect x="15" y="15" width="3" height="3" fill="#171922" />
              <rect x="19" y="19" width="3" height="3" fill="#171922" />
              <rect x="15" y="20" width="2" height="2" fill="#171922" />
            </svg>
          </div>
          <div>
            <span className="block text-[8.5px] font-bold text-white/70 tracking-wider">DIGITAL TX TOKEN</span>
            <span className="text-[8px] text-white/40 font-mono">AUTH: SHA256-8921</span>
          </div>
        </div>
        <span className="text-[8px] font-mono text-white/40 tracking-wider">VERIFIED INVOICE</span>
      </div>
    </div>
  );
}

/**
 * LandingPage:
 * - Top Hero Banner: Dark-themed with hero_banner_texture.jpeg opacity and tactile grain texture,
 *   submerged Gaussian blur negative space on the left.
 * - Desktop: Practical CVS Pharmacy invoice card on the right side of the hero.
 * - Mobile: Clean typography leading directly into the light theme.
 * - Downstream Sections: Pure architectural light theme (inspired by Meuze.ai's light sheets).
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/analytics');
    } else {
      navigate('/register');
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* ========================================================
          1. HERO BANNER (CRISP DEEP DARK NAVY-BLUE)
         ======================================================== */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#030611] text-white px-6 sm:px-12 lg:px-16 py-8 select-none">
        {/* FULL-BANNER CRISP TEXTURE LAYER (NO BLUR FILTER) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <img
            src={heroBannerTexture}
            alt=""
            className="w-full h-full object-cover scale-100 opacity-60 contrast-110 brightness-85"
          />
        </div>

        {/* FULL-BANNER CLEAN DEEP NAVY-BLUE DEPTH VEIL */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse 100% 100% at 30% 40%, rgba(6, 12, 28, 0.60) 0%, rgba(3, 7, 18, 0.82) 70%, #02040b 100%)',
          }}
        />

        {/* CLEAN SUBTLE ANALOG GRAIN TEXTURE */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] mix-blend-overlay"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='heroNoiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23heroNoiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* --- TOP BRAND HEADER BAR (ALIGNED WITH HERO CONTENT) --- */}
        <header className="relative z-30 w-full max-w-7xl mx-auto flex items-center justify-between pt-1 pb-2">
          {/* Official Geometric Diamond Logo + Wordmark (Larger & Crisp) */}
          <Link to="/" className="flex items-center gap-3.5 no-underline text-inherit group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
              <svg width="38" height="38" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect
                  x="16"
                  y="2"
                  width="19.7989"
                  height="19.7989"
                  transform="rotate(45 16 2)"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="#0a0a0b"
                />
                <polygon points="16,8 24,16 16,16" fill="white" />
              </svg>
            </div>
            <span
              className="text-2xl sm:text-3xl font-bold tracking-tight lowercase text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              invostream
            </span>
          </Link>
        </header>

        {/* --- MAIN HERO BODY --- */}
        <div className="relative z-20 w-full max-w-7xl mx-auto my-auto py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Razor-Sharp Typography on Clean Dark Navy Backdrop */}
          <div className="lg:col-span-6 space-y-6">

            {/* Major Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-normal text-white tracking-tight leading-[1.12] font-sans max-w-lg">
              Your bank tells you how much. This tells you what.
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-md font-sans">
              Categories like “shopping” and “travel” don’t help much three weeks later. Invostream reads your receipts and keeps the line items, so you can actually remember where it went.
            </p>

            {/* Subtle Divider Line */}
            <div className="w-full max-w-md border-t border-white/10 pt-2" />

            {/* Action Buttons (Stacked & Capitalized) */}
            <div className="flex flex-col items-start gap-2.5 pt-2">
              <button
                onClick={handleGetStarted}
                className="px-6 py-3 rounded-lg text-xs font-mono font-semibold bg-white text-black hover:bg-white/90 transition-all cursor-pointer shadow-md tracking-wider uppercase"
              >
                Please sign up to store your scans securely →
              </button>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg text-xs font-mono font-semibold border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer tracking-wider uppercase no-underline inline-block"
              >
                or Sign in if you already have an account
              </Link>
            </div>
          </div>

          {/* DESKTOP ONLY: Framed Container with Practical CVS Pharmacy Invoice */}
          <div className="hidden lg:flex lg:col-span-6 justify-end">
            <div className="relative w-full max-w-[540px] rounded-3xl border border-white/15 bg-[#0a0e1a]/90 p-5 sm:p-8 shadow-2xl overflow-hidden">
              <CvsInvoiceCard isMobileFrame={false} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. "HOW IT WORKS" SECTION (PURE ARCHITECTURAL LIGHT THEME)
         ======================================================== */}
      <section id="how-it-works" className="relative z-10 bg-[#f8fafc] text-slate-900 px-6 sm:px-12 lg:px-16 py-20 sm:py-24 scroll-mt-16 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4 font-sans">
              Upload a receipt. Get the details back.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Invostream reads the receipt — vendor, line items, tax, date — and files it somewhere you can actually search later.
            </p>
          </div>

          {/* 4 Light-Themed Step Columns with Connecting Arrows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Card 01 */}
            <div className="relative p-5 sm:p-6 rounded-2xl border border-slate-300 bg-white shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  01 · UPLOAD
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                  Photos or PDFs
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Take a picture of the receipt or drop in a PDF. Upload a stack at once if you've been putting it off.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                PDF · JPEG · PNG · TIFF
              </div>

              {/* Connecting Arrow to Step 02 (Freestanding outside the box) */}
              <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Card 02 */}
            <div className="relative p-5 sm:p-6 rounded-2xl border border-slate-300 bg-white shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  02 · EXTRACT
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                  Line items, not just totals
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Vendor, individual items, subtotal, tax, and date get pulled out automatically.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                Powered by Azure Document Intelligence
              </div>

              {/* Connecting Arrow to Step 03 (Freestanding outside the box) */}
              <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Card 03 */}
            <div className="relative p-5 sm:p-6 rounded-2xl border border-slate-300 bg-white shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider block mb-1">
                  03 · DEDUPE
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                  Upload the same one twice, safely
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Every file gets fingerprinted on the way in, so a duplicate upload won't turn into a duplicate record.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                SHA-256 fingerprinting
              </div>

              {/* Connecting Arrow to Step 04 (Freestanding outside the box) */}
              <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Card 04 */}
            <div className="relative p-5 sm:p-6 rounded-2xl border border-slate-300 bg-white shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  04 · REVIEW
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                  Fix anything it got wrong
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Extractions land in a list you can search and correct by hand.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                Search · edit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. OPERATIONS SECTION (PURE ARCHITECTURAL LIGHT THEME)
         ======================================================== */}
      <section id="operations" className="relative z-10 bg-white text-slate-900 px-6 sm:px-12 lg:px-16 py-24 scroll-mt-16 border-t border-slate-100">
        <div className="max-w-6xl mx-auto mb-12">
          <p className="text-[10.5px] font-mono font-bold tracking-widest uppercase text-slate-500 mb-2">
            OPERATIONS
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight max-w-2xl mb-4 font-sans">
            Extraction, deduplication, line-items, and ledger sync, all handled for you.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
            Invostream connects to everything you already run: your inbox, scanner uploads, and accounting books. Invostream replaces none of it. Then Invostream runs your invoice pipeline.
          </p>
        </div>

        {/* 4 Operations Column Cards with Precision Vector Plates (Light Themed) */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plate 1: Extraction */}
          <div className="p-5 rounded-xl border border-slate-200 bg-[#f8fafc] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                EXTRACTION
              </span>

              <div className="w-full aspect-[4/3] rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center mb-3">
                <svg viewBox="0 0 200 150" className="w-full h-full select-none" fill="none">
                  <rect x="25" y="15" width="150" height="120" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="40" y="30" width="60" height="6" rx="2" fill="#0f172a" opacity="0.85" />
                  <rect x="120" y="30" width="40" height="6" rx="2" fill="#94a3b8" opacity="0.5" />
                  <line x1="40" y1="46" x2="160" y2="46" stroke="#e2e8f0" strokeWidth="1" />
                  <rect x="40" y="58" width="75" height="4" rx="1.5" fill="#64748b" opacity="0.6" />
                  <rect x="130" y="58" width="30" height="4" rx="1.5" fill="#64748b" opacity="0.6" />
                  <rect x="40" y="72" width="65" height="4" rx="1.5" fill="#64748b" opacity="0.6" />
                  <rect x="130" y="72" width="30" height="4" rx="1.5" fill="#64748b" opacity="0.6" />
                  <line x1="25" y1="85" x2="175" y2="85" stroke="#2563eb" strokeWidth="1.5" />
                  <rect x="115" y="105" width="45" height="14" rx="3" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
                  <text x="137" y="115" textAnchor="middle" fill="#16a34a" fontSize="7" fontFamily="'Space Mono', monospace" fontWeight="700">PARSED</text>
                </svg>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Reads every line item
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Isolates itemized tables, unit quantities, and taxes across multi-page invoice documents.
              </p>
            </div>
          </div>

          {/* Plate 2: Deduplication */}
          <div className="p-5 rounded-xl border border-slate-200 bg-[#f8fafc] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                DEDUPLICATION
              </span>

              <div className="w-full aspect-[4/3] rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center mb-3">
                <svg viewBox="0 0 200 150" className="w-full h-full select-none" fill="none">
                  <rect x="20" y="25" width="75" height="100" rx="4" fill="#f8fafc" stroke="#16a34a" strokeWidth="1.2" />
                  <rect x="105" y="25" width="75" height="100" rx="4" fill="#f8fafc" stroke="#d97706" strokeWidth="1.2" strokeDasharray="3 3" />
                  <path d="M 95 75 H 105" stroke="#0f172a" strokeWidth="1.5" />
                  <circle cx="100" cy="75" r="14" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                  <path d="M 95 75 L 98.5 78.5 L 105 71.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="28" y="105" width="58" height="12" rx="2" fill="#dcfce7" />
                  <text x="57" y="114" textAnchor="middle" fill="#16a34a" fontSize="7" fontFamily="'Space Mono', monospace" fontWeight="700">ORIGINAL</text>
                  <rect x="113" y="105" width="58" height="12" rx="2" fill="#fef3c7" />
                  <text x="142" y="114" textAnchor="middle" fill="#d97706" fontSize="7" fontFamily="'Space Mono', monospace" fontWeight="700">FLAGGED</text>
                </svg>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Stops double payments
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Cross-checks cryptographic hashes against historical ledgers to flag duplicate entries.
              </p>
            </div>
          </div>

          {/* Plate 3: Spending Velocity */}
          <div className="p-5 rounded-xl border border-slate-200 bg-[#f8fafc] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                SPEND VELOCITY
              </span>

              <div className="w-full aspect-[4/3] rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center mb-3">
                <svg viewBox="0 0 200 150" className="w-full h-full select-none" fill="none">
                  <line x1="20" y1="120" x2="180" y2="120" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="30" y="85" width="16" height="35" rx="2" fill="#94a3b8" opacity="0.4" />
                  <rect x="58" y="70" width="16" height="50" rx="2" fill="#94a3b8" opacity="0.4" />
                  <rect x="86" y="90" width="16" height="30" rx="2" fill="#94a3b8" opacity="0.4" />
                  <rect x="114" y="55" width="16" height="65" rx="2" fill="#94a3b8" opacity="0.4" />
                  <rect x="142" y="35" width="16" height="85" rx="2" fill="#16a34a" opacity="0.9" stroke="#16a34a" strokeWidth="1" />
                  <polyline points="38,80 66,65 94,85 122,50 150,30" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                  <circle cx="150" cy="30" r="3" fill="#2563eb" />
                </svg>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Monitors cash velocity
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Tracks burn rates, monthly category concentrations, and invoice throughput.
              </p>
            </div>
          </div>

          {/* Plate 4: Integrations */}
          <div className="p-5 rounded-xl border border-slate-200 bg-[#f8fafc] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                ACCOUNTING SYNC
              </span>

              <div className="w-full aspect-[4/3] rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center mb-3">
                <svg viewBox="0 0 200 150" className="w-full h-full select-none" fill="none">
                  <rect x="25" y="30" width="150" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="33" y="38" width="8" height="8" rx="1.5" fill="#16a34a" />
                  <text x="48" y="46" fill="#0f172a" fontSize="8" fontFamily="'Space Mono', monospace" fontWeight="700">CVS Pharmacy #04821</text>
                  <text x="165" y="46" textAnchor="end" fill="#16a34a" fontSize="8" fontFamily="'Space Mono', monospace" fontWeight="700">$54.70</text>

                  <rect x="25" y="62" width="150" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="33" y="70" width="8" height="8" rx="1.5" fill="#16a34a" />
                  <text x="48" y="78" fill="#0f172a" fontSize="8" fontFamily="'Space Mono', monospace" fontWeight="700">Stripe Billing</text>
                  <text x="165" y="78" textAnchor="end" fill="#16a34a" fontSize="8" fontFamily="'Space Mono', monospace" fontWeight="700">$340</text>

                  <rect x="25" y="94" width="150" height="26" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
                  <text x="100" y="110" textAnchor="middle" fill="#2563eb" fontSize="8" fontFamily="'Space Mono', monospace" fontWeight="700">EXPORT: CSV • JSON • REST</text>
                </svg>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">
                1-Click Export & Sync
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Exports verified tables to formatted CSVs, structured JSON, or automated webhooks.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* ========================================================
          3. FULL-WIDTH EDITORIAL FOOTER (STACKED LEFT-ALIGNED)
         ======================================================== */}
      <footer className="relative z-10 w-full bg-white border-t border-slate-200 px-6 sm:px-12 lg:px-16 py-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col items-start text-left gap-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="font-bold text-sm tracking-tight text-slate-900 lowercase"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              invostream
            </span>
            <span className="text-slate-300">•</span>
            <span>© 2026 Invostream</span>
          </div>

          <p className="text-[11.5px] text-slate-500 font-sans">
            Extraction powered by <span className="font-semibold text-slate-700">Microsoft Azure Document Intelligence</span>
          </p>

          <p className="text-[11px] text-slate-400 font-sans pt-0.5">
            Made by <span className="font-medium text-slate-600">Minh Han</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
