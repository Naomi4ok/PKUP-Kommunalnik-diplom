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
import '../styles/EmployeeForm.css';
import TimeRangePicker from '../components/TimeRangePicker';
import AvatarUploadForm from '../components/AvatarUploadForm';

const { Title } = Typography;
const { Option } = Select;

const EmployeeForm = () => {
  const { id } = useParams(); // Get employee ID from URL if editing
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [timeRange, setTimeRange] = useState({ from: '', to: '' });
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
  
  // Photo state
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  
  // Phone input refs and state
  const inputRef = useRef(null);
  const [phoneValue, setPhoneValue] = useState('+375');
  const [cursorPosition, setCursorPosition] = useState(4);
  
  // Load employee data if editing
  useEffect(() => {
    fetchPositionsAndDepartments();
    
    if (id) {
      setIsEditing(true);
      fetchEmployeeData(id);
    }
  }, [id]);

  // Fetch all unique positions and departments
  const fetchPositionsAndDepartments = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract unique positions and departments
      const uniquePositions = Array.from(
        new Set(data.map(emp => emp.Position).filter(Boolean))
      );
      
      const uniqueDepartments = Array.from(
        new Set(data.map(emp => emp.Department).filter(Boolean))
      );
      
      setPositions(uniquePositions);
      setDepartments(uniqueDepartments);
      
    } catch (err) {
      message.error(`Failed to fetch positions and departments: ${err.message}`);
    }
  };

  // Fetch employee data for editing
  const fetchEmployeeData = async (employeeId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const employee = await response.json();
      
      // Split full name into first and last name
      const nameParts = employee.Full_Name ? employee.Full_Name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Determine work schedule type and value
      let workScheduleType = 'Flexible'; // Default to Flexible
      let initialTimeRange = { from: '', to: '' };
      
      if (employee.Work_Schedule === 'Flexible' || employee.Work_Schedule === 'Shift Work') {
        workScheduleType = employee.Work_Schedule;
        setShowTimeRangePicker(false);
      } else if (employee.Work_Schedule) {
        // Check if it looks like a time range format (contains "to")
        const timeRangeMatch = employee.Work_Schedule.match(/(\d+:\d+\s*(?:AM|PM)?)\s*to\s*(\d+:\d+\s*(?:AM|PM)?)/i);
        if (timeRangeMatch) {
          workScheduleType = 'Custom';
          initialTimeRange = { 
            from: timeRangeMatch[1].trim(),
            to: timeRangeMatch[2].trim()
          };
          setTimeRange(initialTimeRange);
          setShowTimeRangePicker(true);
        } else {
          // If it doesn't match any known format, default to Custom
          workScheduleType = 'Custom';
          setShowTimeRangePicker(true);
        }
      }
      
      // Set initial form values
      const formValues = {
        firstName,
        lastName,
        position: employee.Position || '',
        department: employee.Department || '',
        status: employee.Status || 'Active',
        workScheduleType,
      };
      
      setInitialValues(formValues);
      form.setFieldsValue(formValues);
      
      // Set phone number if available
      if (employee.Contact_Details) {
        setPhoneValue(employee.Contact_Details);
      }
      
      // If employee has a photo, set the preview URL
      if (employee.Photo) {
        const imageUrl = `data:image/jpeg;base64,${employee.Photo}`;
        setPhotoPreviewUrl(imageUrl);
      }
      
    } catch (err) {
      message.error(`Failed to fetch employee data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Create FormData object to handle file upload
      const formData = new FormData();
      
      // Combine first and last name
      const fullName = `${values.firstName} ${values.lastName}`.trim();
      formData.append('fullName', fullName);
      formData.append('position', values.position || '');
      formData.append('department', values.department || '');
      formData.append('contactDetails', phoneValue);
      
      // Handle work schedule based on selection
      let workSchedule = '';
      
      if (values.workScheduleType === 'Flexible' || values.workScheduleType === 'Shift Work') {
        workSchedule = values.workScheduleType;
      } else if (values.workScheduleType === 'Custom') {
        // Format the time range as "from to to"
        if (timeRange.from && timeRange.to) {
          workSchedule = `${timeRange.from} to ${timeRange.to}`;
        }
      }
      
      formData.append('workSchedule', workSchedule);
      formData.append('status', values.status || 'Active');
      
      // Add the photo file if it exists
      if (employeePhoto && employeePhoto.selectedImage) {
        formData.append('photo', employeePhoto.selectedImage);
      }

      let response;
      
      if (isEditing) {
        // Update existing employee
        response = await fetch(`/api/employees/${id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        // Add new employee
        response = await fetch('/api/employees', {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Success message
      message.success(`Employee ${isEditing ? 'updated' : 'added'} successfully!`);
      
      // Navigate back to the employees list
      navigate('/employees');
      
    } catch (err) {
      message.error(`Failed to ${isEditing ? 'update' : 'add'} employee: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = (photoData) => {
    setEmployeePhoto(photoData);
  };

  // Phone number formatter for Belarus format
  const formatPhoneNumber = (value) => {
    // Make sure value starts with +375
    if (!value.startsWith('+375')) {
      value = '+375' + value.replace(/^\+375/, '');
    }
    
    // Remove all non-digit characters after the +375 prefix
    const prefix = '+375';
    const phoneDigits = value.substring(prefix.length).replace(/[^\d]/g, '');
    
    // Apply formatting based on the number of digits entered
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
      // Limit to 9 digits (2 for area code, 7 for number)
      return `${prefix}(${phoneDigits.substring(0, 2)})${phoneDigits.substring(2, 5)}-${phoneDigits.substring(5, 7)}-${phoneDigits.substring(7, 9)}`;
    }
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    // Save cursor position before update
    const selectionStart = e.target.selectionStart;
    
    const { value } = e.target;
    
    // Format the phone number
    const formattedValue = formatPhoneNumber(value);
    
    // Update the state
    setPhoneValue(formattedValue);
    
    // Calculate cursor position adjustment based on added formatting characters
    let newPosition = selectionStart;
    
    // Check if the cursor is at a position where a format character was just added
    if (formattedValue.length > value.length) {
      // If formatting added characters, adjust cursor position forward
      newPosition = Math.min(formattedValue.length, selectionStart + (formattedValue.length - value.length));
    }
    
    // Store cursor position to apply after render
    setCursorPosition(newPosition);
  };

  // Update cursor position after value change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [phoneValue, cursorPosition]);

  // Handle work schedule type change
  const handleWorkScheduleTypeChange = (value) => {
    form.setFieldsValue({ workScheduleType: value });
    setShowTimeRangePicker(value === 'Custom');
  };

  // Handle time range change from TimeRangePicker
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Validate the phone number
  const validatePhoneNumber = (_, value) => {
    if (!phoneValue || phoneValue === '+375') {
      return Promise.reject('Please enter a phone number');
    }
    
    // Check if the phone number matches the Belarus format
    const isValid = /^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/.test(phoneValue);
    
    if (!isValid) {
      return Promise.reject('Please enter a valid Belarusian phone number: +375(XX)YYY-YY-YY');
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
          Employees
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditing ? 'Edit Employee' : 'Add Employee'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="employee-form-card">
        <div className="employee-form-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/employees')}
            className="back-button"
          >
            Back to Employees
          </Button>
          <Title level={2} className="employee-form-title">
            {isEditing ? 'Edit Employee' : 'Add Employee'}
          </Title>
        </div>
        
        <Spin spinning={loading}>
          {/* Employee Photo Upload Section - Moved to the top */}
          <div className="avatar-upload-section">
            <AvatarUploadForm
              onAvatarUpload={handleAvatarUpload}
              maxSizeInMB={5}
              initialImageUrl={photoPreviewUrl}
            />
          </div>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            className="employee-form"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="firstName"
                  label="First Name"
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastName"
                  label="Last Name"
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="position"
                  label="Position"
                >
                  <Select
                    showSearch
                    placeholder="Select or enter position"
                    optionFilterProp="children"
                    allowClear
                    mode="tags"
                    maxTagCount={0}
                    maxTagPlaceholder={(omittedValues) => `${omittedValues.length} selected`}
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
                  label="Department"
                >
                  <Select
                    showSearch
                    placeholder="Select or enter department"
                    optionFilterProp="children"
                    allowClear
                    mode="tags"
                    maxTagCount={0}
                    maxTagPlaceholder={(omittedValues) => `${omittedValues.length} selected`}
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
            
            <Form.Item
              label="Contact Details (Phone)"
              rules={[{ validator: validatePhoneNumber }]}
            >
              <Input 
                ref={inputRef}
                placeholder="+375(XX)YYY-YY-YY" 
                value={phoneValue}
                onChange={handlePhoneChange}
              />
            </Form.Item>
            
            <Form.Item
              name="workScheduleType"
              label="Work Schedule Type"
              rules={[{ required: true, message: 'Please select work schedule type' }]}
            >
              <Select 
                placeholder="Select work schedule type"
                onChange={handleWorkScheduleTypeChange}
              >
                <Option value="Flexible">Flexible</Option>
                <Option value="Shift Work">Shift Work</Option>
                <Option value="Custom">Custom Schedule</Option>
              </Select>
            </Form.Item>
            
            {showTimeRangePicker && (
              <Form.Item
                label="Select Work Hours"
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
              label="Employee Status"
              rules={[{ required: true, message: 'Please select employee status' }]}
            >
              <Select placeholder="Select status">
                <Option value="Active">Active</Option>
                <Option value="On Leave">On Leave</Option>
                <Option value="Terminated">Terminated</Option>
              </Select>
            </Form.Item>
            
            <Form.Item className="form-actions">
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  size="large"
                >
                  {isEditing ? 'Update Employee' : 'Add Employee'}
                </Button>
                <Button 
                  onClick={() => navigate('/employees')}
                  size="large"
                >
                  Cancel
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