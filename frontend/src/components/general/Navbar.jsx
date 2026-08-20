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
            to="/analytics" 
            className={({ isActive }) => `text-sm font-medium transition-all no-underline py-1.5 ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            Analytics
          </NavLink>

          <NavLink 
            to="/review" 
            className={({ isActive }) => `text-sm font-medium transition-all no-underline py-1.5 ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            Invoice Review
          </NavLink>

          <NavLink 
            to="/upload" 
            className={({ isActive }) => `text-sm font-medium transition-all no-underline py-1.5 ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            Upload Invoices
          </NavLink>

          {/* Theme Toggler Button */}
          <button
            onClick={toggleTheme}
            title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
              isLight || isScrolled
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          <SignedIn>
            <div className="flex items-center">
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    avatarBox: `w-7 h-7 rounded-full transition-all duration-300 hover:opacity-85 ${
                      isScrolled 
                        ? 'ring-1 ring-slate-300/80 hover:ring-slate-400 shadow-xs' 
                        : 'ring-1 ring-white/20 hover:ring-white/40 shadow-xs'
                    }`,
                    userButtonTrigger: 'focus:shadow-none focus:outline-none'
                  }
                }}
              />
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
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
              isLight || isScrolled
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          <button 
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            className={`flex flex-col justify-center items-center w-9 h-9 focus:outline-none cursor-pointer transition-colors ${
              isScrolled ? 'text-slate-900' : 'text-white'
            }`}
          >
            {isOpen ? (
              <X className="w-5 h-5" />
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
          className="md:hidden mt-3 py-2 flex flex-col gap-1 animate-fade-in"
        >
          <NavLink 
            to="/analytics" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </NavLink>
          <NavLink 
            to="/review" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Invoice Review
          </NavLink>
          <NavLink 
            to="/upload" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'text-slate-900 font-semibold' : 'text-white font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            <UploadIcon className="w-4 h-4" />
            Upload Invoices
          </NavLink>

          {/* Clerk User Auth Button in Mobile Menu */}
          <div className="pt-2 mt-1">
            <SignedIn>
              <div className="flex items-center gap-3 px-4 py-2.5">
                <UserButton afterSignOutUrl="/" />
                <span className={`text-sm font-medium ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                  Account
                </span>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="px-4 py-2">
                <NavLink 
                  to="/login"
                  onClick={closeMenu}
                  className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-gray-200 transition-all no-underline shadow-sm"
                >
                  Sign In
                </NavLink>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}
