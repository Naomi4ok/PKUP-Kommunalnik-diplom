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
  Image,
  Upload
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ImportOutlined,
  MoreOutlined,
  InboxOutlined
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [importError, setImportError] = useState(''); // New state for tracking import errors

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
    setImportError(''); // Clear any previous errors
    setImportModalVisible(true);
  };

  // Handle import file change
  const handleImportFileChange = (info) => {
    console.log('File changed:', info);
    setImportFileList(info.fileList.slice(-1)); // Keep only the latest file
  };

  // Create a template for download
  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Position': 'Manager',
        'Department': 'IT',
        'Contact Details': '+375(29)123-45-67',
        'Work Schedule': '9:00 to 17:00',
        'Status': 'Active'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Position': 'Developer',
        'Department': 'Engineering',
        'Contact Details': '+375(33)765-43-21',
        'Work Schedule': 'Flexible',
        'Status': 'On Leave'
      }
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Download
    XLSX.writeFile(workbook, 'Employee_Import_Template.xlsx');
  };

  // Process the imported Excel file
  const handleImport = async () => {
    setImportError('');
    
    if (!importFileList || importFileList.length === 0) {
      setImportError('Please select an Excel file to import');
      message.error('Please select an Excel file to import');
      return;
    }

    const file = importFileList[0].originFileObj;
    console.log('Processing file:', file);
    
    if (!file) {
      setImportError('Invalid file object');
      message.error('Invalid file object');
      return;
    }
    
    setImporting(true);

    try {
      // Read the Excel file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        console.log('File loaded successfully');
        try {
          // Parse the Excel data
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          if (!worksheetName) {
            throw new Error('Excel file has no sheets');
          }
          
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON - more robust parsing with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
          
          console.log('Parsed Excel data:', jsonData);
          
          // Validate the data structure
          if (!jsonData || jsonData.length <= 1) { // Account for header row
            throw new Error('The Excel file is empty or has invalid data');
          }
          
          // Find the header row and identify column positions
          const headerRow = jsonData[0];
          const columns = {
            firstName: Object.keys(headerRow).find(key => headerRow[key] === 'First Name'),
            lastName: Object.keys(headerRow).find(key => headerRow[key] === 'Last Name'),
            position: Object.keys(headerRow).find(key => headerRow[key] === 'Position'),
            department: Object.keys(headerRow).find(key => headerRow[key] === 'Department'),
            contactDetails: Object.keys(headerRow).find(key => headerRow[key] === 'Contact Details'),
            workSchedule: Object.keys(headerRow).find(key => headerRow[key] === 'Work Schedule'),
            status: Object.keys(headerRow).find(key => headerRow[key] === 'Status')
          };
          
          if (!columns.firstName && !columns.lastName) {
            throw new Error('Excel file is missing First Name or Last Name columns');
          }
          
          // Map rows to our format, skipping header row
          const employees = jsonData.slice(1).map(row => {
            // Extract values using identified column positions
            const firstName = columns.firstName ? row[columns.firstName] || '' : '';
            const lastName = columns.lastName ? row[columns.lastName] || '' : '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            return {
              fullName: fullName,
              position: columns.position ? row[columns.position] || '' : '',
              department: columns.department ? row[columns.department] || '' : '',
              contactDetails: columns.contactDetails ? row[columns.contactDetails] || '' : '',
              workSchedule: columns.workSchedule ? row[columns.workSchedule] || '' : '',
              status: columns.status ? row[columns.status] || 'Active' : 'Active'
            };
          });
          
          // Filter out invalid entries (missing required fields)
          const validEmployees = employees.filter(emp => emp.fullName.trim() !== '');
          
          if (validEmployees.length === 0) {
            throw new Error('No valid employee data found. Full Name is required.');
          }
          
          console.log('Employees to import:', validEmployees);
          
          // Send the data to the server
          const response = await fetch('/api/employees/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employees: validEmployees })
          });
          
          console.log('Server response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Import failed');
          }
          
          const result = await response.json();
          console.log('Import result:', result);
          
          setImportModalVisible(false);
          message.success(`Successfully imported ${result.imported} employees`);
          fetchEmployees();
          
        } catch (err) {
          console.error('Import processing error:', err);
          setImportError(`Import failed: ${err.message}`);
          message.error(`Import failed: ${err.message}`);
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        setImportError('Failed to read file');
        message.error('Failed to read file');
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      console.error('Import error:', err);
      setImportError(`Import failed: ${err.message}`);
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
        open={previewVisible}
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

      {/* Import Modal with debugging improvements */}
      <Modal
        title="Import Employees from Excel"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="template" onClick={downloadTemplate} style={{ float: 'left' }}>
            Download Template
          </Button>,
          <Button key="cancel" onClick={() => setImportModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importing}
            onClick={handleImport}
            disabled={importFileList.length === 0}
          >
            Import
          </Button>
        ]}
      >
        <div className="import-instructions">
          <p>Please upload an Excel file with the following columns:</p>
          <ul>
            <li><strong>First Name</strong> (required)</li>
            <li><strong>Last Name</strong></li>
            <li>Position</li>
            <li>Department</li>
            <li>Contact Details</li>
            <li>Work Schedule</li>
            <li>Status</li>
          </ul>
        </div>

        {importError && (
          <div className="import-error" style={{ color: 'red', marginBottom: '10px' }}>
            Error: {importError}
          </div>
        )}

        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={() => false} // Prevent auto upload
          fileList={importFileList}
          onChange={handleImportFileChange}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single Excel file upload. Ensure your file has the required columns.
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default Employees;