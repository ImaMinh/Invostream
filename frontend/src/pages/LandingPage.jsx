import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import {
  Camera,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Activity,
  BarChart2
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/review');
    } else {
      navigate('/register');
    }
  };

  const handleJoinSecurely = () => {
    if (isSignedIn) {
      navigate('/review');
    } else {
      navigate('/register');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00E5FF] selection:text-black overflow-x-hidden"
      style={{
        fontFamily: "'Inter', 'Montserrat', system-ui, -apple-system, sans-serif",
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* SECTION 1: HERO AREA (Above the Fold) */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Column (Copy) */}
          <div className="flex flex-col items-start text-left z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-800 bg-[#111111]/80 backdrop-blur-sm text-xs font-mono text-gray-300 tracking-wider uppercase mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E676]"></span>
              </span>
              AI EXTRACTION ACTIVE
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
              Automate Your Invoices.<br />
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Master Your Spending.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-gray-400 font-normal leading-relaxed max-w-xl mb-8">
              Quickly scan invoices and track monthly spending with intelligent AI that does the heavy lifting for you.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              className="group inline-flex items-center justify-center gap-2 bg-[#00E5FF] text-black font-bold px-7 py-3.5 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.5)] hover:shadow-[0_0_25px_rgba(0,229,255,0.85)] hover:bg-[#33ebff] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-base"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Right Column (Visual Dashboard Mockup) */}
          <div className="relative z-10">
            <div className="bg-[#111111]/90 border border-gray-800/90 rounded-xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
              {/* Subtle top glow line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/40 to-transparent" />

              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b border-gray-800/60 pb-4">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase tracking-widest block font-semibold">
                    LIVE ENGINE TELEMETRY
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5 tracking-tight">
                    Document Pipeline
                  </h2>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,230,118,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></span>
                  SYNCED
                </div>
              </div>

              {/* Body: Two side-by-side cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

                {/* Card 1: Processing */}
                <div className="bg-[#0a0a0a]/90 border border-gray-800/80 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      PROCESSING
                    </span>
                    <Clock className="w-4 h-4 text-[#FFC107]" />
                  </div>

                  {/* SVG Half-circle Donut Chart */}
                  <div className="my-4 flex items-center justify-center relative">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#FFC107]"
                        strokeDasharray="50, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">4</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-[#FFC107] tracking-wider uppercase block">
                      IN QUEUE
                    </span>
                  </div>
                </div>

                {/* Card 2: Completed */}
                <div className="bg-[#0a0a0a]/90 border border-gray-800/80 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      COMPLETED
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                  </div>

                  {/* SVG Complete Donut Chart */}
                  <div className="my-4 flex items-center justify-center relative">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#00E676]"
                        strokeDasharray="100, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">18</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-[#00E676] tracking-wider uppercase block">
                      VERIFIED
                    </span>
                  </div>
                </div>

              </div>

              {/* Card Footer Progress */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-2 font-medium">
                  <span>Extraction engine pipeline load</span>
                  <span className="text-[#00E5FF] font-mono font-bold">94%</span>
                </div>
                <div className="w-full bg-gray-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-gray-700/50">
                  <div className="bg-[#00E5FF] h-full rounded-full w-[94%] shadow-[0_0_12px_#00E5FF] transition-all duration-1000" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: FEATURES ("PRODUCT CAPABILITIES") */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-gray-800/50 relative">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[#00E5FF] text-xs font-mono uppercase tracking-widest font-bold block mb-2">
            PRODUCT CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Simplicity at Every Step
          </h2>
        </div>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">

          {/* Card 1 */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 sm:p-8 shadow-xl hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Rapid Scan</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Instantly upload PDF, JPG, and PNG files.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 sm:p-8 shadow-xl hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-lg bg-[#FFC107]/10 border border-[#FFC107]/30 flex items-center justify-center text-[#FFC107] mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Data Capture</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our AI automatically identifies vendor, date, and amounts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 sm:p-8 shadow-xl hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-lg bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center text-[#00E676] mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Visual Spending</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Automatically visualize monthly spending by category.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 3: SECURITY & REQUIRED ACCOUNT */}
      <section className="relative py-20 sm:py-28 px-4 overflow-hidden border-t border-gray-800/50">
        {/* Subtle Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00E676]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#111111] border-2 border-[#FFC107] flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,193,7,0.25)]">
            <ShieldCheck className="w-8 h-8 text-[#FFC107]" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Your Finance Data, Secured.
          </h2>

          {/* Subtext */}
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Create an account to store your invoices securely. Platform access is strictly limited to registered users.
          </p>

          {/* Button */}
          <button
            onClick={handleJoinSecurely}
            className="inline-flex items-center justify-center gap-2.5 bg-[#00E676] hover:bg-[#00c865] text-white font-bold px-8 py-4 rounded-lg shadow-[0_0_15px_rgba(0,230,118,0.5)] hover:shadow-[0_0_25px_rgba(0,230,118,0.8)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-base"
          >
            <span>Join Invostream Securely</span>
            <Lock className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </section>

      {/* SECTION 4: FOOTER */}
      <footer className="border-t border-gray-800/80 px-6 sm:px-12 py-8 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <BarChart2 className="w-4 h-4 text-[#00E5FF]" />
          <span>invostream | © 2026 invostream. All Rights Reserved.</span>
        </div>

        {/* Right Side */}
        <div className="text-xs text-gray-500 font-mono">
          Made by Minh Han.
        </div>
      </footer>
    </div>
  );
}
