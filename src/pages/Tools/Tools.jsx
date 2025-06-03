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
import '../../styles/Tools/Tools.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Tools = () => {
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
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Filter values
  const [filterValues, setFilterValues] = useState({
    categories: [],
    locations: [],
    responsibleEmployees: []
  });
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tools and employees on component mount
  useEffect(() => {
    fetchTools();
    fetchEmployees();
  }, []);

  // Update filtered tools when tools list or filters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [tools, filterValues, searchQuery]);

  // Extract unique categories and locations from tools data
  useEffect(() => {
    if (tools.length > 0) {
      const uniqueCategories = Array.from(
        new Set(tools.map(t => t.Category).filter(Boolean))
      );
      setCategories(uniqueCategories);
      
      const uniqueLocations = Array.from(
        new Set(tools.map(t => t.Location).filter(Boolean))
      );
      setLocations(uniqueLocations);
    }
  }, [tools]);

  // Fetch all tools from database
  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tools');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTools(data);
      setFilteredTools(data);
    } catch (err) {
      message.error(`Failed to load tools data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all employees for tool assignment
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      message.error(`Failed to load employees data: ${err.message}`);
    }
  };

  // Apply filters and search
  const applyFiltersAndSearch = () => {
    let filtered = [...tools];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.Name && item.Name.toLowerCase().includes(query)) ||
          (item.Category && item.Category.toLowerCase().includes(query)) ||
          (item.Location && item.Location.toLowerCase().includes(query))
        );
      });
    }
    
    // Apply category filter
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.categories.includes(item.Category)
      );
    }
    
    // Apply location filter
    if (filterValues.locations.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.locations.includes(item.Location)
      );
    }
    
    // Apply responsible employee filter
    if (filterValues.responsibleEmployees.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.responsibleEmployees.includes(item.Responsible_Employee_ID)
      );
    }
    
    setFilteredTools(filtered);
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterValues({
      categories: [],
      locations: [],
      responsibleEmployees: []
    });
  };

  // Handle search function
  const handleSearch = (query) => {
    setSearchQuery(query);
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

  // Export tools to Excel
  const exportToExcel = () => {
    try {
      // Create dataset for export
      const exportData = tools.map(item => {
        // Find responsible employee by ID
        const responsibleEmployee = employees.find(emp => emp.Employee_ID === item.Responsible_Employee_ID);
        const responsibleName = responsibleEmployee ? responsibleEmployee.Full_Name : '';
        
        return {
          'Наименование': item.Name || '',
          'Категория': item.Category || '',
          'Количество': item.Quantity || 0,
          'Место хранения': item.Location || '',
          'Ответственный': responsibleName,
          'Дата последней проверки': formatDate(item.Last_Check_Date) || ''
        };
      });
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 25 }, // Наименование
        { wch: 20 }, // Категория
        { wch: 15 }, // Количество
        { wch: 20 }, // Место хранения
        { wch: 25 }, // Ответственный
        { wch: 25 }  // Дата последней проверки
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Инструменты');
      
      // Generate and download Excel file
      const filename = `Инструменты_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные об инструментах успешно экспортированы!');
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

  // Create template for download
  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        'Наименование': 'Перфоратор Bosch',
        'Категория': 'Электроинструмент',
        'Количество': 3,
        'Место хранения': 'Склад 1',
        'Ответственный': 'Иванов Иван',
        'Дата последней проверки': '15.03.2024'
      },
      {
        'Наименование': 'Набор отверток',
        'Категория': 'Ручной инструмент',
        'Количество': 5,
        'Место хранения': 'Склад 2',
        'Ответственный': 'Петров Петр',
        'Дата последней проверки': '10.02.2024'
      }
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Наименование
      { wch: 20 }, // Категория
      { wch: 15 }, // Количество
      { wch: 20 }, // Место хранения
      { wch: 25 }, // Ответственный
      { wch: 25 }  // Дата последней проверки
    ];
    worksheet['!cols'] = wscols;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Download
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Инструментов.xlsx');
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
            name: Object.keys(headerRow).find(key => headerRow[key] === 'Наименование'),
            category: Object.keys(headerRow).find(key => headerRow[key] === 'Категория'),
            quantity: Object.keys(headerRow).find(key => headerRow[key] === 'Количество'),
            location: Object.keys(headerRow).find(key => headerRow[key] === 'Место хранения'),
            responsible: Object.keys(headerRow).find(key => headerRow[key] === 'Ответственный'),
            lastCheckDate: Object.keys(headerRow).find(key => headerRow[key] === 'Дата последней проверки')
          };
          
          if (!columns.name) {
            throw new Error('В Excel-файле отсутствует столбец Наименование');
          }
          
          // Transform rows to our format, skipping header row
          const toolItems = jsonData.slice(1).map(row => {
            // Get responsible employee by name
            const responsibleName = columns.responsible ? row[columns.responsible] || '' : '';
            const responsibleEmployee = employees.find(emp => emp.Full_Name === responsibleName);
            
            // Обработка даты из формата DD.MM.YYYY в YYYY-MM-DD
            let lastCheckDate = '';
            if (columns.lastCheckDate && row[columns.lastCheckDate]) {
              const dateParts = row[columns.lastCheckDate].split('.');
              if (dateParts.length === 3) {
                lastCheckDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
              } else {
                lastCheckDate = row[columns.lastCheckDate]; // Оставить как есть, если формат неизвестен
              }
            }
            
            return {
              name: columns.name ? row[columns.name] || '' : '',
              category: columns.category ? row[columns.category] || '' : '',
              quantity: columns.quantity ? Number(row[columns.quantity]) || 0 : 0,
              location: columns.location ? row[columns.location] || '' : '',
              responsibleEmployeeId: responsibleEmployee ? responsibleEmployee.Employee_ID : null,
              lastCheckDate: lastCheckDate
            };
          });
          
          // Filter invalid records (missing required fields)
          const validTools = toolItems.filter(item => item.name.trim() !== '');
          
          if (validTools.length === 0) {
            throw new Error('Действительные данные об инструментах не найдены. Наименование обязательно.');
          }
          
          // Send data to server
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

  // Navigate to add tool page
  const goToAddTool = () => {
    navigate('/tools/add');
  };

  // Navigate to edit tool page
  const goToEditTool = (id) => {
    navigate(`/tools/edit/${id}`);
  };

      const handleGenerateReport = () => {
  navigate('/tools/report');
};


  // Handle tool deletion
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      message.success('Инструмент успешно удален!');
      fetchTools();
    } catch (err) {
      message.error(`Не удалось удалить инструмент: ${err.message}`);
    }
  };

  // Handle page change for custom pagination
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.Employee_ID === employeeId);
    return employee ? employee.Full_Name : 'Не назначен';
  };

  // Define table columns
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
      render: (text, record) => (
        <div>
          <div className="tool-name">{text}</div>
          {record.Category && <div className="tool-category">{record.Category}</div>}
        </div>
      ),
    },
    {
      title: 'Количество',
      dataIndex: 'Quantity',
      key: 'quantity',
      sorter: (a, b) => a.Quantity - b.Quantity,
      render: (quantity) => (
        <Tag color={quantity > 0 ? 'green' : 'red'}>
          {quantity}
        </Tag>
      )
    },
    {
      title: 'Место хранения',
      dataIndex: 'Location',
      key: 'location',
      ellipsis: true,
      filters: locations.map(location => ({
        text: location,
        value: location,
      })),
      onFilter: (value, record) => record.Location === value,
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
      ellipsis: true,
      sorter: (a, b) => new Date(a.Last_Check_Date) - new Date(b.Last_Check_Date),
      render: (date) => formatDate(date) // Форматирование даты в формат DD.MM.YYYY
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
  
  // Calculate data for display on current page
  const paginatedData = filteredTools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ant-tools-container">
      {/* Add breadcrumbs */}
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
            {/* Left side: export and import buttons */}
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
            
            {/* Right side: search bar, filter button and add tool button */}
            <div className="header-right-content">

              {/* Filter button */}
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

              {/* Search bar */}
              <div className="tools-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск инструментов"
                  autoFocus={false}
                />
              </div>
              
              {/* Add tool button */}
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
      onClick={resetFilters}>Сбросить все фильтры</Button>
    </div>
    
    <Row gutter={[16, 16]}>
      {/* Category filter */}
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
      
      {/* Location filter */}
      <Col xs={24} sm={12} md={8}>
        <div className="filter-group">
          <label>Место хранения</label>
          <Select
            mode="multiple"
            placeholder="Выберите место хранения"
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
      
      {/* Responsible employee filter */}
      <Col xs={24} sm={12} md={8}>
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
            {/* Table without built-in pagination */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="Tool_ID"
              pagination={false} // Disable built-in pagination
              scroll={{ x: 'max-content' }}
            />
            
            {/* Custom pagination component */}
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

      {/* Import modal */}
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
            <li>Дата последней проверки (формат DD.MM.YYYY)</li>
          </ul>
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

export default Tools;