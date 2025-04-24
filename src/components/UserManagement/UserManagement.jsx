import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './UserManagement.css';

const { Option } = Select;

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);

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
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (user) => {
    setEditingUser(user);
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
  };

  const handleSubmit = async (values) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      if (editingUser) {
        // Update existing user
        const response = await axios.put(`/api/auth/users/${editingUser.User_ID}`, {
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          role: values.role,
          status: values.status || 'active'
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          message.success('Пользователь успешно обновлен');
          fetchUsers();
          setModalVisible(false);
        }
      } else {
        // Create new user
        const response = await axios.post('/api/auth/users', {
          username: values.username,
          password: values.password,
          fullName: values.fullName,
          email: values.email,
          role: values.role
        }, {
          headers: {
            Authorization: `Bearer ${token}`
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

  // Table columns
  const columns = [
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
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
      </Modal>
    </div>
  );
};

export default UserManagement;