import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Badge, 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Tabs, 
  Modal, 
  Form, 
  Input, 
  // DatePicker, // Удаляем импорт DatePicker из Ant Design
  Select, 
  Slider, 
  message, 
  Tooltip, 
  Breadcrumb,
  Empty,
  Spin,
  Popconfirm,
  Upload
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  HomeOutlined,
  TeamOutlined, 
  ToolOutlined, 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  ImportOutlined,
  InboxOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/ru'; // Импортируем русскую локализацию moment
import locale from 'antd/es/date-picker/locale/ru_RU'; // Импортируем русскую локализацию для DatePicker
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../../styles/Schedule/Schedule.css';
import TimeRangePicker from '../../components/TimeRangePicker'; // Импортируем наш компонент TimeRangePicker
import DatePicker from '../../components/DatePicker/DatePicker'; // Импортируем кастомный DatePicker

// Устанавливаем русскую локализацию для moment
moment.locale('ru');

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Schedule = () => {
  const navigate = useNavigate();
  
  // State for tasks and related data
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [transport, setTransport] = useState([]);
  const [processes, setProcesses] = useState([]);

  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  
  // Состояние для хранения временного диапазона
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  // Состояние для кастомного DatePicker
  const [taskDate, setTaskDate] = useState(new Date());

  // Import/Export state
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Priority and status options
  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: '#52c41a' },
    { value: 'medium', label: 'Средний', color: '#1890ff' },
    { value: 'high', label: 'Высокий', color: '#fa8c16' },
    { value: 'critical', label: 'Критичный', color: '#f5222d' }
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Запланировано', color: '#1890ff' },
    { value: 'in-progress', label: 'В процессе', color: '#fa8c16' },
    { value: 'completed', label: 'Выполнено', color: '#52c41a' },
    { value: 'delayed', label: 'Отложено', color: '#f5222d' },
    { value: 'cancelled', label: 'Отменено', color: '#595959' }
  ];

  // Функция для проверки, является ли дата прошедшей
  const isDateInPast = (date) => {
    if (!date) return false;
    const today = moment().startOf('day');
    let selectedDate;
    if (date instanceof Date) {
      selectedDate = moment(date).startOf('day');
    } else {
      selectedDate = moment(date).startOf('day');
    }
    return selectedDate.isBefore(today);
  };

  // Функция для отключения прошедших дат в DatePicker
  const disabledDate = (current) => {
    // Отключаем все даты до сегодняшнего дня
    return current && current < moment().startOf('day');
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Update selectedDateTasks whenever date or tasks change
  useEffect(() => {
    filterTasksByDate(selectedDate);
  }, [selectedDate, tasks]);

  // Main data fetching function
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTasks(),
        fetchEmployees(),
        fetchEquipment(),
        fetchTransport(),
        fetchProcesses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  // Individual data fetching functions
  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/schedule');
      setTasks(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Не удалось загрузить задачи');
      return [];
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.get('/api/equipment');
      setEquipment(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  };

  const fetchTransport = async () => {
    try {
      const response = await axios.get('/api/transportation');
      setTransport(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching transport:', error);
      return [];
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await axios.get('/api/schedule/processes/all');
      setProcesses(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching processes:', error);
      return [];
    }
  };

  // Форматирование даты из YYYY-MM-DD в DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Проверка на валидность даты
      if (isNaN(date.getTime())) return '';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      return '';
    }
  };

  // Export tasks to Excel
  const exportToExcel = () => {
    try {
      // Create dataset for export
      const exportData = tasks.map(item => {
        // Find employees by IDs
        const employeeNames = getEmployeeNames(item.employeeIds);
        const equipmentNames = getEquipmentNames(item.equipmentIds);
        const transportNames = getTransportNames(item.transportIds);
        const processName = getProcessName(item.ProcessId);
        
        return {
          'Название задачи': item.Title || '',
          'Дата': formatDate(item.Date) || '',
          'Время начала': item.StartTime || '',
          'Время окончания': item.EndTime || '',
          'Местоположение': item.Location || '',
          'Процесс': processName,
          'Сотрудники': employeeNames,
          'Оборудование': equipmentNames,
          'Транспорт': transportNames,
          'Приоритет': priorityOptions.find(p => p.value === item.Priority)?.label || '',
          'Статус': statusOptions.find(s => s.value === item.Status)?.label || '',
          'Прогресс (%)': item.Progress || 0,
          'Описание': item.Description || ''
        };
      });
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 25 }, // Название задачи
        { wch: 15 }, // Дата
        { wch: 15 }, // Время начала
        { wch: 15 }, // Время окончания
        { wch: 25 }, // Местоположение
        { wch: 20 }, // Процесс
        { wch: 30 }, // Сотрудники
        { wch: 30 }, // Оборудование
        { wch: 30 }, // Транспорт
        { wch: 15 }, // Приоритет
        { wch: 15 }, // Статус
        { wch: 15 }, // Прогресс
        { wch: 35 }  // Описание
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Расписание');
      
      // Generate and download Excel file
      const filename = `Расписание_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные расписания успешно экспортированы!');
    } catch (err) {
      message.error(`Не удалось экспортировать данные: ${err.message}`);
    }
  };

  // Open import modal
  const showImportModal = () => {
    setImportFileList([]);
    setImportError('');
    setImportModalVisible(true);
  };

  // Handle import file change
  const handleImportFileChange = (info) => {
    setImportFileList(info.fileList.slice(-1)); // Save only the last file
  };

    const handleGenerateReport = () => {
  navigate('/schedule/report');
};

  // Create template for download
  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        'Название задачи': 'Ремонт канализации на ул. Ленина',
        'Дата': moment().add(1, 'day').format('DD.MM.YYYY'), // Завтрашняя дата
        'Время начала': '08:00',
        'Время окончания': '17:00',
        'Местоположение': 'ул. Ленина, д. 10',
        'Процесс': 'Канализация',
        'Сотрудники': 'Иванов Иван, Петров Петр',
        'Оборудование': 'Компрессор, Насос',
        'Транспорт': 'ГАЗель 3302',
        'Приоритет': 'Высокий',
        'Статус': 'Запланировано',
        'Прогресс (%)': 0,
        'Описание': 'Плановый ремонт канализационной системы'
      },
      {
        'Название задачи': 'Уборка парка',
        'Дата': moment().add(2, 'days').format('DD.MM.YYYY'), // Послезавтрашняя дата
        'Время начала': '09:00',
        'Время окончания': '16:00',
        'Местоположение': 'Центральный парк',
        'Процесс': 'Уборка',
        'Сотрудники': 'Сидоров Сидор',
        'Оборудование': 'Газонокосилка',
        'Транспорт': '',
        'Приоритет': 'Средний',
        'Статус': 'В процессе',
        'Прогресс (%)': 50,
        'Описание': 'Еженедельная уборка территории парка'
      }
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Название задачи
      { wch: 15 }, // Дата
      { wch: 15 }, // Время начала
      { wch: 15 }, // Время окончания
      { wch: 25 }, // Местоположение
      { wch: 20 }, // Процесс
      { wch: 30 }, // Сотрудники
      { wch: 30 }, // Оборудование
      { wch: 30 }, // Транспорт
      { wch: 15 }, // Приоритет
      { wch: 15 }, // Статус
      { wch: 15 }, // Прогресс
      { wch: 35 }  // Описание
    ];
    worksheet['!cols'] = wscols;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Download
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Расписания.xlsx');
  };

  // Handle imported Excel file
  const handleImport = async () => {
    setImportError('');
    
    if (!importFileList || importFileList.length === 0) {
      setImportError('Пожалуйста, выберите Excel-файл для импорта');
      message.error('Пожалуйста, выберите Excel-файл для импорта');
      return;
    }

    const file = importFileList[0].originFileObj;
    
    if (!file) {
      setImportError('Неверный файловый объект');
      message.error('Неверный файловый объект');
      return;
    }
    
    setImporting(true);

    try {
      // Read Excel file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Parse Excel data
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          if (!worksheetName) {
            throw new Error('Excel-файл не содержит листов');
          }
          
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
          
          // Check data structure
          if (!jsonData || jsonData.length <= 1) { // Including header row
            throw new Error('Excel-файл пуст или содержит некорректные данные');
          }
          
          // Find header row and identify column positions
          const headerRow = jsonData[0];
          const columns = {
            title: Object.keys(headerRow).find(key => headerRow[key] === 'Название задачи'),
            date: Object.keys(headerRow).find(key => headerRow[key] === 'Дата'),
            startTime: Object.keys(headerRow).find(key => headerRow[key] === 'Время начала'),
            endTime: Object.keys(headerRow).find(key => headerRow[key] === 'Время окончания'),
            location: Object.keys(headerRow).find(key => headerRow[key] === 'Местоположение'),
            process: Object.keys(headerRow).find(key => headerRow[key] === 'Процесс'),
            employees: Object.keys(headerRow).find(key => headerRow[key] === 'Сотрудники'),
            equipment: Object.keys(headerRow).find(key => headerRow[key] === 'Оборудование'),
            transport: Object.keys(headerRow).find(key => headerRow[key] === 'Транспорт'),
            priority: Object.keys(headerRow).find(key => headerRow[key] === 'Приоритет'),
            status: Object.keys(headerRow).find(key => headerRow[key] === 'Статус'),
            progress: Object.keys(headerRow).find(key => headerRow[key] === 'Прогресс (%)'),
            description: Object.keys(headerRow).find(key => headerRow[key] === 'Описание')
          };
          
          if (!columns.title) {
            throw new Error('В Excel-файле отсутствует столбец Название задачи');
          }
          
          // Transform rows to our format, skipping header row
          const taskItems = jsonData.slice(1).map(row => {
            // Parse date from DD.MM.YYYY to YYYY-MM-DD
            let date = '';
            if (columns.date && row[columns.date]) {
              const dateParts = row[columns.date].split('.');
              if (dateParts.length === 3) {
                date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
              } else {
                date = row[columns.date];
              }
            }

            // Проверка даты на задним числом для импорта
            if (date && isDateInPast(date)) {
              throw new Error(`Задача "${row[columns.title]}" имеет дату ${formatDate(date)}, которая находится в прошлом. Создание задач задним числом запрещено.`);
            }

            // Find employees by names
            const employeeNames = columns.employees ? (row[columns.employees] || '').split(',').map(name => name.trim()).filter(Boolean) : [];
            const employeeIds = employeeNames.map(name => {
              const employee = employees.find(emp => emp.Full_Name === name);
              return employee ? employee.Employee_ID : null;
            }).filter(Boolean);

            // Find equipment by names
            const equipmentNames = columns.equipment ? (row[columns.equipment] || '').split(',').map(name => name.trim()).filter(Boolean) : [];
            const equipmentIds = equipmentNames.map(name => {
              const eq = equipment.find(eq => eq.Name === name);
              return eq ? eq.Equipment_ID : null;
            }).filter(Boolean);

            // Find transport by brand/model
            const transportNames = columns.transport ? (row[columns.transport] || '').split(',').map(name => name.trim()).filter(Boolean) : [];
            const transportIds = transportNames.map(name => {
              const tr = transport.find(tr => `${tr.Brand} ${tr.Model}`.includes(name) || name.includes(`${tr.Brand} ${tr.Model}`));
              return tr ? tr.Transport_ID : null;
            }).filter(Boolean);

            // Find process by name
            const processName = columns.process ? row[columns.process] || '' : '';
            const process = processes.find(proc => proc.Name === processName);
            const processId = process ? process.Process_ID : null;

            // Map priority and status
            const priorityText = columns.priority ? row[columns.priority] || '' : '';
            const priority = priorityOptions.find(p => p.label === priorityText)?.value || 'medium';

            const statusText = columns.status ? row[columns.status] || '' : '';
            const status = statusOptions.find(s => s.label === statusText)?.value || 'scheduled';
            
            return {
              title: columns.title ? row[columns.title] || '' : '',
              date: date,
              startTime: columns.startTime ? row[columns.startTime] || '08:00' : '08:00',
              endTime: columns.endTime ? row[columns.endTime] || '17:00' : '17:00',
              location: columns.location ? row[columns.location] || '' : '',
              processId: processId,
              employeeIds: employeeIds,
              equipmentIds: equipmentIds,
              transportIds: transportIds,
              priority: priority,
              status: status,
              progress: columns.progress ? Number(row[columns.progress]) || 0 : 0,
              description: columns.description ? row[columns.description] || '' : ''
            };
          });
          
          // Filter invalid records (missing required fields)
          const validTasks = taskItems.filter(item => item.title.trim() !== '');
          
          if (validTasks.length === 0) {
            throw new Error('Действительные данные о задачах не найдены. Название задачи обязательно.');
          }
          
          // Send data to server
          const response = await fetch('/api/schedule/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tasks: validTasks })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Импорт не удался');
          }
          
          const result = await response.json();
          
          setImportModalVisible(false);
          message.success(`Успешно импортировано ${result.imported} задач`);
          fetchTasks();
          
        } catch (err) {
          setImportError(`Импорт не удался: ${err.message}`);
          message.error(`Импорт не удался: ${err.message}`);
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = (error) => {
        setImportError('Не удалось прочитать файл');
        message.error('Не удалось прочитать файл');
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      setImportError(`Импорт не удался: ${err.message}`);
      message.error(`Импорт не удался: ${err.message}`);
      setImporting(false);
    }
  };

  // Filter tasks for the selected date
  const filterTasksByDate = (date) => {
    const filtered = tasks.filter(task => task.Date === date);
    setSelectedDateTasks(filtered);
  };

  // Handle date selection in calendar
  const onSelect = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    setSelectedDate(dateString);
  };

  // Get tasks for a specific date (for calendar cell rendering)
  const getListData = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    return tasks.filter(task => task.Date === dateString);
  };

  // Render calendar cell data
  const dateCellRender = (value) => {
    const listData = getListData(value);
    
    return (
      <ul className="tasks-list">
        {listData.map(item => (
          <li key={item.Task_ID} onClick={() => showTaskDetails(item)}>
            <Badge
              color={statusOptions.find(s => s.value === item.Status)?.color || 'blue'}
              text={
                <Tooltip title={item.Title}>
                  <span className="task-badge-text">{item.Title}</span>
                </Tooltip>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  // Обработчик изменения временного диапазона
  const handleTimeRangeChange = (range) => {
    setStartTime(range.from);
    setEndTime(range.to);
  };

  // Обработчик изменения даты в кастомном DatePicker
  const handleTaskDateChange = (date) => {
    setTaskDate(date);
  };

  // Add a new task
  const showAddTaskModal = () => {
    setIsEditing(false);
    setCurrentTask(null);
    form.resetFields();
    
    // Set default values - используем сегодняшнюю дату или выбранную, если она не в прошлом
    const defaultDate = isDateInPast(selectedDate) ? new Date() : new Date(selectedDate);
    
    form.setFieldsValue({
      status: 'scheduled',
      priority: 'medium',
      progress: 0
    });
    
    // Установка начальных значений для временного диапазона
    setStartTime('08:00');
    setEndTime('17:00');
    
    // Установка даты для кастомного DatePicker
    setTaskDate(defaultDate);
    
    setModalVisible(true);
  };

  // Edit existing task
  const showEditTaskModal = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    
    form.setFieldsValue({
      title: task.Title,
      employeeIds: task.employeeIds,
      equipmentIds: task.equipmentIds,
      transportIds: task.transportIds,
      processId: task.ProcessId,
      location: task.Location,
      status: task.Status,
      priority: task.Priority,
      description: task.Description,
      progress: task.Progress,
    });
    
    // Установка значений времени для TimeRangePicker
    setStartTime(task.StartTime || '08:00');
    setEndTime(task.EndTime || '17:00');
    
    // Установка даты для кастомного DatePicker
    setTaskDate(new Date(task.Date));
    
    setModalVisible(true);
  };

  // Show task details
  const showTaskDetails = (task) => {
    setCurrentTask(task);
    showEditTaskModal(task);
  };

  // Handle form submission
  const handleSubmit = () => {
    form.validateFields()
      .then(async (values) => {
        setIsLoading(true);
        
        try {
          // Format date from Date object to YYYY-MM-DD
          const date = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}`;
          
          // Проверка даты на задним числом при создании новой задачи
          if (!isEditing && isDateInPast(taskDate)) {
            throw new Error('Нельзя создавать задачи задним числом. Пожалуйста, выберите текущую или будущую дату.');
          }
          
          // Валидация времени (проверка, что время начала раньше времени окончания)
          const startMoment = moment(startTime, 'HH:mm');
          const endMoment = moment(endTime, 'HH:mm');
          
          if (endMoment.isSameOrBefore(startMoment)) {
            throw new Error('Время окончания должно быть позже времени начала');
          }
          
          const taskData = {
            title: values.title,
            date,
            startTime,
            endTime,
            employeeIds: values.employeeIds || [],
            equipmentIds: values.equipmentIds || [],
            transportIds: values.transportIds || [],
            processId: values.processId,
            location: values.location,
            status: values.status,
            priority: values.priority,
            description: values.description,
            progress: values.progress || 0,
          };
          
          if (isEditing && currentTask) {
            // Update existing task
            await axios.put(`/api/schedule/${currentTask.Task_ID}`, taskData);
            message.success('Задача обновлена успешно');
          } else {
            // Create new task
            await axios.post('/api/schedule', taskData);
            message.success('Задача добавлена успешно');
          }
          
          // Refresh tasks data
          fetchTasks();
          setModalVisible(false);
        } catch (error) {
          console.error('Error saving task:', error);
          message.error('Произошла ошибка при сохранении задачи: ' + (error.message || 'Неизвестная ошибка'));
        } finally {
          setIsLoading(false);
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  // Метод для удаления задачи без подтверждения через Modal.confirm
  const confirmTaskDeletion = async (taskId) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`/api/schedule/${taskId}`);
      console.log('Удалено на бэкенде:', response);
      await fetchTasks();
      setModalVisible(false);
      message.success('Задача удалена успешно');
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      message.error('Не удалось удалить задачу');
    } finally {
      setIsLoading(false);
    }
  };

  // Сохраняем метод для совместимости со старым кодом, но не используем его
  const handleDeleteTask = (taskId) => {
    // Этот метод больше не используется
  };

  // Get name from ID for various entities
  const getEmployeeNames = (ids) => {
    if (!ids || !Array.isArray(ids) || !employees.length) return 'Не назначено';
    return ids.map(id => {
      const employee = employees.find(emp => emp.Employee_ID === id);
      return employee ? employee.Full_Name : 'Unknown';
    }).join(', ');
  };

  const getEquipmentNames = (ids) => {
    if (!ids || !Array.isArray(ids) || !equipment.length) return 'Не назначено';
    return ids.map(id => {
      const eq = equipment.find(eq => eq.Equipment_ID === id);
      return eq ? eq.Name : 'Unknown';
    }).join(', ');
  };

  const getTransportNames = (ids) => {
    if (!ids || !Array.isArray(ids) || !transport.length) return 'Не назначено';
    return ids.map(id => {
      const t = transport.find(t => t.Transport_ID === id);
      return t ? `${t.Brand} ${t.Model}` : 'Unknown';
    }).join(', ');
  };

  const getProcessName = (id) => {
    if (!id || !processes.length) return 'Не указано';
    const process = processes.find(p => p.Process_ID === id);
    return process ? process.Name : 'Не указано';
  };

  // Calculate schedule statistics
  const statisticsData = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.Status === 'completed').length,
    inProgressTasks: tasks.filter(task => task.Status === 'in-progress').length,
    delayedTasks: tasks.filter(task => task.Status === 'delayed').length,
  };

  // Получение текущей даты и времени для TimeRangePicker
  const currentDateTime = `${moment().format('YYYY-MM-DD')} ${moment().format('HH:mm:ss')}`;
  
  return (
    <div className="schedule-container">
      <Breadcrumb className="breadcrumb-navigation">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Расписание</Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="schedule-header">
        <div className="schedule-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>Расписание задач</Title>
          <Button 
            type="primary" 
            icon={<FileExcelOutlined />} 
            onClick={exportToExcel}
            className="ant-export-button"
          >
            Экспорт
          </Button>
          <Button 
            type="primary" 
            icon={<ImportOutlined />} 
            onClick={showImportModal}
            className="ant-import-button"
          >
            Импорт
          </Button>

            <Button
              type="primary" 
              icon={<FileDoneOutlined />}
              onClick={handleGenerateReport}
              className="ant-report-button"
            >
              Создать отчёт
            </Button>
        </div>
        <Button
          className="schedule-add-button"  
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddTaskModal}
          size="large"
        >
          Добавить задачу
        </Button>
      </div>
      
      <Spin spinning={isLoading}>
        {/* Statistics Cards */}
        <Row gutter={16} className="statistics-row">
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card">
              <Statistic 
                title="Всего задач" 
                value={statisticsData.totalTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card completed">
              <Statistic 
                title="Выполнено" 
                value={statisticsData.completedTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card in-progress">
              <Statistic 
                title="В процессе" 
                value={statisticsData.inProgressTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card critical-delayed">
              <Statistic 
                title="Отложено" 
                value={statisticsData.delayedTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
        </Row>
        
        {/* Tabs with views */}
        <Tabs 
          defaultActiveKey="month" 
          onChange={setViewMode}
          className="schedule-tabs"
        >
          <TabPane tab="Месяц" key="month">
            <Card className="calendar-card">
              <Calendar 
                dateCellRender={dateCellRender} 
                onSelect={onSelect}
                locale={locale} // Добавляем русскую локализацию для календаря
              />
            </Card>
          </TabPane>
          <TabPane tab="День" key="day">
            <Card className="day-view-card">
              <div className="day-header">
                <Title level={4}>
                  Задачи на {moment(selectedDate).format('DD.MM.YYYY')}
                </Title>
                <DatePicker 
                  selectedDate={new Date(selectedDate)}
                  onChange={(date) => {
                    const dateString = moment(date).format('YYYY-MM-DD');
                    setSelectedDate(dateString);
                  }}
                />
              </div>
              
              {selectedDateTasks.length > 0 ? (
                <div className="day-tasks">
                  {selectedDateTasks.map(task => (
                    <Card
                      key={task.Task_ID}
                      className={`task-card ${task.Status}`}
                      onClick={() => showTaskDetails(task)}
                    >
                      <div className="task-card-header">
                        <Title level={5} style={{ margin: 0 }}>{task.Title}</Title>
                        <Badge 
                          status={
                            task.Status === 'completed' ? 'success' :
                            task.Status === 'in-progress' ? 'processing' :
                            task.Status === 'delayed' ? 'error' :
                            task.Status === 'cancelled' ? 'default' : 'warning'
                          } 
                          text={statusOptions.find(s => s.value === task.Status)?.label || 'Запланировано'} 
                        />
                      </div>
                      <div className="task-card-time">
                        <ClockCircleOutlined /> {task.StartTime} - {task.EndTime}
                      </div>
                      <div className="task-card-location">
                        <EnvironmentOutlined /> {task.Location || 'Не указано'}
                      </div>
                      <div className="task-card-process">
                        {getProcessName(task.ProcessId)}
                      </div>
                      <div className="task-card-resources">
                        <div><TeamOutlined /> {getEmployeeNames(task.employeeIds)}</div>
                        {task.equipmentIds && task.equipmentIds.length > 0 && (
                          <div><ToolOutlined /> {getEquipmentNames(task.equipmentIds)}</div>
                        )}
                        {task.transportIds && task.transportIds.length > 0 && (
                          <div><CarOutlined /> {getTransportNames(task.transportIds)}</div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="no-tasks">
                  <Empty description="Нет задач на выбранную дату" />
                  <Button type="primary" onClick={showAddTaskModal}>
                    Добавить задачу
                  </Button>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Spin>
      
      {/* Task Modal Form */}
      <Modal
        title={isEditing ? "Редактирование задачи" : "Добавление новой задачи"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          isEditing && (
            <Popconfirm
              title="Вы уверены, что хотите удалить эту задачу? Это действие невозможно отменить."
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
              onConfirm={() => confirmTaskDeletion(currentTask.Task_ID)}
            >
              <Button key="delete" danger>
                Удалить
              </Button>
            </Popconfirm>
          ),
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSubmit}
            loading={isLoading}
          >
            {isEditing ? "Сохранить" : "Добавить"}
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          className="task-form"
        >
          <Form.Item
            name="title"
            label="Название задачи"
            rules={[{ required: true, message: 'Пожалуйста, введите название задачи' }]}
          >
            <Input placeholder="Введите название задачи" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Дата"
                rules={[
                  { required: true, message: 'Пожалуйста, выберите дату' },
                  {
                    validator: (_, value) => {
                      if (!isEditing && taskDate && isDateInPast(taskDate)) {
                        return Promise.reject(new Error('Нельзя создавать задачи задним числом. Выберите текущую или будущую дату.'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker 
                  selectedDate={taskDate} 
                  onChange={handleTaskDateChange} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* Заменяем TimePicker.RangePicker на наш компонент TimeRangePicker */}
              <Form.Item
                label="Время"
                required={true}
              >
                <TimeRangePicker
                  label=""
                  onChange={handleTimeRangeChange}
                  initialFromTime={startTime}
                  initialToTime={endTime}
                  required={true}
                  currentDateTime={currentDateTime}
                  currentUser="Naomi4ok"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Местоположение"
              >
                <Input placeholder="Введите адрес или местоположение" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="processId"
                label="Процесс"
              >
                <Select placeholder="Выберите процесс">
                  {processes.map(process => (
                    <Option key={process.Process_ID} value={process.Process_ID}>
                      {process.Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employeeIds"
                label="Сотрудники"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите сотрудников"
                  optionFilterProp="children"
                  showSearch
                >
                  {employees.map(employee => (
                    <Option key={employee.Employee_ID} value={employee.Employee_ID}>
                      {employee.Full_Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="equipmentIds"
                label="Оборудование"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите оборудование"
                  optionFilterProp="children"
                  showSearch
                >
                  {equipment.map(item => (
                    <Option key={item.Equipment_ID} value={item.Equipment_ID}>
                      {item.Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transportIds"
                label="Транспорт"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите транспорт"
                  optionFilterProp="children"
                  showSearch
                >
                  {transport.map(item => (
                    <Option key={item.Transport_ID} value={item.Transport_ID}>
                      {item.Brand} {item.Model}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Приоритет"
                rules={[{ required: true, message: 'Пожалуйста, выберите приоритет' }]}
              >
                <Select placeholder="Выберите приоритет">
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Badge color={option.color} text={option.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Статус"
                rules={[{ required: true, message: 'Пожалуйста, выберите статус' }]}
              >
                <Select placeholder="Выберите статус">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Badge color={option.color} text={option.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="progress"
                label="Прогресс выполнения"
              >
                <Slider
                  marks={{
                    0: '0%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Описание"
          >
            <TextArea 
              rows={4} 
              placeholder="Введите описание задачи" 
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import modal */}
      <Modal
        title="Импорт расписания из Excel"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="template" onClick={downloadTemplate} style={{ float: 'left' }}>
            Скачать шаблон
          </Button>,
          <Button key="cancel" onClick={() => setImportModalVisible(false)}>
            Отмена
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importing}
            onClick={handleImport}
            disabled={importFileList.length === 0}
          >
            Импорт
          </Button>
        ]}
      >
        <div className="import-instructions">
          <p>Пожалуйста, загрузите Excel-файл со следующими столбцами:</p>
          <ul>
            <li><strong>Название задачи</strong> (обязательно)</li>
            <li>Дата (формат DD.MM.YYYY, <strong>не в прошлом</strong>)</li>
            <li>Время начала (формат HH:MM)</li>
            <li>Время окончания (формат HH:MM)</li>
            <li>Местоположение</li>
            <li>Процесс</li>
            <li>Сотрудники (через запятую)</li>
            <li>Оборудование (через запятую)</li>
            <li>Транспорт (через запятую)</li>
            <li>Приоритет (Низкий/Средний/Высокий/Критичный)</li>
            <li>Статус (Запланировано/В процессе/Выполнено/Отложено/Отменено)</li>
            <li>Прогресс (%)</li>
            <li>Описание</li>
          </ul>
          <p><strong>Внимание:</strong> Создание задач задним числом запрещено. Все даты должны быть сегодняшними или будущими.</p>
        </div>

        {importError && (
          <div className="import-error" style={{ color: 'red', marginBottom: '10px' }}>
            Ошибка: {importError}
          </div>
        )}

        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={() => false} // Prevent automatic upload
          fileList={importFileList}
          onChange={handleImportFileChange}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Нажмите или перетащите файл в эту область для загрузки</p>
          <p className="ant-upload-hint">
            Поддерживается загрузка одного Excel-файла. Убедитесь, что ваш файл содержит необходимые столбцы.
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default Schedule;