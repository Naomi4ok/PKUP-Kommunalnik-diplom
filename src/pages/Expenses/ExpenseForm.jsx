import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Card,
  Typography,
  message,
  Breadcrumb,
  Space,
  Divider,
  Row,
  Col
} from 'antd';
import {
  HomeOutlined,
  DollarOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import '../../styles/Expenses/ExpenseForm.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Если есть id в URL, значит редактирование
  const isEditing = !!id;
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [resourceOptions, setResourceOptions] = useState({
    employees: [],
    equipment: [],
    transportation: [],
    tools: [],
    spares: [],
    materials: []
  });
  const [selectedResourceType, setSelectedResourceType] = useState('');
  
  // Fetch all required data on component mount
  useEffect(() => {
    fetchExpenseCategories();
    fetchResourceOptions();
    
    // If editing, load expense data
    if (isEditing) {
      fetchExpenseData();
    }
  }, [isEditing]);
  
  // Fetch expense data for editing
  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Set resource type first to enable resource selection
      setSelectedResourceType(data.Resource_Type);
      
      // Set form values
      form.setFieldsValue({
        resourceType: data.Resource_Type,
        resourceId: data.Resource_ID,
        amount: data.Amount,
        description: data.Description,
        date: moment(data.Date),
        category: data.Category,
        paymentMethod: data.Payment_Method,
        invoiceNumber: data.Invoice_Number
      });
      
    } catch (err) {
      message.error(`Failed to load expense data: ${err.message}`);
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
  
  // Fetch all resource options
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
  
  // Handle resource type change
  const handleResourceTypeChange = (value) => {
    setSelectedResourceType(value);
    form.setFieldsValue({ resourceId: undefined });
  };
  
  // Get resource options based on selected resource type
  const getResourceIdOptions = () => {
    if (!selectedResourceType) return [];
    
    switch(selectedResourceType) {
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
  
  // Submit form handler
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const expenseData = {
        resourceType: values.resourceType,
        resourceId: values.resourceId,
        amount: values.amount,
        description: values.description,
        date: values.date.format('YYYY-MM-DD'),
        category: values.category,
        paymentMethod: values.paymentMethod,
        invoiceNumber: values.invoiceNumber
      };
      
      let response;
      
      if (isEditing) {
        // Update existing expense
        response = await fetch(`/api/expenses/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expenseData)
        });
      } else {
        // Create new expense
        response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expenseData)
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      message.success(`Расход успешно ${isEditing ? 'обновлен' : 'добавлен'}`);
      navigate('/expenses');
    } catch (err) {
      message.error(`Failed to ${isEditing ? 'update' : 'create'} expense: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Options for resource type select
  const resourceTypeOptions = [
    { value: 'Employee', label: 'Сотрудник' },
    { value: 'Equipment', label: 'Оборудование' },
    { value: 'Transportation', label: 'Транспорт' },
    { value: 'Tool', label: 'Инструмент' },
    { value: 'Spare', label: 'Запчасть' },
    { value: 'Material', label: 'Материал' }
  ];
  
  // Options for payment methods
  const paymentMethodOptions = [
    { value: 'cash', label: 'Наличные' },
    { value: 'card', label: 'Банковская карта' },
    { value: 'bank_transfer', label: 'Банковский перевод' },
    { value: 'online', label: 'Онлайн платеж' }
  ];
  
  // Get category options
  const getCategoryOptions = () => {
    return categories.map(c => ({
      value: c.Name,
      label: c.Name
    }));
  };
  
  return (
    <div className="expense-form-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
          <span>Главная</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/expenses">
          <DollarOutlined />
          <span>Расходы</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span>{isEditing ? 'Редактирование' : 'Новый'} расход</span>
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <Card className="expense-form-card">
        <div className="form-header">
          <Title level={3}>{isEditing ? 'Редактирование' : 'Добавление'} расхода</Title>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: moment(),
            amount: 0
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="resourceType"
                label="Тип ресурса"
                rules={[{ required: true, message: 'Выберите тип ресурса' }]}
              >
                <Select 
                  placeholder="Выберите тип ресурса"
                  onChange={handleResourceTypeChange}
                >
                  {resourceTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="resourceId"
                label="Ресурс"
                rules={[{ required: true, message: 'Выберите ресурс' }]}
              >
                <Select 
                  placeholder="Выберите ресурс"
                  disabled={!selectedResourceType}
                >
                  {getResourceIdOptions().map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label="Сумма (₽)"
                rules={[
                  { required: true, message: 'Введите сумму' },
                  { type: 'number', min: 0, message: 'Сумма должна быть положительной' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="category"
                label="Категория"
                rules={[{ required: true, message: 'Выберите категорию' }]}
              >
                <Select placeholder="Выберите категорию">
                  {getCategoryOptions().map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="paymentMethod"
                label="Способ оплаты"
              >
                <Select placeholder="Выберите способ оплаты" allowClear>
                  {paymentMethodOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="invoiceNumber"
                label="Номер счета/накладной"
              >
                <Input placeholder="Введите номер счета или накладной" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="description"
                label="Описание"
              >
                <TextArea 
                  rows={4}
                  placeholder="Введите описание расхода"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <div className="form-actions">
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/expenses')}
              >
                Назад
              </Button>
              <Button 
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                htmlType="submit"
              >
                {isEditing ? 'Сохранить' : 'Добавить'} расход
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ExpenseForm;