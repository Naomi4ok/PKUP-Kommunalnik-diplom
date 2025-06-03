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
  Upload,
  Collapse,
  Select,
  Row,
  Col,
  DatePicker,
  Breadcrumb
} from 'antd';
import {
  ToolOutlined,
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
  HomeOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '../../styles/Equipment/Equipment.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Equipment = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [importError, setImportError] = useState('');
  const [employees, setEmployees] = useState([]);
  
  // Новый стейт для функциональности фильтров
  const [showFilters, setShowFilters] = useState(false);
  const [types, setTypes] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [conditions, setConditions] = useState(['Рабочее', 'Требует ТО', 'Неисправно', 'Ремонтируется']);
  
  // Значения фильтров
  const [filterValues, setFilterValues] = useState({
    types: [],
    manufacturers: [],
    locations: [],
    conditions: [],
    responsibleEmployees: []
  });
  
  // Поисковой запрос
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка оборудования и сотрудников при монтировании компонента
  useEffect(() => {
    fetchEquipment();
    fetchEmployees();
  }, []);

  // Обновление отфильтрованного оборудования при изменении списка оборудования или фильтров
  useEffect(() => {
    applyFiltersAndSearch();
  }, [equipment, filterValues, searchQuery]);

  // Извлечение уникальных типов, производителей и местоположений из данных об оборудовании
  useEffect(() => {
    if (equipment.length > 0) {
      const uniqueTypes = Array.from(
        new Set(equipment.map(e => e.Type).filter(Boolean))
      );
      setTypes(uniqueTypes);
      
      const uniqueManufacturers = Array.from(
        new Set(equipment.map(e => e.Manufacturer).filter(Boolean))
      );
      setManufacturers(uniqueManufacturers);
      
      const uniqueLocations = Array.from(
        new Set(equipment.map(e => e.Location).filter(Boolean))
      );
      setLocations(uniqueLocations);
    }
  }, [equipment]);

  // Загрузка всего оборудования из базы данных
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/equipment');
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      setEquipment(data);
    } catch (err) {
      message.error(`Не удалось загрузить данные об оборудовании: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка всех сотрудников для связи с оборудованием
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      message.error(`Не удалось загрузить данные о сотрудниках: ${err.message}`);
    }
  };

  // Применение фильтров и поиска
  const applyFiltersAndSearch = () => {
    let filtered = [...equipment];
    
    // Применение поискового запроса
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.Name && item.Name.toLowerCase().includes(query)) ||
          (item.Type && item.Type.toLowerCase().includes(query)) ||
          (item.Manufacturer && item.Manufacturer.toLowerCase().includes(query)) ||
          (item.Model && item.Model.toLowerCase().includes(query)) ||
          (item.Inventory_Number && item.Inventory_Number.toLowerCase().includes(query)) ||
          (item.Location && item.Location.toLowerCase().includes(query)) ||
          (item.Condition && item.Condition.toLowerCase().includes(query))
        );
      });
    }
    
    // Применение фильтра типа/класса
    if (filterValues.types.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.types.includes(item.Type)
      );
    }
    
    // Применение фильтра производителя
    if (filterValues.manufacturers.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.manufacturers.includes(item.Manufacturer)
      );
    }
    
    // Применение фильтра местоположения
    if (filterValues.locations.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.locations.includes(item.Location)
      );
    }
    
    // Применение фильтра по состоянию
    if (filterValues.conditions.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.conditions.includes(item.Condition)
      );
    }
    
    // Применение фильтра по ответственному
    if (filterValues.responsibleEmployees.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.responsibleEmployees.includes(item.Responsible_Employee_ID)
      );
    }
    
    setFilteredEquipment(filtered);
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
      types: [],
      manufacturers: [],
      locations: [],
      conditions: [],
      responsibleEmployees: []
    });
  };

  // Обработка функции поиска
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Функция для форматирования даты (из YYYY-MM-DD в DD.MM.YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Возвращаем исходную строку, если дата невалидна
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  // Экспорт оборудования в Excel
  const exportToExcel = () => {
    try {
      // Создание набора данных для экспорта
      const exportData = equipment.map(item => {
        // Найти ответственного сотрудника по ID
        const responsibleEmployee = employees.find(emp => emp.Employee_ID === item.Responsible_Employee_ID);
        const responsibleName = responsibleEmployee ? responsibleEmployee.Full_Name : '';
        
        return {
          'Наименование': item.Name || '',
          'Тип/Класс': item.Type || '',
          'Производитель': item.Manufacturer || '',
          'Модель': item.Model || '',
          'Инвентарный номер': item.Inventory_Number || '',
          'Дата ввода в эксплуатацию': item.Commission_Date ? formatDate(item.Commission_Date) : '',
          'Ответственный за эксплуатацию': responsibleName,
          'Техническое состояние': item.Condition || '',
          'Место нахождения': item.Location || ''
        };
      });
      
      // Создание рабочего листа из данных
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Установка ширины столбцов
      const wscols = [
        { wch: 25 }, // Наименование
        { wch: 15 }, // Тип/Класс
        { wch: 20 }, // Производитель
        { wch: 20 }, // Модель
        { wch: 20 }, // Инвентарный номер
        { wch: 25 }, // Дата ввода в эксплуатацию
        { wch: 30 }, // Ответственный за эксплуатацию
        { wch: 25 }, // Техническое состояние
        { wch: 20 }  // Место нахождения
      ];
      worksheet['!cols'] = wscols;
      
      // Создание рабочей книги
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Оборудование');
      
      // Генерация и загрузка файла Excel
      const filename = `Оборудование_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные об оборудовании успешно экспортированы!');
    } catch (err) {
      message.error(`Не удалось экспортировать данные: ${err.message}`);
    }
  };

  // Открытие модального окна импорта
  const showImportModal = () => {
    setImportFileList([]);
    setImportError('');
    setImportModalVisible(true);
  };

  // Обработка изменения файла импорта
  const handleImportFileChange = (info) => {
    setImportFileList(info.fileList.slice(-1)); // Сохранение только последнего файла
  };

  // Создание шаблона для загрузки
  const downloadTemplate = () => {
    // Создание образца данных
    const sampleData = [
      {
        'Наименование': 'Насос центробежный',
        'Тип/Класс': 'Насосное оборудование',
        'Производитель': 'Grundfos',
        'Модель': 'CR 5-10',
        'Инвентарный номер': 'ИН-00123',
        'Дата ввода в эксплуатацию': '15.01.2023',
        'Ответственный за эксплуатацию': 'Иванов Иван Иванович',
        'Техническое состояние': 'Рабочее',
        'Место нахождения': 'Насосная станция №2'
      },
      {
        'Наименование': 'Котел отопительный',
        'Тип/Класс': 'Котельное оборудование',
        'Производитель': 'Viessmann',
        'Модель': 'Vitodens 200',
        'Инвентарный номер': 'ИН-00124',
        'Дата ввода в эксплуатацию': '20.10.2022',
        'Ответственный за эксплуатацию': 'Петров Петр Петрович',
        'Техническое состояние': 'Требует ТО',
        'Место нахождения': 'Котельная №1'
      }
    ];
    
    // Создание рабочего листа
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Установка ширины столбцов
    const wscols = [
      { wch: 25 }, // Наименование
      { wch: 15 }, // Тип/Класс
      { wch: 20 }, // Производитель
      { wch: 20 }, // Модель
      { wch: 20 }, // Инвентарный номер
      { wch: 25 }, // Дата ввода в эксплуатацию
      { wch: 30 }, // Ответственный за эксплуатацию
      { wch: 25 }, // Техническое состояние
      { wch: 20 }  // Место нахождения
    ];
    worksheet['!cols'] = wscols;
    
    // Создание рабочей книги
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Загрузка
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Оборудования.xlsx');
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
          
          // Проверка структуры данных
          if (!jsonData || jsonData.length <= 1) { // С учетом строки заголовка
            throw new Error('Excel-файл пуст или содержит некорректные данные');
          }
          
          // Поиск строки заголовка и идентификация позиций столбцов
          const headerRow = jsonData[0];
          const columns = {
            name: Object.keys(headerRow).find(key => headerRow[key] === 'Наименование'),
            type: Object.keys(headerRow).find(key => headerRow[key] === 'Тип/Класс'),
            manufacturer: Object.keys(headerRow).find(key => headerRow[key] === 'Производитель'),
            model: Object.keys(headerRow).find(key => headerRow[key] === 'Модель'),
            inventoryNumber: Object.keys(headerRow).find(key => headerRow[key] === 'Инвентарный номер'),
            commissionDate: Object.keys(headerRow).find(key => headerRow[key] === 'Дата ввода в эксплуатацию'),
            responsible: Object.keys(headerRow).find(key => headerRow[key] === 'Ответственный за эксплуатацию'),
            condition: Object.keys(headerRow).find(key => headerRow[key] === 'Техническое состояние'),
            location: Object.keys(headerRow).find(key => headerRow[key] === 'Место нахождения')
          };
          
          if (!columns.name) {
            throw new Error('В Excel-файле отсутствует столбец Наименование');
          }
          
          // Преобразование строк в наш формат, пропуская строку заголовка
          const equipmentItems = jsonData.slice(1).map(row => {
            // Получение ответственного сотрудника по имени
            const responsibleName = columns.responsible ? row[columns.responsible] || '' : '';
            const responsibleEmployee = employees.find(emp => emp.Full_Name === responsibleName);
            
            // Преобразование даты из формата DD.MM.YYYY в YYYY-MM-DD для сохранения в базе
            let commissionDate = columns.commissionDate ? row[columns.commissionDate] || '' : '';
            if (commissionDate && commissionDate.includes('.')) {
              const parts = commissionDate.split('.');
              if (parts.length === 3) {
                commissionDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            
            return {
              name: columns.name ? row[columns.name] || '' : '',
              type: columns.type ? row[columns.type] || '' : '',
              manufacturer: columns.manufacturer ? row[columns.manufacturer] || '' : '',
              model: columns.model ? row[columns.model] || '' : '',
              inventoryNumber: columns.inventoryNumber ? row[columns.inventoryNumber] || '' : '',
              commissionDate: commissionDate,
              responsibleEmployeeId: responsibleEmployee ? responsibleEmployee.Employee_ID : null,
              condition: columns.condition ? row[columns.condition] || 'Рабочее' : 'Рабочее',
              location: columns.location ? row[columns.location] || '' : ''
            };
          });
          
          // Фильтрация недействительных записей (отсутствуют обязательные поля)
          const validEquipment = equipmentItems.filter(item => item.name.trim() !== '');
          
          if (validEquipment.length === 0) {
            throw new Error('Действительные данные об оборудовании не найдены. Наименование обязательно.');
          }
          
          // Отправка данных на сервер
          const response = await fetch('/api/equipment/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ equipment: validEquipment })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Импорт не удался');
          }
          
          const result = await response.json();
          
          setImportModalVisible(false);
          message.success(`Успешно импортировано ${result.imported} единиц оборудования`);
          fetchEquipment();
          
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

  // Переход на страницу добавления оборудования
  const goToAddEquipment = () => {
    navigate('/equipment/add');
  };

  // Переход на страницу редактирования оборудования
  const goToEditEquipment = (id) => {
    navigate(`/equipment/edit/${id}`);
  };

      const handleGenerateReport = () => {
  navigate('/equipment/report');
};

  // Обработка удаления оборудования
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }

      message.success('Оборудование успешно удалено!');
      fetchEquipment();
    } catch (err) {
      message.error(`Не удалось удалить оборудование: ${err.message}`);
    }
  };

  // Обработка изменения страницы для пользовательской пагинации
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  // Получение имени сотрудника по ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.Employee_ID === employeeId);
    return employee ? employee.Full_Name : 'Не назначен';
  };

  // Отображение статуса оборудования
  const renderConditionTag = (condition) => {
    let color = 'green';
    if (condition === 'Требует ТО') {
      color = 'blue';
    } else if (condition === 'Неисправно') {
      color = 'red';
    } else if (condition === 'Ремонтируется') {
      color = 'gold';
    }
    
    return (
      <Tag color={color}>
        {condition || 'Рабочее'}
      </Tag>
    );
  };

  // Определение столбцов таблицы
  const columns = [
    {
      title: 'Название',
      dataIndex: 'Name',
      key: 'name',
      sorter: (a, b) => a.Name.localeCompare(b.Name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Поиск по наименованию"
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
      onFilter: (value, record) => record.Name.toLowerCase().includes(value.toLowerCase()),
      render: (text, record) => (
        <div>
          <div className="employee-name">{text}</div>
          {record.Manufacturer && <div className="employee-position">{record.Manufacturer}</div>}
        </div>
      ),
    },
    {
      title: 'Тип/Класс',
      dataIndex: 'Type',
      key: 'type',
      filters: types.map(type => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.Type === value,
    },
    {
      title: 'Модель',
      dataIndex: 'Model',
      key: 'model',
      ellipsis: true,
    },
    {
      title: 'Инв. номер',
      dataIndex: 'Inventory_Number',
      key: 'inventoryNumber',
      ellipsis: true,
    },
    {
      title: 'Ввод в эксплуатацию',
      dataIndex: 'Commission_Date',
      key: 'commissionDate',
      ellipsis: true,
      sorter: (a, b) => new Date(a.Commission_Date) - new Date(b.Commission_Date),
      render: (text) => formatDate(text) // Используем функцию форматирования даты
    },
    {
      title: 'Ответственный',
      dataIndex: 'Responsible_Employee_ID',
      key: 'responsibleEmployee',
      ellipsis: true,
      render: employeeId => getEmployeeName(employeeId),
      filters: employees.map(employee => ({
        text: employee.Full_Name,
        value: employee.Employee_ID,
      })),
      onFilter: (value, record) => record.Responsible_Employee_ID === value,
    },
    {
      title: 'Тех. состояние',
      dataIndex: 'Condition',
      key: 'condition',
      render: renderConditionTag,
      filters: conditions.map(condition => ({
        text: condition,
        value: condition,
      })),
      onFilter: (value, record) => record.Condition === value,
    },
    {
      title: 'Локация',
      dataIndex: 'Location',
      key: 'location',
      ellipsis: true,
      filters: locations.map(location => ({
        text: location,
        value: location,
      })),
      onFilter: (value, record) => record.Location === value,
      render: (text) => text || 'Не указано'
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Редактировать',
                icon: <EditOutlined />,
                onClick: () => goToEditEquipment(record.Equipment_ID)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление оборудования"
                    description="Вы уверены, что хотите удалить это оборудование?"
                    onConfirm={() => handleDelete(record.Equipment_ID)}
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
  const paginatedData = filteredEquipment.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ant-equipment-container">
      {/* Добавление хлебных крошек */}
      <Breadcrumb className="equipment-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Оборудование
        </Breadcrumb.Item>
      </Breadcrumb>
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Левая сторона: кнопки экспорта и импорта */}
            <div className="header-left-content">
            <Title level={2}>Оборудование</Title>
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
            
            {/* Правая сторона: строка поиска, кнопка фильтра и кнопка добавления оборудования */}
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

                              <Button
                                type="primary" 
                                icon={<FileDoneOutlined />}
                                onClick={handleGenerateReport}
                                className="ant-report-button"
                              >
                                Создать отчёт
                              </Button>
              
              {/* Строка поиска */}
              <div className="equipment-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск оборудования"
                  autoFocus={false}
                />
              </div>
              
              {/* Кнопка добавления оборудования */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={goToAddEquipment}
                className="ant-add-button"
              >
                Добавить оборудование
              </Button>
            </div>
          </div>
          
          {showFilters && (
  <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
    <div className="filter-panel-header">
      <h4>Фильтр оборудования</h4>
      <Button 
      className="ant-filreset-button"
      type="link"
      onClick={resetFilters}>Сбросить все фильтры</Button>
    </div>
    
    <Row gutter={[16, 16]}>
      {/* Фильтр по типу/классу */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Тип/Класс</label>
          <Select
            mode="multiple"
            placeholder="Выберите тип"
            value={filterValues.types}
            onChange={(values) => handleFilterChange('types', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {types.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по производителю */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Производитель</label>
          <Select
            mode="multiple"
            placeholder="Выберите производителя"
            value={filterValues.manufacturers}
            onChange={(values) => handleFilterChange('manufacturers', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {manufacturers.map(manufacturer => (
              <Option key={manufacturer} value={manufacturer}>{manufacturer}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по техническому состоянию */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Техническое состояние</label>
          <Select
            mode="multiple"
            placeholder="Выберите состояние"
            value={filterValues.conditions}
            onChange={(values) => handleFilterChange('conditions', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {conditions.map(condition => (
              <Option key={condition} value={condition}>{condition}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по местоположению */}
      <Col xs={24} sm={12} md={6}>
        <div className="filter-group">
          <label>Место нахождения</label>
          <Select
            mode="multiple"
            placeholder="Выберите местоположение"
            value={filterValues.locations}
            onChange={(values) => handleFilterChange('locations', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {locations.map(location => (
              <Option key={location} value={location}>{location}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Фильтр по ответственному сотруднику */}
      <Col xs={24} sm={12} md={12}>
        <div className="filter-group">
          <label>Ответственный за эксплуатацию</label>
          <Select
            mode="multiple"
            placeholder="Выберите ответственного"
            value={filterValues.responsibleEmployees}
            onChange={(values) => handleFilterChange('responsibleEmployees', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {employees.map(employee => (
              <Option key={employee.Employee_ID} value={employee.Employee_ID}>{employee.Full_Name}</Option>
            ))}
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
              rowKey="Equipment_ID"
              pagination={false} // Отключение встроенной пагинации
              scroll={{ x: 'max-content' }}
            />
            
            {/* Компонент пользовательской пагинации */}
            <Pagination
              totalItems={filteredEquipment.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 20, 50]}
              initialPageSize={pageSize}
            />
          </Spin>
        </div>
      </Card>

      {/* Модальное окно импорта */}
      <Modal
        title="Импорт оборудования из Excel"
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
            <li><strong>Наименование</strong> (обязательно)</li>
            <li>Тип/Класс</li>
            <li>Производитель</li>
            <li>Модель</li>
            <li>Инвентарный номер</li>
            <li>Дата ввода в эксплуатацию</li>
            <li>Ответственный за эксплуатацию</li>
            <li>Техническое состояние</li>
            <li>Место нахождения</li>
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

export default Equipment;