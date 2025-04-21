import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  DatePicker,
  Select,
  Breadcrumb,
  Spin,
  Divider
} from 'antd';
import { HomeOutlined, SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // Using dayjs instead of moment
import '../../styles/Equipment/EquipmentForm.css';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EquipmentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([
    'Насосное оборудование',
    'Котельное оборудование',
    'Электрооборудование',
    'Вентиляционное оборудование',
    'Трансформаторы',
    'Компрессоры',
    'Измерительные приборы',
    'Сантехническое оборудование',
    'Грузоподъемное оборудование',
    'Прочее'
  ]);
  
  const [conditions] = useState([
    'Рабочее',
    'Требует обслуживания',
    'Неисправно',
    'На ремонте'
  ]);

  // Загрузка списка сотрудников
  useEffect(() => {
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
    
    fetchEmployees();
  }, []);

  // Загрузка данных об оборудовании при редактировании
  useEffect(() => {
    if (isEditing) {
      const fetchEquipmentDetails = async () => {
        try {
          setInitialLoading(true);
          const response = await fetch(`/api/equipment/${id}`);
          
          if (!response.ok) {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Установка значений формы
          form.setFieldsValue({
            name: data.Name,
            type: data.Type,
            manufacturer: data.Manufacturer,
            model: data.Model,
            inventoryNumber: data.Inventory_Number,
            commissionDate: data.Commission_Date ? dayjs(data.Commission_Date) : null,
            responsibleEmployeeId: data.Responsible_Employee_ID,
            condition: data.Condition || 'Рабочее',
            location: data.Location
          });
          
        } catch (err) {
          message.error(`Не удалось загрузить информацию об оборудовании: ${err.message}`);
          navigate('/equipment');
        } finally {
          setInitialLoading(false);
        }
      };
      
      fetchEquipmentDetails();
    }
  }, [id, isEditing, form, navigate]);

  // Обработка отправки формы
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Подготовка данных для отправки
      const equipmentData = {
        name: values.name,
        type: values.type,
        manufacturer: values.manufacturer,
        model: values.model,
        inventoryNumber: values.inventoryNumber,
        commissionDate: values.commissionDate ? values.commissionDate.format('YYYY-MM-DD') : null,
        responsibleEmployeeId: values.responsibleEmployeeId,
        condition: values.condition,
        location: values.location
      };

      let response;
      
      if (isEditing) {
        // Обновление существующего оборудования
        response = await fetch(`/api/equipment/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(equipmentData)
        });
      } else {
        // Добавление нового оборудования
        response = await fetch('/api/equipment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(equipmentData)
        });
      }

      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }

      // Сообщение об успехе
      message.success(`Оборудование успешно ${isEditing ? 'обновлено' : 'добавлено'}!`);
      
      // Переход обратно к списку оборудования
      navigate('/equipment');
      
    } catch (err) {
      message.error(`Не удалось ${isEditing ? 'обновить' : 'добавить'} оборудование: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Возврат к списку оборудования
  const handleCancel = () => {
    navigate('/equipment');
  };

  return (
    <div className="equipment-form-container">
      <Breadcrumb className="equipment-form-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/equipment">
          Оборудование
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditing ? 'Редактирование' : 'Добавление'} оборудования
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Title level={2}>
          {isEditing ? 'Редактирование' : 'Добавление'} оборудования
        </Title>
        
        <Divider />
        
        <Spin spinning={initialLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              condition: 'Рабочее' // Значение по умолчанию
            }}
          >
            {/* Наименование */}
            <Form.Item
              name="name"
              label="Наименование"
              rules={[
                { required: true, message: 'Пожалуйста, введите наименование оборудования' }
              ]}
            >
              <Input placeholder="Введите наименование оборудования" />
            </Form.Item>
            
            <div className="form-row">
              {/* Тип/Класс */}
              <Form.Item
                name="type"
                label="Тип/Класс"
                rules={[
                  { required: true, message: 'Пожалуйста, выберите тип оборудования' }
                ]}
              >
                <Select 
                  placeholder="Выберите тип оборудования"
                  showSearch
                  allowClear
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                        <Input
                          style={{ flex: 'auto' }}
                          placeholder="Добавить новый тип"
                          onPressEnter={(e) => {
                            const value = e.target.value.trim();
                            if (value && !types.includes(value)) {
                              setTypes([...types, value]);
                              form.setFieldsValue({ type: value });
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                  )}
                >
                  {types.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              {/* Производитель */}
              <Form.Item
                name="manufacturer"
                label="Производитель"
              >
                <Input placeholder="Введите производителя" />
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Модель */}
              <Form.Item
                name="model"
                label="Модель"
              >
                <Input placeholder="Введите модель" />
              </Form.Item>
              
              {/* Инвентарный номер */}
              <Form.Item
                name="inventoryNumber"
                label="Инвентарный номер"
                rules={[
                  { required: true, message: 'Пожалуйста, введите инвентарный номер' }
                ]}
              >
                <Input placeholder="Введите инвентарный номер" />
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Дата ввода в эксплуатацию */}
              <Form.Item
                name="commissionDate"
                label="Дата ввода в эксплуатацию"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Выберите дату"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              
              {/* Ответственный за эксплуатацию */}
              <Form.Item
                name="responsibleEmployeeId"
                label="Ответственный за эксплуатацию"
                rules={[
                  { required: true, message: 'Пожалуйста, выберите ответственного сотрудника' }
                ]}
              >
                <Select
                  placeholder="Выберите ответственного сотрудника"
                  showSearch
                  optionFilterProp="children"
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
            </div>
            
            <div className="form-row">
              {/* Техническое состояние */}
              <Form.Item
                name="condition"
                label="Техническое состояние"
              >
                <Select placeholder="Выберите техническое состояние">
                  {conditions.map(condition => (
                    <Option key={condition} value={condition}>{condition}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              {/* Место нахождения */}
              <Form.Item
                name="location"
                label="Место нахождения"
              >
                <Input placeholder="Введите место нахождения" />
              </Form.Item>
            </div>
            
            <div className="form-actions">
              <Button 
                onClick={handleCancel}
                icon={<RollbackOutlined />}
              >
                Отмена
              </Button>
              <Button
                className="employee-submit-button"  
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                {isEditing ? 'Обновить' : 'Добавить'} оборудование
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default EquipmentForm;