import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Card,
  Typography,
  message,
  Popconfirm,
  Spin,
  Tag,
  Divider,
  Dropdown,
  Input,
  Modal,
  Image
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ImportOutlined,
  MoreOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '../styles/Employees.css';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';

const { Title } = Typography;

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  // New state for avatar preview
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

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

  // Handle avatar preview
  const handlePreview = (photo, name) => {
    if (photo) {
      setPreviewImage(`data:image/jpeg;base64,${photo}`);
      setPreviewTitle(name || 'Employee Photo');
      setPreviewVisible(true);
    }
  };

  // Handle closing the preview modal
  const handlePreviewCancel = () => {
    setPreviewVisible(false);
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
      const exportData = employees.map(employee => {
        // Split full name into first and last name if possible
        const nameParts = employee.Full_Name ? employee.Full_Name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          'First Name': firstName,
          'Last Name': lastName,
          'Position': employee.Position || '',
          'Department': employee.Department || '',
          'Contact Details': employee.Contact_Details || '',
          'Work Schedule': employee.Work_Schedule || '',
          'Status': employee.Status || 'Active'
        };
      });
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 15 }, // First Name
        { wch: 20 }, // Last Name
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

  // Open import modal
  const showImportModal = () => {
    setImportFileList([]);
    setImportModalVisible(true);
  };

  // Handle import file change
  const handleImportFileChange = ({ fileList }) => {
    setImportFileList(fileList);
  };

  // Process the imported Excel file
  const handleImport = async () => {
    if (importFileList.length === 0) {
      message.error('Please select an Excel file to import');
      return;
    }

    const file = importFileList[0].originFileObj;
    setImporting(true);

    try {
      // Read the Excel file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Parse the Excel data
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 2 });
          
          // Validate the data structure
          if (jsonData.length === 0) {
            throw new Error('The Excel file is empty or has invalid data.');
          }
          
          // Map Excel columns to database fields
          const employees = jsonData.map(row => {
            // Combine First Name and Last Name into Full Name
            const fullName = `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim();
            
            return {
              fullName: fullName || '',
              position: row['Position'] || '',
              department: row['Department'] || '',
              contactDetails: row['Contact Details'] || '',
              workSchedule: row['Work Schedule'] || '',
              status: row['Status'] || 'Active'
            };
          });
          
          // Filter out invalid entries (missing required fields)
          const validEmployees = employees.filter(emp => emp.fullName.trim() !== '');
          
          if (validEmployees.length === 0) {
            throw new Error('No valid employee data found. Full Name is required.');
          }
          
          // Send the data to the server
          const response = await fetch('/api/employees/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employees: validEmployees })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Import failed');
          }
          
          const result = await response.json();
          
          setImportModalVisible(false);
          message.success(`Successfully imported ${result.imported} employees`);
          fetchEmployees();
          
        } catch (err) {
          message.error(`Import failed: ${err.message}`);
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = () => {
        message.error('Failed to read file');
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      message.error(`Import failed: ${err.message}`);
      setImporting(false);
    }
  };

  // Navigate to add employee page
  const goToAddEmployee = () => {
    navigate('/employees/add');
  };

  // Navigate to edit employee page
  const goToEditEmployee = (id) => {
    navigate(`/employees/edit/${id}`);
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

  // Handle page change for custom pagination
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  // Define table columns
  const columns = [
    {
      title: 'Photo',
      dataIndex: 'Photo',
      key: 'photo',
      width: 80,
      render: (photo, record) => (
        photo ? (
          <img 
            src={`data:image/jpeg;base64,${photo}`} 
            alt="Employee" 
            className="ant-employee-photo"
            onClick={() => handlePreview(photo, record.Full_Name)}
            style={{ cursor: 'pointer' }}
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
      render: (text, record) => (
        <div>
          <div className="employee-name">{text}</div>
          {record.Position && <div className="employee-position">{record.Position}</div>}
        </div>
      ),
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
                onClick: () => goToEditEmployee(record.Employee_ID)
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
  
  // Calculate the data to be displayed on the current page
  const paginatedData = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ant-employees-container">
      <Title level={2}>Employees Management</Title>
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Left side: Export and Import buttons */}
            <div className="header-left-content">
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
                icon={<ImportOutlined />} 
                onClick={showImportModal}
                className="ant-import-button"
              >
                Import
              </Button>
            </div>
            
            {/* Right side: Search bar and Add Employee button */}
            <div className="header-right-content">
              {/* Search bar on the right side */}
              <div className="employees-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Search employees"
                  autoFocus={false}
                />
              </div>
              
              {/* Add Employee button after search bar */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={goToAddEmployee}
                className="ant-add-button"
              >
                Add Employee
              </Button>
            </div>
          </div>
          
          <Divider />
          
          <Spin spinning={loading}>
            {/* Table without built-in pagination */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="Employee_ID"
              pagination={false} // Disable built-in pagination
              scroll={{ x: 'max-content' }}
            />
            
            {/* Custom Pagination Component */}
            <Pagination
              totalItems={filteredEmployees.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 20, 50]}
              initialPageSize={pageSize}
            />
          </Spin>
        </div>
      </Card>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handlePreviewCancel}
      >
        <div className="employee-photo-preview-container">
          <img 
            alt="Employee Preview" 
            style={{ width: '100%' }} 
            src={previewImage} 
          />
        </div>
      </Modal>
    </div>
  );
};

export default Employees;