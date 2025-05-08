import React, { useState, useEffect, useContext } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Alert, 
  Badge, Spin, Typography, Avatar, Divider, Progress, 
  Empty, Tag
} from 'antd';
import { 
  UserOutlined, ToolOutlined, CarOutlined, 
  PartitionOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, CalendarOutlined, SettingOutlined,
  CloudOutlined, ApartmentOutlined, BellOutlined,
  ClockCircleOutlined, SyncOutlined, TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Dashboard/Dashboard.css';
import moment from 'moment';

const { Title, Text } = Typography;

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
  // Заменяем статическую дату на текущее время
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const currentUser = 'Naomi4ok';

  // Добавляем эффект для обновления времени каждую секунду
  useEffect(() => {
    // Запускаем таймер, который обновляет дату каждую секунду
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    
    // Очищаем таймер при размонтировании компонента
    return () => {
      clearInterval(timer);
    };
  }, []);

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
        setError(null);
        
        // Fetch all the required data
        await Promise.all([
          fetchStats(),
          fetchEquipmentStatus(),
          fetchTransportStatus(),
          fetchMaintenanceSchedule(),
          fetchWeatherData()
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Ошибка загрузки данных для дашборда');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch stats counts from various tables
  const fetchStats = async () => {
    try {
      const [
        employeesResponse, 
        equipmentResponse, 
        transportResponse, 
        toolsResponse, 
        sparesResponse, 
        materialsResponse
      ] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/equipment'),
        axios.get('/api/transportation'),
        axios.get('/api/tools'),
        axios.get('/api/spares'),
        axios.get('/api/materials')
      ]);

      setStats({
        employeesCount: employeesResponse.data.length || 0,
        equipmentCount: equipmentResponse.data.length || 0,
        transportCount: transportResponse.data.length || 0,
        toolsCount: toolsResponse.data.length || 0,
        sparesCount: sparesResponse.data.length || 0,
        materialsCount: materialsResponse.data.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  // Fetch equipment status
  const fetchEquipmentStatus = async () => {
    try {
      const response = await axios.get('/api/equipment');
      const equipment = response.data;
      
      // Count equipment by condition
      const statusCounts = {
        'Рабочее': 0,
        'Требует ТО': 0,
        'Ремонтируется': 0,
        'Неисправно': 0
      };
      
      equipment.forEach(item => {
        if (statusCounts[item.Condition] !== undefined) {
          statusCounts[item.Condition]++;
        } else {
          statusCounts['Неисправно']++;
        }
      });
      
      const equipmentStatusData = Object.keys(statusCounts).map(type => ({
        type,
        value: statusCounts[type]
      }));
      
      setEquipmentStatus(equipmentStatusData);
    } catch (error) {
      console.error('Error fetching equipment status:', error);
      throw error;
    }
  };

  // Fetch transport status
  const fetchTransportStatus = async () => {
    try {
      const response = await axios.get('/api/transportation');
      const transport = response.data;
      
      // Count transport by technical condition
      const statusCounts = {
        'Исправен': 0,
        'Требует ТО': 0,
        'Ремонтируется': 0,
        'Неисправен': 0
      };
      
      transport.forEach(item => {
        if (item.TechnicalCondition === 'Исправен') {
          statusCounts['Исправен']++;
        } else if (item.TechnicalCondition === 'Требует ТО') {
          statusCounts['Требует ТО']++;
        } else if (item.TechnicalCondition === 'Ремонтируется') {
          statusCounts['Ремонтируется']++;
        } else {
          statusCounts['Неисправен']++;
        }
      });
      
      const transportStatusData = Object.keys(statusCounts).map(type => ({
        type,
        value: statusCounts[type]
      }));
      
      setTransportStatus(transportStatusData);
    } catch (error) {
      console.error('Error fetching transport status:', error);
      throw error;
    }
  };

  // Fetch maintenance schedule
  const fetchMaintenanceSchedule = async () => {
    try {
      // Get scheduled tasks from the Schedule table
      const response = await axios.get('/api/schedule');
      const tasks = response.data;
      
      // Get equipment and transport data for details
      const [equipmentResponse, transportResponse] = await Promise.all([
        axios.get('/api/equipment'),
        axios.get('/api/transportation')
      ]);
      
      const equipment = equipmentResponse.data.reduce((map, item) => {
        map[item.Equipment_ID] = item;
        return map;
      }, {});
      
      const transport = transportResponse.data.reduce((map, item) => {
        map[item.Transport_ID] = item;
        return map;
      }, {});
      
      // Filter tasks for maintenance-related activities and map to the required format
      const maintenanceItems = tasks
        .filter(task => task.ProcessId === 1 || task.ProcessId === 2)
        .slice(0, 10)
        .map((task, index) => {
          const equipmentIds = task.EquipmentIds ? JSON.parse(task.EquipmentIds) : [];
          const transportIds = task.TransportIds ? JSON.parse(task.TransportIds) : [];
          
          const equipmentId = equipmentIds.length > 0 ? equipmentIds[0] : null;
          const transportId = transportIds.length > 0 ? transportIds[0] : null;
          
          let itemType, itemName;
          if (equipmentId && equipment[equipmentId]) {
            itemType = 'Оборудование';
            itemName = equipment[equipmentId].Name || 'Неизвестное оборудование';
          } else if (transportId && transport[transportId]) {
            itemType = 'Транспорт';
            itemName = `${transport[transportId].Brand} ${transport[transportId].Model}` || 'Неизвестный транспорт';
          } else {
            itemType = 'Другое';
            itemName = task.Title || 'Неизвестно';
          }
          
          let status;
          if (task.Status === 'completed') {
            status = 'Выполнено';
          } else if (task.Status === 'in-progress') {
            status = 'В процессе';
          } else {
            status = 'Назначено';
          }
          
          return {
            id: task.Task_ID || index + 1,
            itemType,
            itemName,
            maintenanceType: task.Title?.includes('ремонт') ? 'Внеплановый ремонт' : 'Плановое ТО',
            scheduledDate: task.Date ? `${task.Date}T${task.StartTime}` : new Date().toISOString(),
            assignedTo: task.EmployeeIds ? 'Назначенный сотрудник' : 'Не назначен',
            status
          };
        });
      
      setMaintenanceSchedule(maintenanceItems);
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
      throw error;
    }
  };

  // Fetch real weather data for Brest, Belarus using WeatherAPI
  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      
      const API_KEY = 'e2d480ee39474050a56215834252504';
      const response = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Brest,Belarus&aqi=no`);
      const data = response.data;
      
      const weather = {
        condition: data.current.condition.text,
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        wind: data.current.wind_kph / 3.6,
        icon: getWeatherIcon(data.current.condition.code),
        location: `${data.location.name}, ${data.location.country}`
      };
      
      setWeatherData(weather);
      setWeatherLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData({
        condition: 'Нет данных',
        temperature: '--',
        humidity: '--',
        wind: '--',
        icon: '❓',
        location: 'Брест, Беларусь'
      });
      setWeatherLoading(false);
    }
  };

  // Helper function to map condition codes to emoji icons
  const getWeatherIcon = (code) => {
    if (code === 1000) return '☀️';
    if (code >= 1003 && code <= 1009) return '⛅';
    if (code >= 1030 && code <= 1039) return '🌫️';
    if (code >= 1063 && code <= 1069) return '🌧️';
    if (code >= 1114 && code <= 1117) return '❄️';
    if (code >= 1150 && code <= 1153) return '🌧️';
    if (code >= 1180 && code <= 1195) return '🌧️';
    if (code >= 1200 && code <= 1225) return '🌨️';
    if (code >= 1240 && code <= 1246) return '🌧️';
    if (code >= 1273 && code <= 1282) return '⛈️';
    return '☁️';
  };

  // Status color mapping
  const getStatusColor = (statusType) => {
    if (statusType.includes('Рабочее') || statusType.includes('Исправен') || statusType === 'Выполнено') {
      return '#52c41a'; // green
    } else if (statusType.includes('Требует ТО') || statusType === 'В процессе') {
      return '#1890ff'; // orange
    } else if (statusType.includes('Ремонтируется')) {
      return '#fa8c16'; // dark orange
    } else if (statusType.includes('Неисправ')) {
      return '#f5222d'; // red
    }
    return '#1890ff'; // blue default
  };

  // Weather info display
  const renderWeatherInfo = () => {
    if (weatherLoading) return <Spin size="small" />;
    
    if (!weatherData) return <div>Нет данных о погоде</div>;
    
    return (
      <div className="weather-container">
        <div className="weather-icon">{weatherData.icon}</div>
        <div className="weather-details">
          <div className="weather-location">{weatherData.location}, {weatherData.condition}</div>
          <div className="weather-temp">{weatherData.temperature}°C</div>
          <div className="weather-meta">
            <span>Влажность: {weatherData.humidity}%</span>
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
        render: (text) => {
          let icon = <ApartmentOutlined />;
          if (text === 'Оборудование') icon = <SettingOutlined />;
          if (text === 'Транспорт') icon = <CarOutlined />;
          return (
            <span>
              {icon} {text}
            </span>
          );
        }
      },
      {
        title: 'Наименование',
        dataIndex: 'itemName',
        key: 'itemName',
        width: '25%',
        ellipsis: true
      },
      {
        title: 'Вид работ',
        dataIndex: 'maintenanceType',
        key: 'maintenanceType',
        width: '20%',
        render: (text) => {
          const isUrgent = text.includes('Внеплановый');
          return (
            <Tag color={isUrgent ? 'volcano' : 'blue'}>
              {text}
            </Tag>
          );
        }
      },
      {
        title: 'Дата',
        dataIndex: 'scheduledDate',
        key: 'scheduledDate',
        render: (text) => {
          const date = new Date(text);
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          
          return (
            <div>
              <div>{date.toLocaleDateString()}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isToday && <Tag color="green" style={{ marginLeft: '4px' }}>Сегодня</Tag>}
            </div>
          );
        },
        width: '15%',
      },
      {
        title: 'Исполнитель',
        dataIndex: 'assignedTo',
        key: 'assignedTo',
        width: '15%',
        render: (text) => {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                style={{ marginRight: '8px', backgroundColor: text === 'Не назначен' ? '#f0f0f0' : '#1890ff' }} 
              />
              {text}
            </div>
          );
        }
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: '13%',
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
            <Tag color={color} icon={icon}>
              {status}
            </Tag>
          );
        },
      },
    ];
    
    return (
      <Table 
        columns={columns} 
        dataSource={maintenanceSchedule} 
        rowKey="id" 
        size="middle" 
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: <Empty description="Нет запланированных работ" /> }}
        rowClassName={(record) => record.status === 'Назначено' ? 'highlight-row' : ''}
      />
    );
  };

  // Simple chart component for status visualization
  const renderSimpleStatusChart = (data) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="enhanced-chart">
        <div className="status-summary">
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const statusColor = getStatusColor(item.type);
            
            return (
              <div key={index} className="status-count-card">
                <div 
                  className="status-indicator" 
                  style={{ backgroundColor: statusColor }}
                />
                <div className="status-details">
                  <div className="status-value">{item.value}</div>
                  <div className="status-label">{item.type}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="status-bars">
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const statusColor = getStatusColor(item.type);
            
            return (
              <div key={index} className="chart-item">
                <div className="chart-item-label">
                  <span className="chart-label-text">{item.type}</span>
                  <span className="chart-item-percentage">{percentage}%</span>
                </div>
                <Progress 
                  percent={percentage} 
                  showInfo={false} 
                  strokeColor={statusColor}
                  trailColor="#f0f0f0"
                  size="default"
                  className="status-progress"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render the dashboard
  return (
    <div className="dashboard-container">
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p className="loading-text">Загрузка данных из базы...</p>
        </div>
      ) : error ? (
        <Alert 
          message="Ошибка" 
          description={error} 
          type="error" 
          showIcon 
          style={{ margin: '20px 0' }}
        />
      ) : (
        <>
          {/* Welcome header */}
          <div className="dashboard-header">
            <div className="welcome-section">
              <div className="user-avatar">
                {user?.avatar ? (
                  <Avatar size={64} src={user.avatar} />
                ) : (
                  <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
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
                  <span className="time-display">
                    {currentDate.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </Text>
              </div>
            </div>
            <div className="weather-box">
              {renderWeatherInfo()}
            </div>
          </div>

          {/* Stats cards row */}
          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card resource-card" hoverable>
                <div className="stat-icon-container employee-icon">
                  <TeamOutlined className="stat-icon" />
                </div>
                <Statistic 
                  title="Сотрудники" 
                  value={stats.employeesCount} 
                  className="stat-value"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card resource-card" hoverable>
                <div className="stat-icon-container equipment-icon">
                  <SettingOutlined className="stat-icon" />
                </div>
                <Statistic 
                  title="Оборудование" 
                  value={stats.equipmentCount} 
                  className="stat-value"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card resource-card" hoverable>
                <div className="stat-icon-container transport-icon">
                  <CarOutlined className="stat-icon" />
                </div>
                <Statistic 
                  title="Транспорт" 
                  value={stats.transportCount} 
                  className="stat-value"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card resource-card" hoverable>
                <div className="stat-icon-container tools-icon">
                  <ToolOutlined className="stat-icon" />
                </div>
                <Statistic 
                  title="Инструменты" 
                  value={stats.toolsCount} 
                  className="stat-value"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card resource-card" hoverable>
                <div className="stat-icon-container spares-icon">
                  <PartitionOutlined className="stat-icon" />
                </div>
                <Statistic 
                  title="Запчасти" 
                  value={stats.sparesCount} 
                  className="stat-value"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card bordered={false} className="stat-card resource-card" hoverable>
                <div className="stat-icon-container materials-icon">
                  <ApartmentOutlined className="stat-icon" />
                </div>
                <Statistic 
                  title="Материалы" 
                  value={stats.materialsCount} 
                  className="stat-value"
                />
              </Card>
            </Col>
          </Row>

          {/* Main content rows */}
          <Row gutter={[16, 16]} className="main-row">
            {/* Equipment and transport status */}
            <Col xs={24} md={12}>
              <Card 
                title={
                  <div className="card-title-with-icon">
                    <SettingOutlined className="title-icon equipment-icon" />
                    <span>Статус оборудования</span>
                  </div>
                }
                className="chart-card"
                bordered={false}
                hoverable
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
                title={
                  <div className="card-title-with-icon">
                    <CarOutlined className="title-icon transport-icon" />
                    <span>Статус транспорта</span>
                  </div>
                }
                className="chart-card"
                bordered={false}
                hoverable
              >
                {transportStatus.length > 0 ? (
                  renderSimpleStatusChart(transportStatus)
                ) : (
                  <Empty description="Нет данных о транспорте" />
                )}
              </Card>
            </Col>

            {/* Maintenance schedule */}
            <Col xs={24}>
              <Card 
                title={
                  <div className="card-title-with-icon">
                    <ToolOutlined className="title-icon maintenance-icon" />
                    <span>График технического обслуживания</span>
                  </div>
                }
                className="schedule-card"
                bordered={false}
                hoverable
              >
                {renderMaintenanceSchedule()}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;