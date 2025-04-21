import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Typography, 
  Card, 
  Row, 
  Col, 
  message, 
  Upload, 
  Spin,
  InputNumber,
  Divider,
  Space,
  Avatar,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined, 
  CarOutlined,
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import '../../styles/Transport/TransportForm.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Brands for dropdown
const BRANDS = [
  { value: 'МАЗ', logo: 'https://cdn.worldvectorlogo.com/logos/maz.svg' },
  { value: 'Volvo', logo: 'https://cdn.worldvectorlogo.com/logos/volvo.svg' },
  { value: 'МТЗ', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_kTqoxHahVX00BLsmSk5re3_zB208xN6LlHU1cVA6A_nQ=s900-c-k-c0x00ffffff-no-rj' },
  { value: 'MAN', logo: 'https://cdn.worldvectorlogo.com/logos/man-logo.svg' },
  { value: 'ГАЗ', logo: 'https://vitterra-yug.ru/image/catalog/manufactures/GAZ.png' },
  { value: 'КАМАЗ', logo: 'https://upload.wikimedia.org/wikipedia/ru/thumb/a/af/KAMAZ_Logo.svg/500px-KAMAZ_Logo.svg.png?20211121025007' },
  { value: 'Другое', logo: '' }
];

// Technical condition mapping for status tags
const TECH_CONDITION_MAP = {
  'Исправен': { color: 'success', className: 'status-operational' },
  'Требует ТО': { color: 'processing', className: 'status-maintenance' },
  'Ремонтируется': { color: 'warning', className: 'status-repair' },
  'Неисправен': { color: 'error', className: 'status-inactive' }
};

const TransportForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [brandLogo, setBrandLogo] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState('Исправен');
  const isEditMode = !!id;

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        message.error('Не удалось загрузить список сотрудников');
      }
    };

    fetchEmployees();
  }, []);

  // Fetch data for edit mode
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      fetch(`/api/transportation/${id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch transportation data');
          }
          return response.json();
        })
        .then(data => {
          // Format the data to match our form fields
          const formattedData = {
            brand: data.Brand,
            model: data.Model,
            year: data.Year,
            licenseNumber: data.LicenseNumber,
            purpose: data.Purpose,
            fuelType: data.FuelType,
            transmissionType: data.TransmissionType,
            technicalCondition: data.TechnicalCondition,
            assignedEmployeeId: data.AssignedEmployee_ID,
            lastMaintenance: data.LastMaintenance ? moment(data.LastMaintenance) : null,
            nextScheduledService: data.NextScheduledService ? moment(data.NextScheduledService) : null,
            registrationDate: data.RegistrationDate ? moment(data.RegistrationDate) : null,
            description: data.Description
          };
          
          setInitialData(formattedData);
          form.setFieldsValue(formattedData);
          
          setBrandLogo(data.BrandLogo || '');
          setSelectedCondition(data.TechnicalCondition || 'Исправен');
          
          // Set file list for image preview if there's an image
          if (data.Image) {
            setFileList([
              {
                uid: '-1',
                name: 'transport-image.jpg',
                status: 'done',
                url: `data:image/jpeg;base64,${data.Image}`,
              }
            ]);
          }
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Error:', error);
          message.error('Не удалось загрузить данные о транспорте');
          navigate('/transport');
          setLoading(false);
        });
    } else {
      // Set default brand logo for new form
      const defaultBrand = BRANDS.find(b => b.value === 'МАЗ');
      setBrandLogo(defaultBrand ? defaultBrand.logo : '');
    }
  }, [id, form, navigate, isEditMode]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Add image file if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }
      
      // Format dates if they exist
      const formattedValues = { ...values };
      if (formattedValues.lastMaintenance && moment.isMoment(formattedValues.lastMaintenance)) {
        formattedValues.lastMaintenance = formattedValues.lastMaintenance.format('YYYY-MM-DD');
      }
      if (formattedValues.nextScheduledService && moment.isMoment(formattedValues.nextScheduledService)) {
        formattedValues.nextScheduledService = formattedValues.nextScheduledService.format('YYYY-MM-DD');
      }
      if (formattedValues.registrationDate && moment.isMoment(formattedValues.registrationDate)) {
        formattedValues.registrationDate = formattedValues.registrationDate.format('YYYY-MM-DD');
      }
      
      // Add all form values
      Object.keys(formattedValues).forEach(key => {
        if (formattedValues[key] !== undefined && formattedValues[key] !== null) {
          formData.append(key, formattedValues[key]);
        }
      });
      
      // Add brand logo
      formData.append('brandLogo', brandLogo);
      
      const url = isEditMode ? `/api/transportation/${id}` : '/api/transportation';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transportation');
      }
      
      message.success({
        content: `Транспортное средство успешно ${isEditMode ? 'обновлено' : 'добавлено'}`,
        icon: <CarOutlined />,
      });
      navigate('/transport');
    } catch (error) {
      console.error('Error saving transportation:', error);
      message.error(`Не удалось ${isEditMode ? 'обновить' : 'добавить'} транспортное средство`);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageChange = ({ fileList }) => {
    setFileList(fileList);
  };

  // Handle brand change to update logo
  const handleBrandChange = (value) => {
    const brand = BRANDS.find(b => b.value === value);
    setBrandLogo(brand ? brand.logo : '');
  };

  // Handle technical condition change
  const handleConditionChange = (value) => {
    setSelectedCondition(value);
  };

  // Handle cancel/back
  const handleCancel = () => {
    navigate('/transport');
  };

  return (
    <div className="transport-form-container">
      <div className="transport-form-header">
        <Title level={2}>
          <CarOutlined style={{ marginRight: 8 }} />
          {isEditMode ? 'Редактировать транспорт' : 'Добавить транспорт'}
        </Title>
        <Button 
          type="default" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleCancel}
          size="large"
        >
          Вернуться к списку
        </Button>
      </div>
      
      <Spin spinning={loading} size="large">
        <Card className="transport-form-card">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              technicalCondition: 'Исправен',
              fuelType: 'Дизель',
              transmissionType: 'Механическая',
              brand: 'МАЗ'
            }}
          >
            {/* Brand and basic info section */}
            <div className="form-section-title">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Основная информация
            </div>
            
            <Row gutter={[24, 12]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  name="brand"
                  label="Бренд"
                  rules={[{ required: true, message: 'Пожалуйста, выберите бренд' }]}
                >
                  <Select 
                    placeholder="Выберите бренд" 
                    onChange={handleBrandChange}
                    size="large"
                    dropdownRender={menu => (
                      <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
                          {brandLogo && (
                            <img 
                              src={brandLogo}
                              alt="Brand logo" 
                              style={{ maxHeight: '40px', maxWidth: '120px' }}
                            />
                          )}
                        </div>
                      </>
                    )}
                  >
                    {BRANDS.map(brand => (
                      <Option key={brand.value} value={brand.value}>
                        <div className="brand-select-option">
                          {brand.logo && (
                            <img 
                              src={brand.logo} 
                              alt={brand.value} 
                              className="brand-logo"
                            />
                          )}
                          {brand.value}
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  name="model"
                  label="Модель"
                  rules={[{ required: true, message: 'Пожалуйста, введите модель' }]}
                >
                  <Input 
                    placeholder="Введите модель транспорта" 
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  name="purpose"
                  label="Назначение"
                  rules={[{ required: true, message: 'Пожалуйста, выберите назначение' }]}
                >
                  <Select placeholder="Выберите назначение" size="large">
                    <Option value="Мусоровоз">Мусоровоз</Option>
                    <Option value="Грузовик">Грузовик</Option>
                    <Option value="Трактор">Трактор</Option>
                    <Option value="Фура">Фура</Option>
                    <Option value="Техпомощь">Техпомощь</Option>
                    <Option value="Самосвал">Самосвал</Option>
                    <Option value="Другое">Другое</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={6} lg={6}>
                <Form.Item
                  name="year"
                  label="Год выпуска"
                  rules={[{ required: true, message: 'Пожалуйста, введите год выпуска' }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={1950} 
                    max={2025} 
                    placeholder="Год выпуска" 
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={9} lg={6}>
                <Form.Item
                  name="licenseNumber"
                  label="Гос. номер"
                  rules={[{ required: true, message: 'Пожалуйста, введите гос. номер' }]}
                >
                  <Input 
                    placeholder="Например, А123ВС78" 
                    size="large"
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={9} lg={6}>
                <Form.Item
                  name="registrationDate"
                  label="Дата регистрации"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    placeholder="Выберите дату"
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={24} lg={6}>
                <Form.Item
                  name="technicalCondition"
                  label="Техническое состояние"
                  rules={[{ required: true, message: 'Пожалуйста, выберите состояние' }]}
                >
                  <Select 
                    placeholder="Выберите состояние" 
                    size="large"
                    onChange={handleConditionChange}
                  >
                    {Object.keys(TECH_CONDITION_MAP).map(condition => (
                      <Option key={condition} value={condition}>
                        <Tag 
                          color={TECH_CONDITION_MAP[condition].color}
                          className={`transport-status-tag ${TECH_CONDITION_MAP[condition].className}`}
                        >
                          {condition}
                        </Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            {/* Technical specifications section */}
            <div className="form-section-title">
              <ToolOutlined style={{ marginRight: 8 }} />
              Технические характеристики
            </div>
            
            <Row gutter={[24, 12]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  name="fuelType"
                  label="Тип топлива"
                  rules={[{ required: true, message: 'Пожалуйста, выберите тип топлива' }]}
                >
                  <Select placeholder="Выберите тип топлива" size="large">
                    <Option value="Дизель">Дизель</Option>
                    <Option value="Бензин">Бензин</Option>
                    <Option value="Газ">Газ</Option>
                    <Option value="Электрический">Электрический</Option>
                    <Option value="Гибрид">Гибрид</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  name="transmissionType"
                  label="Тип трансмиссии"
                  rules={[{ required: true, message: 'Пожалуйста, выберите тип трансмиссии' }]}
                >
                  <Select placeholder="Выберите тип трансмиссии" size="large">
                    <Option value="Механическая">Механическая</Option>
                    <Option value="Автоматическая">Автоматическая</Option>
                    <Option value="Роботизированная">Роботизированная</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={24} lg={8}>
                <Form.Item
                  name="assignedEmployeeId"
                  label="Ответственный сотрудник"
                >
                  <Select 
                    placeholder="Выберите сотрудника" 
                    size="large"
                    showSearch
                    optionFilterProp="children"
                  >
                    {employees.map(emp => (
                      <Option key={emp.Employee_ID} value={emp.Employee_ID}>
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} />
                          {emp.Full_Name}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            {/* Maintenance section */}
            <div className="form-section-title">
              <CalendarOutlined style={{ marginRight: 8 }} />
              Техническое обслуживание
            </div>
                        
            <Row gutter={[24, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastMaintenance"
                  label="Дата последнего ТО"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    placeholder="Выберите дату"
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="nextScheduledService"
                  label="Дата следующего ТО"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    placeholder="Выберите дату"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            {/* Image and description section */}
            <div className="form-section-title">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Изображение и описание
            </div>
            
            <Row gutter={[24, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="image"
                  label="Изображение транспорта"
                >
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleImageChange}
                    beforeUpload={() => false} // Prevent auto-upload
                    maxCount={1}
                  >
                    {fileList.length === 0 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Выбрать фото</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="description"
                  label="Описание"
                >
                  <TextArea 
                    rows={6} 
                    placeholder="Введите описание транспортного средства" 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <div className="form-actions">
              <Button 
                type="default" 
                onClick={handleCancel}
                size="large"
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                size="large"
              >
                {isEditMode ? 'Обновить' : 'Сохранить'} транспорт
              </Button>
            </div>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default TransportForm;