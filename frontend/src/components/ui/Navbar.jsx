import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Upload as UploadIcon, X, BarChart3, Sun, Moon } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLight, isScrolled, toggleTheme } = useTheme();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <header 
      className={`sticky top-0 z-50 w-full px-4 sm:px-6 py-4 backdrop-blur-md border-b transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled 
          ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.08)]' 
          : 'bg-[#0a0a0b]/90 border-white/10 text-white shadow-2xl'
      }`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.90)' : 'rgba(10, 10, 11, 0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isScrolled ? '1px solid rgba(226, 232, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isScrolled 
          ? '0 12px 28px -6px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08), inset 0 -1px 0 0 rgba(226, 232, 240, 0.9)' 
          : '0 10px 30px -10px rgba(0,0,0,0.5), inset 0 -1px 0 0 rgba(255, 255, 255, 0.08)',
        padding: '1rem 1.5rem',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <NavLink 
          to="/review" 
          onClick={closeMenu} 
          className="flex items-center gap-2.5 sm:gap-3 group no-underline"
        >
          {/* Geometric Diamond Mark Icon*/}
          <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="16" y="2" width="19.7989" height="19.7989" transform="rotate(45 16 2)" stroke={isScrolled ? "#0f172a" : "white"} strokeWidth="2.5" fill={isScrolled ? "#f8fafc" : "#0a0a0b"} />
              <polygon points="16,8 24,16 16,16" fill={isScrolled ? "#0f172a" : "white"} />
            </svg>
          </div>
          <span 
            className={`text-lg sm:text-xl font-bold tracking-tight lowercase transition-colors duration-500 ${
              isScrolled ? 'text-slate-900' : 'text-white'
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            invostream
          </span>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink 
            to="/review" 
            className={({ isActive }) => `relative text-sm font-medium transition-all no-underline py-1.5 ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            {({ isActive }) => (
              <>
                <span>Invoice Review</span>
                {isActive && (
                  <span className={`absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full transition-all duration-300 ${
                    isLight 
                      ? 'bg-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.2)]' 
                      : 'bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]'
                  }`} />
                )}
              </>
            )}
          </NavLink>

          <NavLink 
            to="/upload" 
            className={({ isActive }) => `relative text-sm font-medium transition-all no-underline py-1.5 ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            {({ isActive }) => (
              <>
                <span>Upload Invoices</span>
                {isActive && (
                  <span className={`absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full transition-all duration-300 ${
                    isLight 
                      ? 'bg-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.2)]' 
                      : 'bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]'
                  }`} />
                )}
              </>
            )}
          </NavLink>

          <NavLink 
            to="/analytics" 
            className={({ isActive }) => `relative text-sm font-medium transition-all no-underline py-1.5 ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            {({ isActive }) => (
              <>
                <span>Analytics</span>
                {isActive && (
                  <span className={`absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full transition-all duration-300 ${
                    isLight 
                      ? 'bg-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.2)]' 
                      : 'bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]'
                  }`} />
                )}
              </>
            )}
          </NavLink>

          {/* Theme Toggler Button */}
          <button
            onClick={toggleTheme}
            title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
              isLight 
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 shadow-sm' 
                : 'bg-zinc-800/80 border-zinc-700/80 text-amber-400 hover:bg-zinc-700 shadow-md'
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <SignedIn>
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          <SignedOut>
            <NavLink 
              to="/login"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-gray-200 transition-all no-underline shadow-sm"
            >
              Sign In
            </NavLink>
          </SignedOut>
        </nav>

        {/* Mobile Hamburger & Theme Toggle Button Group */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
            className={`p-2 rounded-lg transition-all duration-300 cursor-pointer border ${
              isLight 
                ? 'bg-slate-100 border-slate-300 text-slate-700 shadow-sm' 
                : 'bg-zinc-800 border-zinc-700 text-amber-400 shadow-md'
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button 
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            className={`flex flex-col justify-center items-center w-9 h-9 focus:outline-none cursor-pointer border rounded p-1 transition-all ${
              isScrolled ? 'border-slate-800 bg-slate-50 text-slate-900 shadow-sm' : 'border-white/20 bg-transparent text-white'
            }`}
            style={{
              borderRadius: '4px',
              border: isScrolled ? '1px solid #1e293b' : '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {isOpen ? (
              <X className={`w-5 h-5 ${isScrolled ? 'text-slate-900' : 'text-white'}`} />
            ) : (
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`w-full h-[1.5px] transition-colors ${isScrolled ? 'bg-slate-900' : 'bg-white'}`}></span>
                <span className={`w-full h-[1.5px] transition-colors ${isScrolled ? 'bg-slate-900' : 'bg-white'}`}></span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Responsive Dropdown Menu (Mobile Only) */}
      {isOpen && (
        <div 
          className={`md:hidden mt-3 py-3 px-2 border rounded-md flex flex-col gap-1.5 animate-fade-in ${
            isScrolled ? 'bg-white/95 border-slate-200 shadow-xl' : 'bg-[#111113]/95 border-white/10'
          }`}
          style={{
            backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 17, 19, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '0.375rem'
          }}
        >
          <NavLink 
            to="/review" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-white/10 text-white font-semibold') 
                : (isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5')
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Invoice Review
          </NavLink>
          <NavLink 
            to="/upload" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-white/10 text-white font-semibold') 
                : (isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5')
            }`}
          >
            <UploadIcon className="w-4 h-4" />
            Upload Invoices
          </NavLink>
          <NavLink 
            to="/analytics" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-white/10 text-white font-semibold') 
                : (isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5')
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </NavLink>

          {/* Theme Toggler Item in Mobile Menu */}
          <button
            onClick={() => { toggleTheme(); closeMenu(); }}
            className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
              isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>Theme: {isLight ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
              Toggle
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
