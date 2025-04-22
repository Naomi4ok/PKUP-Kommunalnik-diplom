import React from 'react';
import { Card, Typography, Row, Col, Button, Statistic, Space } from 'antd';
import { Link } from 'react-router-dom';
import {
  UserOutlined,
  ToolOutlined,
  CarOutlined,
  DashboardOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  // RocketOutlined // Uncomment if using the optional button
} from '@ant-design/icons';
import '../../styles/Home/Home.css';

const { Title, Paragraph } = Typography;

// Enhanced Home component
const Home = () => {
  // Placeholder data - replace with actual data fetching if available
  const stats = {
    employees: 15, // Example count
    equipment: 45, // Example count
    vehicles: 8,   // Example count
  };

  return (
    // Use a more specific container class for easier styling
    <div className="home-page-container">

      {/* --- Hero Section --- */}
      <div className="hero-section">
        <Title level={1} style={{ marginBottom: '8px' }}>
          Welcome to Kommunalnik Pro!
        </Title>
        <Paragraph type="secondary" style={{ fontSize: '1.1em', marginBottom: '24px' }}>
          Your central hub for managing municipal resources efficiently.
        </Paragraph>
        {/* Optional: Add a primary action button if needed */}
        {/* <Button type="primary" size="large" icon={<RocketOutlined />}>Get Started</Button> */}
      </div>

      {/* --- Statistics Section (Optional) --- */}
      {/* Uncomment and adjust if you have data */}
      {/*
      <Title level={3} style={{ marginTop: '40px', marginBottom: '20px' }}>System Overview</Title>
      <Row gutter={[32, 32]} justify="center" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)' }}>
            <Statistic title="Active Employees" value={stats.employees} prefix={<UserOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
           <Card bordered={false} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)' }}>
            <Statistic title="Managed Equipment" value={stats.equipment} prefix={<ToolOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
           <Card bordered={false} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)' }}>
            <Statistic title="Available Vehicles" value={stats.vehicles} prefix={<CarOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>
      */}

      {/* --- Module Cards Section --- */}
      <Title level={3} style={{ marginTop: '40px', marginBottom: '20px' }}>Manage Modules</Title>
      <Row gutter={[24, 24]} className="module-cards-enhanced">
        {[
          { title: 'Employees', icon: <UserOutlined />, link: '/employees', description: 'Manage staff details, roles, and assignments.' },
          { title: 'Equipment', icon: <ToolOutlined />, link: '/equipment', description: 'Track tools, machinery, status, and assignees.' },
          { title: 'Transportation', icon: <CarOutlined />, link: '/transport', description: 'Oversee vehicles, maintenance schedules, and usage.' },
          { title: 'Dashboard', icon: <DashboardOutlined />, link: '/dashboard', description: 'View key performance indicators and summaries.' },
          { title: 'Schedule', icon: <CalendarOutlined />, link: '/schedule', description: 'Coordinate tasks, events, and personnel availability.' },
        ].map(module => (
          <Col key={module.title} xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card
              hoverable
              className="module-card" // Add class for specific styling
              actions={[
                <Link to={module.link} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                   {module.link.includes('dashboard') ? 'View' : 'Manage'} <ArrowRightOutlined />
                </Link>,
              ]}
            >
              <Card.Meta
                avatar={<span className="module-card-icon">{module.icon}</span>} // Larger icon
                title={<Title level={5}>{module.title}</Title>}
                description={<Paragraph type="secondary" style={{ minHeight: '40px' }}>{module.description}</Paragraph>} // Ensure consistent height
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Home;