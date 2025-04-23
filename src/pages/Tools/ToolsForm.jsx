import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Space,
  Breadcrumb,
  InputNumber,
  DatePicker
} from 'antd';
import {
  ToolOutlined,
  SaveOutlined,
  HomeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import '../../styles/Tools/ToolsForm.css';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ToolsForm = () => {
  const { id } = useParams(); // Get tool ID from URL when editing
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [categories, setCategories] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Load data when component mounts
  useEffect(() => {
    fetchCategories();
    fetchStorageLocations();
    fetchEmployees();
    
    if (id) {
      setIsEditing(true);
      fetchToolData(id);
    }
  }, [id]);

  // Fetch unique categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/tools/categories');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data);
      
    } catch (err) {
      message.error(`Failed to load categories: ${err.message}`);
    }
  };

  // Fetch unique storage locations
  const fetchStorageLocations = async () => {
    try {
      const response = await fetch('/api/tools/storage-locations');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setStorageLocations(data);
      
    } catch (err) {
      message.error(`Failed to load storage locations: ${err.message}`);
    }
  };

  // Fetch employees for the responsible employee dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
      
    } catch (err) {
      message.error(`Failed to load employees: ${err.message}`);
    }
  };

  // Fetch specific tool data when editing
  const fetchToolData = async (toolId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tools/${toolId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const tool = await response.json();
      
      // Format the date if it exists
      const formattedValues = {
        name: tool.Name || '',
        category: tool.Category || '',
        quantity: tool.Quantity || 1,
        storageLocation: tool.Storage_Location || '',
        responsibleEmployeeId: tool.Responsible_Employee_ID || null,
        lastCheckDate: tool.Last_Check_Date ? moment(tool.Last_Check_Date) : null
      };
      
      setInitialValues(formattedValues);
      form.setFieldsValue(formattedValues);
      
    } catch (err) {
      message.error(`Failed to load tool data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Format date to string if it exists
      const formattedValues = {
        ...values,
        lastCheckDate: values.lastCheckDate ? values.lastCheckDate.format('YYYY-MM-DD') : null
      };
      
      let response;
      
      if (isEditing) {
        // Update existing tool
        response = await fetch(`/api/tools/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formattedValues.name,
            category: formattedValues.category,
            quantity: formattedValues.quantity,
            storageLocation: formattedValues.storageLocation,
            responsibleEmployeeId: formattedValues.responsibleEmployeeId,
            lastCheckDate: formattedValues.lastCheckDate,
          }),
        });
      } else {
        // Add new tool
        response = await fetch('/api/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formattedValues.name,
            category: formattedValues.category,
            quantity: formattedValues.quantity,
            storageLocation: formattedValues.storageLocation,
            responsibleEmployeeId: formattedValues.responsibleEmployeeId,
            lastCheckDate: formattedValues.lastCheckDate,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Success message
      message.success(`Tool successfully ${isEditing ? 'updated' : 'added'}!`);
      
      // Navigate back to tools list
      navigate('/tools');
      
    } catch (err) {
      message.error(`Failed to ${isEditing ? 'update' : 'add'} tool: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-form-container">
      <Breadcrumb className="tool-form-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/tools">
          Инструменты
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditing ? 'Редактирование инструмента' : 'Добавление инструмента'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="tool-form-card">
        <div className="tool-form-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/tools')}
            className="back-button"
          >
            Назад к списку инструментов
          </Button>
          <Title level={2} className="tool-form-title">
            {isEditing ? 'Редактирование инструмента' : 'Добавление инструмента'}
          </Title>
        </div>
        
        <Spin spinning={loading} tip="Загрузка...">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            className="tool-form"
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Наименование"
                  rules={[{ required: true, message: 'Пожалуйста, введите наименование инструмента' }]}
                >
                  <Input placeholder="Введите наименование инструмента" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="category"
                  label="Категория"
                >
                  <Select
                    showSearch
                    placeholder="Выберите или введите категорию"
                    optionFilterProp="children"
                    allowClear
                    mode="tags"
                  >
                    {categories.map(category => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="quantity"
                  label="Количество"
                  rules={[{ required: true, message: 'Пожалуйста, укажите количество' }]}
                  initialValue={1}
                >
                  <InputNumber 
                    min={1} 
                    style={{ width: '100%' }} 
                    placeholder="Введите количество"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="storageLocation"
                  label="Место хранения"
                >
                  <Select
                    showSearch
                    placeholder="Выберите или введите место хранения"
                    optionFilterProp="children"
                    allowClear
                    mode="tags"
                  >
                    {storageLocations.map(location => (
                      <Option key={location} value={location}>
                        {location}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="responsibleEmployeeId"
                  label="Ответственный сотрудник"
                >
                  <Select
                    showSearch
                    placeholder="Выберите ответственного сотрудника"
                    optionFilterProp="children"
                    allowClear
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {employees.map(employee => (
                      <Option key={employee.Employee_ID} value={employee.Employee_ID}>
                        {employee.Full_Name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastCheckDate"
                  label="Дата последней проверки"
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD.MM.YYYY"
                    placeholder="Выберите дату"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  className="tool-submit-button" 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  size="large"
                >
                  {isEditing ? 'Обновить инструмент' : 'Добавить инструмент'}
                </Button>
                <Button 
                  onClick={() => navigate('/tools')}
                  size="large"
                >
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default ToolsForm;