import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Select,
  Breadcrumb,
  Spin,
  Divider,
  Space,
  InputNumber,
  Avatar
} from 'antd';
import { HomeOutlined, SaveOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import '../../styles/Tools/ToolsForm.css';
import DatePicker from '../../components/DatePicker/DatePicker';

const { Title } = Typography;
const { Option } = Select;

const ToolsForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categories, setCategories] = useState([
    'Электроинструмент',
    'Ручной инструмент',
    'Измерительный инструмент',
    'Садовый инструмент',
    'Строительный инструмент',
    'Сварочный инструмент',
    'Прочее'
  ]);
  
  // Удаляем статический массив локаций
  // Добавляем новые состояния для хранения локаций из API
  const [storageLocations, setStorageLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        message.error(`Не удалось загрузить данные о сотрудниках: ${err.message}`);
      }
    };
    
    fetchEmployees();
  }, []);

  // Добавляем новый useEffect для загрузки мест хранения инструментов
  useEffect(() => {
    const fetchStorageLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await fetch('/api/storage/tools');
        
        if (!response.ok) {
          throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
        
        const data = await response.json();
        setStorageLocations(data);
      } catch (err) {
        message.error(`Не удалось загрузить места хранения: ${err.message}`);
        // Fallback данные для демонстрации, если не удалось загрузить
        setStorageLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchStorageLocations();
  }, []);

  // Load tool data when editing
  useEffect(() => {
    if (isEditing) {
      const fetchToolDetails = async () => {
        try {
          setInitialLoading(true);
          const response = await fetch(`/api/tools/${id}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Set form values
          form.setFieldsValue({
            name: data.Name,
            category: data.Category,
            quantity: data.Quantity,
            location: data.Location,
            responsibleEmployeeId: data.Responsible_Employee_ID,
          });
          
          // Set date for custom DatePicker
          if (data.Last_Check_Date) {
            setSelectedDate(new Date(data.Last_Check_Date));
          }
          
        } catch (err) {
          message.error(`Не удалось загрузить информацию об инструменте: ${err.message}`);
          navigate('/tools');
        } finally {
          setInitialLoading(false);
        }
      };
      
      fetchToolDetails();
    }
  }, [id, isEditing, form, navigate]);

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Format the date properly
      const formattedDate = selectedDate ? 
        `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}` : 
        null;
      
      // Prepare data for submission
      const toolData = {
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        location: values.location,
        responsibleEmployeeId: values.responsibleEmployeeId,
        lastCheckDate: formattedDate
      };

      let response;
      
      if (isEditing) {
        // Update existing tool
        response = await fetch(`/api/tools/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(toolData)
        });
      } else {
        // Add new tool
        response = await fetch('/api/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(toolData)
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Success message
      message.success(`Инструмент успешно ${isEditing ? 'обновлен' : 'добавлен'}!`);
      
      // Navigate back to tools list
      navigate('/tools');
      
    } catch (err) {
      message.error(`Не удалось ${isEditing ? 'обновить' : 'добавить'} инструмент: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Return to tools list
  const handleCancel = () => {
    navigate('/tools');
  };

  return (
    <div className="tools-form-container">
      <Breadcrumb className="tools-form-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/tools">
          Инструменты
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditing ? 'Редактирование' : 'Добавление'} инструмента
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="tools-form-card">
        <div className="tools-form-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/tools')}
            className="back-button"
          >
            Назад к списку инструментов
          </Button>
          <Title level={2} className="tools-form-title">
            {isEditing ? 'Редактирование' : 'Добавление'} инструмента
          </Title>
        </div>
        
        <Spin spinning={initialLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              quantity: 1
            }}
          >
            {/* Name */}
            <Form.Item
              name="name"
              label="Наименование"
              rules={[
                { required: true, message: 'Пожалуйста, введите наименование инструмента' }
              ]}
            >
              <Input placeholder="Введите наименование инструмента" />
            </Form.Item>
            
            <div className="form-row">
              {/* Category */}
              <Form.Item
                name="category"
                label="Категория"
                rules={[
                  { required: true, message: 'Пожалуйста, выберите категорию инструмента' }
                ]}
              >
                <Select 
                  placeholder="Выберите категорию инструмента"
                  showSearch
                  allowClear
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                        <Input
                          style={{ flex: 'auto' }}
                          placeholder="Добавить новую категорию"
                          onPressEnter={(e) => {
                            const value = e.target.value.trim();
                            if (value && !categories.includes(value)) {
                              setCategories([...categories, value]);
                              form.setFieldsValue({ category: value });
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                  )}
                >
                  {categories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              {/* Quantity */}
              <Form.Item
                name="quantity"
                label="Количество"
                rules={[
                  { required: true, message: 'Пожалуйста, укажите количество' }
                ]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Location - Заменяем на Select с данными из API */}
              <Form.Item
                name="location"
                label="Место хранения"
                rules={[
                  { required: true, message: 'Пожалуйста, укажите место хранения' }
                ]}
              >
                <Select 
                  placeholder="Выберите место хранения"
                  showSearch
                  allowClear
                  loading={loadingLocations}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children[0].props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ 
                        padding: '8px', 
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '12px'
                      }}>
                        Новые места хранения инструментов можно добавить в разделе "Места хранения"
                      </div>
                    </div>
                  )}
                >
                  {storageLocations.map(location => (
                    <Option key={location.id} value={location.name} title={location.description}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{location.name}</span>
                        <span style={{ 
                            fontSize: '11px', 
                            color: '#999',
                            marginLeft: '8px',
                            flexShrink: 0
                        }}>
                          ({location.itemCount} инстр.)
                        </span>
                      </div>
                      <div style={{ 
                          fontSize: '10px', 
                          color: '#666',
                          lineHeight: '1.2',
                          marginBottom: '8px'
                      }}>
                        {location.description}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              {/* Responsible employee - добавляем аватарки как в EquipmentForm */}
              <Form.Item
                name="responsibleEmployeeId"
                label="Ответственный"
                rules={[
                  { required: true, message: 'Пожалуйста, выберите ответственного сотрудника' }
                ]}
              >
                <Select
                  placeholder="Выберите ответственного сотрудника"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    return option.children && 
                      typeof option.children.props.children[1] === 'string' && 
                      option.children.props.children[1].toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {employees.map(employee => (
                    <Option key={employee.Employee_ID} value={employee.Employee_ID}>
                      <Space>
                        <Avatar 
                          size="small" 
                          src={employee.Photo ? `data:image/jpeg;base64,${employee.Photo}` : undefined} 
                          icon={!employee.Photo ? <UserOutlined /> : undefined} 
                        />
                        {employee.Full_Name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Last check date - кастомный DatePicker */}
              <Form.Item
                label="Дата последней проверки"
              >
                <DatePicker 
                  selectedDate={selectedDate} 
                  onChange={handleDateChange} 
                />
              </Form.Item>
              
              {/* Empty item for layout balance */}
              <div style={{ flex: 1 }}></div>
            </div>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  className="tools-submit-button"  
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  {isEditing ? 'Обновить' : 'Добавить'} инструмент
                </Button>
                <Button 
                  onClick={handleCancel}
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