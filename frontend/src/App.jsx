import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReviewInvoices from './pages/ReviewInvoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Upload from './pages/Upload';

import { UploadProvider } from './context/UploadContext';

function App() {
  useEffect(() => {
    // Initialize Lenis smooth scroll with heavy friction & momentum decay
    const lenis = new Lenis({
      duration: 1.0,          // High duration = heavy weighted momentum
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Heavy friction curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,   // High resistance (slows down wheel velocity)
      touchMultiplier: 1.2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <UploadProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col font-sans" style={{ minHeight: '100vh', backgroundColor: '#0a0a0b', color: '#ffffff' }}>
          {/* Modern Responsive Top Navigation Bar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 w-full" style={{ flex: 1, width: '100%' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/review" element={<ReviewInvoices />} />
              <Route path="/review/:id" element={<InvoiceDetail />} />
              <Route path="/upload" element={<Upload />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UploadProvider>
  );
}

export default App;
