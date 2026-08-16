import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Upload as UploadIcon, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <header 
      className={`sticky top-0 z-50 w-full px-4 sm:px-6 py-4 backdrop-blur-md border-b transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled 
          ? 'bg-white/85 border-slate-200/80 text-slate-900 shadow-sm scale-[0.998]' 
          : 'bg-[#0a0a0b]/90 border-white/10 text-white scale-100'
      }`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(10, 10, 11, 0.90)',
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isScrolled ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem 1.5rem',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <NavLink 
          to="/" 
          onClick={closeMenu} 
          className="flex items-center gap-2.5 sm:gap-3 group no-underline"
        >
          {/* Geometric Diamond Mark */}
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
        <nav className="hidden md:flex items-center gap-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => `relative text-sm font-medium transition-all no-underline py-1 ${
              isActive 
                ? (isScrolled ? 'text-cyan-600 font-semibold' : 'text-cyan-400 font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            {({ isActive }) => (
              <>
                <span>Analytics</span>
                {isActive && (
                  <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-[35%] h-[1.5px] bg-gradient-to-r from-transparent ${
                    isScrolled ? 'via-cyan-600' : 'via-cyan-400'
                  } to-transparent`} />
                )}
              </>
            )}
          </NavLink>

          <NavLink 
            to="/review" 
            className={({ isActive }) => `relative text-sm font-medium transition-all no-underline py-1 ${
              isActive 
                ? (isScrolled ? 'text-cyan-600 font-semibold' : 'text-cyan-400 font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            {({ isActive }) => (
              <>
                <span>Invoice Review</span>
                {isActive && (
                  <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-[35%] h-[1.5px] bg-gradient-to-r from-transparent ${
                    isScrolled ? 'via-cyan-600' : 'via-cyan-400'
                  } to-transparent`} />
                )}
              </>
            )}
          </NavLink>

          <NavLink 
            to="/upload" 
            className={({ isActive }) => `relative text-sm font-medium transition-all no-underline py-1 ${
              isActive 
                ? (isScrolled ? 'text-cyan-600 font-semibold' : 'text-cyan-400 font-semibold') 
                : (isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white')
            }`}
          >
            {({ isActive }) => (
              <>
                <span>Upload Invoices</span>
                {isActive && (
                  <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-[35%] h-[1.5px] bg-gradient-to-r from-transparent ${
                    isScrolled ? 'via-cyan-600' : 'via-cyan-400'
                  } to-transparent`} />
                )}
              </>
            )}
          </NavLink>
        </nav>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={toggleMenu}
          aria-label="Toggle Menu"
          className={`md:hidden flex flex-col justify-center items-center w-9 h-9 focus:outline-none cursor-pointer border rounded p-1 transition-all ${
            isScrolled ? 'border-slate-800 bg-slate-50 text-slate-900' : 'border-white/20 bg-transparent text-white'
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

      {/* Responsive Dropdown Menu (Mobile Only) */}
      {isOpen && (
        <div 
          className={`md:hidden mt-3 py-3 px-2 border rounded-md flex flex-col gap-1.5 animate-fade-in ${
            isScrolled ? 'bg-white/95 border-slate-200 shadow-lg' : 'bg-[#111113]/95 border-white/10'
          }`}
          style={{
            backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 17, 19, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '0.375rem'
          }}
        >
          <NavLink 
            to="/" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'bg-cyan-50 text-cyan-600 font-semibold' : 'bg-white/10 text-cyan-400 font-semibold') 
                : (isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5')
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Analytics
          </NavLink>
          <NavLink 
            to="/review" 
            onClick={closeMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all no-underline ${
              isActive 
                ? (isScrolled ? 'bg-cyan-50 text-cyan-600 font-semibold' : 'bg-white/10 text-cyan-400 font-semibold') 
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
                ? (isScrolled ? 'bg-cyan-50 text-cyan-600 font-semibold' : 'bg-white/10 text-cyan-400 font-semibold') 
                : (isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5')
            }`}
          >
            <UploadIcon className="w-4 h-4" />
            Upload Invoices
          </NavLink>
        </div>
      )}
    </header>
  );
}
