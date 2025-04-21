import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Typography, Card, Row, Col } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  CalendarOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import './App.css';
import Employees from './pages/Employee/Employees';
import EmployeeForm from './pages/Employee/EmployeeForm';
import SidebarComponent from './components/SidebarComponent'; // Import the sidebar component

const { Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const siteLayoutRef = useRef(null);
  
  // Check screen size on mount and resize
  useEffect(() => {
    const checkSize = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      // Auto-collapse sidebar on mobile
      if (isMobileView) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', checkSize);
    checkSize(); // Initial check
    
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Handle layout transitions when collapse state changes
  useEffect(() => {
    const siteLayout = siteLayoutRef.current;
    if (!siteLayout) return;
    
    // Add transitioning class
    siteLayout.classList.add('layout-transitioning');
    
    // Use a more precise listener that only fires once
    const transitionEndHandler = (e) => {
      // Only trigger when the margin-left property transition ends
      if (e.propertyName === 'margin-left') {
        siteLayout.classList.remove('layout-transitioning');
        siteLayout.removeEventListener('transitionend', transitionEndHandler);
      }
    };
    
    siteLayout.addEventListener('transitionend', transitionEndHandler);
    
    // Clean up if component unmounts before transition ends
    return () => {
      siteLayout.removeEventListener('transitionend', transitionEndHandler);
    };
  }, [collapsed]);
  
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
        
        {/* Mobile backdrop for clicking outside sidebar to close */}
        {isMobile && !collapsed && (
          <div 
            className="mobile-sidebar-backdrop visible" 
            onClick={handleBackdropClick}
          />
        )}
        
        <Layout 
          className={`site-layout ${collapsed ? 'sidebar-collapsed' : ''}`}
          ref={siteLayoutRef}
        >
          <Content className="content-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/add" element={<EmployeeForm />} />
              <Route path="/employees/edit/:id" element={<EmployeeForm />} />
              <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
              <Route path="/schedule" element={<PlaceholderPage title="Schedule" />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

// Simple placeholder page for demonstration
const PlaceholderPage = ({ title }) => {
  return (
    <div className="home-container">
      <Title level={2}>{title}</Title>
      <p>This page is under construction.</p>
    </div>
  );
};

// Simple Home component using Ant Design
const Home = () => {
  return (
    <div className="home-container">
      <Title level={2}>Welcome to PKUP Kommunalnik Management System</Title>
      <p>Select a module from the navigation menu to get started.</p>
      
      <Row gutter={[16, 16]} className="module-cards">
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card
            hoverable
            cover={<div className="card-icon-container"><UserOutlined /></div>}
            actions={[
              <Link to="/employees">Manage</Link>,
            ]}
          >
            <Card.Meta
              title="Employees"
              description="Manage employee information, positions, departments, and more."
            />
          </Card>
        </Col>
        
        {/* Dashboard card */}
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card
            hoverable
            cover={<div className="card-icon-container"><DashboardOutlined /></div>}
            actions={[
              <Link to="/dashboard">View</Link>,
            ]}
          >
            <Card.Meta
              title="Dashboard"
              description="View key metrics and reports at a glance."
            />
          </Card>
        </Col>
        
        {/* Schedule card */}
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card
            hoverable
            cover={<div className="card-icon-container"><CalendarOutlined /></div>}
            actions={[
              <Link to="/schedule">Manage</Link>,
            ]}
          >
            <Card.Meta
              title="Schedule"
              description="Manage schedules and calendar events."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default App;