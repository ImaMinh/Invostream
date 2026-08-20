import React from 'react';
import { Link } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';

export default function Register() {
  return (
    <div 
      className="min-h-screen bg-[#08090d] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-white selection:text-black relative overflow-hidden font-sans"
    >
      {/* Main Unified Card Container (Bento Card Style: Darker Background & Lighter Sharp Border) */}
      <div className="w-full max-w-[440px] z-10 rounded-none border border-white/25 bg-[#07090e] shadow-2xl overflow-hidden flex flex-col items-center">
        
        {/* Brand Header Inside the Card (Compact Padding) */}
        <div className="w-full pt-5 pb-1 px-6 flex justify-center text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group no-underline">
            <div className="w-7 h-7 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="2" width="19.7989" height="19.7989" transform="rotate(45 16 2)" stroke="white" strokeWidth="2.5" fill="#0a0a0b" />
                <polygon points="16,8 24,16 16,16" fill="white" />
              </svg>
            </div>
            <span 
              className="text-xl font-bold tracking-tight text-white lowercase"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              invostream
            </span>
          </Link>
        </div>

        {/* Clerk Sign Up Component styled seamlessly */}
        <div className="w-full">
          <SignUp 
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/analytics"
            forceRedirectUrl="/analytics"
            appearance={{
              variables: {
                colorPrimary: '#ffffff',
                colorBackground: '#07090e',
                colorText: '#ffffff',
                colorTextSecondary: '#94a3b8',
                colorInputBackground: '#040508',
                colorInputText: '#ffffff',
                colorNeutral: '#ffffff',
                borderRadius: '0px',
              },
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none rounded-none border-none bg-transparent',
                card: 'w-full bg-transparent border-none shadow-none text-white p-6 pt-0 sm:p-8 sm:pt-0 rounded-none',
                header: 'pt-0 pb-4',
                headerTitle: 'text-white font-bold text-xl tracking-tight font-sans text-center',
                headerSubtitle: 'text-slate-400 text-xs font-sans text-center',
                socialButtonsBlockButton: 'bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/35 transition-all text-xs font-medium rounded-none',
                socialButtonsBlockButtonText: 'text-white font-medium text-xs',
                dividerLine: 'bg-white/20',
                dividerText: 'text-slate-500 text-xs font-mono',
                formButtonPrimary: 'bg-white hover:bg-white/90 text-black font-bold py-2.5 rounded-none transition-all shadow-md text-xs tracking-wider uppercase',
                footer: 'bg-[#040508] border-t border-white/20 p-4 rounded-none',
                footerAction: 'bg-transparent text-slate-400 text-xs justify-center',
                footerActionLink: 'text-sky-400 hover:text-sky-300 font-medium transition-colors text-xs',
                footerActionText: 'text-slate-400 text-xs',
                footerPages: 'bg-[#040508]',
                footerPagesLink: 'text-slate-400 hover:text-white text-xs',
                formFieldInput: 'bg-[#040508] border-white/20 text-white rounded-none text-xs focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-all placeholder:text-slate-600',
                formFieldLabel: 'text-slate-300 text-xs font-mono uppercase tracking-wider',
                identityPreviewText: 'text-slate-300 text-xs',
                identityPreviewEditButtonIcon: 'text-sky-400',
                formHeaderSubtitle: 'text-slate-400 text-xs text-center',
                formResendCodeLink: 'text-sky-400 hover:text-sky-300 text-xs',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
