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
  HomeOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '../../styles/Tools/Tools.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import moment from 'moment';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const Tool = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [importError, setImportError] = useState('');
  const [employees, setEmployees] = useState([]);
  
  // Состояние для фильтров
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  
  // Значения фильтров
  const [filterValues, setFilterValues] = useState({
    categories: [],
    storageLocations: [],
    responsibleEmployees: []
  });
  
  // Поисковой запрос
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка инструментов и сотрудников при монтировании компонента
  useEffect(() => {
    fetchTools();
    fetchEmployees();
  }, []);

  // Обновление отфильтрованных инструментов при изменении списка или фильтров
  useEffect(() => {
    applyFiltersAndSearch();
  }, [tools, filterValues, searchQuery]);

  // Извлечение уникальных категорий и мест хранения из данных об инструментах
  useEffect(() => {
    if (tools.length > 0) {
      const uniqueCategories = Array.from(
        new Set(tools.map(t => t.Category).filter(Boolean))
      );
      setCategories(uniqueCategories);
      
      const uniqueStorageLocations = Array.from(
        new Set(tools.map(t => t.Storage_Location).filter(Boolean))
      );
      setStorageLocations(uniqueStorageLocations);
    }
  }, [tools]);

  // Загрузка всех инструментов из базы данных
  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tools');
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      setTools(data);
    } catch (err) {
      message.error(`Не удалось загрузить данные об инструментах: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка всех сотрудников для связи с инструментами
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
    let filtered = [...tools];
    
    // Применение поискового запроса
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.Name && item.Name.toLowerCase().includes(query)) ||
          (item.Category && item.Category.toLowerCase().includes(query)) ||
          (item.Storage_Location && item.Storage_Location.toLowerCase().includes(query))
        );
      });
    }
    
    // Применение фильтра категории
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.categories.includes(item.Category)
      );
    }
    
    // Применение фильтра места хранения
    if (filterValues.storageLocations.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.storageLocations.includes(item.Storage_Location)
      );
    }
    
    // Применение фильтра по ответственному
    if (filterValues.responsibleEmployees.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.responsibleEmployees.includes(item.Responsible_Employee_ID)
      );
    }
    
    setFilteredTools(filtered);
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
      categories: [],
      storageLocations: [],
      responsibleEmployees: []
    });
  };

  // Обработка функции поиска
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Экспорт инструментов в Excel
  const exportToExcel = () => {
    try {
      // Создание набора данных для экспорта
      const exportData = tools.map(item => {
        // Найти ответственного сотрудника по ID
        const responsibleEmployee = employees.find(emp => emp.Employee_ID === item.Responsible_Employee_ID);
        const responsibleName = responsibleEmployee ? responsibleEmployee.Full_Name : '';
        
        return {
          'Наименование': item.Name || '',
          'Категория': item.Category || '',
          'Количество': item.Quantity || '',
          'Место хранения': item.Storage_Location || '',
          'Ответственный': responsibleName,
          'Дата последней проверки': item.Last_Check_Date || ''
        };
      });
      
      // Создание рабочего листа из данных
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Установка ширины столбцов
      const wscols = [
        { wch: 25 }, // Наименование
        { wch: 15 }, // Категория
        { wch: 10 }, // Количество
        { wch: 20 }, // Место хранения
        { wch: 30 }, // Ответственный
        { wch: 25 }  // Дата последней проверки
      ];
      worksheet['!cols'] = wscols;
      
      // Создание рабочей книги
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Инструменты');
      
      // Генерация и загрузка файла Excel
      const filename = `Инструменты_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные об инструментах успешно экспортированы!');
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
        'Наименование': 'Дрель аккумуляторная',
        'Категория': 'Электроинструменты',
        'Количество': '2',
        'Место хранения': 'Склад №1',
        'Ответственный': 'Иванов Иван Иванович',
        'Дата последней проверки': '2023-01-15'
      },
      {
        'Наименование': 'Набор гаечных ключей',
        'Категория': 'Ручной инструмент',
        'Количество': '5',
        'Место хранения': 'Инструментальный шкаф №3',
        'Ответственный': 'Петров Петр Петрович',
        'Дата последней проверки': '2022-11-20'
      }
    ];
    
    // Создание рабочего листа
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Установка ширины столбцов
    const wscols = [
      { wch: 25 }, // Наименование
      { wch: 15 }, // Категория
      { wch: 10 }, // Количество
      { wch: 20 }, // Место хранения
      { wch: 30 }, // Ответственный
      { wch: 25 }  // Дата последней проверки
    ];
    worksheet['!cols'] = wscols;
    
    // Создание рабочей книги
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Загрузка
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Инструментов.xlsx');
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
            category: Object.keys(headerRow).find(key => headerRow[key] === 'Категория'),
            quantity: Object.keys(headerRow).find(key => headerRow[key] === 'Количество'),
            storageLocation: Object.keys(headerRow).find(key => headerRow[key] === 'Место хранения'),
            responsible: Object.keys(headerRow).find(key => headerRow[key] === 'Ответственный'),
            lastCheckDate: Object.keys(headerRow).find(key => headerRow[key] === 'Дата последней проверки')
          };
          
          if (!columns.name) {
            throw new Error('В Excel-файле отсутствует столбец Наименование');
          }
          
          // Преобразование строк в наш формат, пропуская строку заголовка
          const toolItems = jsonData.slice(1).map(row => {
            // Получение ответственного сотрудника по имени
            const responsibleName = columns.responsible ? row[columns.responsible] || '' : '';
            const responsibleEmployee = employees.find(emp => emp.Full_Name === responsibleName);
            
            return {
              name: columns.name ? row[columns.name] || '' : '',
              category: columns.category ? row[columns.category] || '' : '',
              quantity: columns.quantity ? row[columns.quantity] || '0' : '0',
              storageLocation: columns.storageLocation ? row[columns.storageLocation] || '' : '',
              responsibleEmployeeId: responsibleEmployee ? responsibleEmployee.Employee_ID : null,
              lastCheckDate: columns.lastCheckDate ? row[columns.lastCheckDate] || '' : ''
            };
          });
          
          // Фильтрация недействительных записей (отсутствуют обязательные поля)
          const validTools = toolItems.filter(item => item.name.trim() !== '');
          
          if (validTools.length === 0) {
            throw new Error('Действительные данные об инструментах не найдены. Наименование обязательно.');
          }
          
          // Отправка данных на сервер
          const response = await fetch('/api/tools/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tools: validTools })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Импорт не удался');
          }
          
          const result = await response.json();
          
          setImportModalVisible(false);
          message.success(`Успешно импортировано ${result.imported} инструментов`);
          fetchTools();
          
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

  // Переход на страницу добавления инструмента
  const goToAddTool = () => {
    navigate('/tools/add');
  };

  // Переход на страницу редактирования инструмента
  const goToEditTool = (id) => {
    navigate(`/tools/edit/${id}`);
  };

  // Обработка удаления инструмента
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }

      message.success('Инструмент успешно удален!');
      fetchTools();
    } catch (err) {
      message.error(`Не удалось удалить инструмент: ${err.message}`);
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

  // Форматирование даты для отображения
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return moment(dateString).format('DD.MM.YYYY');
  };

  // Определение столбцов таблицы
  const columns = [
    {
      title: 'Наименование',
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
    },
{
  title: 'Категория',
  dataIndex: 'Category',
  key: 'category',
  render: v =>
    Array.isArray(v) ? v.join(', ')
  : (v && typeof v === 'object' ? v.value || v.label : v || ''),
},
    {
      title: 'Количество',
      dataIndex: 'Quantity',
      key: 'quantity',
      sorter: (a, b) => a.Quantity - b.Quantity,
    },
    {
      title: 'Место хранения',
      dataIndex: 'Storage_Location',
      key: 'storageLocation',
      filters: storageLocations.map(location => ({
        text: location,
        value: location,
      })),
      onFilter: (value, record) => record.Storage_Location === value,
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
      title: 'Дата последней проверки',
      dataIndex: 'Last_Check_Date',
      key: 'lastCheckDate',
      render: date => formatDate(date),
      sorter: (a, b) => new Date(a.Last_Check_Date) - new Date(b.Last_Check_Date),
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
                onClick: () => goToEditTool(record.Tool_ID)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление инструмента"
                    description="Вы уверены, что хотите удалить этот инструмент?"
                    onConfirm={() => handleDelete(record.Tool_ID)}
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
  const paginatedData = filteredTools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ant-tools-container">
      {/* Добавление хлебных крошек */}
      <Breadcrumb className="tools-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Инструменты
        </Breadcrumb.Item>
      </Breadcrumb>
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Левая сторона: кнопки экспорта и импорта */}
            <div className="header-left-content">
              <Title level={2}>Инструменты</Title>
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
            
            {/* Правая сторона: строка поиска, кнопка фильтра и кнопка добавления инструмента */}
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
              <div className="tools-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск инструментов"
                  autoFocus={false}
                />
              </div>
              
              {/* Кнопка добавления инструмента */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={goToAddTool}
                className="ant-add-button"
              >
                Добавить инструмент
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
              <div className="filter-panel-header">
                <h4>Фильтр инструментов</h4>
                <Button 
                  className="ant-filreset-button"
                  type="link"
                  onClick={resetFilters}>
                  Сбросить все фильтры
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* Фильтр по категориям */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Категория</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите категорию"
                      value={filterValues.categories}
                      onChange={(values) => handleFilterChange('categories', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      {categories.map(category => (
                        <Option key={category} value={category}>{category}</Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                
                {/* Фильтр по местам хранения */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Место хранения</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите место хранения"
                      value={filterValues.storageLocations}
                      onChange={(values) => handleFilterChange('storageLocations', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      {storageLocations.map(location => (
                        <Option key={location} value={location}>{location}</Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                
                {/* Фильтр по ответственному сотруднику */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Ответственный</label>
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
              rowKey="Tool_ID"
              pagination={false} // Отключение встроенной пагинации
              scroll={{ x: 'max-content' }}
            />
            
            {/* Компонент пользовательской пагинации */}
            <Pagination
              totalItems={filteredTools.length}
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
        title="Импорт инструментов из Excel"
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
            <li>Категория</li>
            <li>Количество</li>
            <li>Место хранения</li>
            <li>Ответственный</li>
            <li>Дата последней проверки</li>
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

export default Tool;