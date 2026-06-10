import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Settings, FileSearch } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ReviewInvoices from './pages/ReviewInvoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Upload from './pages/Upload';
import { Upload as UploadIcon } from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="logo">
            <LayoutDashboard size={28} color="#00cec9" />
            Invostream
          </div>
          
          <nav className="nav-links">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              Analytics
            </NavLink>
            
            <NavLink 
              to="/review" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileCheck size={20} />
              Invoice Review
            </NavLink>

            <NavLink 
              to="/upload" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UploadIcon size={20} />
              Upload Invoices
            </NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
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
