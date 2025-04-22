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
  Upload, // Keep Upload import
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
  InboxOutlined // Import InboxOutlined for Dragger
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import '../../styles/Transport/TransportForm.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload; // Destructure Dragger

// ... (rest of the imports and component setup remains the same) ...

const BRANDS = [
  { value: 'МАЗ', logo: 'https://cdn.worldvectorlogo.com/logos/maz.svg' },
  { value: 'Volvo', logo: 'https://cdn.worldvectorlogo.com/logos/volvo.svg' },
  { value: 'МТЗ', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_kTqoxHahVX00BLsmSk5re3_zB208xN6LlHU1cVA6A_nQ=s900-c-k-c0x00ffffff-no-rj' },
  { value: 'MAN', logo: 'https://cdn.worldvectorlogo.com/logos/man-logo.svg' },
  { value: 'ГАЗ', logo: 'https://vitterra-yug.ru/image/catalog/manufactures/GAZ.png' },
  { value: 'КАМАЗ', logo: 'https://upload.wikimedia.org/wikipedia/ru/thumb/a/af/KAMAZ_Logo.svg/500px-KAMAZ_Logo.svg.png?20211121025007' },
  { value: 'Другое', logo: '' }
];

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

  // ... (useEffect hooks and other functions remain the same) ...

  // Handle image upload
  const handleImageChange = ({ fileList: newFileList }) => {
    // Ensure only the latest file is kept if maxCount is 1
    setFileList(newFileList.slice(-1)); 
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
        // If it's an existing image in edit mode, don't re-append, 
        // but you might need a way to signal the backend not to delete it.
        // Or handle image deletion separately. For now, we assume backend keeps image if not replaced.
      } else if (fileList.length === 0 && isEditMode) {
          // Handle case where user removed the existing image
          formData.append('remove_image', 'true'); // Example: Signal backend to remove
      }
      
      // Format dates if they exist
      const formattedValues = { ...values };
      if (formattedValues.lastMaintenance && moment.isMoment(formattedValues.lastMaintenance)) {
        formattedValues.lastMaintenance = formattedValues.lastMaintenance.format('YYYY-MM-DD');
      } else {
         delete formattedValues.lastMaintenance; // Don't send if empty
      }
      // Removed nextScheduledService handling
      if (formattedValues.registrationDate && moment.isMoment(formattedValues.registrationDate)) {
        formattedValues.registrationDate = formattedValues.registrationDate.format('YYYY-MM-DD');
      } else {
         delete formattedValues.registrationDate;
      }
      
      // Add all other form values
      Object.keys(formattedValues).forEach(key => {
        // Don't append the 'image' field itself from values, handle via fileList
        if (key !== 'image' && formattedValues[key] !== undefined && formattedValues[key] !== null) {
           // Handle empty strings specifically if needed, e.g., assignedEmployeeId
           if (key === 'assignedEmployeeId' && formattedValues[key] === '') {
             formData.append(key, ''); // Or handle as null if backend prefers
           } else {
             formData.append(key, formattedValues[key]);
           }
        } else if (key === 'assignedEmployeeId' && formattedValues[key] === null) {
             formData.append(key, ''); // Send empty string if null/unselected
        }
      });
      
      // Add brand logo (assuming this is needed by backend)
      formData.append('brandLogo', brandLogo); 
      
      const url = isEditMode ? `/api/transportation/${id}` : '/api/transportation';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        body: formData // Sending FormData, no need for Content-Type header usually
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

  // Custom request function for Upload component (optional, if you need more control)
  // If you use beforeUpload={() => false}, this isn't strictly necessary as upload is manual
  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  // Fetch data for edit mode (Modified to handle image state correctly)
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
          const formattedData = {
            brand: data.Brand,
            model: data.Model,
            year: data.Year,
            licenseNumber: data.LicenseNumber,
            purpose: data.Purpose,
            fuelType: data.FuelType,
            transmissionType: data.TransmissionType,
            technicalCondition: data.TechnicalCondition,
            assignedEmployeeId: data.AssignedEmployee_ID || null, // Ensure null if empty
            lastMaintenance: data.LastMaintenance ? moment(data.LastMaintenance) : null,
            // Removed nextScheduledService
            registrationDate: data.RegistrationDate ? moment(data.RegistrationDate) : null,
            // Do not set 'image' field value here for the form
          };
          
          setInitialData(formattedData);
          form.setFieldsValue(formattedData); // Set form values without image
          
          setBrandLogo(data.BrandLogo || '');
          setSelectedCondition(data.TechnicalCondition || 'Исправен');
          
          // Set file list for image preview if there's an image URL or Base64 data
          if (data.Image) { // Assuming data.Image contains the URL or Base64 string
             const imageUrl = typeof data.Image === 'string' && data.Image.startsWith('data:image') 
                ? data.Image // It's base64
                : `/api/images/${data.Image}`; // Or construct URL if it's just an ID/filename

            setFileList([
              {
                uid: '-1', // Static uid for existing image
                name: data.ImageName || 'transport-image.jpg', // Use a real name if available
                status: 'done',
                url: imageUrl, 
                // No originFileObj for existing images from server
              }
            ]);
          } else {
             setFileList([]); // Ensure fileList is empty if no image
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
      const defaultBrand = BRANDS.find(b => b.value === 'МАЗ');
      setBrandLogo(defaultBrand ? defaultBrand.logo : '');
      setSelectedCondition('Исправен');
      setFileList([]); // Start with empty file list for new form
      form.resetFields(); // Reset form fields for new entry
      form.setFieldsValue({ // Set default values after reset
         technicalCondition: 'Исправен',
         fuelType: 'Дизель',
         transmissionType: 'Механическая',
         brand: 'МАЗ'
      });
    }
  }, [id, form, navigate, isEditMode]); // Dependencies


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
            // Remove initialValues from here, set dynamically in useEffect
          >
            {/* Brand and basic info section */}
            <div className="form-section-title">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Основная информация
            </div>
            
            {/* ... (Rest of the form fields: Brand, Model, Purpose, etc.) ... */}
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
                    // ... (dropdownRender remains the same) ...
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
              
              {/* ... Other fields in this row ... */}
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
            </Row>
             <Row gutter={[24, 12]}>
               <Col xs={24} md={6} lg={6}>
                 <Form.Item
                   name="year"
                   label="Год выпуска"
                   rules={[{ required: true, message: 'Пожалуйста, введите год выпуска' }, { type: 'number', min: 1900, max: new Date().getFullYear() + 1, message: 'Введите корректный год' }]}
                 >
                   <InputNumber 
                     style={{ width: '100%' }} 
                     placeholder="Год" 
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
            {/* Moved lastMaintenance here as the 4th form */}
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
                   <Select placeholder="Выберите тип топлива" size="large">
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
                   <Select placeholder="Выберите тип трансмиссии" size="large">
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
                   // No longer required? If so, remove rules. If required, add rules back.
                 >
                   <Select 
                     placeholder="Выберите сотрудника или оставьте пустым" 
                     size="large"
                     showSearch
                     allowClear // Allow unselecting
                     optionFilterProp="children"
                     filterOption={(input, option) =>
                       option.children[1].toLowerCase().includes(input.toLowerCase())
                     }
                   >
                     {employees.map(emp => (
                       <Option key={emp.Employee_ID} value={emp.Employee_ID}>
                         <Space>
                           <Avatar size="small" src={emp.Avatar || undefined} icon={!emp.Avatar ? <UserOutlined /> : undefined} />
                           {emp.Full_Name}
                         </Space>
                       </Option>
                     ))}
                   </Select>
                 </Form.Item>
               </Col>
               
               {/* Added lastMaintenance field here as the 4th form */}
               <Col xs={24} md={12} lg={6}>
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
             </Row>

            <Divider />
            
            {/* Image section - Using Dragger */}
            <div className="form-section-title">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Изображение транспорта
            </div>
            
            <Row gutter={[24, 12]}>
              <Col xs={24}> {/* Make dragger full width on small screens */}
                 {/* Removed Form.Item wrapper for Dragger to allow custom layout if needed */}
                 {/* Label can be added manually above Dragger if desired */}
                 <Text style={{ display: 'block', marginBottom: 8 }}>Фотография транспорта (необязательно)</Text>
                 <Dragger
                    name="imageFile"
                    // listType="picture-card" // REMOVE THIS LINE
                    fileList={fileList}
                    onChange={handleImageChange}
                    beforeUpload={() => false}
                    maxCount={1}
                    accept="image/*"
                    customRequest={dummyRequest}
                    onRemove={() => { setFileList([]); }}
                    style={{ background: '#fafafa', border: '2px dashed #d9d9d9', padding: '20px' }}
                 >
                    {/* The content here (icon and text) is automatically hidden */}
                    {/* by Dragger when fileList is not empty */}
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Нажмите или перетащите файл сюда для загрузки</p>
                    <p className="ant-upload-hint">
                      Загрузите одно изображение (например, JPG, PNG).
                    </p>
                 </Dragger>
                 {/* Note: Form.Item validation for the image itself might be tricky */}
                 {/* If image is required, you might need custom validation logic */}
                 {/* based on fileList state outside of the standard Form.Item rules */}
              </Col>
            </Row>
            
            <div className="form-actions">
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                size="large"
                loading={loading} // Show loading state on submit button
                className="transport-submit-button"
              >
                {isEditMode ? 'Обновить' : 'Добавить'} транспорт
              </Button>
              <Button 
                type="default" 
                onClick={handleCancel}
                size="large"
                disabled={loading} // Disable cancel while submitting
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