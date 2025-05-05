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
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  DollarOutlined,
  FilterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import '../../styles/Expenses/Expenses.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

const Expenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
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
    byCategory: []
  });
  const [filterValues, setFilterValues] = useState({
    dateRange: [moment().startOf('month'), moment()],
    resourceType: '',
    resourceId: '',
    category: ''
  });
  
  // Fetch all required data on component mount
  useEffect(() => {
    fetchExpenses();
    fetchExpenseCategories();
    fetchResourceOptions();
  }, []);
  
  // Fetch expenses with filters applied
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Construct query params based on filters
      const params = new URLSearchParams();
      if (filterValues.resourceType) {
        params.append('resourceType', filterValues.resourceType);
      }
      if (filterValues.resourceId) {
        params.append('resourceId', filterValues.resourceId);
      }
      if (filterValues.category) {
        params.append('category', filterValues.category);
      }
      if (filterValues.dateRange && filterValues.dateRange[0]) {
        params.append('startDate', filterValues.dateRange[0].format('YYYY-MM-DD'));
      }
      if (filterValues.dateRange && filterValues.dateRange[1]) {
        params.append('endDate', filterValues.dateRange[1].format('YYYY-MM-DD'));
      }
      
      const url = `/api/expenses?${params.toString()}`;
      const response = await fetch(url);
      
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
      setCategories(data);
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
      
      // Fetch summary data in parallel
      const [totalResponse, byTypeResponse, byCategoryResponse] = await Promise.all([
        fetch(`/api/expenses/summary/total?${params.toString()}`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=resource_type`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=category`).then(res => res.json())
      ]);
      
      setSummaryData({
        total: totalResponse[0]?.Total || 0,
        byType: byTypeResponse || [],
        byCategory: byCategoryResponse || []
      });
    } catch (err) {
      message.error(`Failed to load summary data: ${err.message}`);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilterValues({
      ...filterValues,
      [type]: value
    });
    
    // Reset resourceId if resourceType changes
    if (type === 'resourceType') {
      setFilterValues({
        ...filterValues,
        resourceType: value,
        resourceId: ''
      });
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchExpenses();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterValues({
      dateRange: [moment().startOf('month'), moment()],
      resourceType: '',
      resourceId: '',
      category: ''
    });
    
    // Fetch expenses with reset filters
    setTimeout(fetchExpenses, 0);
  };
  
  // Add new expense button handler
  const handleAddExpense = () => {
    navigate('/expenses/new');
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
      
      message.success('Расход успешно удален');
      fetchExpenses();
    } catch (err) {
      message.error(`Failed to delete expense: ${err.message}`);
    }
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
  
  // Define table columns
  const columns = [
    {
      title: 'Дата',
      dataIndex: 'Date',
      key: 'date',
      render: text => moment(text).format('DD.MM.YYYY')
    },
    {
      title: 'Тип ресурса',
      dataIndex: 'Resource_Type',
      key: 'resourceType',
      render: text => {
        const typeMap = {
          'Employee': 'Сотрудник',
          'Equipment': 'Оборудование',
          'Transportation': 'Транспорт',
          'Tool': 'Инструмент',
          'Spare': 'Запчасть',
          'Material': 'Материал'
        };
        return typeMap[text] || text;
      }
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
      render: amount => <Text strong>{Number(amount).toLocaleString('ru-RU')}</Text>
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
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/expenses/edit/${record.Expense_ID}`)} 
          />
          <Popconfirm
            title="Вы уверены, что хотите удалить этот расход?"
            onConfirm={() => handleDeleteExpense(record.Expense_ID)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  // Options for resource type filter
  const resourceTypeOptions = [
    { value: 'Employee', label: 'Сотрудники' },
    { value: 'Equipment', label: 'Оборудование' },
    { value: 'Transportation', label: 'Транспорт' },
    { value: 'Tool', label: 'Инструменты' },
    { value: 'Spare', label: 'Запчасти' },
    { value: 'Material', label: 'Материалы' }
  ];
  
  // Get resource options based on selected resource type
  const getResourceIdOptions = () => {
    if (!filterValues.resourceType) return [];
    
    switch(filterValues.resourceType) {
      case 'Employee':
        return resourceOptions.employees.map(e => ({
          value: e.Employee_ID,
          label: e.Full_Name
        }));
      case 'Equipment':
        return resourceOptions.equipment.map(e => ({
          value: e.Equipment_ID,
          label: e.Name
        }));
      case 'Transportation':
        return resourceOptions.transportation.map(t => ({
          value: t.Transport_ID,
          label: `${t.Brand} ${t.Model}`
        }));
      case 'Tool':
        return resourceOptions.tools.map(t => ({
          value: t.Tool_ID,
          label: t.Name
        }));
      case 'Spare':
        return resourceOptions.spares.map(s => ({
          value: s.Spare_ID,
          label: s.Name
        }));
      case 'Material':
        return resourceOptions.materials.map(m => ({
          value: m.Material_ID,
          label: m.Name
        }));
      default:
        return [];
    }
  };
  
  // Get category options for filter
  const getCategoryOptions = () => {
    return categories.map(c => ({
      value: c.Name,
      label: c.Name
    }));
  };
  
  return (
    <div className="expenses-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
          <span>Главная</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <DollarOutlined />
          <span>Расходы</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>Управление расходами</Title>
        </Col>
      </Row>

      {/* Статистика по расходам */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Всего расходов" 
              value={summaryData.total} 
              prefix="₽"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Крупнейшая категория" 
              value={
                summaryData.byCategory[0]?.Total || 0
              } 
              prefix="₽"
              precision={2}
              suffix={summaryData.byCategory[0]?.Category || 'Нет данных'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Текущий месяц" 
              value={summaryData.total} 
              prefix="₽"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Фильтры */}
      <Card className="filter-card">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="Период">
                <RangePicker 
                  style={{ width: '100%' }}
                  value={filterValues.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Тип ресурса">
                <Select 
                  placeholder="Выберите тип ресурса"
                  style={{ width: '100%' }}
                  value={filterValues.resourceType}
                  onChange={(value) => handleFilterChange('resourceType', value)}
                  allowClear
                >
                  {resourceTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Ресурс">
                <Select 
                  placeholder="Выберите ресурс"
                  style={{ width: '100%' }}
                  value={filterValues.resourceId}
                  onChange={(value) => handleFilterChange('resourceId', value)}
                  disabled={!filterValues.resourceType}
                  allowClear
                >
                  {getResourceIdOptions().map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Категория">
                <Select 
                  placeholder="Выберите категорию"
                  style={{ width: '100%' }}
                  value={filterValues.category}
                  onChange={(value) => handleFilterChange('category', value)}
                  allowClear
                >
                  {getCategoryOptions().map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button 
                  onClick={resetFilters}
                >
                  Сбросить
                </Button>
                <Button 
                  type="primary" 
                  icon={<FilterOutlined />} 
                  onClick={applyFilters}
                >
                  Применить
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Таблица расходов */}
      <Card className="expenses-table-card">
        <div className="table-header">
          <div className="table-title">
            <Title level={4}>Список расходов</Title>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddExpense}
          >
            Добавить расход
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="Expense_ID"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
        />
      </Card>
    </div>
  );
};

export default Expenses;