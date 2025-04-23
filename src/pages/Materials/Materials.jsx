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
  AppstoreOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '../../styles/Materials/Materials.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Materials = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [importError, setImportError] = useState('');
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [statuses, setStatuses] = useState(['В наличии', 'Заканчивается', 'Нет в наличии', 'Заказано']);
  
  // Filter values
  const [filterValues, setFilterValues] = useState({
    locations: [],
    suppliers: [],
    statuses: []
  });
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Update filtered materials when materials list or filters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [materials, filterValues, searchQuery]);

  // Extract unique locations and suppliers from materials data
  useEffect(() => {
    if (materials.length > 0) {
      const uniqueLocations = Array.from(
        new Set(materials.map(m => m.Location).filter(Boolean))
      );
      setLocations(uniqueLocations);
      
      const uniqueSuppliers = Array.from(
        new Set(materials.map(m => m.Supplier).filter(Boolean))
      );
      setSuppliers(uniqueSuppliers);
    }
  }, [materials]);

  // Fetch all materials from database
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materials');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setMaterials(data);
      setFilteredMaterials(data);
    } catch (err) {
      message.error(`Failed to load materials data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  const applyFiltersAndSearch = () => {
    let filtered = [...materials];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.Name && item.Name.toLowerCase().includes(query)) ||
          (item.Location && item.Location.toLowerCase().includes(query)) ||
          (item.Supplier && item.Supplier.toLowerCase().includes(query))
        );
      });
    }
    
    // Apply location filter
    if (filterValues.locations.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.locations.includes(item.Location)
      );
    }
    
    // Apply supplier filter
    if (filterValues.suppliers.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.suppliers.includes(item.Supplier)
      );
    }
    
    // Apply status filter
    if (filterValues.statuses.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.statuses.includes(item.Status)
      );
    }
    
    setFilteredMaterials(filtered);
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
      locations: [],
      suppliers: [],
      statuses: []
    });
  };

  // Handle search function
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Render status tag with appropriate color
  const renderStatusTag = (status) => {
    let color;
    switch (status) {
      case 'В наличии':
        color = 'green';
        break;
      case 'Заканчивается':
        color = 'gold';
        break;
      case 'Нет в наличии':
        color = 'red';
        break;
      case 'Заказано':
        color = 'blue';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Tag color={color}>
        {status || 'Не указан'}
      </Tag>
    );
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-BY', {
      style: 'currency',
      currency: 'BYN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Export materials to Excel
  const exportToExcel = () => {
    try {
      // Create dataset for export
      const exportData = materials.map(item => {
        return {
          'Наименование': item.Name || '',
          'Количество': item.Quantity || 0,
          'Стоимость за единицу': item.Unit_Cost || 0,
          'Общая стоимость': item.Total_Cost || 0,
          'Дата последнего пополнения': item.Last_Replenishment_Date || '',
          'Место хранения': item.Location || '',
          'Поставщик': item.Supplier || '',
          'Статус': item.Status || ''
        };
      });
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 30 }, // Наименование
        { wch: 15 }, // Количество
        { wch: 20 }, // Стоимость за единицу
        { wch: 20 }, // Общая стоимость
        { wch: 25 }, // Дата последнего пополнения
        { wch: 20 }, // Место хранения
        { wch: 25 }, // Поставщик
        { wch: 15 }  // Статус
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Материалы');
      
      // Generate and download Excel file
      const filename = `Материалы_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные о материалах успешно экспортированы!');
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
        'Наименование': 'Песок строительный',
        'Количество': 1000,
        'Стоимость за единицу': 25,
        'Общая стоимость': 25000,
        'Дата последнего пополнения': '2025-04-01',
        'Место хранения': 'Склад 1',
        'Поставщик': 'СтройМаркет',
        'Статус': 'В наличии'
      },
      {
        'Наименование': 'Цемент М500',
        'Количество': 200,
        'Стоимость за единицу': 15,
        'Общая стоимость': 3000,
        'Дата последнего пополнения': '2025-03-15',
        'Место хранения': 'Склад 2',
        'Поставщик': 'БелСтрой',
        'Статус': 'Заканчивается'
      }
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    const wscols = [
      { wch: 30 }, // Наименование
      { wch: 15 }, // Количество
      { wch: 20 }, // Стоимость за единицу
      { wch: 20 }, // Общая стоимость
      { wch: 25 }, // Дата последнего пополнения
      { wch: 20 }, // Место хранения
      { wch: 25 }, // Поставщик
      { wch: 15 }  // Статус
    ];
    worksheet['!cols'] = wscols;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Download
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Материалов.xlsx');
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
            quantity: Object.keys(headerRow).find(key => headerRow[key] === 'Количество'),
            unitCost: Object.keys(headerRow).find(key => headerRow[key] === 'Стоимость за единицу'),
            totalCost: Object.keys(headerRow).find(key => headerRow[key] === 'Общая стоимость'),
            lastReplenishmentDate: Object.keys(headerRow).find(key => headerRow[key] === 'Дата последнего пополнения'),
            location: Object.keys(headerRow).find(key => headerRow[key] === 'Место хранения'),
            supplier: Object.keys(headerRow).find(key => headerRow[key] === 'Поставщик'),
            status: Object.keys(headerRow).find(key => headerRow[key] === 'Статус')
          };
          
          if (!columns.name) {
            throw new Error('В Excel-файле отсутствует столбец Наименование');
          }
          
          // Transform rows to our format, skipping header row
          const materialItems = jsonData.slice(1).map(row => {
            const quantity = columns.quantity ? Number(row[columns.quantity]) || 0 : 0;
            const unitCost = columns.unitCost ? Number(row[columns.unitCost]) || 0 : 0;
            
            // Calculate total cost from quantity and unit cost if not provided
            let totalCost = columns.totalCost ? Number(row[columns.totalCost]) || 0 : 0;
            if (totalCost === 0 && quantity > 0 && unitCost > 0) {
              totalCost = quantity * unitCost;
            }
            
            return {
              name: columns.name ? row[columns.name] || '' : '',
              quantity: quantity,
              unitCost: unitCost,
              totalCost: totalCost,
              lastReplenishmentDate: columns.lastReplenishmentDate ? row[columns.lastReplenishmentDate] || '' : '',
              location: columns.location ? row[columns.location] || '' : '',
              supplier: columns.supplier ? row[columns.supplier] || '' : '',
              status: columns.status ? row[columns.status] || 'В наличии' : 'В наличии'
            };
          });
          
          // Filter invalid records (missing required fields)
          const validMaterials = materialItems.filter(item => item.name.trim() !== '');
          
          if (validMaterials.length === 0) {
            throw new Error('Действительные данные о материалах не найдены. Наименование обязательно.');
          }
          
          // Send data to server
          const response = await fetch('/api/materials/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ materials: validMaterials })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Импорт не удался');
          }
          
          const result = await response.json();
          
          setImportModalVisible(false);
          message.success(`Успешно импортировано ${result.imported} материалов`);
          fetchMaterials();
          
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

  // Navigate to add material page
  const goToAddMaterial = () => {
    navigate('/materials/add');
  };

  // Navigate to edit material page
  const goToEditMaterial = (id) => {
    navigate(`/materials/edit/${id}`);
  };

  // Handle material deletion
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      message.success('Материал успешно удален!');
      fetchMaterials();
    } catch (err) {
      message.error(`Не удалось удалить материал: ${err.message}`);
    }
  };

  // Handle page change for custom pagination
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
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
          <div className="material-name">{text}</div>
          {record.Supplier && <div className="material-supplier">{record.Supplier}</div>}
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
      title: 'Стоимость за единицу',
      dataIndex: 'Unit_Cost',
      key: 'unitCost',
      sorter: (a, b) => a.Unit_Cost - b.Unit_Cost,
      render: (unitCost) => formatCurrency(unitCost)
    },
    {
      title: 'Общая стоимость',
      dataIndex: 'Total_Cost',
      key: 'totalCost',
      sorter: (a, b) => a.Total_Cost - b.Total_Cost,
      render: (totalCost) => formatCurrency(totalCost)
    },
    {
      title: 'Дата пополнения',
      dataIndex: 'Last_Replenishment_Date',
      key: 'lastReplenishmentDate',
      ellipsis: true,
      sorter: (a, b) => new Date(a.Last_Replenishment_Date) - new Date(b.Last_Replenishment_Date),
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
      title: 'Поставщик',
      dataIndex: 'Supplier',
      key: 'supplier',
      ellipsis: true,
      filters: suppliers.map(supplier => ({
        text: supplier,
        value: supplier,
      })),
      onFilter: (value, record) => record.Supplier === value,
    },
    {
      title: 'Статус',
      dataIndex: 'Status',
      key: 'status',
      render: renderStatusTag,
      filters: statuses.map(status => ({
        text: status,
        value: status,
      })),
      onFilter: (value, record) => record.Status === value,
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
                onClick: () => goToEditMaterial(record.Material_ID)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление материала"
                    description="Вы уверены, что хотите удалить этот материал?"
                    onConfirm={() => handleDelete(record.Material_ID)}
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
  const paginatedData = filteredMaterials.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ant-materials-container">
      {/* Add breadcrumbs */}
      <Breadcrumb className="materials-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Материалы
        </Breadcrumb.Item>
      </Breadcrumb>
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Left side: export and import buttons */}
            <div className="header-left-content">
            <Title level={2}>Материалы</Title>
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
            
            {/* Right side: search bar, filter button and add material button */}
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
              
              {/* Search bar */}
              <div className="materials-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск материалов"
                  autoFocus={false}
                />
              </div>
              
              {/* Add material button */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={goToAddMaterial}
                className="ant-add-button"
              >
                Добавить материал
              </Button>
            </div>
          </div>
          
          {showFilters && (
  <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
    <div className="filter-panel-header">
      <h4>Фильтр материалов</h4>
      <Button 
      className="ant-filreset-button"
      type="link"
      onClick={resetFilters}>Сбросить все фильтры</Button>
    </div>
    
    <Row gutter={[16, 16]}>
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
      
      {/* Supplier filter */}
      <Col xs={24} sm={12} md={8}>
        <div className="filter-group">
          <label>Поставщик</label>
          <Select
            mode="multiple"
            placeholder="Выберите поставщика"
            value={filterValues.suppliers}
            onChange={(values) => handleFilterChange('suppliers', values)}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {suppliers.map(supplier => (
              <Option key={supplier} value={supplier}>{supplier}</Option>
            ))}
          </Select>
        </div>
      </Col>
      
      {/* Status filter */}
      <Col xs={24} sm={12} md={8}>
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
    </Row>
  </div>
)}
          
          <Divider />
          
          <Spin spinning={loading}>
            {/* Table without built-in pagination */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="Material_ID"
              pagination={false} // Disable built-in pagination
              scroll={{ x: 'max-content' }}
            />
            
            {/* Custom pagination component */}
            <Pagination
              totalItems={filteredMaterials.length}
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
        title="Импорт материалов из Excel"
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
            <li>Количество</li>
            <li>Стоимость за единицу</li>
            <li>Общая стоимость</li>
            <li>Дата последнего пополнения</li>
            <li>Место хранения</li>
            <li>Поставщик</li>
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

export default Materials;