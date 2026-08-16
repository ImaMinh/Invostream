import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReviewInvoices from './pages/ReviewInvoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Upload from './pages/Upload';

function App() {
  return (
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
  );
}

export default App;
