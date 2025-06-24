import React, { useState, useEffect, useContext } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Alert, 
  Badge, Spin, Typography, Avatar, Divider, Progress, 
  Empty, Tag, Button // Добавил Button в импорты
} from 'antd';
import { 
  UserOutlined, ToolOutlined, CarOutlined, 
  PartitionOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, CalendarOutlined, SettingOutlined,
  CloudOutlined, ApartmentOutlined, BellOutlined,
  ClockCircleOutlined, SyncOutlined, TeamOutlined
} from '@ant-design/icons';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Dashboard/Dashboard.css';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination'; // Импорт кастомной пагинации

const { Title, Text } = Typography;

// Функция для перевода погодных условий на русский язык
const translateWeatherCondition = (condition) => {
  const translations = {
    // Ясная погода
    'Sunny': 'Солнечно',
    'Clear': 'Ясно',
    'Partly cloudy': 'Переменная облачность',
    'Cloudy': 'Облачно',
    'Overcast': 'Пасмурно',
    
    // Дождь
    'Patchy rain possible': 'Возможен небольшой дождь',
    'Light rain shower': 'Легкий дождь',
    'Light rain': 'Небольшой дождь',
    'Moderate rain at times': 'Временами умеренный дождь',
    'Moderate rain': 'Умеренный дождь',
    'Heavy rain at times': 'Временами сильный дождь',
    'Heavy rain': 'Сильный дождь',
    'Light drizzle': 'Легкая морось',
    'Drizzle': 'Морось',
    'Torrential rain shower': 'Ливневый дождь',
    'Patchy light drizzle': 'Местами легкая морось',
    'Patchy light rain': 'Местами легкий дождь',
    'Moderate or heavy rain shower': 'Умеренный или сильный ливень',
    'Light rain with thunder': 'Легкий дождь с грозой',
    
    // Снег
    'Patchy snow possible': 'Возможен снег',
    'Light snow showers': 'Легкий снег',
    'Light snow': 'Небольшой снег',
    'Moderate snow': 'Умеренный снег',
    'Heavy snow': 'Сильный снег',
    'Blizzard': 'Метель',
    'Blowing snow': 'Позёмок',
    'Patchy light snow': 'Местами легкий снег',
    'Moderate or heavy snow showers': 'Умеренный или сильный снегопад',
    'Patchy moderate snow': 'Местами умеренный снег',
    'Moderate or heavy snow with thunder': 'Умеренный или сильный снег с грозой',
    
    // Туман
    'Mist': 'Легкий туман',
    'Fog': 'Туман',
    'Freezing fog': 'Замерзающий туман',
    
    // Гроза
    'Thundery outbreaks possible': 'Возможна гроза',
    'Patchy light rain with thunder': 'Местами легкий дождь с грозой',
    'Moderate or heavy rain with thunder': 'Умеренный или сильный дождь с грозой',
    'Patchy light snow with thunder': 'Местами легкий снег с грозой',
    
    // Мокрый снег и изморось
    'Freezing drizzle': 'Замерзающая морось',
    'Heavy freezing drizzle': 'Сильная замерзающая морось',
    'Ice pellets': 'Ледяная крупа',
    'Light sleet': 'Легкий мокрый снег',
    'Moderate or heavy sleet': 'Умеренный или сильный мокрый снег',
    'Light sleet showers': 'Легкий мокрый снег',
    'Moderate or heavy sleet showers': 'Умеренный или сильный мокрый снег',
    
    // Дополнительные условия
    'Patchy freezing drizzle possible': 'Возможна замерзающая морось',
    'Light freezing rain': 'Легкий ледяной дождь',
    'Moderate or heavy freezing rain': 'Умеренный или сильный ледяной дождь',
    'Light showers of ice pellets': 'Легкая ледяная крупа',
    'Moderate or heavy showers of ice pellets': 'Умеренная или сильная ледяная крупа',
    
    // Если перевод не найден
    'No data': 'Нет данных'
  };
  
  return translations[condition] || condition;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
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
  const [scheduleData, setScheduleData] = useState([]); // Изменено название с maintenanceSchedule на scheduleData
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  // Добавляем состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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
          fetchScheduleData(), // Изменено с fetchMaintenanceSchedule на fetchScheduleData
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
      
      const equipmentStatusData = Object.keys(statusCounts)
        .filter(type => statusCounts[type] > 0) // Показываем только те статусы, которые есть
        .map(type => ({
          name: type,
          value: statusCounts[type],
          color: getStatusColor(type)
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
      
      const transportStatusData = Object.keys(statusCounts)
        .filter(type => statusCounts[type] > 0) // Показываем только те статусы, которые есть
        .map(type => ({
          name: type,
          value: statusCounts[type],
          color: getStatusColor(type)
        }));
      
      setTransportStatus(transportStatusData);
    } catch (error) {
      console.error('Error fetching transport status:', error);
      throw error;
    }
  };

  // Fetch schedule data - новая функция, заменяющая fetchMaintenanceSchedule
  const fetchScheduleData = async () => {
    try {
      // Получаем данные из расписания
      const response = await axios.get('/api/schedule');
      const tasks = response.data;
      
      // Сортируем по дате (ближайшие даты сначала)
      const sortedTasks = tasks
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));

      // Маппинг данных для отображения в таблице
      const formattedSchedule = sortedTasks.map((task, index) => {
        // Парсим employeeIds
        const employeeIds = task.EmployeeIds ? JSON.parse(task.EmployeeIds) : [];
        const employeeCount = employeeIds.length;

        // Определяем приоритет
        const priorityOptions = {
          'low': { label: 'Низкий', color: '#52c41a' },
          'medium': { label: 'Средний', color: '#1890ff' },
          'high': { label: 'Высокий', color: '#fa8c16' },
          'critical': { label: 'Критичный', color: '#f5222d' }
        };

        // Определяем статус
        const statusOptions = {
          'scheduled': { label: 'Запланировано', color: '#1890ff' },
          'in-progress': { label: 'В процессе', color: '#fa8c16' },
          'completed': { label: 'Выполнено', color: '#52c41a' },
          'delayed': { label: 'Отложено', color: '#f5222d' },
          'cancelled': { label: 'Отменено', color: '#595959' }
        };

        // Форматирование даты
        const formatTaskDate = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}.${month}.${year}`;
          } catch (error) {
            return '';
          }
        };

        return {
          id: task.Task_ID || index + 1,
          taskName: task.Title || 'Не указано',
          processName: task.ProcessName || 'Не указано',
          employeeCount: employeeCount,
          date: task.Date ? formatTaskDate(task.Date) : 'Не указана',
          priority: task.Priority || 'medium',
          status: task.Status || 'scheduled',
          startTime: task.StartTime || '',
          endTime: task.EndTime || '',
          location: task.Location || ''
        };
      });

      setScheduleData(formattedSchedule);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      throw error;
    }
  };

  // Fetch real weather data for Brest, Belarus using WeatherAPI
// Обновленная функция fetchWeatherData
const fetchWeatherData = async () => {
  try {
    setWeatherLoading(true);
    
    const API_KEY = 'e2d480ee39474050a56215834252504';
    const response = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Brest,Belarus&aqi=no`);
    const data = response.data;
    
    // Функция для перевода названий городов и стран
    const translateLocation = (city, country) => {
      const cityTranslations = {
        'Brest': 'Брест',
        'Minsk': 'Минск',
        'Gomel': 'Гомель',
        'Vitebsk': 'Витебск',
        'Grodno': 'Гродно',
        'Mogilev': 'Могилёв'
      };
      
      const countryTranslations = {
        'Belarus': 'Беларусь',
        'Russia': 'Россия',
        'Ukraine': 'Украина',
        'Poland': 'Польша',
        'Lithuania': 'Литва',
        'Latvia': 'Латвия'
      };
      
      const translatedCity = cityTranslations[city] || city;
      const translatedCountry = countryTranslations[country] || country;
      
      return `${translatedCity}, ${translatedCountry}`;
    };
    
    const weather = {
      condition: translateWeatherCondition(data.current.condition.text),
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      wind: data.current.wind_kph / 3.6,
      icon: getWeatherIcon(data.current.condition.code),
      location: translateLocation(data.location.name, data.location.country)
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

  // Navigation function for cards
  const handleCardClick = (path) => {
    navigate(path);
  };

  // Status color mapping for charts
  const getStatusColor = (statusType) => {
    if (statusType.includes('Рабочее') || statusType.includes('Исправен') || statusType === 'Выполнено') {
      return '#52c41a'; // green
    } else if (statusType.includes('Требует ТО') || statusType === 'В процессе') {
      return '#1890ff'; // blue
    } else if (statusType.includes('Ремонтируется')) {
      return '#fa8c16'; // orange
    } else if (statusType.includes('Неисправ')) {
      return '#f5222d'; // red
    }
    return '#1890ff'; // blue default
  };

  // Custom tooltip for pie charts
  const renderTooltip = (props) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0];
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '12px',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '13px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: data.payload.color }}>
            {data.payload.name}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            Количество: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (percent < 0.05) return null; // Не показываем метки для очень маленьких сегментов
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
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
            {weatherData.wind !== '--' && (
              <span>Ветер: {Math.round(weatherData.wind)} м/с</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Обработка изменения страницы для пользовательской пагинации
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  // Обновленная функция для отображения таблицы расписания
  const renderScheduleTable = () => {
    const columns = [
      {
        title: 'Название задачи',
        dataIndex: 'taskName',
        key: 'taskName',
        width: '25%',
        ellipsis: true,
        render: (text) => (
          <span style={{ fontWeight: '500' }}>{text}</span>
        )
      },
      {
        title: 'Процесс задачи',
        dataIndex: 'processName',
        key: 'processName',
        width: '20%',
        ellipsis: true,
        render: (text) => (
          <Tag color="blue">{text}</Tag>
        )
      },
      {
        title: 'Количество сотрудников',
        dataIndex: 'employeeCount',
        key: 'employeeCount',
        width: '15%',
        align: 'center',
        render: (count) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TeamOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
            <span style={{ fontWeight: '500' }}>{count}</span>
          </div>
        )
      },
      {
        title: 'Дата',
        dataIndex: 'date',
        key: 'date',
        width: '15%',
        render: (text, record) => {
          const today = new Date().toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const isToday = text === today;
          
          return (
            <div>
              <div style={{ fontWeight: isToday ? 'bold' : 'normal' }}>{text}</div>
              {record.startTime && record.endTime && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {record.startTime} - {record.endTime}
                </Text>
              )}
              {isToday && <Tag color="green" style={{ marginTop: '2px' }}>Сегодня</Tag>}
            </div>
          );
        }
      },
      {
        title: 'Приоритет',
        dataIndex: 'priority',
        key: 'priority',
        width: '12%',
        render: (priority) => {
          const priorityOptions = {
            'low': { label: 'Низкий', color: '#52c41a' },
            'medium': { label: 'Средний', color: '#1890ff' },
            'high': { label: 'Высокий', color: '#fa8c16' },
            'critical': { label: 'Критичный', color: '#f5222d' }
          };
          
          const priorityConfig = priorityOptions[priority] || priorityOptions['medium'];
          
          return (
            <Tag color={priorityConfig.color}>
              {priorityConfig.label}
            </Tag>
          );
        }
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: '13%',
        render: (status) => {
          const statusOptions = {
            'scheduled': { label: 'Запланировано', color: 'blue', icon: <ClockCircleOutlined /> },
            'in-progress': { label: 'В процессе', color: 'orange', icon: <SyncOutlined spin /> },
            'completed': { label: 'Выполнено', color: 'green', icon: <CheckCircleOutlined /> },
            'delayed': { label: 'Отложено', color: 'red', icon: <ClockCircleOutlined /> },
            'cancelled': { label: 'Отменено', color: 'default', icon: <CloseCircleOutlined /> }
          };
          
          const statusConfig = statusOptions[status] || statusOptions['scheduled'];
          
          return (
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {statusConfig.label}
            </Tag>
          );
        }
      }
    ];
    
    // Вычисляем данные для текущей страницы
    const paginatedData = scheduleData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    return (
      <div>
        <Table 
          columns={columns} 
          dataSource={paginatedData} 
          rowKey="id" 
          size="middle" 
          pagination={false} // Отключаем встроенную пагинацию
          locale={{ emptyText: <Empty description="Нет запланированных задач" /> }}
          rowClassName={(record) => {
            if (record.status === 'completed') return 'completed-row';
            if (record.status === 'delayed') return 'delayed-row';
            return '';
          }}
        />
        
        {/* Добавляем кастомную пагинацию */}
        <Pagination
          totalItems={scheduleData.length}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          pageSizeOptions={[5, 10, 20]}
          initialPageSize={pageSize}
        />
      </div>
    );
  };

  // Render equipment status chart
  const renderEquipmentChart = () => {
    if (!equipmentStatus.length) {
      return <Empty description="Нет данных об оборудовании" />;
    }

    const total = equipmentStatus.reduce((sum, item) => sum + item.value, 0);

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '300px' }}>
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <Pie
              data={equipmentStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {equipmentStatus.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>
        
        <div style={{ width: '35%', paddingLeft: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
            Всего: {total}
          </div>
          {equipmentStatus.map((item, index) => {
            const percentage = Math.round((item.value / total) * 100);
            return (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color, 
                    borderRadius: '50%',
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <div style={{ fontWeight: '500', color: '#333' }}>{item.name}</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    {item.value} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render transport status chart
  const renderTransportChart = () => {
    if (!transportStatus.length) {
      return <Empty description="Нет данных о транспорте" />;
    }

    const total = transportStatus.reduce((sum, item) => sum + item.value, 0);

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '300px' }}>
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <Pie
              data={transportStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {transportStatus.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>
        
        <div style={{ width: '35%', paddingLeft: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
            Всего: {total}
          </div>
          {transportStatus.map((item, index) => {
            const percentage = Math.round((item.value / total) * 100);
            return (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color, 
                    borderRadius: '50%',
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <div style={{ fontWeight: '500', color: '#333' }}>{item.name}</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    {item.value} ({percentage}%)
                  </div>
                </div>
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
              <Card 
                bordered={false} 
                className="stat-card resource-card" 
                hoverable 
                onClick={() => handleCardClick('/employees')}
                style={{ cursor: 'pointer' }}
              >
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
              <Card 
                bordered={false} 
                className="stat-card resource-card" 
                hoverable 
                onClick={() => handleCardClick('/equipment')}
                style={{ cursor: 'pointer' }}
              >
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
              <Card 
                bordered={false} 
                className="stat-card resource-card" 
                hoverable 
                onClick={() => handleCardClick('/transport')}
                style={{ cursor: 'pointer' }}
              >
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
              <Card 
                bordered={false} 
                className="stat-card resource-card" 
                hoverable 
                onClick={() => handleCardClick('/tools')}
                style={{ cursor: 'pointer' }}
              >
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
              <Card 
                bordered={false} 
                className="stat-card resource-card" 
                hoverable 
                onClick={() => handleCardClick('/spares')}
                style={{ cursor: 'pointer' }}
              >
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
              <Card 
                bordered={false} 
                className="stat-card resource-card" 
                hoverable 
                onClick={() => handleCardClick('/materials')}
                style={{ cursor: 'pointer' }}
              >
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
            {/* Equipment and transport status charts */}
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
                {renderEquipmentChart()}
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
                {renderTransportChart()}
              </Card>
            </Col>

            {/* Schedule table - обновленная секция */}
            <Col xs={24}>
              <Card 
                title={
                  <div className="card-title-with-icon">
                    <CalendarOutlined className="title-icon schedule-icon" />
                    <span>Расписание задач</span>
                  </div>
                }
                className="schedule-card"
                bordered={false}
                hoverable
                extra={
                  <Button 
                    type="link" 
                    onClick={() => handleCardClick('/schedule')}
                    style={{ padding: 0 }}
                  >
                    Посмотреть все →
                  </Button>
                }
              >
                {renderScheduleTable()}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;