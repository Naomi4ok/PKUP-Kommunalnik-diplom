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
  Tag,
  Breadcrumb,
  DatePicker,
  Select,
  Input,
  Row,
  Col,
  Form,
  Statistic,
  Spin,
  Divider,
  Dropdown
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  DollarOutlined,
  FilterOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ImportOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import '../../styles/Expenses/Expenses.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Expenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resourceOptions, setResourceOptions] = useState({
    employees: [],
    equipment: [],
    transportation: [],
    tools: [],
    spares: [],
    materials: []
  });
  const [summaryData, setSummaryData] = useState({
    total: 0,
    byType: [],
    byCategory: [],
    currentMonth: 0
  });
  const [filterValues, setFilterValues] = useState({
    dateRange: [moment().startOf('month'), moment()],
    resourceTypes: [],
    resourceIds: [],
    categories: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [resourceTypes, setResourceTypes] = useState([
    'Employee',
    'Equipment',
    'Transportation',
    'Tool',
    'Spare',
    'Material'
  ]);
  
  // Fetch all required data on component mount
  useEffect(() => {
    fetchExpenses();
    fetchExpenseCategories();
    fetchResourceOptions();
  }, []);
  
  // Update filtered expenses when expenses, filters or search query change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [expenses, filterValues, searchQuery]);
  
  // Fetch expenses with filters applied
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/expenses');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setExpenses(data);
      
      // Fetch summary data too
      fetchSummaryData();
    } catch (err) {
      message.error(`Failed to load expenses data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    try {
      const response = await fetch('/api/expenses/categories/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data.map(c => c.Name));
    } catch (err) {
      message.error(`Failed to load expense categories: ${err.message}`);
    }
  };
  
  // Fetch all resource options for the filters
  const fetchResourceOptions = async () => {
    try {
      // Fetch all resource types in parallel
      const [employees, equipment, transportation, tools, spares, materials] = await Promise.all([
        fetch('/api/employees').then(res => res.json()),
        fetch('/api/equipment').then(res => res.json()),
        fetch('/api/transportation').then(res => res.json()),
        fetch('/api/tools').then(res => res.json()),
        fetch('/api/spares').then(res => res.json()),
        fetch('/api/materials').then(res => res.json())
      ]);
      
      setResourceOptions({
        employees,
        equipment,
        transportation,
        tools,
        spares,
        materials
      });
    } catch (err) {
      message.error(`Failed to load resource options: ${err.message}`);
    }
  };
  
  // Fetch summary data for statistics
  const fetchSummaryData = async () => {
    try {
      // Construct query params for date range
      const params = new URLSearchParams();
      if (filterValues.dateRange && filterValues.dateRange[0]) {
        params.append('startDate', filterValues.dateRange[0].format('YYYY-MM-DD'));
      }
      if (filterValues.dateRange && filterValues.dateRange[1]) {
        params.append('endDate', filterValues.dateRange[1].format('YYYY-MM-DD'));
      }
      
      // Fetch current month data
      const currentMonthParams = new URLSearchParams();
      currentMonthParams.append('startDate', moment().startOf('month').format('YYYY-MM-DD'));
      currentMonthParams.append('endDate', moment().format('YYYY-MM-DD'));
      
      // Fetch summary data in parallel
      const [totalResponse, byTypeResponse, byCategoryResponse, currentMonthResponse] = await Promise.all([
        fetch(`/api/expenses/summary/total?${params.toString()}`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=resource_type`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=category`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${currentMonthParams.toString()}`).then(res => res.json())
      ]);
      
      setSummaryData({
        total: totalResponse[0]?.Total || 0,
        byType: byTypeResponse || [],
        byCategory: byCategoryResponse || [],
        currentMonth: currentMonthResponse[0]?.Total || 0
      });
    } catch (err) {
      message.error(`Failed to load summary data: ${err.message}`);
    }
  };

  // Applying filters and search to the expenses
  const applyFiltersAndSearch = () => {
    let filtered = [...expenses];
    
    // Apply date range filter
    if (filterValues.dateRange && filterValues.dateRange[0] && filterValues.dateRange[1]) {
      const startDate = filterValues.dateRange[0].startOf('day');
      const endDate = filterValues.dateRange[1].endOf('day');
      
      filtered = filtered.filter(expense => {
        const expenseDate = moment(expense.Date);
        return expenseDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Apply resource type filter
    if (filterValues.resourceTypes.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.resourceTypes.includes(expense.Resource_Type)
      );
    }
    
    // Apply resource ID filter
    if (filterValues.resourceIds.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.resourceIds.includes(expense.Resource_ID)
      );
    }
    
    // Apply category filter
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.categories.includes(expense.Category)
      );
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense => {
        const resourceName = getResourceName(expense.Resource_Type, expense.Resource_ID).toLowerCase();
        
        return (
          (expense.Category && expense.Category.toLowerCase().includes(query)) ||
          resourceName.includes(query) ||
          (expense.Description && expense.Description.toLowerCase().includes(query)) ||
          (expense.Invoice_Number && expense.Invoice_Number.toLowerCase().includes(query))
        );
      });
    }
    
    setFilteredExpenses(filtered);
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };
  
  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterValues({
      dateRange: [moment().startOf('month'), moment()],
      resourceTypes: [],
      resourceIds: [],
      categories: []
    });
  };
  
  // Handle search query change
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Add new expense button handler
  const handleAddExpense = () => {
    navigate('/expenses/new');
  };
  
  // Edit expense handler
  const goToEditExpense = (id) => {
    navigate(`/expenses/edit/${id}`);
  };
  
  // Delete expense handler
  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      message.success('Расход успешно удален!');
      fetchExpenses();
    } catch (err) {
      message.error(`Не удалось удалить расход: ${err.message}`);
    }
  };
  
  // Page change handler for pagination
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };
  
  // Export expenses to Excel
  const exportToExcel = () => {
    message.success('Экспорт расходов в Excel');
    // Implement excel export functionality here
  };
  
  // Show import modal
  const showImportModal = () => {
    message.info('Функция импорта находится в разработке');
    // Implement import modal here
  };

  // Get resource name by type and id
  const getResourceName = (type, id) => {
    if (!id) return '-';
    
    switch(type) {
      case 'Employee':
        return resourceOptions.employees.find(e => e.Employee_ID === id)?.Full_Name || `ID: ${id}`;
      case 'Equipment':
        return resourceOptions.equipment.find(e => e.Equipment_ID === id)?.Name || `ID: ${id}`;
      case 'Transportation':
        return resourceOptions.transportation.find(t => t.Transport_ID === id)?.Brand + ' ' + 
               resourceOptions.transportation.find(t => t.Transport_ID === id)?.Model || `ID: ${id}`;
      case 'Tool':
        return resourceOptions.tools.find(t => t.Tool_ID === id)?.Name || `ID: ${id}`;
      case 'Spare':
        return resourceOptions.spares.find(s => s.Spare_ID === id)?.Name || `ID: ${id}`;
      case 'Material':
        return resourceOptions.materials.find(m => m.Material_ID === id)?.Name || `ID: ${id}`;
      default:
        return `${type} ID: ${id}`;
    }
  };

  // Get resource type display name
  const getResourceTypeDisplayName = (type) => {
    const typeMap = {
      'Employee': 'Сотрудник',
      'Equipment': 'Оборудование',
      'Transportation': 'Транспорт',
      'Tool': 'Инструмент',
      'Spare': 'Запчасть',
      'Material': 'Материал'
    };
    return typeMap[type] || type;
  };
  
  // Define table columns
  const columns = [
    {
      title: 'Дата',
      dataIndex: 'Date',
      key: 'date',
      render: text => moment(text).format('DD.MM.YYYY'),
      sorter: (a, b) => moment(a.Date).unix() - moment(b.Date).unix(),
    },
    {
      title: 'Тип ресурса',
      dataIndex: 'Resource_Type',
      key: 'resourceType',
      render: text => getResourceTypeDisplayName(text)
    },
    {
      title: 'Ресурс',
      key: 'resource',
      render: record => getResourceName(record.Resource_Type, record.Resource_ID)
    },
    {
      title: 'Категория',
      dataIndex: 'Category',
      key: 'category'
    },
    {
      title: 'Сумма (₽)',
      dataIndex: 'Amount',
      key: 'amount',
      render: amount => <Text strong>{Number(amount).toLocaleString('ru-RU')}</Text>,
      sorter: (a, b) => a.Amount - b.Amount,
    },
    {
      title: 'Описание',
      dataIndex: 'Description',
      key: 'description',
      ellipsis: true
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
                onClick: () => goToEditExpense(record.Expense_ID)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление расхода"
                    description="Вы уверены, что хотите удалить этот расход?"
                    onConfirm={() => handleDeleteExpense(record.Expense_ID)}
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

  // Get paginated data
  const paginatedData = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  return (
    <div className="expenses-page">
      {/* Breadcrumbs */}
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Расходы
        </Breadcrumb.Item>
      </Breadcrumb>
      
      {/* Статистика по расходам */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic 
              title="Всего расходов" 
              value={summaryData.total} 
              precision={2}
              prefix="₽"
              valueStyle={{ color: '#078800' }}
              className="expense-stat"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic 
              title="Крупнейшая категория" 
              value={summaryData.byCategory[0]?.Total || 0} 
              precision={2}
              prefix="₽" 
              valueStyle={{ color: '#0AB101' }}
              className="expense-stat"
              suffix={
                <span className="stat-category">
                  {summaryData.byCategory[0]?.Category || 'Нет данных'}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic 
              title="Текущий месяц" 
              value={summaryData.currentMonth} 
              precision={2}
              prefix="₽"
              valueStyle={{ color: '#0AB101' }}
              className="expense-stat"
            />
          </Card>
        </Col>
      </Row>
      
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Left side: title with export and import buttons */}
            <div className="header-left-content">
              <Title level={2}>Расходы</Title>
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
            
            {/* Right side: filter, search, and add buttons */}
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
              <div className="expenses-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск расходов"
                  autoFocus={false}
                />
              </div>
              
              {/* Add expense button */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddExpense}
                className="ant-add-button"
              >
                Добавить расход
              </Button>
            </div>
          </div>
          
          {/* Filter panel */}
          {showFilters && (
            <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
              <div className="filter-panel-header">
                <h4>Фильтр расходов</h4>
                <Button 
                  className="ant-filreset-button"
                  type="link"
                  onClick={resetFilters}
                >
                  Сбросить все фильтры
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* Date range filter */}
                <Col xs={24} sm={24} md={12}>
                  <div className="filter-group">
                    <label>Период</label>
                    <RangePicker 
                      style={{ width: '100%' }}
                      value={filterValues.dateRange}
                      onChange={(dates) => handleFilterChange('dateRange', dates)}
                    />
                  </div>
                </Col>
                
                {/* Resource type filter */}
                <Col xs={24} sm={12} md={6}>
                  <div className="filter-group">
                    <label>Тип ресурса</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите тип ресурса"
                      value={filterValues.resourceTypes}
                      onChange={(values) => handleFilterChange('resourceTypes', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      {resourceTypes.map(type => (
                        <Option key={type} value={type}>
                          {getResourceTypeDisplayName(type)}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                
                {/* Category filter */}
                <Col xs={24} sm={12} md={6}>
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
              </Row>
            </div>
          )}
          
          <Divider />
          
          <Spin spinning={loading}>
            {/* Table without built-in pagination */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="Expense_ID"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
            
            {/* Custom pagination component */}
            <Pagination
              totalItems={filteredExpenses.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 20, 50]}
              initialPageSize={pageSize}
            />
          </Spin>
        </div>
      </Card>
    </div>
  );
};

export default Expenses;