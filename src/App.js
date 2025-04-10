import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, Typography, Card, Row, Col } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import './App.css';
import Employees from './pages/Employees';
import Logo from './components/Logo';
import SidebarTrigger from './components/SidebarTrigger';

const { Sider, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={250}
          className="site-sider"
          breakpoint="lg"
          collapsedWidth="80"
          collapsed={collapsed}
          trigger={null} // Remove default trigger
          theme="light"
        >
          {/* Logo at the top of sidebar */}
          <Logo collapsed={collapsed} lightTheme={true} />
          
          {/* Moved: Sidebar trigger at top of the sidebar */}
          <SidebarTrigger collapsed={collapsed} toggle={toggleCollapsed} color="white" />
        
          
          <Menu
            theme="light"
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              {
                key: '1',
                icon: <HomeOutlined />,
                label: <Link to="/">Home</Link>,
              },
              {
                key: '2',
                icon: <UserOutlined />,
                label: <Link to="/employees">Employees</Link>,
              },
              // Add more menu items for other tables
            ]}
          />
        </Sider>
        
        <Layout className="site-layout">
          <Content className="content-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/employees" element={<Employees />} />
              {/* Add routes for other tables */}
            </Routes>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            PKUP Kommunalnik ©2025 Created by Naomi4ok
          </Footer>
        </Layout>
      </Layout>
    </Router>
  );
}

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
        
        {/* Add cards for other modules/tables here */}
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card
            hoverable
            cover={<div className="card-icon-container"><SettingOutlined /></div>}
            actions={[
              <Link to="/">Coming Soon</Link>,
            ]}
          >
            <Card.Meta
              title="More Tables"
              description="Additional tables will be implemented in the future."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default App;