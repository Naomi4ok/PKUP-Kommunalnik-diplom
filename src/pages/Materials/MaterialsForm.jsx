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
  InputNumber
} from 'antd';
import { HomeOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import '../../styles/Materials/MaterialsForm.css';
import DatePicker from '../../components/DatePicker/DatePicker';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MaterialsForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [suppliers, setSuppliers] = useState([
    'СтройМаркет',
    'БелСтрой',
    'МатериалПлюс',
    'ТехноСтрой',
    'Прочее'
  ]);
  
  const [statuses] = useState([
    'В наличии',
    'Заканчивается',
    'Нет в наличии',
    'Заказано'
  ]);

  // Загрузка мест хранения для материалов
  useEffect(() => {
    const fetchStorageLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await fetch('/api/storage/materials');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        message.error(`Не удалось загрузить места хранения: ${err.message}`);
        // Используем резервные данные, если не удалось загрузить с сервера
        setLocations([
          { id: 1, name: 'Склад 1', description: 'Основной склад материалов', itemCount: 0 },
          { id: 2, name: 'Склад 2', description: 'Дополнительный склад материалов', itemCount: 0 },
          { id: 3, name: 'Строительная площадка', description: 'Место хранения на стройплощадке', itemCount: 0 },
          { id: 4, name: 'Гараж', description: 'Место хранения в гараже', itemCount: 0 },
          { id: 5, name: 'Прочее', description: 'Другие места хранения', itemCount: 0 }
        ]);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchStorageLocations();
  }, []);

  // Handle date change from custom DatePicker
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Load material data when editing
  useEffect(() => {
    if (isEditing) {
      const fetchMaterialDetails = async () => {
        try {
          setInitialLoading(true);
          const response = await fetch(`/api/materials/${id}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Set selected date if exists
          if (data.Last_Replenishment_Date) {
            setSelectedDate(new Date(data.Last_Replenishment_Date));
          }
          
          // Set form values
          form.setFieldsValue({
            name: data.Name,
            quantity: data.Quantity,
            unitCost: data.Unit_Cost,
            totalCost: data.Total_Cost,
            location: data.Location,
            supplier: data.Supplier,
            status: data.Status || 'В наличии'
          });
          
        } catch (err) {
          message.error(`Не удалось загрузить информацию о материале: ${err.message}`);
          navigate('/materials');
        } finally {
          setInitialLoading(false);
        }
      };
      
      fetchMaterialDetails();
    }
  }, [id, isEditing, form, navigate]);

  // Calculate total cost based on quantity and unit cost
  const calculateTotalCost = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    const unitCost = form.getFieldValue('unitCost') || 0;
    
    if (quantity > 0 && unitCost > 0) {
      const totalCost = quantity * unitCost;
      form.setFieldsValue({ totalCost });
    }
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
      const materialData = {
        name: values.name,
        quantity: values.quantity,
        unitCost: values.unitCost,
        totalCost: values.totalCost || (values.quantity * values.unitCost),
        lastReplenishmentDate: formattedDate,
        location: values.location,
        supplier: values.supplier,
        status: values.status || 'В наличии'
      };

      let response;
      
      if (isEditing) {
        // Update existing material
        response = await fetch(`/api/materials/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(materialData)
        });
      } else {
        // Add new material
        response = await fetch('/api/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(materialData)
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Success message
      message.success(`Материал успешно ${isEditing ? 'обновлен' : 'добавлен'}!`);
      
      // Navigate back to materials list
      navigate('/materials');
      
    } catch (err) {
      message.error(`Не удалось ${isEditing ? 'обновить' : 'добавить'} материал: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Return to materials list
  const handleCancel = () => {
    navigate('/materials');
  };

  return (
    <div className="materials-form-container">
      <Breadcrumb className="materials-form-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/materials">
          Материалы
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditing ? 'Редактирование' : 'Добавление'} материала
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="materials-form-card">
        <div className="materials-form-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/materials')}
            className="back-button"
          >
            Назад к списку материалов
          </Button>
          <Title level={2} className="materials-form-title">
            {isEditing ? 'Редактирование' : 'Добавление'} материала
          </Title>
        </div>
        
        <Spin spinning={initialLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              quantity: 1,
              unitCost: 0,
              totalCost: 0,
              status: 'В наличии'
            }}
          >
            {/* Name */}
            <Form.Item
              name="name"
              label="Наименование"
              rules={[
                { required: true, message: 'Пожалуйста, введите наименование материала' }
              ]}
            >
              <Input placeholder="Введите наименование материала" />
            </Form.Item>
            
            <div className="form-row">
              {/* Quantity */}
              <Form.Item
                name="quantity"
                label="Количество"
                rules={[
                  { required: true, message: 'Пожалуйста, укажите количество' }
                ]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  onChange={() => calculateTotalCost()}
                />
              </Form.Item>
              
              {/* Unit Cost */}
              <Form.Item
                name="unitCost"
                label="Цена за ед."
                rules={[
                  { required: true, message: 'Пожалуйста, укажите Цена за ед.' }
                ]}
              >
                <InputNumber 
                  min={0} 
                  step={0.01} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  onChange={() => calculateTotalCost()}
                  addonAfter="BYN"
                />
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Total Cost */}
              <Form.Item
                name="totalCost"
                label="Общая стоимость"
              >
                <InputNumber 
                  min={0} 
                  step={0.01} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  readOnly
                  addonAfter="BYN"
                />
              </Form.Item>
              
              {/* Last Replenishment Date */}
              <Form.Item
                label="Дата последнего пополнения"
                rules={[{ required: false }]}
              >
                <DatePicker 
                  selectedDate={selectedDate} 
                  onChange={handleDateChange}
                />
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Location - Modified to use storage locations from API */}
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
                  {locations.map(location => (
                    <Option key={location.id} value={location.name} title={location.description}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{location.name}</span>
                        <span style={{ 
                            fontSize: '11px', 
                            color: '#999',
                            marginLeft: '8px',
                            flexShrink: 0
                        }}>
                          ({location.itemCount} материалов)
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
              
              {/* Supplier */}
              <Form.Item
                name="supplier"
                label="Поставщик"
                rules={[
                  { required: true, message: 'Пожалуйста, укажите поставщика' }
                ]}
              >
                <Select 
                  placeholder="Выберите поставщика"
                  showSearch
                  allowClear
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                        <Input
                          style={{ flex: 'auto' }}
                          placeholder="Добавить нового поставщика"
                          onPressEnter={(e) => {
                            const value = e.target.value.trim();
                            if (value && !suppliers.includes(value)) {
                              setSuppliers([...suppliers, value]);
                              form.setFieldsValue({ supplier: value });
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                  )}
                >
                  {suppliers.map(supplier => (
                    <Option key={supplier} value={supplier}>{supplier}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <div className="form-row">
              {/* Status */}
              <Form.Item
                name="status"
                label="Статус"
                rules={[
                  { required: true, message: 'Пожалуйста, укажите статус' }
                ]}
              >
                <Select placeholder="Выберите статус">
                  {statuses.map(status => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              {/* Empty item for layout balance */}
              <div style={{ flex: 1 }}></div>
            </div>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  className="materials-submit-button"  
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  {isEditing ? 'Обновить' : 'Добавить'} материал
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

export default MaterialsForm;