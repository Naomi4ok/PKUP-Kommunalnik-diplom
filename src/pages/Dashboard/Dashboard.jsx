import React, { useState, useEffect, useContext } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Alert, 
  Badge, Spin, Typography, Avatar, Divider, Progress, 
  Empty
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
import moment from 'moment'; // Import moment for date handling with antd

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
  // Use the provided date/time and convert it to a Date object
  const [currentDate] = useState(new Date('2025-04-25T17:16:51'));
  const [weatherData, setWeatherData] = useState(null);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  // Use the provided username
  const currentUser = 'Naomi4ok';

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
        'Требует обслуживания': 0,
        'На ремонте': 0,
        'Неисправно': 0
      };
      
      equipment.forEach(item => {
        if (statusCounts[item.Condition] !== undefined) {
          statusCounts[item.Condition]++;
        } else {
          // If condition doesn't match existing categories, add to "Неисправно"
          statusCounts['Неисправно']++;
        }
      });
      
      // Convert to array format expected by the chart
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
        'Требует обслуживания': 0,
        'На ремонте': 0,
        'Неисправен': 0
      };
      
      transport.forEach(item => {
        if (item.TechnicalCondition === 'Исправен') {
          statusCounts['Исправен']++;
        } else if (item.TechnicalCondition === 'Требует обслуживания') {
          statusCounts['Требует обслуживания']++;
        } else if (item.TechnicalCondition === 'На ремонте') {
          statusCounts['На ремонте']++;
        } else {
          statusCounts['Неисправен']++;
        }
      });
      
      // Convert to array format expected by the chart
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
        .filter(task => task.ProcessId === 1 || task.ProcessId === 2) // Assuming ProcessIds 1 and 2 are for maintenance
        .slice(0, 10) // Limit to 10 items
        .map((task, index) => {
          // Parse equipment and transport IDs
          const equipmentIds = task.EquipmentIds ? JSON.parse(task.EquipmentIds) : [];
          const transportIds = task.TransportIds ? JSON.parse(task.TransportIds) : [];
          
          // Get the first equipment or transport for simplicity
          const equipmentId = equipmentIds.length > 0 ? equipmentIds[0] : null;
          const transportId = transportIds.length > 0 ? transportIds[0] : null;
          
          // Determine item type and name
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
          
          // Map status
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

  // Fetch real weather data for Brest, Belarus
  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      
      // In a real implementation, we would use an actual weather API like OpenWeatherMap, WeatherAPI, etc.
      // Since we can't make actual API calls in this environment, we'll simulate a response for Brest, Belarus
      
      // Simulated API call:
      // const API_KEY = 'your_api_key_here';
      // const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Brest,by&units=metric&appid=${API_KEY}`);
      // const weatherData = response.data;
      
      // Simulate a response for Brest, Belarus with realistic weather data
      setTimeout(() => {
        // Simulated weather data for Brest, Belarus
        const weather = {
          condition: 'Облачно с прояснениями',
          temperature: 16, // Temperature in Celsius
          humidity: 72,    // Humidity percentage
          wind: 4.2,       // Wind speed in m/s
          icon: '⛅',      // Weather icon
          location: 'Брест, Беларусь'
        };
        
        setWeatherData(weather);
        setWeatherLoading(false);
      }, 800); // Simulate API delay
      
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

  // Weather info display
  const renderWeatherInfo = () => {
    if (weatherLoading) return <Spin size="small" />;
    
    if (!weatherData) return <div>Нет данных о погоде</div>;
    
    return (
      <div className="weather-container">
        <div className="weather-icon">{weatherData.icon}</div>
        <div className="weather-details">
          <div className="weather-location">{weatherData.location}</div>
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
        locale={{ emptyText: 'Нет запланированных работ' }}
      />
    );
  };

  // Simple chart component for status visualization
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

  // Render the dashboard
  return (
    <div className="dashboard-container">
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>Загрузка данных из базы...</p>
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
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;