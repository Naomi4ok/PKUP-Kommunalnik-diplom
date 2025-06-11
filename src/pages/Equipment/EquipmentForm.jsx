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
  Avatar
} from 'antd';
import { 
  HomeOutlined, 
  SaveOutlined, 
  RollbackOutlined, 
  ArrowLeftOutlined,
  UserOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs'; // Using dayjs instead of moment
import '../../styles/Equipment/EquipmentForm.css';
import DatePicker from '../../components/DatePicker/DatePicker'; // Импортируем кастомный DatePicker

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
  const [storageLocations, setStorageLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
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
    'Требует ТО',
    'Неисправно',
    'Ремонтируется'
  ]);

  // Добавляем состояние для даты
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Загрузка мест хранения оборудования
  useEffect(() => {
    const fetchStorageLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await fetch('/api/storage/equipment');
        
        if (!response.ok) {
          throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
        
        const data = await response.json();
        setStorageLocations(data);
      } catch (err) {
        message.error(`Не удалось загрузить места хранения: ${err.message}`);
        // Fallback данные для демонстрации
        setStorageLocations([
          { id: 1, name: 'Насосная станция №1', description: 'Локация насосного оборудования', itemCount: 12 },
          { id: 2, name: 'Котельная', description: 'Локация отопительного оборудования', itemCount: 8 },
          { id: 3, name: 'Электроподстанция', description: 'Локация электрического оборудования', itemCount: 15 },
          { id: 4, name: 'Компрессорная', description: 'Локация компрессорного оборудования', itemCount: 6 },
          { id: 5, name: 'Цех №3', description: 'Локация производственного оборудования', itemCount: 22 }
        ]);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchStorageLocations();
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
          
          // Устанавливаем дату в кастомный DatePicker
          if (data.Commission_Date) {
            setSelectedDate(new Date(data.Commission_Date));
          }
          
          // Установка значений формы
          form.setFieldsValue({
            name: data.Name,
            type: data.Type,
            manufacturer: data.Manufacturer,
            model: data.Model,
            inventoryNumber: data.Inventory_Number,
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

  // Функция для обработки изменения даты
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Обработка отправки формы
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Форматируем дату из DatePicker
      const formattedDate = selectedDate ? 
        `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}` : 
        null;
      
      // Подготовка данных для отправки
      const equipmentData = {
        name: values.name,
        type: values.type,
        manufacturer: values.manufacturer,
        model: values.model,
        inventoryNumber: values.inventoryNumber,
        commissionDate: formattedDate,
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

      <Card className="equipment-form-card">
        <div className="equipment-form-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/equipment')}
            className="back-button"
          >
            Назад к списку оборудования
          </Button>
          <Title level={2} className="equipment-form-title">
            {isEditing ? 'Редактирование' : 'Добавление'} оборудования
          </Title>
        </div>
        
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
              {/* Дата ввода в эксплуатацию - Заменяем на кастомный DatePicker */}
              <Form.Item
                label="Дата ввода в эксплуатацию"
                rules={[
                  { required: false, message: 'Пожалуйста, выберите дату' }
                ]}
              >
                <DatePicker 
                  selectedDate={selectedDate} 
                  onChange={handleDateChange} 
                />
              </Form.Item>
              
              {/* Ответственный за эксплуатацию - добавляем аватарки как в ExpenseForm */}
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
              
              {/* Место нахождения - улучшенная версия с лучшим отображением */}
              <Form.Item
                name="location"
                label="Место нахождения"
                rules={[
                  { required: true, message: 'Пожалуйста, выберите место нахождения' }
                ]}
              >
                <Select
                  className="location-select"
                  placeholder="Выберите место нахождения"
                  showSearch
                  allowClear
                  loading={loadingLocations}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
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
                        Новые места хранения можно добавить в разделе "Места хранения"
                      </div>
                    </div>
                  )}
                >
                  {storageLocations.map(location => (
                    <Option key={location.id} value={location.name} title={location.description}>
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                        }}>
                          <span>{location.name}</span>
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#999',
                            marginLeft: '8px',
                            flexShrink: 0
                          }}>
                            ({location.itemCount} ед.)
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
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  className="equipment-submit-button"  
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  {isEditing ? 'Обновить' : 'Добавить'} оборудование
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

export default EquipmentForm;