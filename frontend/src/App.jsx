import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Context & Auth
import { UploadProvider } from './context/UploadContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/routes/ProtectedRoute.jsx';

// Layout & Components
import Navbar from './components/ui/Navbar.jsx';

// Page Components
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Upload from './pages/Upload';
import ReviewInvoices from './pages/ReviewInvoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Analytics from './pages/Analytics';

/**
 * AppRoutes: Main routing engine and layout manager
 */
function AppRoutes() {
  const location = useLocation();
  const hideNavbar = ['/', '/landing'].includes(location.pathname) || location.pathname.startsWith('/register') || location.pathname.startsWith('/login');

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col font-sans">
      {/* Top Navigation Bar - Hidden on Landing & Auth Pages */}
      {!hideNavbar && <Navbar />}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <Routes>
          {/* Public Unprotected Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/login/*" element={<Login />} />

          {/* Protected Authenticated Routes */}
          <Route path="/review" element={<ProtectedRoute><ReviewInvoices /></ProtectedRoute>} />
          <Route path="/review/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Root Application Component
 */
export default function App() {
  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.075,
      touchInertiaExponent: 1.7,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <ThemeProvider>
      <UploadProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UploadProvider>
    </ThemeProvider>
  );
}
