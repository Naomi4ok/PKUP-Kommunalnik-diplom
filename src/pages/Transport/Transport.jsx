import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Row, 
  Col, 
  Input, 
  Space, 
  Dropdown, 
  Menu, 
  Empty, 
  Modal, 
  message,
  Spin,
  Breadcrumb,
  Card,
  Divider,
  Select,
  Upload
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ExportOutlined, 
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  FileExcelOutlined,
  ImportOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TransportCard from '../../components/Transport/TransportCard';
import '../../styles/Transport/Transport.css';
import SearchBar from '../../components/SearchBar';
import * as XLSX from 'xlsx';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Transport = () => {
  const navigate = useNavigate();
  const [transportList, setTransportList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    purpose: null,
    condition: null,
    brand: null,
    assignedEmployee: null,
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Для хранения уникальных значений
  const [uniqueEmployees, setUniqueEmployees] = useState([]);
  
  // Для импорта/экспорта
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Load data on component mount
  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        setLoading(true);
        // Use the correct endpoint '/api/transportation' instead of '/api/transport'
        const response = await fetch('/api/transportation');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Process the data to match our component's expected format
        const formattedData = data.map(item => ({
          id: item.Transport_ID,
          brand: item.Brand,
          brandLogo: item.BrandLogo,
          model: item.Model,
          year: item.Year,
          licenseNumber: item.LicenseNumber,
          purpose: item.Purpose,
          fuelType: item.FuelType,
          transmissionType: item.TransmissionType,
          technicalCondition: item.TechnicalCondition,
          lastMaintenance: item.LastMaintenance,
          assignedEmployee: item.AssignedEmployeeName || 'Не назначен',
          imageUrl: item.Image ? `data:image/jpeg;base64,${item.Image}` : null
        }));
        
        setTransportList(formattedData);
        setFilteredList(formattedData);
        setLoading(false);
        
        // Получаем уникальных сотрудников из данных
        const employees = [...new Set(formattedData.map(item => item.assignedEmployee))];
        setUniqueEmployees(employees.filter(emp => emp));
        
      } catch (error) {
        console.error("Error fetching transport data:", error);
        message.error("Не удалось загрузить данные о транспорте");
        setLoading(false);
        
        // Fall back to mock data if API call fails
        const mockData = [
          {
            id: 1,
            brand: 'МАЗ',
            brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/MAZ_logo.svg/200px-MAZ_logo.svg.png',
            model: '5550C5',
            year: 2021,
            licenseNumber: 'А123ВС78',
            purpose: 'Мусоровоз',
            fuelType: 'Дизель',
            transmissionType: 'Механическая',
            technicalCondition: 'Исправен',
            lastMaintenance: '15.03.2025',
            assignedEmployee: 'Иванов Петр',
            imageUrl: 'https://via.placeholder.com/300/0000FF/FFFFFF?text=МАЗ+5550C5'
          },
          {
            id: 2,
            brand: 'Volvo',
            brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Volvo_symbol.svg/200px-Volvo_symbol.svg.png',
            model: 'FM 440',
            year: 2020,
            licenseNumber: 'В456СТ78',
            purpose: 'Грузовик',
            fuelType: 'Дизель',
            transmissionType: 'Автоматическая',
            technicalCondition: 'Требует ТО',
            lastMaintenance: '10.04.2025',
            assignedEmployee: 'Петрова Мария',
            imageUrl: 'https://via.placeholder.com/300/FF0000/FFFFFF?text=Volvo+FM+440'
          },
          {
            id: 3,
            brand: 'МТЗ',
            brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Belarus-MTZ_logo.svg/200px-Belarus-MTZ_logo.svg.png',
            model: 'Беларус-82.1',
            year: 2019,
            licenseNumber: 'Т789УФ78',
            purpose: 'Трактор',
            fuelType: 'Дизель',
            transmissionType: 'Механическая',
            technicalCondition: 'Исправен',
            lastMaintenance: '28.02.2025',
            assignedEmployee: 'Смирнов Алексей',
            imageUrl: 'https://via.placeholder.com/300/00FF00/FFFFFF?text=МТЗ+Беларус-82.1'
          },
          // More mock data items...
        ];
        
        // Получаем уникальных сотрудников из мок-данных
        const employees = [...new Set(mockData.map(item => item.assignedEmployee))];
        setUniqueEmployees(employees.filter(emp => emp));
        
        setTransportList(mockData);
        setFilteredList(mockData);
        setLoading(false);
      }
    };

    fetchTransportData();
  }, []);

  // Filter data when search or filters change
  useEffect(() => {
    let result = [...transportList];
    
    // Apply search filter
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(item => 
        item.brand?.toLowerCase().includes(lowerCaseSearch) || 
        item.model?.toLowerCase().includes(lowerCaseSearch) || 
        item.licenseNumber?.toLowerCase().includes(lowerCaseSearch) ||
        item.assignedEmployee?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Apply purpose filter
    if (filters.purpose) {
      result = result.filter(item => item.purpose === filters.purpose);
    }
    
    // Apply condition filter
    if (filters.condition) {
      result = result.filter(item => item.technicalCondition === filters.condition);
    }
    
    // Apply brand filter
    if (filters.brand) {
      result = result.filter(item => item.brand === filters.brand);
    }
    
    // Apply assigned employee filter
    if (filters.assignedEmployee) {
      result = result.filter(item => item.assignedEmployee === filters.assignedEmployee);
    }
    
    setFilteredList(result);
  }, [transportList, searchText, filters]);

  // Handle search input
  const handleSearch = (value) => {
    setSearchText(value);
  };
  
  // Toggle filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Navigate to add form
  const handleAddTransport = () => {
    navigate('/transport/add');
  };
  
  // Navigate to edit form
  const handleEditTransport = (id) => {
    navigate(`/transport/edit/${id}`);
  };
  
  // Show delete confirmation
  const showDeleteConfirm = (id) => {
    setConfirmDelete(id);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (confirmDelete) {
      try {
        setLoading(true);
        
        // Use the correct endpoint '/api/transportation' instead of '/api/transport'
        const response = await fetch(`/api/transportation/${confirmDelete}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        // Update local state
        const updatedList = transportList.filter(item => item.id !== confirmDelete);
        setTransportList(updatedList);
        message.success("Транспортное средство успешно удалено");
        setConfirmDelete(null);
      } catch (error) {
        console.error("Error deleting transport:", error);
        message.error("Не удалось удалить транспортное средство");
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Get unique values for filters
  const getBrands = () => {
    const brands = [...new Set(transportList.map(item => item.brand))];
    return brands
      .filter(brand => brand) // Remove undefined/null values
      .map(brand => ({ key: brand, label: brand }));
  };
  
  const getPurposes = () => {
    const purposes = [...new Set(transportList.map(item => item.purpose))];
    return purposes
      .filter(purpose => purpose) // Remove undefined/null values
      .map(purpose => ({ key: purpose, label: purpose }));
  };
  
  // Сброс всех фильтров
  const resetFilters = () => {
    setFilters({
      purpose: null,
      condition: null,
      brand: null,
      assignedEmployee: null
    });
  };

  // Экспорт транспорта в Excel
  const exportToExcel = () => {
    try {
      // Создание набора данных для экспорта
      const exportData = transportList.map(item => {
        return {
          'Бренд': item.brand || '',
          'Модель': item.model || '',
          'Год выпуска': item.year || '',
          'Гос. номер': item.licenseNumber || '',
          'Назначение': item.purpose || '',
          'Тип топлива': item.fuelType || '',
          'Тип трансмиссии': item.transmissionType || '',
          'Техническое состояние': item.technicalCondition || '',
          'Последнее ТО': item.lastMaintenance || '',
          'Ответственный': item.assignedEmployee || ''
        };
      });
      
      // Создание рабочего листа из данных
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Установка ширины столбцов
      const wscols = [
        { wch: 15 }, // Бренд
        { wch: 20 }, // Модель
        { wch: 15 }, // Год выпуска
        { wch: 15 }, // Гос. номер
        { wch: 20 }, // Назначение
        { wch: 15 }, // Тип топлива
        { wch: 20 }, // Тип трансмиссии
        { wch: 20 }, // Техническое состояние
        { wch: 15 }, // Последнее ТО
        { wch: 25 }  // Ответственный
      ];
      worksheet['!cols'] = wscols;
      
      // Создание рабочей книги
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Транспорт');
      
      // Генерация и загрузка файла Excel
      const filename = `Транспорт_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные о транспорте успешно экспортированы!');
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
        'Бренд': 'МАЗ',
        'Модель': '5550C5',
        'Год выпуска': '2021',
        'Гос. номер': 'А123ВС78',
        'Назначение': 'Мусоровоз',
        'Тип топлива': 'Дизель',
        'Тип трансмиссии': 'Механическая',
        'Техническое состояние': 'Исправен',
        'Последнее ТО': '15.03.2025',
        'Ответственный': 'Иванов Петр'
      },
      {
        'Бренд': 'Volvo',
        'Модель': 'FM 440',
        'Год выпуска': '2020',
        'Гос. номер': 'В456СТ78',
        'Назначение': 'Грузовик',
        'Тип топлива': 'Дизель',
        'Тип трансмиссии': 'Автоматическая',
        'Техническое состояние': 'Требует ТО',
        'Последнее ТО': '10.04.2025',
        'Ответственный': 'Петрова Мария'
      }
    ];
    
    // Создание рабочего листа
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Установка ширины столбцов
    const wscols = [
      { wch: 15 }, // Бренд
      { wch: 20 }, // Модель
      { wch: 15 }, // Год выпуска
      { wch: 15 }, // Гос. номер
      { wch: 20 }, // Назначение
      { wch: 15 }, // Тип топлива
      { wch: 20 }, // Тип трансмиссии
      { wch: 20 }, // Техническое состояние
      { wch: 15 }, // Последнее ТО
      { wch: 25 }  // Ответственный
    ];
    worksheet['!cols'] = wscols;
    
    // Создание рабочей книги
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Загрузка
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Транспорта.xlsx');
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
            brand: Object.keys(headerRow).find(key => headerRow[key] === 'Бренд'),
            model: Object.keys(headerRow).find(key => headerRow[key] === 'Модель'),
            year: Object.keys(headerRow).find(key => headerRow[key] === 'Год выпуска'),
            licenseNumber: Object.keys(headerRow).find(key => headerRow[key] === 'Гос. номер'),
            purpose: Object.keys(headerRow).find(key => headerRow[key] === 'Назначение'),
            fuelType: Object.keys(headerRow).find(key => headerRow[key] === 'Тип топлива'),
            transmissionType: Object.keys(headerRow).find(key => headerRow[key] === 'Тип трансмиссии'),
            technicalCondition: Object.keys(headerRow).find(key => headerRow[key] === 'Техническое состояние'),
            lastMaintenance: Object.keys(headerRow).find(key => headerRow[key] === 'Последнее ТО'),
            assignedEmployee: Object.keys(headerRow).find(key => headerRow[key] === 'Ответственный')
          };
          
          if (!columns.brand || !columns.model) {
            throw new Error('В Excel-файле отсутствуют обязательные столбцы Бренд и Модель');
          }
          
          // Преобразование строк в наш формат, пропуская строку заголовка
          const transportItems = jsonData.slice(1).map(row => {
            return {
              brand: columns.brand ? row[columns.brand] || '' : '',
              model: columns.model ? row[columns.model] || '' : '',
              year: columns.year ? row[columns.year] || '' : '',
              licenseNumber: columns.licenseNumber ? row[columns.licenseNumber] || '' : '',
              purpose: columns.purpose ? row[columns.purpose] || '' : '',
              fuelType: columns.fuelType ? row[columns.fuelType] || '' : '',
              transmissionType: columns.transmissionType ? row[columns.transmissionType] || '' : '',
              technicalCondition: columns.technicalCondition ? row[columns.technicalCondition] || 'Исправен' : 'Исправен',
              lastMaintenance: columns.lastMaintenance ? row[columns.lastMaintenance] || '' : '',
              assignedEmployee: columns.assignedEmployee ? row[columns.assignedEmployee] || '' : ''
            };
          });
          
          // Фильтрация недействительных записей (отсутствуют обязательные поля)
          const validTransport = transportItems.filter(item => item.brand.trim() !== '' && item.model.trim() !== '');
          
          if (validTransport.length === 0) {
            throw new Error('Действительные данные о транспорте не найдены. Бренд и Модель обязательны.');
          }
          
          // Отправка данных на сервер
          const response = await fetch('/api/transportation/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transportation: validTransport })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Импорт не удался');
          }
          
          const result = await response.json();
          
          setImportModalVisible(false);
          message.success(`Успешно импортировано ${result.imported} единиц транспорта`);
          
          // Обновление списка транспорта
          const fetchTransportData = async () => {
            try {
              setLoading(true);
              const response = await fetch('/api/transportation');
              
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              
              const data = await response.json();
              
              const formattedData = data.map(item => ({
                id: item.Transport_ID,
                brand: item.Brand,
                brandLogo: item.BrandLogo,
                model: item.Model,
                year: item.Year,
                licenseNumber: item.LicenseNumber,
                purpose: item.Purpose,
                fuelType: item.FuelType,
                transmissionType: item.TransmissionType,
                technicalCondition: item.TechnicalCondition,
                lastMaintenance: item.LastMaintenance,
                assignedEmployee: item.AssignedEmployeeName || 'Не назначен',
                imageUrl: item.Image ? `data:image/jpeg;base64,${item.Image}` : null
              }));
              
              setTransportList(formattedData);
            } catch (error) {
              console.error("Error fetching transport data:", error);
              message.error("Не удалось обновить данные о транспорте");
            } finally {
              setLoading(false);
            }
          };
          
          fetchTransportData();
          
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

  return (
    <div className="ant-transport-container">
      {/* Путь к странице */}
      <Breadcrumb className="transport-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Транспорт</Breadcrumb.Item>
      </Breadcrumb>
      
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Левая сторона: заголовок и кнопки экспорта */}
            <div className="header-left-content">
              <Title level={2}>Транспорт</Title>
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
            
            {/* Правая сторона: строка поиска, кнопки фильтра и добавления */}
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
              <div className="transport-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск транспорта"
                  autoFocus={false}
                />
              </div>
              
              {/* Кнопка добавления транспорта */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddTransport}
                className="ant-add-button"
              >
                Добавить транспорт
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
              <div className="filter-panel-header">
                <h4>Фильтр транспорта</h4>
                <Button 
                  className="ant-filreset-button"
                  type="link"
                  onClick={resetFilters}>
                    Сбросить все фильтры
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* Фильтр по назначению */}
                <Col xs={24} sm={12} md={6}>
                  <div className="filter-group">
                    <label>Назначение</label>
                    <Select
                      placeholder="Выберите типы"
                      value={filters.purpose}
                      onChange={(value) => setFilters({...filters, purpose: value})}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {getPurposes().map(purpose => (
                        <Option key={purpose.key} value={purpose.key}>{purpose.label}</Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                
                {/* Фильтр по состоянию */}
                <Col xs={24} sm={12} md={6}>
                  <div className="filter-group">
                    <label>Состояние</label>
                    <Select
                      placeholder="Выберите состояние"
                      value={filters.condition}
                      onChange={(value) => setFilters({...filters, condition: value})}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      <Option value="Исправен">Исправен</Option>
                      <Option value="Требует ТО">Требует ТО</Option>
                      <Option value="Ремонтируется">Ремонтируется</Option>
                      <Option value="Неисправен">Неисправен</Option>
                    </Select>
                  </div>
                </Col>
                
                {/* Фильтр по бренду */}
                <Col xs={24} sm={12} md={6}>
                  <div className="filter-group">
                    <label>Бренд</label>
                    <Select
                      placeholder="Выберите бренд"
                      value={filters.brand}
                      onChange={(value) => setFilters({...filters, brand: value})}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {getBrands().map(brand => (
                        <Option key={brand.key} value={brand.key}>{brand.label}</Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                
                {/* Фильтр по ответственному за транспорт */}
                <Col xs={24} sm={12} md={6}>
                  <div className="filter-group">
                    <label>Ответственный</label>
                    <Select
                      placeholder="Выберите сотрудника"
                      value={filters.assignedEmployee}
                      onChange={(value) => setFilters({...filters, assignedEmployee: value})}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {uniqueEmployees.map(employee => (
                        <Option key={employee} value={employee}>{employee}</Option>
                      ))}
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>
          )}
          
          <Divider />
          
          <div className="transport-content">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="Загрузка данных..." />
              </div>
            ) : filteredList.length > 0 ? (
              <Row gutter={[16, 16]}>
                {filteredList.map((item) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                    <TransportCard 
                      data={item}
                      onEdit={() => handleEditTransport(item.id)}
                      onDelete={() => showDeleteConfirm(item.id)}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="Транспортные средства не найдены" />
            )}
          </div>
        </div>
      </Card>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        title="Подтверждение удаления"
        open={confirmDelete !== null}
        onOk={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        okText="Да, удалить"
        cancelText="Отмена"
      >
        <p>Вы уверены, что хотите удалить это транспортное средство? Это действие нельзя отменить.</p>
      </Modal>
      
      {/* Модальное окно импорта */}
      <Modal
        title="Импорт транспорта из Excel"
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
            <li><strong>Бренд</strong> (обязательно)</li>
            <li><strong>Модель</strong> (обязательно)</li>
            <li>Год выпуска</li>
            <li>Гос. номер</li>
            <li>Назначение</li>
            <li>Тип топлива</li>
            <li>Тип трансмиссии</li>
            <li>Техническое состояние</li>
            <li>Последнее ТО</li>
            <li>Ответственный</li>
            <li>Описание</li>
            <li>Дата регистрации</li>
            <li>Следующее ТО</li>
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

export default Transport;