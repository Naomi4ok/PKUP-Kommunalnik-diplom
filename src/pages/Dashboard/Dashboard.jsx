import React from 'react';
import { Card, Typography, Row, Col, Divider, Avatar, Badge } from 'antd';
import { Link } from 'react-router-dom';
import {
  UserOutlined,
  ToolOutlined,
  CarOutlined,
  DashboardOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import '../../styles/Dashboard/Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = () => {
  // Current date and time in UTC
  const currentDateTime = "2025-04-22 22:27:48";
  
  // Format date and time parts for display
  const formatDateTime = () => {
    const [datePart, timePart] = currentDateTime.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    return {
      day,
      month: monthNames[parseInt(month) - 1],
      year,
      time: `${hour}:${minute}`
    };
  };
  
  const dateTime = formatDateTime();
  
  const modules = [
    {
      title: 'Сотрудники',
      icon: <UserOutlined />,
      link: '/employees',
      status: 'normal'
    },
    {
      title: 'Оборудование',
      icon: <ToolOutlined />,
      link: '/equipment',
      status: 'processing'
    },
    {
      title: 'Транспорт',
      icon: <CarOutlined />,
      link: '/transport',
      status: 'normal'
    },
    {
      title: 'Панель управления',
      icon: <DashboardOutlined />,
      link: '/dashboard',
      status: 'normal'
    },
    {
      title: 'Расписание',
      icon: <CalendarOutlined />,
      link: '/schedule',
      status: 'warning'
    },
    {
      title: 'Аналитика',
      icon: <LineChartOutlined />,
      link: '/analytics',
      status: 'normal'
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="app-branding">
          <Avatar size={44} icon={<AppstoreOutlined />} className="app-avatar" />
          <div className="app-info">
            <Title level={3}>Коммунальник Про</Title>
            <Text type="secondary">Система управления коммунальными ресурсами</Text>
          </div>
        </div>
        
        <div className="datetime-display">
          <div className="datetime-card">
            <div className="date-part">
              <div className="day">{dateTime.day}</div>
              <div className="month-year">
                <span className="month">{dateTime.month}</span>
                <span className="year">{dateTime.year}</span>
              </div>
            </div>
            <div className="time-part">
              <ClockCircleOutlined className="clock-icon" />
              <span className="time">{dateTime.time}</span>
            </div>
          </div>
        </div>
      </div>

      <Divider />
      
      <div className="welcome-message">
        <Title level={4}>Добро пожаловать в систему</Title>
        <Text>Выберите необходимый модуль для работы</Text>
      </div>

      <div className="modules-grid">
        <Row gutter={[24, 24]}>
          {modules.map(module => (
            <Col xs={24} sm={12} md={8} key={module.title}>
              <Link to={module.link} className="module-link">
                <Badge.Ribbon 
                  text={
                    module.status === 'processing' ? 'Обновлено' : 
                    module.status === 'warning' ? 'Внимание' : ''
                  } 
                  color={
                    module.status === 'processing' ? '#1890ff' : 
                    module.status === 'warning' ? '#fa8c16' : ''
                  }
                  style={{ display: module.status === 'normal' ? 'none' : 'block' }}
                >
                  <Card className="module-card" hoverable>
                    <div className="module-content">
                      <div className={`module-icon ${module.status}`}>
                        {module.icon}
                      </div>
                      <div className="module-title">
                        {module.title}
                      </div>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <div className="dashboard-footer">
        <div className="footer-content">
          <Text type="secondary">© 2025 Коммунальник Про. Все права защищены.</Text>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;