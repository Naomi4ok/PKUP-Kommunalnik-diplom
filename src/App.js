import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, Typography, Card, Row, Col } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import './App.css';
import Employees from './pages/Employees';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header">
          <div className="logo">PKUP Kommunalnik</div>
          <div className="mobile-menu-button">
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              onClick: toggleCollapsed,
            })}
          </div>
        </Header>
        <Layout>
          <Sider
            width={200}
            className="site-layout-background"
            breakpoint="lg"
            collapsedWidth="80"
            collapsed={collapsed}
            onCollapse={toggleCollapsed}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.Item key="1" icon={<HomeOutlined />}>
                <Link to="/">Home</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<UserOutlined />}>
                <Link to="/employees">Employees</Link>
              </Menu.Item>
              {/* Add more menu items for other tables */}
            </Menu>
          </Sider>
          <Layout className="site-layout-content">
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