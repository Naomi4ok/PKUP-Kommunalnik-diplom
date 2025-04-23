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
  Tag,
  Breadcrumb
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined, 
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  InboxOutlined 
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import '../../styles/Transport/TransportForm.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

// Предопределенные бренды с логотипами
const BRANDS = [
  { value: 'МАЗ', logo: 'https://cdn.worldvectorlogo.com/logos/maz.svg' },
  { value: 'Volvo', logo: 'https://cdn.worldvectorlogo.com/logos/volvo.svg' },
  { value: 'МТЗ', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_kTqoxHahVX00BLsmSk5re3_zB208xN6LlHU1cVA6A_nQ=s900-c-k-c0x00ffffff-no-rj' },
  { value: 'MAN', logo: 'https://cdn.worldvectorlogo.com/logos/man-logo.svg' },
  { value: 'ГАЗ', logo: 'https://vitterra-yug.ru/image/catalog/manufactures/GAZ.png' },
  { value: 'КАМАЗ', logo: 'https://upload.wikimedia.org/wikipedia/ru/thumb/a/af/KAMAZ_Logo.svg/500px-KAMAZ_Logo.svg.png?20211121025007' },
];

// Заглушка для логотипа
const DEFAULT_LOGO = 'https://super-paket.ru/upload/iblock/d2f/o07y63dolv19fpbllb2b0eetk516iihc.jpg';

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
  const [customBrandMode, setCustomBrandMode] = useState(false);
  const [purposes, setPurposes] = useState([]); // Добавляем состояние для хранения списка назначений
  const isEditMode = !!id;

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        setEmployees(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        message.error('Не удалось загрузить список сотрудников');
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Получение всех уникальных назначений
  useEffect(() => {
    const fetchPurposes = async () => {
      try {
        const response = await fetch('/api/transportation');
        if (!response.ok) {
          throw new Error('Failed to fetch transportation data');
        }
        const data = await response.json();
        
        // Извлечение уникальных назначений
        const uniquePurposes = Array.from(
          new Set(data.map(transport => transport.Purpose).filter(Boolean))
        );
        
        setPurposes(uniquePurposes);
      } catch (error) {
        console.error('Error fetching purposes:', error);
        // Не показываем ошибку пользователю, просто логируем
      }
    };

    fetchPurposes();
  }, []);

  // Handle image upload
  const handleImageChange = ({ fileList: newFileList }) => {
    // Ensure only the latest file is kept if maxCount is 1
    setFileList(newFileList.slice(-1)); 
  };

  // Handle brand change to update logo
  const handleBrandChange = (value) => {
    // Проверяем, является ли выбранный бренд одним из предопределенных
    const brand = BRANDS.find(b => b.value === value);
    if (brand) {
      setBrandLogo(brand.logo);
      setCustomBrandMode(false);
    } else {
      setBrandLogo(DEFAULT_LOGO); // Используем заглушку для пользовательского бренда
      setCustomBrandMode(true);
    }
  };

  // Переключение в режим ввода пользовательского бренда
  const handleCustomBrandMode = () => {
    setCustomBrandMode(true);
    form.setFieldsValue({ brand: '' }); // Очищаем поле при переключении в режим ручного ввода
    setBrandLogo(DEFAULT_LOGO);
  };

  // Обработчик для возврата к выбору из списка
  const handleSelectListMode = () => {
    setCustomBrandMode(false);
    form.setFieldsValue({ brand: BRANDS[0].value }); // Выбираем первый бренд из списка
    setBrandLogo(BRANDS[0].logo);
  };

  // Handle technical condition change
  const handleConditionChange = (value) => {
    setSelectedCondition(value);
  };

  // Handle cancel/back
  const handleCancel = () => {
    navigate('/transport');
  };

   // Handle form submission
   const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Add image file if it exists and is a new file
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      } else if (fileList.length > 0 && !fileList[0].originFileObj && isEditMode) {
        // If it's an existing image in edit mode, don't re-append
      } else if (fileList.length === 0 && isEditMode) {
          // Handle case where user removed the existing image
          formData.append('remove_image', 'true');
      }
      
      // Format dates if they exist
      const formattedValues = { ...values };
      if (formattedValues.lastMaintenance && moment.isMoment(formattedValues.lastMaintenance)) {
        // Изменяем формат даты на DD.MM.YYYY
        formattedValues.lastMaintenance = formattedValues.lastMaintenance.format('DD.MM.YYYY');
      }
      
      // Add all other form values
      Object.keys(formattedValues).forEach(key => {
        if (key !== 'image' && formattedValues[key] !== undefined && formattedValues[key] !== null) {
           if (key === 'assignedEmployeeId' && formattedValues[key] === '') {
             formData.append(key, '');
           } else {
             formData.append(key, formattedValues[key]);
           }
        } else if (key === 'assignedEmployeeId' && formattedValues[key] === null) {
             formData.append(key, '');
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
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || 'Failed to save transportation');
      }
      
      message.success({
        content: `Транспортное средство успешно ${isEditMode ? 'обновлено' : 'добавлено'}`,
      });
      navigate('/transport');
    } catch (error) {
      console.error('Error saving transportation:', error);
      message.error(`Не удалось ${isEditMode ? 'обновить' : 'добавить'} транспортное средство: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Custom request function for Upload component
  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

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
          // Преобразуем дату из формата сервера в объект moment
          let maintenanceDate = null;
          if (data.LastMaintenance) {
            // Проверяем формат даты и преобразуем соответственно
            if (typeof data.LastMaintenance === 'string') {
              // Обрабатываем строковый формат даты, независимо от исходного представления
              maintenanceDate = moment(new Date(data.LastMaintenance));
            } else {
              // Если это не строка, пытаемся обработать как дату
              maintenanceDate = moment(data.LastMaintenance);
            }
          }
          
          const formattedData = {
            brand: data.Brand,
            model: data.Model,
            year: data.Year,
            licenseNumber: data.LicenseNumber,
            purpose: data.Purpose,
            fuelType: data.FuelType,
            transmissionType: data.TransmissionType,
            technicalCondition: data.TechnicalCondition,
            assignedEmployeeId: data.AssignedEmployee_ID || null,
            lastMaintenance: maintenanceDate,
          };
          
          setInitialData(formattedData);
          form.setFieldsValue(formattedData);
          
          // Проверяем, является ли бренд одним из предопределенных
          const isPredefinedBrand = BRANDS.some(b => b.value === data.Brand);
          setCustomBrandMode(!isPredefinedBrand);
          
          if (data.BrandLogo) {
            setBrandLogo(data.BrandLogo);
          } else {
            setBrandLogo(isPredefinedBrand 
              ? BRANDS.find(b => b.value === data.Brand)?.logo || DEFAULT_LOGO
              : DEFAULT_LOGO);
          }
          
          setSelectedCondition(data.TechnicalCondition || 'Исправен');
          
          // Set file list for image preview if there's an image URL or Base64 data
          if (data.Image) {
             const imageUrl = typeof data.Image === 'string' && data.Image.startsWith('data:image') 
                ? data.Image
                : `data:image/jpeg;base64,${data.Image}`;

            setFileList([
              {
                uid: '-1',
                name: data.ImageName || 'transport-image.jpg',
                status: 'done',
                url: imageUrl,
              }
            ]);
          } else {
             setFileList([]);
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
      // New form defaults
      const defaultBrand = BRANDS[0];
      setBrandLogo(defaultBrand.logo);
      setSelectedCondition('Исправен');
      setFileList([]);
      setCustomBrandMode(false);
      form.resetFields();
      form.setFieldsValue({
         technicalCondition: 'Исправен',
         fuelType: 'Дизель',
         transmissionType: 'Механическая',
         brand: defaultBrand.value
      });
    }
  }, [id, form, navigate, isEditMode]);


  return (
    <div className="transport-form-container">
      <Breadcrumb className="transport-form-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/transport">
          Транспорт
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditMode ? 'Редактирование транспорта' : 'Добавление транспорта'}
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <Card className="transport-form-card">
        <Spin spinning={loading} size="large">
          <div className="transport-form-header">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleCancel}
              className="back-button"
            >
              Назад к списку транспорта
            </Button>
            <Title level={2} className="transport-form-title">
              {isEditMode ? 'Редактирование транспорта' : 'Добавление транспорта'}
            </Title>
          </div>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
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
                  rules={[{ required: true, message: 'Пожалуйста, укажите бренд' }]}
                >
                  {customBrandMode ? (
                    <Input 
                      placeholder="Введите название бренда" 
                      suffix={
                        <Button 
                          type="link" 
                          onClick={handleSelectListMode}
                          style={{ marginRight: -7 }}
                        >
                          Выбрать из списка
                        </Button>
                      }
                    />
                  ) : (
                    <Select 
                      placeholder="Выберите бренд" 
                      onChange={handleBrandChange}
                      size="large"
                      dropdownRender={menu => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{ padding: '8px', textAlign: 'center' }}>
                            <Button type="link" onClick={handleCustomBrandMode}>
                              Ввести другой бренд
                            </Button>
                          </div>
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
                  )}
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
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  className="ant-transport-purpose"
                  name="purpose"
                  label="Назначение"
                  rules={[{ required: true, message: 'Пожалуйста, укажите назначение' }]}
                >
                  <Select 
                    placeholder="Введите или выберите назначение" 
                    showSearch
                    allowClear
                    mode="tags"
                  >
                    {purposes.map(purpose => (
                      <Option key={purpose} value={purpose}>
                        {purpose}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
             <Row gutter={[24, 12]}>
             <Col xs={24} md={12} lg={8}>
  <Form.Item
    name="year"
    label="Год выпуска"
    rules={[
      { required: true, message: 'Пожалуйста, выберите год выпуска' }
    ]}
    // Добавляем нормализацию значения, чтобы в форме сохранялся числовой год, а не moment объект
    getValueProps={(value) => {
      // Преобразуем числовое значение года в moment объект при загрузке данных
      return { value: value ? moment().year(value).startOf('year') : undefined };
    }}
    getValueFromEvent={(date) => {
      // Получаем из moment объекта числовое значение года при сохранении
      return date ? date.year() : null;
    }}
  >
    <DatePicker
      style={{ width: '100%' }}
      picker="year"
      placeholder="Выберите год"
      format="YYYY"
      disabledDate={(current) => {
        // Отключаем выбор будущих лет (кроме текущего) и годов до 1900
        return (current && current.year() > new Date().getFullYear()) || 
               (current && current.year() < 1900);
      }}
    />
  </Form.Item>
</Col>
               
<Col xs={24} md={12} lg={8}>
                 <Form.Item
                   name="licenseNumber"
                   label="Гос. номер"
                   rules={[{ required: true, message: 'Пожалуйста, введите гос. номер' }]}
                 >
                   <Input 
                     placeholder="Например, А123ВС78" 
                   />
                 </Form.Item>
               </Col>
               
               <Col xs={24} md={12} lg={8}>
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
              <Col xs={24} md={12} lg={6}>
                <Form.Item
                  name="fuelType"
                  label="Тип топлива"
                  rules={[{ required: true, message: 'Пожалуйста, выберите тип топлива' }]}
                >
                  <Select placeholder="Выберите тип топлива">
                    <Option value="Дизель">Дизель</Option>
                    <Option value="Бензин">Бензин</Option>
                    <Option value="Газ">Газ</Option>
                    <Option value="Электрический">Электрический</Option>
                    <Option value="Гибрид">Гибрид</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={6}>
                <Form.Item
                  name="transmissionType"
                  label="Тип трансмиссии"
                  rules={[{ required: true, message: 'Пожалуйста, выберите тип трансмиссии' }]}
                >
                  <Select placeholder="Выберите тип трансмиссии">
                    <Option value="Механическая">Механическая</Option>
                    <Option value="Автоматическая">Автоматическая</Option>
                    <Option value="Роботизированная">Роботизированная</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={6}>
                <Form.Item
                  name="assignedEmployeeId"
                  label="Ответственный сотрудник"
                >
                  <Select 
                    placeholder="Выберите сотрудника" 
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                      return option.children && 
                        typeof option.children.props.children[1] === 'string' && 
                        option.children.props.children[1].toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {employees.map(emp => (
                      <Option key={emp.Employee_ID} value={emp.Employee_ID}>
                        <Space>
                          <Avatar 
                            size="small" 
                            src={emp.Photo ? `data:image/jpeg;base64,${emp.Photo}` : undefined} 
                            icon={!emp.Photo ? <UserOutlined /> : undefined} 
                          />
                          {emp.Full_Name}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12} lg={6}>
                <Form.Item
                  name="lastMaintenance"
                  label="Дата последнего ТО"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    placeholder="Выберите дату"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            
            {/* Image section - Using Dragger */}
            <div className="form-section-title">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Изображение транспорта
            </div>
            
            <Row gutter={[24, 12]}>
              <Col xs={24}>
                <Text style={{ display: 'block', marginBottom: 8 }}>Фотография транспорта (необязательно)</Text>
                <Dragger
                   name="imageFile"
                   fileList={fileList}
                   onChange={handleImageChange}
                   beforeUpload={() => false}
                   maxCount={1}
                   accept="image/*"
                   customRequest={dummyRequest}
                   onRemove={() => { setFileList([]); }}
                   style={{ background: '#fafafa', border: '2px dashed #d9d9d9', padding: '20px' }}
                >
                   <p className="ant-upload-drag-icon">
                     <InboxOutlined />
                   </p>
                   <p className="ant-upload-text">Нажмите или перетащите файл сюда для загрузки</p>
                   <p className="ant-upload-hint">
                     Загрузите одно изображение (например, JPG, PNG).
                   </p>
                </Dragger>
              </Col>
            </Row>
            
            <div className="form-actions">
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
                className="transport-submit-button"
              >
                {isEditMode ? 'Обновить' : 'Добавить'} транспорт
              </Button>
              <Button 
                type="default" 
                onClick={handleCancel}
                size="large"
                disabled={loading}
              >
                Отмена
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default TransportForm;