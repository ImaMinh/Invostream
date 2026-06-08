import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Settings, FileSearch } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ReviewInvoices from './pages/ReviewInvoices';
import InvoiceDetail from './pages/InvoiceDetail';

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

            <div style={{ marginTop: 'auto' }}>
              <div className="nav-item" style={{ cursor: 'pointer' }}>
                <Settings size={20} />
                Settings
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review" element={<ReviewInvoices />} />
            <Route path="/review/:id" element={<InvoiceDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
