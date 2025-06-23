import React, { useState, useEffect, useContext } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Typography,
  Breadcrumb,
  Dropdown,
  Spin,
  Tag,
  Divider,
  Row,
  Col,
  Avatar,
  Space
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  FilterOutlined,
  EllipsisOutlined,
  UserOutlined,
  SearchOutlined,
  SaveOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import AvatarUploadForm from '../AvatarUploadForm';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import { formatToMoscowTime } from '../../utils/dateUtils';
import './UserManagement.css';

const { Option } = Select;
const { Title } = Typography;

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [roles, setRoles] = useState(['admin', 'user']);
  const [statuses, setStatuses] = useState(['active', 'inactive']);
  
  // Filter values
  const [filterValues, setFilterValues] = useState({
    roles: [],
    statuses: []
  });

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch users on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Update filtered users when users list or filters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [users, filterValues, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get('/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  const applyFiltersAndSearch = () => {
    let filtered = [...users];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.Username && item.Username.toLowerCase().includes(query)) ||
          (item.Full_Name && item.Full_Name.toLowerCase().includes(query)) ||
          (item.Email && item.Email.toLowerCase().includes(query))
        );
      });
    }
    
    // Apply role filter
    if (filterValues.roles.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.roles.includes(item.Role)
      );
    }
    
    // Apply status filter
    if (filterValues.statuses.length > 0) {
      filtered = filtered.filter(item => 
        filterValues.statuses.includes(item.Status)
      );
    }
    
    setFilteredUsers(filtered);
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterValues({
      roles: [],
      statuses: []
    });
  };

  // Handle search function
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const showAddModal = () => {
    setEditingUser(null);
    setAvatarFile(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (user) => {
    setEditingUser(user);
    setAvatarFile(null);
    form.setFieldsValue({
      username: user.Username,
      fullName: user.Full_Name,
      email: user.Email,
      role: user.Role,
      status: user.Status
    });
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setAvatarFile(null);
  };

  const handleSubmit = async (values) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('fullName', values.fullName || '');
      formData.append('email', values.email || '');
      formData.append('role', values.role);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      if (editingUser) {
        // Update existing user
        formData.append('status', values.status || 'active');
        
        const response = await axios.put(`/api/auth/users/${editingUser.User_ID}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          message.success('Пользователь успешно обновлен');
          fetchUsers();
          setModalVisible(false);
        }
      } else {
        // Create new user
        formData.append('password', values.password);
        
        const response = await axios.post('/api/auth/users', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          message.success('Пользователь успешно создан');
          fetchUsers();
          setModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.error || 'Произошла ошибка при сохранении';
      message.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.delete(`/api/auth/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        message.success('Пользователь успешно удален');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.error || 'Произошла ошибка при удалении';
      message.error(errorMessage);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = (avatarData) => {
    if (avatarData.selectedImage) {
      setAvatarFile(avatarData.selectedImage);
    }
  };

  // Handle page change for custom pagination
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  // Render status tag with appropriate color
  const renderStatusTag = (status) => {
    const color = status === 'active' ? 'green' : 'red';
    const text = status === 'active' ? 'Активен' : 'Неактивен';
    
    return (
      <Tag color={color}>
        {text}
      </Tag>
    );
  };

  // Table columns
  const columns = [
    {
      title: 'Фото',
      dataIndex: 'Avatar',
      key: 'avatar',
      width: 80,
      render: (avatar, record) => {
        // Get user's initials for avatar fallback
        const getUserInitials = () => {
          if (record.Full_Name) {
            // Get initials from full name
            return record.Full_Name.split(' ').map(n => n[0]).join('').toUpperCase();
          } else if (record.Username) {
            // Use first letter of username as fallback
            return record.Username[0].toUpperCase();
          }
          // Default fallback
          return 'U';
        };
        
        return (
          <div className="user-avatar-container">
            {avatar ? (
              <img 
                src={avatar} 
                alt={`${record.Username} avatar`} 
                className="user-avatar-thumbnail"
              />
            ) : (
              <Avatar
                size={40}
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: '#0AB101',
                  color: '#fff'
                }}
              >
                {getUserInitials()}
              </Avatar>
            )}
          </div>
        );
      }
    },
    {
      title: 'Логин',
      dataIndex: 'Username',
      key: 'username',
      sorter: (a, b) => a.Username.localeCompare(b.Username),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Поиск по имени"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Поиск
            </Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
              Сброс
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => record.Username.toLowerCase().includes(value.toLowerCase()),
      render: (text, record) => (
        <div>
          <div className="user-name">{text}</div>
          {record.Email && <div className="user-email">{record.Email}</div>}
        </div>
      ),
    },
    {
      title: 'ФИО',
      dataIndex: 'Full_Name',
      key: 'fullName',
      sorter: (a, b) => {
        if (!a.Full_Name) return -1;
        if (!b.Full_Name) return 1;
        return a.Full_Name.localeCompare(b.Full_Name);
      },
    },
    {
      title: 'Роль',
      dataIndex: 'Role',
      key: 'role',
      filters: [
        { text: 'Администратор', value: 'admin' },
        { text: 'Пользователь', value: 'user' },
      ],
      onFilter: (value, record) => record.Role === value,
      render: (role) => (
        <Tag color={role === 'admin' ? 'blue' : 'cyan'}>
          {role === 'admin' ? 'Администратор' : 'Пользователь'}
        </Tag>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'Status',
      key: 'status',
      render: renderStatusTag,
      filters: [
        { text: 'Активен', value: 'active' },
        { text: 'Неактивен', value: 'inactive' },
      ],
      onFilter: (value, record) => record.Status === value,
    },
    {
      title: 'Последний вход',
      dataIndex: 'Last_Login',
      key: 'lastLogin',
      sorter: (a, b) => {
        if (!a.Last_Login) return 1;
        if (!b.Last_Login) return -1;
        return new Date(b.Last_Login) - new Date(a.Last_Login);
      },
      render: (timestamp) => formatToMoscowTime(timestamp) // Используем утилиту
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Редактировать',
                icon: <EditOutlined />,
                onClick: () => showEditModal(record),
                disabled: user?.User_ID === record.User_ID && record.Role === 'admin'
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление пользователя"
                    description="Вы уверены, что хотите удалить этого пользователя?"
                    onConfirm={() => handleDeleteUser(record.User_ID)}
                    okText="Да"
                    cancelText="Нет"
                    disabled={user?.User_ID === record.User_ID}
                  >
                    <span className="dropdown-delete-label">Удалить</span>
                  </Popconfirm>,
                icon: <DeleteOutlined />,
                danger: true,
                disabled: user?.User_ID === record.User_ID
              }
            ]
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<EllipsisOutlined />}
            className="action-more-button"
            disabled={user?.User_ID === record.User_ID}
          />
        </Dropdown>
      ),
    },
  ];

  // Calculate data for display on current page
  const paginatedData = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!isAdmin) {
    return (
      <div className="no-access-container">
        <h2>Доступ запрещен</h2>
        <p>У вас нет прав для управления пользователями.</p>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Breadcrumbs */}
      <Breadcrumb className="user-management-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Управление пользователями
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <div className="user-page-header-wrapper">
          <div className="ant-page-header">
            {/* Left side header */}
            <div className="header-left-content">
              <Title level={2}>Управление пользователями</Title>
            </div>
            
            {/* Right side header */}
            <div className="header-right-content">
              {/* Filter button */}
              <Button
                type="primary" 
                icon={<FilterOutlined />}
                onClick={toggleFilters}
                className="ant-filter-button"
              >
                Фильтр
              </Button>
              
              {/* Search bar */}
              <div className="user-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск пользователей"
                  autoFocus={false}
                />
              </div>
              
              {/* Add user button */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showAddModal}
                className="ant-add-button"
              >
                Добавить пользователя
              </Button>
            </div>
          </div>
          
          {/* Filter panel */}
          {showFilters && (
            <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
              <div className="filter-panel-header">
                <h4>Фильтр пользователей</h4>
                <Button 
                  className="ant-filreset-button"
                  type="link"
                  onClick={resetFilters}
                >
                  Сбросить все фильтры
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* Role filter */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Роль</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите роль"
                      value={filterValues.roles}
                      onChange={(values) => handleFilterChange('roles', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      <Option value="admin">Администратор</Option>
                      <Option value="user">Пользователь</Option>
                    </Select>
                  </div>
                </Col>
                
                {/* Status filter */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Статус</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите статус"
                      value={filterValues.statuses}
                      onChange={(values) => handleFilterChange('statuses', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      <Option value="active">Активен</Option>
                      <Option value="inactive">Неактивен</Option>
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>
          )}
          
          <Divider />
          
          <Spin spinning={loading}>
            {/* Table without built-in pagination */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="User_ID"
              pagination={false} // Disable built-in pagination
              scroll={{ x: 'max-content' }}
            />
            
            {/* Custom pagination component */}
            <Pagination
              totalItems={filteredUsers.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 20, 50]}
              initialPageSize={pageSize}
            />
          </Spin>
        </div>
      </Card>

      {/* User modal */}
      <Modal
        title={editingUser ? "Изменить пользователя" : "Добавить пользователя"}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
        className="user-form-modal"
      >
        <div className="user-form-container">
          <div className="avatar-upload-section">
            <AvatarUploadForm 
              onAvatarUpload={handleAvatarUpload}
              initialImageUrl={editingUser ? editingUser.Avatar : null}
              maxSizeInMB={5}
            />
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="user-form"
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="username"
                  label="Логин"
                  rules={[{ required: true, message: 'Пожалуйста, введите имя пользователя' }]}
                >
                  <Input placeholder="Логин" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                {!editingUser && (
                  <Form.Item
                    name="password"
                    label="Пароль"
                    rules={[
                      { required: true, message: 'Пожалуйста, введите пароль' },
                      { min: 6, message: 'Пароль должен быть не менее 6 символов' }
                    ]}
                  >
                    <Input.Password placeholder="Пароль" />
                  </Form.Item>
                )}
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label="ФИО"
                >
                  <Input placeholder="Фамилия Имя Отчество" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { type: 'email', message: 'Некорректный формат email' }
                  ]}
                >
                  <Input placeholder="email@example.com" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="role"
                  label="Роль пользователя"
                  rules={[{ required: true, message: 'Пожалуйста, выберите роль' }]}
                  initialValue="user"
                >
                  <Select>
                    <Option value="user">Пользователь</Option>
                    <Option value="admin">Администратор</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                {editingUser && (
                  <Form.Item
                    name="status"
                    label="Статус"
                    initialValue="active"
                  >
                    <Select>
                      <Option value="active">Активен</Option>
                      <Option value="inactive">Неактивен</Option>
                    </Select>
                  </Form.Item>
                )}
              </Col>
            </Row>

            <Form.Item className="form-actions">
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  size="large"
                  className="user-submit-button"
                >
                  {editingUser ? 'Сохранить' : 'Создать'}
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
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;