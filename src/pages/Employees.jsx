import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Upload,
  Space,
  Card,
  Typography,
  message,
  Popconfirm,
  Spin,
  Tag,
  Modal,
  Divider,
  Dropdown
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileExcelOutlined,
  MoreOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '../styles/Employees.css';
import SearchBar from '../components/SearchBar';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Employee');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Update filtered employees when employees change
  useEffect(() => {
    setFilteredEmployees(employees);
  }, [employees]);

  // Fetch all employees from the database
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      message.error(`Failed to fetch employees: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  const handleSearch = (query) => {
    if (query.trim() === '') {
      setFilteredEmployees(employees);
      return;
    }
    
    const searchQuery = query.toLowerCase();
    const filtered = employees.filter(employee => {
      return (
        (employee.Full_Name && employee.Full_Name.toLowerCase().includes(searchQuery)) ||
        (employee.Position && employee.Position.toLowerCase().includes(searchQuery)) ||
        (employee.Department && employee.Department.toLowerCase().includes(searchQuery)) ||
        (employee.Contact_Details && employee.Contact_Details.toLowerCase().includes(searchQuery)) ||
        (employee.Work_Schedule && employee.Work_Schedule.toLowerCase().includes(searchQuery)) ||
        (employee.Status && employee.Status.toLowerCase().includes(searchQuery))
      );
    });
    
    setFilteredEmployees(filtered);
  };

  // Export employees to Excel
  const exportToExcel = () => {
    try {
      // Create a clean dataset without photos and with formatted data
      const exportData = employees.map(employee => ({
        'Full Name': employee.Full_Name,
        'Position': employee.Position || '',
        'Department': employee.Department || '',
        'Contact Details': employee.Contact_Details || '',
        'Work Schedule': employee.Work_Schedule || '',
        'Status': employee.Status || 'Active'
      }));
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 25 }, // Full Name
        { wch: 20 }, // Position
        { wch: 20 }, // Department
        { wch: 30 }, // Contact Details
        { wch: 20 }, // Work Schedule
        { wch: 15 }  // Status
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
      
      // Generate and download the Excel file
      const filename = `Employees_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Employees exported successfully!');
    } catch (err) {
      message.error(`Failed to export employees: ${err.message}`);
    }
  };

  // Show modal for adding or editing employee
  const showModal = (employee = null) => {
    setModalTitle(employee ? 'Edit Employee' : 'Add Employee');
    setEditingEmployee(employee);
    
    // Reset form and file list
    form.resetFields();
    setFileList([]);
    
    if (employee) {
      // Populate form with employee data
      form.setFieldsValue({
        fullName: employee.Full_Name,
        position: employee.Position || '',
        department: employee.Department || '',
        contactDetails: employee.Contact_Details || '',
        workSchedule: employee.Work_Schedule || '',
        status: employee.Status || 'Active',
      });
      
      // If employee has a photo, add it to the file list
      if (employee.Photo) {
        setFileList([{
          uid: '-1',
          name: 'employee-photo.jpg',
          status: 'done',
          url: `data:image/jpeg;base64,${employee.Photo}`,
        }]);
      }
    }
    
    setModalVisible(true);
  };

  // Handle modal cancel
  const handleCancel = () => {
    setModalVisible(false);
  };

  // Handle form submission (add or update employee)
  const handleSubmit = async (values) => {
    // Create FormData object to handle file upload
    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('position', values.position || '');
    formData.append('department', values.department || '');
    formData.append('contactDetails', values.contactDetails || '');
    formData.append('workSchedule', values.workSchedule || '');
    formData.append('status', values.status || 'Active');
    
    // Get file from fileList if it exists
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('photo', fileList[0].originFileObj);
    }

    try {
      let response;
      
      if (editingEmployee) {
        // Update existing employee
        response = await fetch(`/api/employees/${editingEmployee.Employee_ID}`, {
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
      message.success(`Employee ${editingEmployee ? 'updated' : 'added'} successfully!`);
      
      // Close the modal and refresh employee list
      setModalVisible(false);
      fetchEmployees();
    } catch (err) {
      message.error(`Failed to ${editingEmployee ? 'update' : 'add'} employee: ${err.message}`);
    }
  };

  // Handle employee deletion
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      message.success('Employee deleted successfully!');
      fetchEmployees();
    } catch (err) {
      message.error(`Failed to delete employee: ${err.message}`);
    }
  };

  // Handle file upload change
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Handle image preview
  const handlePreview = async (file) => {
    if (file.url) {
      setPreviewImage(file.url);
    } else if (file.originFileObj) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file.originFileObj);
    }
    setPreviewVisible(true);
  };

  // Define table columns
  const columns = [
    {
      title: 'Photo',
      dataIndex: 'Photo',
      key: 'photo',
      width: 80,
      render: (photo) => (
        photo ? (
          <img 
            src={`data:image/jpeg;base64,${photo}`} 
            alt="Employee" 
            className="ant-employee-photo"
            onClick={() => {
              setPreviewImage(`data:image/jpeg;base64,${photo}`);
              setPreviewVisible(true);
            }}
          />
        ) : (
          <div className="ant-employee-photo-placeholder">
            <UserOutlined />
          </div>
        )
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'Full_Name',
      key: 'fullName',
      sorter: (a, b) => a.Full_Name.localeCompare(b.Full_Name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search name"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => record.Full_Name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Position',
      dataIndex: 'Position',
      key: 'position',
      sorter: (a, b) => (a.Position || '').localeCompare(b.Position || ''),
    },
    {
      title: 'Department',
      dataIndex: 'Department',
      key: 'department',
      filters: Array.from(new Set(employees.map(e => e.Department).filter(Boolean))).map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => record.Department === value,
    },
    {
      title: 'Contact Details',
      dataIndex: 'Contact_Details',
      key: 'contactDetails',
      ellipsis: true,
    },
    {
      title: 'Work Schedule',
      dataIndex: 'Work_Schedule',
      key: 'workSchedule',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'On Leave', value: 'On Leave' },
        { text: 'Terminated', value: 'Terminated' },
      ],
      onFilter: (value, record) => record.Status === value,
      render: (status) => {
        let color = 'green';
        if (status === 'On Leave') {
          color = 'gold';
        } else if (status === 'Terminated') {
          color = 'red';
        }
        
        return (
          <Tag color={color}>
            {status || 'Active'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Edit',
                icon: <EditOutlined />,
                onClick: () => showModal(record)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Delete employee"
                    description="Are you sure you want to delete this employee?"
                    onConfirm={() => handleDelete(record.Employee_ID)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <span className="dropdown-delete-label">Delete</span>
                  </Popconfirm>,
                icon: <DeleteOutlined />,
                danger: true
              }
            ]
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            className="action-more-button"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="ant-employees-container">
      <Title level={2}>Employees Management</Title>
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
          <div className="employees-search-bar-container">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search employees by name, position, department..."
              autoFocus={false}
            />
          </div>
            <Space>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />} 
                onClick={exportToExcel}
                className="ant-export-button"
              >
                Export
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => showModal()}
                className="ant-add-button"
              >
                Add Employee
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <Spin spinning={loading}>
            <Table 
              dataSource={filteredEmployees} 
              columns={columns} 
              rowKey="Employee_ID"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
              }}
              scroll={{ x: 'max-content' }}
            />
          </Spin>
        </div>
      </Card>
      
      {/* Add/Edit Employee Modal */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'Active',
          }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>
          
          <Form.Item
            name="position"
            label="Position"
          >
            <Input placeholder="Enter position" />
          </Form.Item>
          
          <Form.Item
            name="department"
            label="Department"
          >
            <Input placeholder="Enter department" />
          </Form.Item>
          
          <Form.Item
            name="contactDetails"
            label="Contact Details"
          >
            <TextArea rows={2} placeholder="Enter contact details (phone, email, etc.)" />
          </Form.Item>
          
          <Form.Item
            name="workSchedule"
            label="Work Schedule"
          >
            <Input placeholder="Enter work schedule" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="On Leave">On Leave</Option>
              <Option value="Terminated">Terminated</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="photo"
            label="Photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
          >
            <Upload
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
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingEmployee ? 'Update' : 'Add'}
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default Employees;