import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import AvatarUploadForm from '../AvatarUploadForm';
import './UserManagement.css';

const { Option } = Select;

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch users on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

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
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
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

  // Table columns
  const columns = [
    {
      title: 'Аватар',
      dataIndex: 'Avatar',
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
        <div className="user-avatar-container">
          {avatar ? (
            <img 
              src={avatar} 
              alt={`${record.Username} avatar`} 
              className="user-avatar-thumbnail"
            />
          ) : (
            <div className="user-avatar-placeholder">
              {record.Username ? record.Username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Имя пользователя',
      dataIndex: 'Username',
      key: 'username',
    },
    {
      title: 'ФИО',
      dataIndex: 'Full_Name',
      key: 'fullName',
    },
    {
      title: 'Роль',
      dataIndex: 'Role',
      key: 'role',
      render: (role) => role === 'admin' ? 'Администратор' : 'Пользователь'
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'email',
    },
    {
      title: 'Статус',
      dataIndex: 'Status',
      key: 'status',
      render: (status) => (
        <span className={`status-badge ${status === 'active' ? 'active' : 'inactive'}`}>
          {status === 'active' ? 'Активен' : 'Неактивен'}
        </span>
      )
    },
    {
      title: 'Последний вход',
      dataIndex: 'Last_Login',
      key: 'lastLogin',
    },
    {
      title: 'Дата создания',
      dataIndex: 'Created_At',
      key: 'createdAt',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <div className="action-buttons">
          <Button 
            type="primary" 
            onClick={() => showEditModal(record)}
            disabled={user?.User_ID === record.User_ID && record.Role === 'admin'}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Вы уверены, что хотите удалить этого пользователя?"
            onConfirm={() => handleDeleteUser(record.User_ID)}
            okText="Да"
            cancelText="Нет"
            disabled={user?.User_ID === record.User_ID}
          >
            <Button 
              danger 
              disabled={user?.User_ID === record.User_ID}
            >
              Удалить
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

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
      <div className="page-header">
        <h1>Управление пользователями</h1>
        <Button 
          type="primary" 
          onClick={showAddModal}
          className="add-user-button"
        >
          Добавить пользователя
        </Button>
      </div>

      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="User_ID"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUser ? "Изменить пользователя" : "Добавить пользователя"}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <div className="user-form-container">
          <div className="avatar-upload-section">
            <AvatarUploadForm 
              onAvatarUpload={handleAvatarUpload}
              initialImageUrl={editingUser ? editingUser.Avatar : null}
            />
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="user-form"
          >
            <Form.Item
              name="username"
              label="Имя пользователя"
              rules={[{ required: true, message: 'Пожалуйста, введите имя пользователя' }]}
            >
              <Input placeholder="Имя пользователя" />
            </Form.Item>

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

            <Form.Item
              name="fullName"
              label="ФИО"
            >
              <Input placeholder="Фамилия Имя Отчество" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { type: 'email', message: 'Некорректный формат email' }
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>

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

            <Form.Item className="form-actions">
              <Button onClick={handleCancel}>Отмена</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Сохранить' : 'Создать'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;