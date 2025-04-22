import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Removed Link as it's not directly used here anymore
import { Layout } from 'antd'; // Removed Card, Typography, Row, Col, Button
// Removed specific icons previously only used in Home component
import './App.css';

// Components
import SidebarComponent from './components/SidebarComponents/SidebarComponent';
import PlaceholderPage from './components/PlaceholderPage'; // Import PlaceholderPage

// Pages
import Home from './pages/Home/Home'; // Import the new Home component
import Employees from './pages/Employee/Employees';
import EmployeeForm from './pages/Employee/EmployeeForm';
import Equipment from './pages/Equipment/Equipment';
import EquipmentForm from './pages/Equipment/EquipmentForm';
import Transport from './pages/Transport/Transport';
import TransportForm from './pages/Transport/TransportForm';

const { Content } = Layout;
// Removed Title as it's not directly used here anymore

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const siteLayoutRef = useRef(null);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) { // Collapse sidebar automatically on mobile
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', checkMobile);
    checkMobile(); // Initial check

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Add/remove class for layout transition animation
  useEffect(() => {
    const siteLayout = siteLayoutRef.current;
    if (!siteLayout) return;

    // Add class to trigger transition
    siteLayout.classList.add('layout-transitioning');

    // Use setTimeout to remove the class after the transition duration
    // This is a simpler alternative to transitionend listener if duration is fixed
    const timer = setTimeout(() => {
      siteLayout.classList.remove('layout-transitioning');
    }, 200); // Match transition duration in App.css (0.2s)

    return () => clearTimeout(timer); // Cleanup timer on unmount or change

  }, [collapsed]); // Re-run when collapsed state changes

  // Mobile backdrop click handler
  const handleBackdropClick = () => {
    if (isMobile && !collapsed) {
      setCollapsed(true);
    }
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <SidebarComponent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Mobile backdrop */}
        {isMobile && !collapsed && (
          <div
            className="mobile-sidebar-backdrop visible"
            onClick={handleBackdropClick}
          />
        )}

        <Layout
          className={`site-layout ${collapsed ? 'sidebar-collapsed' : ''}`}
          ref={siteLayoutRef}
          // Add style for margin transition
          style={{ marginLeft: collapsed ? (isMobile ? 0 : 80) : (isMobile ? 0 : 200) }}
        >
          {/* Header could go here if needed */}
          {/* <Header className="site-layout-background" style={{ padding: 0 }} /> */}

          <Content className="content-area">
            <Routes>
              <Route path="/" element={<Home />} /> {/* Use imported Home */}
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/add" element={<EmployeeForm />} />
              <Route path="/employees/edit/:id" element={<EmployeeForm />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/equipment/add" element={<EquipmentForm />} />
              <Route path="/equipment/edit/:id" element={<EquipmentForm />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/transport/add" element={<TransportForm />} />
              <Route path="/transport/edit/:id" element={<TransportForm />} />
              {/* Use imported PlaceholderPage */}
              <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
              <Route path="/schedule" element={<PlaceholderPage title="Schedule" />} />
            </Routes>
          </Content>
          {/* Footer could go here if needed */}
          {/* <Footer style={{ textAlign: 'center' }}>Kommunalnik Pro ©2024</Footer> */}
        </Layout>
      </Layout>
    </Router>
  );
}

// Removed Home component definition
// Removed PlaceholderPage component definition

export default App;
