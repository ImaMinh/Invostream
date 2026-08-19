import React from 'react';
import { Link } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { ShieldCheck } from 'lucide-react';

export default function Register() {
  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-[#00E5FF] selection:text-black relative overflow-hidden"
      style={{
        fontFamily: "'Inter', 'Montserrat', system-ui, -apple-system, sans-serif",
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E676]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#00E5FF]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group no-underline mb-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-black border border-gray-800 group-hover:border-[#00E5FF]/50 transition-colors shadow-lg">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="2" width="19.7989" height="19.7989" transform="rotate(45 16 2)" stroke="#00E5FF" strokeWidth="2.5" fill="#0a0a0b" />
                <polygon points="16,8 24,16 16,16" fill="#00E5FF" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white lowercase">
              invostream
            </span>
          </Link>
        </div>

        {/* 
          Clerk Sign Up Micro-Frontend Component:
          - Automatically mounts an interactive sign-up form into the DOM.
          - Uses VITE_CLERK_PUBLISHABLE_KEY from ClerkProvider (main.jsx) to fetch form fields & OAuth config from Clerk Cloud.
          - Manages state internally (email/password validation, OTP verification, and JWT session creation).
          - Handles DOM mounting on render and teardown/unmounting when navigating away.
        */}
        <div className="w-full flex justify-center">
          <SignUp 
            routing="path" // Enables client-side path routing compatible with React Router
            path="/register" // Mount path for the sign-up route 
            signInUrl="/login" // Link target for users who already have an account
            fallbackRedirectUrl="/review"
            forceRedirectUrl="/review"
            appearance={{ // Custom styling object: Overrides default Clerk CSS elements with Invostream's Tailwind dark-theme
              elements: {
                rootBox: 'w-full flex justify-center',
                card: 'bg-[#111111]/95 border border-gray-800/90 text-white shadow-2xl rounded-2xl backdrop-blur-xl w-full',
                headerTitle: 'text-white font-bold text-xl',
                headerSubtitle: 'text-gray-400 text-xs',
                socialButtonsBlockButton: 'bg-black border border-gray-800 text-white hover:bg-gray-900',
                formButtonPrimary: 'bg-[#00E676] hover:bg-[#00c865] text-black font-bold py-2.5 rounded-xl',
                footerActionLink: 'text-[#00E5FF] hover:underline font-medium',
                formFieldInput: 'bg-black/60 border-gray-800 text-white rounded-xl',
                formFieldLabel: 'text-gray-400 text-xs uppercase tracking-wider font-mono',
                identityPreviewText: 'text-gray-300',
                identityPreviewEditButtonIcon: 'text-[#00E676]',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
