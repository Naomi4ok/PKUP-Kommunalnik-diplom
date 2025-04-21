import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Card,
  Typography,
  message,
  Popconfirm,
  Spin,
  Tag,
  Divider,
  Dropdown,
  Input,
  Modal,
  Image,
  Upload,
  Collapse,
  Select,
  Row,
  Col,
  Checkbox,
  DatePicker,
  Breadcrumb
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ImportOutlined,
  MoreOutlined,
  InboxOutlined,
  EllipsisOutlined,
  FilterOutlined,
  HomeOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '../../styles/Employee/Employees.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [importError, setImportError] = useState('');
  
  // Новый стейт для функциональности фильтров
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  // Русские статусы
  const [statuses, setStatuses] = useState(['Активен', 'В отпуске', 'Уволен']);
  
  // Значения фильтров
  const [filterValues, setFilterValues] = useState({
    departments: [],
    positions: [],
    statuses: [],
    workSchedule: []
  });
  
  // Поисковой запрос
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка сотрудников при монтировании компонента
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Обновление отфильтрованных сотрудников при изменении списка сотрудников или фильтров
  useEffect(() => {
    applyFiltersAndSearch();
  }, [employees, filterValues, searchQuery]);

  // Извлечение уникальных отделов и должностей из данных о сотрудниках
  useEffect(() => {
    if (employees.length > 0) {
      const uniqueDepartments = Array.from(
        new Set(employees.map(e => e.Department).filter(Boolean))
      );
      setDepartments(uniqueDepartments);
      
      const uniquePositions = Array.from(
        new Set(employees.map(e => e.Position).filter(Boolean))
      );
      setPositions(uniquePositions);
    }
  }, [employees]);

  // Перевод статусов с английского на русский
  const translateStatusToRussian = (status) => {
    if (!status) return 'Активен'; // По умолчанию
    
    switch(status) {
      case 'Active': 
        return 'Активен';
      case 'On Leave': 
        return 'В отпуске';
      case 'Terminated': 
        return 'Уволен';
      default:
        return status; // Если статус уже на русском или другой
    }
  };

  // Перевод графика работы с английского на русский
  const translateWorkScheduleToRussian = (schedule) => {
    if (!schedule) return '';
    
    switch(schedule) {
      case 'Flexible': 
        return 'Гибкий';
      case 'Shift Work': 
        return 'Сменный';
      default:
        // Если это временной диапазон или другая строка, оставляем как есть
        return schedule;
    }
  };

  // Перевод статусов с русского на английский (для API)
  const translateStatusToEnglish = (status) => {
    if (!status) return 'Active'; // По умолчанию
    
    switch(status) {
      case 'Активен': 
        return 'Active';
      case 'В отпуске': 
        return 'On Leave';
      case 'Уволен': 
        return 'Terminated';
      default:
        return status; // Если статус уже на английском или другой
    }
  };

  // Перевод графика работы с русского на английский
  const translateWorkScheduleToEnglish = (schedule) => {
    if (!schedule) return '';
    
    switch(schedule) {
      case 'Гибкий': 
        return 'Flexible';
      case 'Сменный': 
        return 'Shift Work';
      default:
        // Если это временной диапазон или другая строка, оставляем как есть
        return schedule;
    }
  };

  // Загрузка всех сотрудников из базы данных
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Преобразование английских статусов и графиков работы в русские при получении данных
      const translatedData = data.map(employee => ({
        ...employee,
        Status: translateStatusToRussian(employee.Status),
        Work_Schedule: translateWorkScheduleToRussian(employee.Work_Schedule)
      }));
      
      setEmployees(translatedData);
    } catch (err) {
      message.error(`Не удалось загрузить данные о сотрудниках: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Применение фильтров и поиска
  const applyFiltersAndSearch = () => {
    let filtered = [...employees];
    
    // Применение поискового запроса
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(employee => {
        return (
          (employee.Full_Name && employee.Full_Name.toLowerCase().includes(query)) ||
          (employee.Position && employee.Position.toLowerCase().includes(query)) ||
          (employee.Department && employee.Department.toLowerCase().includes(query)) ||
          (employee.Contact_Details && employee.Contact_Details.toLowerCase().includes(query)) ||
          (employee.Work_Schedule && employee.Work_Schedule.toLowerCase().includes(query)) ||
          (employee.Status && employee.Status.toLowerCase().includes(query))
        );
      });
    }
    
    // Применение фильтра отдела
    if (filterValues.departments.length > 0) {
      filtered = filtered.filter(employee => 
        filterValues.departments.includes(employee.Department)
      );
    }
    
    // Применение фильтра должности
    if (filterValues.positions.length > 0) {
      filtered = filtered.filter(employee => 
        filterValues.positions.includes(employee.Position)
      );
    }
    
    // Применение фильтра статуса
    if (filterValues.statuses.length > 0) {
      filtered = filtered.filter(employee => 
        filterValues.statuses.includes(employee.Status)
      );
    }
    
    // Применение фильтра по графику работы
    if (filterValues.workSchedule.length > 0) {
      filtered = filtered.filter(employee => {
        if (filterValues.workSchedule.includes('Гибкий') && 
            (employee.Work_Schedule === 'Гибкий' || employee.Work_Schedule === 'Flexible')) {
          return true;
        }
        if (filterValues.workSchedule.includes('Сменный') && 
            (employee.Work_Schedule === 'Сменный' || employee.Work_Schedule === 'Shift Work')) {
          return true;
        }
        if (filterValues.workSchedule.includes('Индивидуальный') && 
            employee.Work_Schedule && 
            employee.Work_Schedule !== 'Гибкий' && 
            employee.Work_Schedule !== 'Flexible' && 
            employee.Work_Schedule !== 'Сменный' && 
            employee.Work_Schedule !== 'Shift Work') {
          return true;
        }
        return false;
      });
    }
    
    setFilteredEmployees(filtered);
  };

  // Переключение видимости фильтров
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Обработка изменений фильтров
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Сброс всех фильтров
  const resetFilters = () => {
    setFilterValues({
      departments: [],
      positions: [],
      statuses: [],
      workSchedule: []
    });
  };

  // Обработка функции поиска
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Обработка предпросмотра фото
  const handlePreview = (photo, name) => {
    if (photo) {
      setPreviewImage(`data:image/jpeg;base64,${photo}`);
      setPreviewTitle(name || 'Фото сотрудника');
      setPreviewVisible(true);
    }
  };

  // Закрытие модального окна предпросмотра
  const handlePreviewCancel = () => {
    setPreviewVisible(false);
  };

  // Экспорт сотрудников в Excel
  const exportToExcel = () => {
    try {
      // Создание набора данных без фотографий и с форматированными данными
      const exportData = employees.map(employee => {
        // Разделение полного имени на имя и фамилию, если возможно
        const nameParts = employee.Full_Name ? employee.Full_Name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          'Имя': firstName,
          'Фамилия': lastName,
          'Должность': employee.Position || '',
          'Отдел': employee.Department || '',
          'Контактные данные': employee.Contact_Details || '',
          'График работы': employee.Work_Schedule || '',
          'Статус': employee.Status || 'Активен'
        };
      });
      
      // Создание рабочего листа из данных
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Установка ширины столбцов
      const wscols = [
        { wch: 15 }, // Имя
        { wch: 20 }, // Фамилия
        { wch: 20 }, // Должность
        { wch: 20 }, // Отдел
        { wch: 30 }, // Контактные данные
        { wch: 20 }, // График работы
        { wch: 15 }  // Статус
      ];
      worksheet['!cols'] = wscols;
      
      // Создание рабочей книги
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Сотрудники');
      
      // Генерация и загрузка файла Excel
      const filename = `Сотрудники_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные о сотрудниках успешно экспортированы!');
    } catch (err) {
      message.error(`Не удалось экспортировать данные: ${err.message}`);
    }
  };

  // Открытие модального окна импорта
  const showImportModal = () => {
    setImportFileList([]);
    setImportError(''); // Очистка предыдущих ошибок
    setImportModalVisible(true);
  };

  // Обработка изменения файла импорта
  const handleImportFileChange = (info) => {
    console.log('Файл изменен:', info);
    setImportFileList(info.fileList.slice(-1)); // Сохранение только последнего файла
  };

  // Создание шаблона для загрузки
  const downloadTemplate = () => {
    // Создание образца данных
    const sampleData = [
      {
        'Имя': 'Иван',
        'Фамилия': 'Иванов',
        'Должность': 'Менеджер',
        'Отдел': 'ИТ',
        'Контактные данные': '+375(29)123-45-67',
        'График работы': 'Гибкий',
        'Статус': 'Активен'
      },
      {
        'Имя': 'Мария',
        'Фамилия': 'Петрова',
        'Должность': 'Разработчик',
        'Отдел': 'Инженерный',
        'Контактные данные': '+375(33)765-43-21',
        'График работы': 'Сменный',
        'Статус': 'В отпуске'
      }
    ];
    
    // Создание рабочего листа
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Установка ширины столбцов
    const wscols = [
      { wch: 15 }, // Имя
      { wch: 20 }, // Фамилия
      { wch: 20 }, // Должность
      { wch: 20 }, // Отдел
      { wch: 30 }, // Контактные данные
      { wch: 20 }, // График работы
      { wch: 15 }  // Статус
    ];
    worksheet['!cols'] = wscols;
    
    // Создание рабочей книги
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Загрузка
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Сотрудников.xlsx');
  };

  // Обработка импортированного Excel-файла
  const handleImport = async () => {
    setImportError('');
    
    if (!importFileList || importFileList.length === 0) {
      setImportError('Пожалуйста, выберите Excel-файл для импорта');
      message.error('Пожалуйста, выберите Excel-файл для импорта');
      return;
    }

    const file = importFileList[0].originFileObj;
    console.log('Обработка файла:', file);
    
    if (!file) {
      setImportError('Неверный файловый объект');
      message.error('Неверный файловый объект');
      return;
    }
    
    setImporting(true);

    try {
      // Чтение Excel-файла
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        console.log('Файл успешно загружен');
        try {
          // Разбор данных Excel
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Получение первого рабочего листа
          const worksheetName = workbook.SheetNames[0];
          if (!worksheetName) {
            throw new Error('Excel-файл не содержит листов');
          }
          
          const worksheet = workbook.Sheets[worksheetName];
          
          // Конвертация в JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
          
          console.log('Разобранные данные Excel:', jsonData);
          
          // Проверка структуры данных
          if (!jsonData || jsonData.length <= 1) { // С учетом строки заголовка
            throw new Error('Excel-файл пуст или содержит некорректные данные');
          }
          
          // Поиск строки заголовка и идентификация позиций столбцов
          const headerRow = jsonData[0];
          const columns = {
            firstName: Object.keys(headerRow).find(key => headerRow[key] === 'Имя'),
            lastName: Object.keys(headerRow).find(key => headerRow[key] === 'Фамилия'),
            position: Object.keys(headerRow).find(key => headerRow[key] === 'Должность'),
            department: Object.keys(headerRow).find(key => headerRow[key] === 'Отдел'),
            contactDetails: Object.keys(headerRow).find(key => headerRow[key] === 'Контактные данные'),
            workSchedule: Object.keys(headerRow).find(key => headerRow[key] === 'График работы'),
            status: Object.keys(headerRow).find(key => headerRow[key] === 'Статус')
          };
          
          if (!columns.firstName && !columns.lastName) {
            throw new Error('В Excel-файле отсутствуют столбцы Имя или Фамилия');
          }
          
          // Преобразование строк в наш формат, пропуская строку заголовка
          const employees = jsonData.slice(1).map(row => {
            // Извлечение значений из идентифицированных позиций столбцов
            const firstName = columns.firstName ? row[columns.firstName] || '' : '';
            const lastName = columns.lastName ? row[columns.lastName] || '' : '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            // Конвертирование русского статуса в английский для API
            const status = columns.status ? translateStatusToEnglish(row[columns.status] || 'Активен') : 'Active';
            
            // Конвертирование русского графика работы в английский для API
            let workSchedule = '';
            if (columns.workSchedule) {
              workSchedule = translateWorkScheduleToEnglish(row[columns.workSchedule] || '');
            }
            
            return {
              fullName: fullName,
              position: columns.position ? row[columns.position] || '' : '',
              department: columns.department ? row[columns.department] || '' : '',
              contactDetails: columns.contactDetails ? row[columns.contactDetails] || '' : '',
              workSchedule: workSchedule,
              status: status
            };
          });
          
          // Фильтрация недействительных записей (отсутствуют обязательные поля)
          const validEmployees = employees.filter(emp => emp.fullName.trim() !== '');
          
          if (validEmployees.length === 0) {
            throw new Error('Действительные данные о сотрудниках не найдены. Полное имя обязательно.');
          }
          
          console.log('Сотрудники для импорта:', validEmployees);
          
          // Отправка данных на сервер
          const response = await fetch('/api/employees/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employees: validEmployees })
          });
          
          console.log('Статус ответа сервера:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Импорт не удался');
          }
          
          const result = await response.json();
          console.log('Результат импорта:', result);
          
          setImportModalVisible(false);
          message.success(`Успешно импортировано ${result.imported} сотрудников`);
          fetchEmployees();
          
        } catch (err) {
          console.error('Ошибка обработки импорта:', err);
          setImportError(`Импорт не удался: ${err.message}`);
          message.error(`Импорт не удался: ${err.message}`);
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Ошибка чтения файла:', error);
        setImportError('Не удалось прочитать файл');
        message.error('Не удалось прочитать файл');
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      console.error('Ошибка импорта:', err);
      setImportError(`Импорт не удался: ${err.message}`);
      message.error(`Импорт не удался: ${err.message}`);
      setImporting(false);
    }
  };

  // Переход на страницу добавления сотрудника
  const goToAddEmployee = () => {
    navigate('/employees/add');
  };

  // Переход на страницу редактирования сотрудника
  const goToEditEmployee = (id) => {
    navigate(`/employees/edit/${id}`);
  };

  // Обработка удаления сотрудника
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }

      message.success('Сотрудник успешно удален!');
      fetchEmployees();
    } catch (err) {
      message.error(`Не удалось удалить сотрудника: ${err.message}`);
    }
  };

  // Обработка изменения страницы для пользовательской пагинации
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  // Определение столбцов таблицы
  const columns = [
    {
      title: 'Фото',
      dataIndex: 'Photo',
      key: 'photo',
      width: 80,
      render: (photo, record) => (
        photo ? (
          <img 
            src={`data:image/jpeg;base64,${photo}`} 
            alt="Сотрудник" 
            className="ant-employee-photo"
            onClick={() => handlePreview(photo, record.Full_Name)}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div className="ant-employee-photo-placeholder">
            <UserOutlined />
          </div>
        )
      ),
    },
    {
      title: 'ФИО',
      dataIndex: 'Full_Name',
      key: 'fullName',
      sorter: (a, b) => a.Full_Name.localeCompare(b.Full_Name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Поиск по имени"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Поиск
            </Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
              Сброс
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => record.Full_Name.toLowerCase().includes(value.toLowerCase()),
      render: (text, record) => (
        <div>
          <div className="employee-name">{text}</div>
          {record.Position && <div className="employee-position">{record.Position}</div>}
        </div>
      ),
    },
    {
      title: 'Отдел',
      dataIndex: 'Department',
      key: 'department',
      filters: Array.from(new Set(employees.map(e => e.Department).filter(Boolean))).map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => record.Department === value,
    },
    {
      title: 'Контактные данные',
      dataIndex: 'Contact_Details',
      key: 'contactDetails',
      ellipsis: true,
    },
    {
      title: 'График работы',
      dataIndex: 'Work_Schedule',
      key: 'workSchedule',
      ellipsis: true,
    },
    {
      title: 'Статус',
      dataIndex: 'Status',
      key: 'status',
      filters: [
        { text: 'Активен', value: 'Активен' },
        { text: 'В отпуске', value: 'В отпуске' },
        { text: 'Уволен', value: 'Уволен' },
      ],
      onFilter: (value, record) => record.Status === value,
      render: (status) => {
        let color = 'green';
        if (status === 'В отпуске') {
          color = 'gold';
        } else if (status === 'Уволен') {
          color = 'red';
        }
        
        return (
          <Tag color={color}>
            {status || 'Активен'}
          </Tag>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Редактировать',
                icon: <EditOutlined />,
                onClick: () => goToEditEmployee(record.Employee_ID)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление сотрудника"
                    description="Вы уверены, что хотите удалить этого сотрудника?"
                    onConfirm={() => handleDelete(record.Employee_ID)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <span className="dropdown-delete-label">Удалить</span>
                  </Popconfirm>,
                icon: <DeleteOutlined />,
                danger: true
              }
            ]
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<EllipsisOutlined  />}
            className="action-more-button"
          />
        </Dropdown>
      ),
    },
  ];
  
  // Расчет данных для отображения на текущей странице
  const paginatedData = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ant-employees-container">
      {/* Добавление хлебных крошек */}
      <Breadcrumb className="employee-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Сотрудники
        </Breadcrumb.Item>
      </Breadcrumb>
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Левая сторона: кнопки экспорта и импорта */}
            <div className="header-left-content">
            <Title level={2}>Сотрудники</Title>
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
            </div>
            
            {/* Правая сторона: строка поиска, кнопка фильтра и кнопка добавления сотрудника */}
            <div className="header-right-content">

              {/* Кнопка фильтра */}
              <Button
                type="primary" 
                icon={<FilterOutlined />}
                onClick={toggleFilters}
                className="ant-filter-button"
              >
                Фильтр
              </Button>
              
              {/* Строка поиска */}
              <div className="employees-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск сотрудников"
                  autoFocus={false}
                />
              </div>
              
              {/* Кнопка добавления сотрудника */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={goToAddEmployee}
                className="ant-add-button"
              >
                Добавить сотрудника
              </Button>
            </div>
          </div>
          
          {showFilters && (
  <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
    <div className="filter-panel-header">
      <h4>Фильтр сотрудников</h4>
      <Button 
      className="ant-filreset-button"
      type="link"
      onClick={resetFilters}>Сбросить все фильтры</Button>
    </div>
    
    <Row gutter={[16, 16]}>
      {/* Фильтр по отделу */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Отдел</label>
          <Select
            mode="multiple"
            placeholder="Выберите отделы"
            value={filterValues.departments}
            onChange={(values) => handleFilterChange('departments', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {departments.map(dept => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по должности */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Должность</label>
          <Select
            mode="multiple"
            placeholder="Выберите должности"
            value={filterValues.positions}
            onChange={(values) => handleFilterChange('positions', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {positions.map(pos => (
              <Option key={pos} value={pos}>{pos}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по статусу */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Статус</label>
          <Select
            mode="multiple"
            placeholder="Выберите статус"
            value={filterValues.statuses}
            onChange={(values) => handleFilterChange('statuses', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {statuses.map(status => (
              <Option key={status} value={status}>{status}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по графику работы */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>График работы</label>
          <Select
            mode="multiple"
            placeholder="Выберите тип графика"
            value={filterValues.workSchedule}
            onChange={(values) => handleFilterChange('workSchedule', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            <Option value="Гибкий">Гибкий</Option>
            <Option value="Сменный">Сменный</Option>
            <Option value="Индивидуальный">Индивидуальный график</Option>
          </Select>
        </div>
      </Col>
    </Row>
  </div>
)}
          
          <Divider />
          
          <Spin spinning={loading}>
            {/* Таблица без встроенной пагинации */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="Employee_ID"
              pagination={false} // Отключение встроенной пагинации
              scroll={{ x: 'max-content' }}
            />
            
            {/* Компонент пользовательской пагинации */}
            <Pagination
              totalItems={filteredEmployees.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 20, 50]}
              initialPageSize={pageSize}
            />
          </Spin>
        </div>
      </Card>

      {/* Модальное окно предпросмотра изображения */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handlePreviewCancel}
      >
        <div className="employee-photo-preview-container">
          <img 
            alt="Предпросмотр сотрудника" 
            style={{ width: '100%' }} 
            src={previewImage} 
          />
        </div>
      </Modal>

      {/* Модальное окно импорта с улучшениями отладки */}
      <Modal
        title="Импорт сотрудников из Excel"
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
            <li><strong>Имя</strong> (обязательно)</li>
            <li><strong>Фамилия</strong></li>
            <li>Должность</li>
            <li>Отдел</li>
            <li>Контактные данные</li>
            <li>График работы</li>
            <li>Статус</li>
          </ul>
        </div>

        {importError && (
          <div className="import-error" style={{ color: 'red', marginBottom: '10px' }}>
            Ошибка: {importError}
          </div>
        )}

        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={() => false} // Предотвращение автоматической загрузки
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

export default Employees;