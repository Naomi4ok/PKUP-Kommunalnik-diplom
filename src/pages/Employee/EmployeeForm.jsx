import React, { useState, useEffect, useRef } from 'react';
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
  Breadcrumb
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  HomeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import '../../styles/Employee/EmployeeForm.css';
import TimeRangePicker from '../../components/TimeRangePicker';
import AvatarUploadForm from '../../components/AvatarUploadForm';

const { Title } = Typography;
const { Option } = Select;

const EmployeeForm = () => {
  const { id } = useParams(); // Получение ID сотрудника из URL при редактировании
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [timeRange, setTimeRange] = useState({ from: '', to: '' });
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
  
  // Состояние для фото
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  
  // Refs и состояние для ввода телефона
  const inputRef = useRef(null);
  const [phoneValue, setPhoneValue] = useState('+375');
  const [cursorPosition, setCursorPosition] = useState(4);
  
  // Загрузка данных сотрудника при редактировании
  useEffect(() => {
    fetchPositionsAndDepartments();
    
    if (id) {
      setIsEditing(true);
      fetchEmployeeData(id);
    }
  }, [id]);

  // Получение всех уникальных должностей и отделов
  const fetchPositionsAndDepartments = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Извлечение уникальных должностей и отделов
      const uniquePositions = Array.from(
        new Set(data.map(emp => emp.Position).filter(Boolean))
      );
      
      const uniqueDepartments = Array.from(
        new Set(data.map(emp => emp.Department).filter(Boolean))
      );
      
      setPositions(uniquePositions);
      setDepartments(uniqueDepartments);
      
    } catch (err) {
      message.error(`Не удалось загрузить должности и отделы: ${err.message}`);
    }
  };

  // Перевод английских типов графиков работы на русский
  const translateWorkScheduleToRussian = (workSchedule) => {
    switch(workSchedule) {
      case 'Flexible':
        return 'Гибкий';
      case 'Shift Work':
        return 'Сменный';
      default:
        return workSchedule;
    }
  };

  // Перевод русских типов графиков работы на английский
  const translateWorkScheduleToEnglish = (workSchedule) => {
    switch(workSchedule) {
      case 'Гибкий':
        return 'Flexible';
      case 'Сменный':
        return 'Shift Work';
      case 'Свой':
        return 'Custom';
      default:
        return workSchedule;
    }
  };

  // Получение данных сотрудника для редактирования
  const fetchEmployeeData = async (employeeId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      
      const employee = await response.json();
      
      // Разделение полного имени на имя, отчество и фамилию
      const nameParts = employee.Full_Name ? employee.Full_Name.split(' ') : ['', '', ''];
      const firstName = nameParts[0] || '';
      const middleName = nameParts[1] || '';
      const lastName = nameParts.slice(2).join(' ') || '';
      
      // Определение типа рабочего графика и значения
      let workScheduleType = 'Гибкий'; // По умолчанию Гибкий
      let initialTimeRange = { from: '', to: '' };
      
      if (employee.Work_Schedule === 'Flexible' || employee.Work_Schedule === 'Shift Work') {
        workScheduleType = translateWorkScheduleToRussian(employee.Work_Schedule);
        setShowTimeRangePicker(false);
      } else if (employee.Work_Schedule) {
        // Проверка, похоже ли на формат временного диапазона (содержит "to")
        const timeRangeMatch = employee.Work_Schedule.match(/(\d+:\d+\s*(?:AM|PM)?)\s*to\s*(\d+:\d+\s*(?:AM|PM)?)/i);
        if (timeRangeMatch) {
          workScheduleType = 'Свой';
          initialTimeRange = { 
            from: timeRangeMatch[1].trim(),
            to: timeRangeMatch[2].trim()
          };
          setTimeRange(initialTimeRange);
          setShowTimeRangePicker(true);
        } else {
          // Если не соответствует известному формату, по умолчанию "Свой"
          workScheduleType = 'Свой';
          setShowTimeRangePicker(true);
        }
      }
      
      // Установка начальных значений формы
      const formValues = {
        firstName,
        middleName,
        lastName,
        position: employee.Position || '',
        department: employee.Department || '',
        status: employee.Status === 'Active' ? 'Активен' : 
                employee.Status === 'On Leave' ? 'В отпуске' : 
                employee.Status === 'Terminated' ? 'Уволен' : 
                employee.Status || 'Активен',
        workScheduleType,
      };
      
      setInitialValues(formValues);
      form.setFieldsValue(formValues);
      
      // Установка номера телефона, если доступен
      if (employee.Contact_Details) {
        setPhoneValue(employee.Contact_Details);
      }
      
      // Если у сотрудника есть фото, устанавливаем URL предпросмотра
      if (employee.Photo) {
        const imageUrl = `data:image/jpeg;base64,${employee.Photo}`;
        setPhotoPreviewUrl(imageUrl);
      }
      
    } catch (err) {
      message.error(`Не удалось загрузить данные сотрудника: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Создание объекта FormData для обработки загрузки файла
      const formData = new FormData();
      
      // Объединение имени, отчества и фамилии
      const fullName = `${values.firstName} ${values.middleName || ''} ${values.lastName}`.replace(/\s+/g, ' ').trim();
      formData.append('fullName', fullName);
      formData.append('position', values.position || '');
      formData.append('department', values.department || '');
      formData.append('contactDetails', phoneValue);
      
      // Обработка рабочего графика на основе выбора
      let workSchedule = '';
      
      // Получение английского значения типа графика для сервера
      const workScheduleTypeEng = translateWorkScheduleToEnglish(values.workScheduleType);
      
      if (workScheduleTypeEng === 'Flexible' || workScheduleTypeEng === 'Shift Work') {
        workSchedule = workScheduleTypeEng;
      } else if (workScheduleTypeEng === 'Custom') {
        // Форматирование временного диапазона как "from to to"
        if (timeRange.from && timeRange.to) {
          workSchedule = `От ${timeRange.from} до ${timeRange.to}`;
        }
      }
      
      formData.append('workSchedule', workSchedule);
      
      // Преобразование статуса сотрудника в английский
      const statusMap = {
        'Активен': 'Active',
        'В отпуске': 'On Leave',
        'Уволен': 'Terminated'
      };
      
      formData.append('status', statusMap[values.status] || values.status || 'Active');
      
      // Добавление файла фото, если он существует
      if (employeePhoto && employeePhoto.selectedImage) {
        formData.append('photo', employeePhoto.selectedImage);
      }

      let response;
      
      if (isEditing) {
        // Обновление существующего сотрудника
        response = await fetch(`/api/employees/${id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        // Добавление нового сотрудника
        response = await fetch('/api/employees', {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }

      // Сообщение об успехе
      message.success(`Сотрудник успешно ${isEditing ? 'обновлен' : 'добавлен'}!`);
      
      // Переход обратно к списку сотрудников
      navigate('/employees');
      
    } catch (err) {
      message.error(`Не удалось ${isEditing ? 'обновить' : 'добавить'} сотрудника: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Обработка загрузки аватара
  const handleAvatarUpload = (photoData) => {
    setEmployeePhoto(photoData);
  };

  // Форматирование номера телефона в белорусском формате
  const formatPhoneNumber = (value) => {
    // Убедимся, что значение начинается с +375
    if (!value.startsWith('+375')) {
      value = '+375' + value.replace(/^\+375/, '');
    }
    
    // Удаляем все нецифровые символы после префикса +375
    const prefix = '+375';
    const phoneDigits = value.substring(prefix.length).replace(/[^\d]/g, '');
    
    // Применяем форматирование в зависимости от количества введенных цифр
    if (phoneDigits.length === 0) {
      return prefix;
    } else if (phoneDigits.length <= 2) {
      return `${prefix}(${phoneDigits}`;
    } else if (phoneDigits.length <= 5) {
      return `${prefix}(${phoneDigits.substring(0, 2)})${phoneDigits.substring(2)}`;
    } else if (phoneDigits.length <= 7) {
      return `${prefix}(${phoneDigits.substring(0, 2)})${phoneDigits.substring(2, 5)}-${phoneDigits.substring(5)}`;
    } else if (phoneDigits.length <= 9) {
      return `${prefix}(${phoneDigits.substring(0, 2)})${phoneDigits.substring(2, 5)}-${phoneDigits.substring(5, 7)}-${phoneDigits.substring(7)}`;
    } else {
      // Ограничиваем до 9 цифр (2 для кода региона, 7 для номера)
      return `${prefix}(${phoneDigits.substring(0, 2)})${phoneDigits.substring(2, 5)}-${phoneDigits.substring(5, 7)}-${phoneDigits.substring(7, 9)}`;
    }
  };

  // Обработка изменения телефонного ввода
  const handlePhoneChange = (e) => {
    // Сохраняем позицию курсора перед обновлением
    const selectionStart = e.target.selectionStart;
    
    const { value } = e.target;
    
    // Форматируем номер телефона
    const formattedValue = formatPhoneNumber(value);
    
    // Обновляем состояние
    setPhoneValue(formattedValue);
    
    // Рассчитываем корректировку позиции курсора на основе добавленных символов форматирования
    let newPosition = selectionStart;
    
    // Проверяем, находится ли курсор в позиции, где только что был добавлен символ форматирования
    if (formattedValue.length > value.length) {
      // Если форматирование добавило символы, корректируем позицию курсора вперед
      newPosition = Math.min(formattedValue.length, selectionStart + (formattedValue.length - value.length));
    }
    
    // Сохраняем позицию курсора для применения после рендеринга
    setCursorPosition(newPosition);
  };

  // Обновление позиции курсора после изменения значения
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [phoneValue, cursorPosition]);

  // Обработка изменения типа рабочего графика
  const handleWorkScheduleTypeChange = (value) => {
    form.setFieldsValue({ workScheduleType: value });
    setShowTimeRangePicker(value === 'Свой');
  };

  // Обработка изменения временного диапазона из TimeRangePicker
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Проверка номера телефона
  const validatePhoneNumber = (_, value) => {
    if (!phoneValue || phoneValue === '+375') {
      return Promise.reject('Пожалуйста, введите номер телефона');
    }
    
    // Проверяем, соответствует ли номер телефона белорусскому формату
    const isValid = /^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/.test(phoneValue);
    
    if (!isValid) {
      return Promise.reject('Пожалуйста, введите действительный белорусский номер телефона: +375(XX)YYY-YY-YY');
    }
    
    return Promise.resolve();
  };

  return (
    <div className="employee-form-container">
      <Breadcrumb className="employee-form-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/employees">
          Сотрудники
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditing ? 'Редактирование сотрудника' : 'Добавление сотрудника'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="employee-form-card">
        <div className="employee-form-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/employees')}
            className="back-button"
          >
            Назад к списку сотрудников
          </Button>
          <Title level={2} className="employee-form-title">
            {isEditing ? 'Редактирование сотрудника' : 'Добавление сотрудника'}
          </Title>
        </div>
        
        <Spin spinning={loading} tip="Загрузка...">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            className="employee-form"
          >
            {/* Двухколоночный макет с аватаром слева, полями формы справа */}
            <Row gutter={32}>
              {/* Левая колонка: загрузка аватара */}
              <Col xs={24} md={8}>
                <div className="avatar-upload-section-left">
                  <AvatarUploadForm
                    onAvatarUpload={handleAvatarUpload}
                    maxSizeInMB={5}
                    initialImageUrl={photoPreviewUrl}
                  />
                </div>
              </Col>
              
              {/* Правая колонка: поля основной информации */}
              <Col xs={24} md={16}>
                <div className="basic-info-section">
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="firstName"
                        label="Имя"
                        rules={[{ required: true, message: 'Пожалуйста, введите имя' }]}
                      >
                        <Input placeholder="Введите имя" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="middleName"
                        label="Отчество"
                        rules={[{ required: true, message: 'Пожалуйста, введите отчество' }]}
                      >
                        <Input placeholder="Введите отчество" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="lastName"
                        label="Фамилия"
                        rules={[{ required: true, message: 'Пожалуйста, введите фамилию' }]}
                      >
                        <Input placeholder="Введите фамилию" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="position"
                        label="Должность"
                      >
                        <Select
                          showSearch
                          placeholder="Выберите или введите должность"
                          optionFilterProp="children"
                          allowClear
                          mode="tags"
                        >
                          {positions.map(position => (
                            <Option key={position} value={position}>
                              {position}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="department"
                        label="Отдел"
                      >
                        <Select
                          showSearch
                          placeholder="Выберите или введите отдел"
                          optionFilterProp="children"
                          allowClear
                          mode="tags"
                        >
                          {departments.map(department => (
                            <Option key={department} value={department}>
                              {department}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
            
            {/* Поля на всю ширину под двумя колонками */}
            <Row className="additional-fields-section">
              <Col xs={24}>
                <Form.Item
                  label="Контактные данные (Телефон)"
                  rules={[{ validator: validatePhoneNumber }]}
                >
                  <div className="phone-input-wrapper">
                    <Input 
                      ref={inputRef}
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      className="phone-input"
                    />
                    {phoneValue === '+375' && (
                      <div className="phone-placeholder">
                        <span className="prefix">+375</span>
                        <span className="format">(XX)YYY-YY-YY</span>
                      </div>
                    )}
                  </div>
                </Form.Item>
                
                <Form.Item
                  name="workScheduleType"
                  label="Тип рабочего графика"
                  rules={[{ required: true, message: 'Пожалуйста, выберите тип рабочего графика' }]}
                >
                  <Select 
                    placeholder="Выберите тип рабочего графика"
                    onChange={handleWorkScheduleTypeChange}
                  >
                    <Option value="Гибкий">Гибкий</Option>
                    <Option value="Сменный">Сменный</Option>
                    <Option value="Свой">Свой график</Option>
                  </Select>
                </Form.Item>
                
                {showTimeRangePicker && (
                  <Form.Item
                    label="Выберите рабочие часы"
                    required={true}
                  >
                    <TimeRangePicker 
                      label=""
                      onChange={handleTimeRangeChange}
                      initialFromTime={timeRange.from}
                      initialToTime={timeRange.to}
                      required={true}
                    />
                  </Form.Item>
                )}
                
                <Form.Item
                  name="status"
                  label="Статус сотрудника"
                  rules={[{ required: true, message: 'Пожалуйста, выберите статус сотрудника' }]}
                >
                  <Select placeholder="Выберите статус">
                    <Option value="Активен">Активен</Option>
                    <Option value="В отпуске">В отпуске</Option>
                    <Option value="Уволен">Уволен</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  className="employee-submit-button" 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  size="large"
                >
                  {isEditing ? 'Обновить сотрудника' : 'Добавить сотрудника'}
                </Button>
                <Button 
                  onClick={() => navigate('/employees')}
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

export default EmployeeForm;