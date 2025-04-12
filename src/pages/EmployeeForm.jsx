import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  Card,
  Typography,
  Row,
  Col,
  message,
  TimePicker,
  Spin,
  Space,
  Breadcrumb
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  SaveOutlined,
  HomeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import '../styles/EmployeeForm.css';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const EmployeeForm = () => {
  const { id } = useParams(); // Get employee ID from URL if editing
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  
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
      let workScheduleType = 'Custom';
      let workScheduleCustom = '';
      let workScheduleTime = null;
      
      if (employee.Work_Schedule === 'Flexible' || employee.Work_Schedule === 'Shift Work') {
        workScheduleType = employee.Work_Schedule;
      } else if (employee.Work_Schedule) {
        // Check if it looks like a time format (contains ":" and possibly AM/PM)
        if (/\d+:\d+/.test(employee.Work_Schedule)) {
          workScheduleType = 'Time';
          workScheduleTime = dayjs(employee.Work_Schedule, 'HH:mm');
        } else {
          workScheduleType = 'Custom';
          workScheduleCustom = employee.Work_Schedule;
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
        workScheduleCustom,
        workScheduleTime,
      };
      
      setInitialValues(formValues);
      form.setFieldsValue(formValues);
      
      // Set phone number if available
      if (employee.Contact_Details) {
        setPhoneValue(employee.Contact_Details);
      }
      
      // If employee has a photo, add it to the file list
      if (employee.Photo) {
        setFileList([{
          uid: '-1',
          name: 'employee-photo.jpg',
          status: 'done',
          url: `data:image/jpeg;base64,${employee.Photo}`,
        }]);
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
      
      if (values.workScheduleType === 'Time' && values.workScheduleTime) {
        workSchedule = values.workScheduleTime.format('HH:mm');
      } else if (values.workScheduleType === 'Custom') {
        workSchedule = values.workScheduleCustom || '';
      } else {
        workSchedule = values.workScheduleType || '';
      }
      
      formData.append('workSchedule', workSchedule);
      formData.append('status', values.status || 'Active');
      
      // Get file from fileList if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('photo', fileList[0].originFileObj);
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

  // Handle file upload change
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Handle preview for uploaded image
  const handlePreview = async (file) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
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
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            className="employee-form"
          >
            {/* Move Employee Photo to the top */}
            <Form.Item
              name="photo"
              label="Employee Photo"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e && e.fileList;
              }}
              className="employee-photo-field"
            >
              <Upload
                name="photo"
                listType="picture-card"
                fileList={fileList}
                onChange={handleUploadChange}
                onPreview={handlePreview}
                beforeUpload={() => false} // Prevent automatic upload
                maxCount={1}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
            
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
                <Option value="Time">Specific Time</Option>
                <Option value="Custom">Custom Schedule</Option>
              </Select>
            </Form.Item>
            
            {form.getFieldValue('workScheduleType') === 'Time' && (
              <Form.Item
                name="workScheduleTime"
                label="Working Hours"
                rules={[{ required: true, message: 'Please select working hours' }]}
              >
                <TimePicker
                  use12Hours
                  format="h:mm A"
                  style={{ width: '100%' }}
                  placeholder="Select working hours"
                />
              </Form.Item>
            )}
            
            {form.getFieldValue('workScheduleType') === 'Custom' && (
              <Form.Item
                name="workScheduleCustom"
                label="Custom Work Schedule"
                rules={[{ required: true, message: 'Please enter custom work schedule' }]}
              >
                <Input placeholder="E.g., Mon-Fri 9:00-18:00" />
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