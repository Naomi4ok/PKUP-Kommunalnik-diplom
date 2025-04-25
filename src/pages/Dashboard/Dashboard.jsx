import React, { useState, useEffect, useContext } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Calendar, Alert, 
  Badge, Spin, Typography, Avatar, Divider, Progress, 
  Timeline, Select, Empty
} from 'antd';
import { 
  UserOutlined, ToolOutlined, CarOutlined, 
  WarningOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, CalendarOutlined, ThunderboltOutlined,
  CloudOutlined, ApartmentOutlined, BellOutlined,
  ClockCircleOutlined, SyncOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Dashboard/Dashboard.css';

const { Title, Text } = Typography;
const { Option } = Select;

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employeesCount: 0,
    equipmentCount: 0,
    transportCount: 0,
    toolsCount: 0,
    sparesCount: 0,
    materialsCount: 0
  });
  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const [transportStatus, setTransportStatus] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [currentDate] = useState(new Date('2025-04-25T13:11:12')); // Using the provided date
  const [weatherData, setWeatherData] = useState(null);
  const [resourceUtilization, setResourceUtilization] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const currentUser = 'Naomi4ok'; // Using the provided user login

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Convert UTC string to localized datetime
  const formatDateTime = (utcString) => {
    const date = new Date(utcString);
    return date.toLocaleString();
  };

  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simulate API calls with some delay
        setTimeout(() => {
          // Generate mock data
          generateMockData();
          
          // Simulate weather data
          fetchWeatherData();
          
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate mock data for charts and tables
  const generateMockData = () => {
    // Statistics
    setStats({
      employeesCount: 42,
      equipmentCount: 76,
      transportCount: 18,
      toolsCount: 124,
      sparesCount: 357,
      materialsCount: 283
    });

    // Equipment status
    const mockEquipmentStatus = [
      { type: 'Рабочее', value: 54 },
      { type: 'Требует обслуживания', value: 12 },
      { type: 'На ремонте', value: 7 },
      { type: 'Неисправно', value: 3 }
    ];
    setEquipmentStatus(mockEquipmentStatus);

    // Transport status
    const mockTransportStatus = [
      { type: 'Исправен', value: 12 },
      { type: 'Требует обслуживания', value: 3 },
      { type: 'На ремонте', value: 2 },
      { type: 'Неисправен', value: 1 }
    ];
    setTransportStatus(mockTransportStatus);
    
    // Resource utilization data (costs over time)
    const timeframes = {
      week: 7,
      month: 30,
      year: 12
    };
    
    // Generate data for all timeframes
    const allTimeframesData = {};
    
    // For week - daily data
    allTimeframesData.week = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: formatDate(date),
        materials: Math.floor(Math.random() * 5000) + 1000,
        equipment: Math.floor(Math.random() * 3000) + 500,
        tools: Math.floor(Math.random() * 2000) + 300,
      };
    });
    
    // For month - daily data
    allTimeframesData.month = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: formatDate(date),
        materials: Math.floor(Math.random() * 5000) + 1000,
        equipment: Math.floor(Math.random() * 3000) + 500,
        tools: Math.floor(Math.random() * 2000) + 300,
      };
    });
    
    // For year - monthly data
    allTimeframesData.year = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - (11 - i));
      return {
        date: date.toLocaleString('default', { month: 'short' }),
        materials: Math.floor(Math.random() * 50000) + 10000,
        equipment: Math.floor(Math.random() * 30000) + 5000,
        tools: Math.floor(Math.random() * 20000) + 3000,
      };
    });
    
    setResourceUtilization(allTimeframesData);

    // Generate mock recent activity
    const activityTypes = [
      { type: 'maintenance', text: 'Техническое обслуживание' },
      { type: 'repair', text: 'Ремонт' },
      { type: 'inventory', text: 'Инвентаризация' },
      { type: 'assignment', text: 'Назначение задания' },
      { type: 'order', text: 'Заказ материалов' }
    ];
    
    const resourceTypes = [
      { type: 'equipment', text: 'оборудования' },
      { type: 'transport', text: 'транспорта' },
      { type: 'tools', text: 'инструментов' },
      { type: 'materials', text: 'материалов' },
      { type: 'spares', text: 'запчастей' }
    ];
    
    const mockActivities = Array.from({ length: 10 }, (_, i) => {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const date = new Date(currentDate);
      date.setHours(date.getHours() - Math.floor(Math.random() * 48));
      
      return {
        id: i + 1,
        action: `${activityType.text} ${resourceType.text}`,
        resource: `${resourceType.type}-${Math.floor(Math.random() * 100) + 1}`,
        timestamp: date.toISOString(),
        user: Math.random() > 0.5 ? currentUser : 'Администратор'
      };
    });
    
    setRecentActivity(mockActivities);

    // Generate mock maintenance schedule
    const upcomingDays = 14;
    const mockMaintenanceItems = [];
    const equipmentNames = ['Насос КНС-4', 'Трансформатор ТП-12', 'Котел отопления', 'Компрессор', 'Генератор'];
    const transportNames = ['МАЗ Самосвал', 'Экскаватор JCB', 'КамАЗ грузовой', 'УАЗ Патриот', 'Трактор МТЗ'];
    
    for (let i = 0; i < 10; i++) {
      const isEquipment = Math.random() > 0.5;
      const scheduledDate = new Date(currentDate);
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * upcomingDays));
      
      mockMaintenanceItems.push({
        id: i + 1,
        itemName: isEquipment ? equipmentNames[Math.floor(Math.random() * equipmentNames.length)] : transportNames[Math.floor(Math.random() * transportNames.length)],
        itemType: isEquipment ? 'Оборудование' : 'Транспорт',
        maintenanceType: Math.random() > 0.3 ? 'Плановое ТО' : 'Внеплановый ремонт',
        scheduledDate: scheduledDate.toISOString(),
        assignedTo: Math.random() > 0.5 ? 'Иванов И.И.' : 'Петров П.П.',
        status: Math.random() > 0.7 ? 'Назначено' : (Math.random() > 0.5 ? 'В процессе' : 'Выполнено')
      });
    }
    
    setMaintenanceSchedule(mockMaintenanceItems);
  };

  // Simulate weather data fetch
  const fetchWeatherData = () => {
    // Mock weather data for a municipal services dashboard
    const weatherConditions = [
      { condition: 'Солнечно', temperature: 22, humidity: 45, wind: 5, icon: '☀️' },
      { condition: 'Облачно', temperature: 18, humidity: 60, wind: 8, icon: '☁️' },
      { condition: 'Дождь', temperature: 15, humidity: 80, wind: 12, icon: '🌧️' },
      { condition: 'Снег', temperature: -2, humidity: 75, wind: 10, icon: '❄️' },
      { condition: 'Туман', temperature: 10, humidity: 90, wind: 3, icon: '🌫️' }
    ];
    
    const randomIndex = Math.floor(Math.random() * weatherConditions.length);
    setWeatherData(weatherConditions[randomIndex]);
  };

  // Weather info display
  const renderWeatherInfo = () => {
    if (!weatherData) return <Spin />;
    
    return (
      <div className="weather-container">
        <div className="weather-icon">{weatherData.icon}</div>
        <div className="weather-details">
          <div className="weather-condition">{weatherData.condition}</div>
          <div className="weather-temp">{weatherData.temperature}°C</div>
          <div className="weather-meta">
            <span>Влажность: {weatherData.humidity}%</span>
            <span>Ветер: {weatherData.wind} м/с</span>
          </div>
        </div>
      </div>
    );
  };

  // Maintenance schedule display
  const renderMaintenanceSchedule = () => {
    const columns = [
      {
        title: 'Тип',
        dataIndex: 'itemType',
        key: 'itemType',
        width: '12%',
      },
      {
        title: 'Наименование',
        dataIndex: 'itemName',
        key: 'itemName',
        width: '25%',
      },
      {
        title: 'Вид работ',
        dataIndex: 'maintenanceType',
        key: 'maintenanceType',
        width: '20%',
      },
      {
        title: 'Дата',
        dataIndex: 'scheduledDate',
        key: 'scheduledDate',
        render: (text) => new Date(text).toLocaleDateString(),
        width: '12%',
      },
      {
        title: 'Исполнитель',
        dataIndex: 'assignedTo',
        key: 'assignedTo',
        width: '15%',
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: '16%',
        render: (status) => {
          let color = 'blue';
          let icon = <ClockCircleOutlined />;
          
          if (status === 'Выполнено') {
            color = 'green';
            icon = <CheckCircleOutlined />;
          } else if (status === 'В процессе') {
            color = 'orange';
            icon = <SyncOutlined spin />;
          }
          
          return (
            <Badge color={color} text={<span>{icon} {status}</span>} />
          );
        },
      },
    ];
    
    return (
      <Table 
        columns={columns} 
        dataSource={maintenanceSchedule} 
        rowKey="id" 
        size="small" 
        pagination={{ pageSize: 5 }}
      />
    );
  };

  // Recent activity timeline display
  const renderActivityTimeline = () => {
    return (
      <Timeline className="activity-timeline">
        {recentActivity.map(activity => (
          <Timeline.Item 
            key={activity.id}
            color={getActivityColor(activity.action)}
            dot={getActivityIcon(activity.action)}
          >
            <div className="activity-content">
              <div className="activity-header">
                <span className="activity-action">{activity.action}</span>
                <span className="activity-time">{formatDateTime(activity.timestamp)}</span>
              </div>
              <div className="activity-meta">
                <span className="activity-user">Пользователь: {activity.user}</span>
                <span className="activity-resource">ID: {activity.resource}</span>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  // Helper to get color for activity timeline
  const getActivityColor = (action) => {
    if (action.includes('Ремонт')) return 'red';
    if (action.includes('Техническое обслуживание')) return 'blue';
    if (action.includes('Инвентаризация')) return 'green';
    if (action.includes('Назначение')) return 'purple';
    if (action.includes('Заказ')) return 'orange';
    return 'gray';
  };

  // Helper to get icon for activity timeline
  const getActivityIcon = (action) => {
    if (action.includes('Ремонт')) return <ToolOutlined />;
    if (action.includes('Техническое обслуживание')) return <ThunderboltOutlined />;
    if (action.includes('Инвентаризация')) return <ApartmentOutlined />;
    if (action.includes('Назначение')) return <CalendarOutlined />;
    if (action.includes('Заказ')) return <DollarOutlined />;
    return <BellOutlined />;
  };

  // Timeframe selector for the resource utilization chart
  const handleTimeframeChange = (value) => {
    setSelectedTimeframe(value);
  };

  // Simple chart component to replace @ant-design/charts
  const renderSimpleStatusChart = (data) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="simple-chart">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          
          let statusColor = '#1890ff';
          if (item.type.includes('Рабочее') || item.type.includes('Исправен')) {
            statusColor = '#52c41a'; // green
          } else if (item.type.includes('Требует обслуживания')) {
            statusColor = '#faad14'; // orange
          } else if (item.type.includes('На ремонте')) {
            statusColor = '#fa8c16'; // dark orange
          } else if (item.type.includes('Неисправно')) {
            statusColor = '#f5222d'; // red
          }
          
          return (
            <div key={index} className="chart-item">
              <div className="chart-item-label">
                <Badge color={statusColor} />
                <span>{item.type}: </span>
                <span className="chart-item-percentage">{percentage}%</span>
                <span className="chart-item-value">({item.value})</span>
              </div>
              <Progress 
                percent={percentage} 
                showInfo={false} 
                strokeColor={statusColor}
                trailColor="#f0f0f0"
                size="small"
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Simple resource usage chart component 
  const renderSimpleResourceChart = () => {
    const data = resourceUtilization[selectedTimeframe] || [];
    if (data.length === 0) return <Empty description="Нет данных" />;
    
    const timeLabels = {
      week: 'дней',
      month: 'дней',
      year: 'месяцев'
    };
    
    return (
      <div className="resource-chart-container">
        <div className="resource-chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#1890ff' }}></div>
            <div className="legend-label">Материалы</div>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#52c41a' }}></div>
            <div className="legend-label">Оборудование</div>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#fa8c16' }}></div>
            <div className="legend-label">Инструменты</div>
          </div>
        </div>
        <div className="resource-chart-grid">
          {data.map((item, index) => (
            <div key={index} className="resource-chart-column">
              <div className="resource-chart-bars">
                <Tooltip title={`Материалы: ${item.materials} ₽`}>
                  <div 
                    className="resource-bar materials-bar" 
                    style={{ height: `${Math.min(100, item.materials / 100)}px` }}
                  ></div>
                </Tooltip>
                <Tooltip title={`Оборудование: ${item.equipment} ₽`}>
                  <div 
                    className="resource-bar equipment-bar" 
                    style={{ height: `${Math.min(100, item.equipment / 60)}px` }}
                  ></div>
                </Tooltip>
                <Tooltip title={`Инструменты: ${item.tools} ₽`}>
                  <div 
                    className="resource-bar tools-bar" 
                    style={{ height: `${Math.min(100, item.tools / 40)}px` }}
                  ></div>
                </Tooltip>
              </div>
              <div className="resource-chart-label">{
                selectedTimeframe === 'year' ? item.date : index + 1
              }</div>
            </div>
          ))}
        </div>
        <div className="resource-chart-xaxis-label">
          Последние {data.length} {timeLabels[selectedTimeframe]}
        </div>
      </div>
    );
  };

  // We need to create this component for rendering tooltips
  const Tooltip = ({ title, children }) => {
    return (
      <div className="custom-tooltip" title={title}>
        {children}
      </div>
    );
  };

  // Render the dashboard
  return (
    <div className="dashboard-container">
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
          {/* Welcome header */}
          <div className="dashboard-header">
            <div className="welcome-section">
              <div className="user-avatar">
                {user?.avatar ? (
                  <Avatar size={64} src={user.avatar} />
                ) : (
                  <Avatar size={64} icon={<UserOutlined />} />
                )}
              </div>
              <div className="welcome-text">
                <Title level={3}>Добро пожаловать, {user?.fullName || currentUser || 'Администратор'}</Title>
                <Text type="secondary">
                  {currentDate.toLocaleDateString('ru-RU', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </div>
            </div>
            <div className="weather-box">
              {renderWeatherInfo()}
            </div>
          </div>

          <Divider />

          {/* Stats cards row */}
          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card">
                <Statistic 
                  title="Сотрудники" 
                  value={stats.employeesCount} 
                  prefix={<UserOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card">
                <Statistic 
                  title="Оборудование" 
                  value={stats.equipmentCount} 
                  prefix={<ThunderboltOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card">
                <Statistic 
                  title="Транспорт" 
                  value={stats.transportCount} 
                  prefix={<CarOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card">
                <Statistic 
                  title="Инструменты" 
                  value={stats.toolsCount} 
                  prefix={<ToolOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card">
                <Statistic 
                  title="Запчасти" 
                  value={stats.sparesCount} 
                  prefix={<WarningOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card">
                <Statistic 
                  title="Материалы" 
                  value={stats.materialsCount} 
                  prefix={<ApartmentOutlined />} 
                />
              </Card>
            </Col>
          </Row>

          {/* Main content rows */}
          <Row gutter={[16, 16]} className="main-row">
            {/* Equipment and transport status */}
            <Col xs={24} md={12}>
              <Card 
                title="Статус оборудования" 
                className="chart-card"
                bordered={false}
              >
                {equipmentStatus.length > 0 ? (
                  renderSimpleStatusChart(equipmentStatus)
                ) : (
                  <Empty description="Нет данных об оборудовании" />
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                title="Статус транспорта" 
                className="chart-card"
                bordered={false}
              >
                {transportStatus.length > 0 ? (
                  renderSimpleStatusChart(transportStatus)
                ) : (
                  <Empty description="Нет данных о транспорте" />
                )}
              </Card>
            </Col>
            
            {/* Resource utilization chart */}
            <Col xs={24}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Расход ресурсов</span>
                    <Select 
                      defaultValue="week" 
                      style={{ width: 120 }} 
                      onChange={handleTimeframeChange}
                    >
                      <Option value="week">Неделя</Option>
                      <Option value="month">Месяц</Option>
                      <Option value="year">Год</Option>
                    </Select>
                  </div>
                }
                className="chart-card"
                bordered={false}
              >
                {renderSimpleResourceChart()}
              </Card>
            </Col>

            {/* Maintenance schedule */}
            <Col xs={24}>
              <Card 
                title="График технического обслуживания" 
                className="schedule-card"
                bordered={false}
              >
                {renderMaintenanceSchedule()}
              </Card>
            </Col>
            
            {/* Recent activity and mini calendar */}
            <Col xs={24} md={16}>
              <Card 
                title="Последние действия" 
                className="activity-card"
                bordered={false}
              >
                {renderActivityTimeline()}
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card 
                title="Календарь" 
                className="calendar-card"
                bordered={false}
              >
                <Calendar fullscreen={false} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;