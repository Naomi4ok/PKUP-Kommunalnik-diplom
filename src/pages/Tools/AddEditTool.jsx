import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Select,
  InputNumber,
  DatePicker,
  Breadcrumb,
  Divider,
  Space,
  Typography,
  Spin,
} from 'antd';
import { HomeOutlined, SaveOutlined, UndoOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';
import '../../styles/Tools/AddEditTool.css';

const { Title } = Typography;
const { Option } = Select;

const AddEditTool = () => {
  const { id } = useParams(); // Получить ID инструмента из URL, если есть
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  
  const isEditing = !!id;
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchEmployees();
    fetchCategories();
    fetchStorageLocations();
    
    if (isEditing) {
      fetchToolData();
    }
  }, [id]);
  
  // Загрузка данных о сотрудниках
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      message.error(`Не удалось загрузить список сотрудников: ${error.message}`);
    }
  };
  
  // Загрузка уникальных категорий инструментов
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/tools/categories');
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      message.error(`Не удалось загрузить список категорий: ${error.message}`);
    }
  };
  
  // Загрузка уникальных мест хранения
  const fetchStorageLocations = async () => {
    try {
      const response = await fetch('/api/tools/storage-locations');
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      const data = await response.json();
      setStorageLocations(data);
    } catch (error) {
      message.error(`Не удалось загрузить список мест хранения: ${error.message}`);
    }
  };
  
  // Загрузка данных инструмента при редактировании
  const fetchToolData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/${id}`);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      const data = await response.json();
      setInitialData(data);
      
      // Установка значений формы
      form.setFieldsValue({
        name: data.Name,
        category: data.Category,
        quantity: data.Quantity,
        storageLocation: data.Storage_Location,
        responsibleEmployeeId: data.Responsible_Employee_ID,
        lastCheckDate: data.Last_Check_Date ? moment(data.Last_Check_Date) : null
      });
    } catch (error) {
      message.error(`Не удалось загрузить данные инструмента: ${error.message}`);
      navigate('/tools'); // Возврат к списку при ошибке
    } finally {
      setLoading(false);
    }
  };
  
  // Обработка отправки формы
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      const toolData = {
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        storageLocation: values.storageLocation,
        responsibleEmployeeId: values.responsibleEmployeeId,
        lastCheckDate: values.lastCheckDate ? values.lastCheckDate.format('YYYY-MM-DD') : null
      };
      
      const url = isEditing ? `/api/tools/${id}` : '/api/tools';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      message.success(`Инструмент успешно ${isEditing ? 'обновлен' : 'добавлен'}`);
      navigate('/tools');
    } catch (error) {
      message.error(`Не удалось ${isEditing ? 'обновить' : 'добавить'} инструмент: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработка ввода и выбора новой категории
  const handleCategoryChange = (value) => {
    // Если значение не в списке, добавить его
    if (value && !categories.includes(value)) {
      setCategories([...categories, value]);
    }
  };
  
  // Обработка ввода и выбора нового места хранения
  const handleStorageLocationChange = (value) => {
    // Если значение не в списке, добавить его
    if (value && !storageLocations.includes(value)) {
      setStorageLocations([...storageLocations, value]);
    }
  };
  
  // Отмена и возврат к списку
  const handleCancel = () => {
    navigate('/tools');
  };
  
  return (
    <div className="ant-add-edit-tools-container">
      <Breadcrumb className="tools-breadcrumb">
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
        
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              quantity: 1
            }}
          >
            <Form.Item
              name="name"
              label="Наименование"
              rules={[{ required: true, message: 'Пожалуйста, введите наименование инструмента' }]}
            >
              <Input placeholder="Введите наименование инструмента" />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="Категория"
            >
              <Select
                placeholder="Выберите или введите категорию"
                allowClear
                showSearch
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="quantity"
              label="Количество"
              rules={[{ required: true, message: 'Пожалуйста, укажите количество' }]}
            >
              <InputNumber min={0} placeholder="Укажите количество" style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="storageLocation"
              label="Место хранения"
            >
              <Select
                placeholder="Выберите или введите место хранения"
                allowClear
                showSearch
                onChange={handleStorageLocationChange}
              >
                {storageLocations.map(location => (
                  <Option key={location} value={location}>{location}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="responsibleEmployeeId"
              label="Ответственный"
            >
              <Select
                placeholder="Выберите ответственного сотрудника"
                allowClear
                showSearch
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
            
            <Form.Item
              name="lastCheckDate"
              label="Дата последней проверки"
            >
              <DatePicker 
                placeholder="Выберите дату" 
                style={{ width: '100%' }} 
                format="DD.MM.YYYY" 
              />
            </Form.Item>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  className="tools-submit-button"  
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  {isEditing ? 'Сохранить изменения' : 'Добавить инструмент'}
                </Button>
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleCancel}
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

export default AddEditTool;