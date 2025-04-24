import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);

  // Fetch users from API
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
      console.error('Error fetching users:', error);
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form submission for creating/editing user
  const handleSubmit = async (values) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      if (editingUser) {
        // Update existing user
        await axios.put(`/api/auth/users/${editingUser.User_ID}`, {
          username: values.username,
          fullName: values.fullName,
          role: values.role,
          email: values.email,
          status: values.status
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        message.success('Пользователь успешно обновлен');
      } else {
        // Create new user
        await axios.post('/api/auth/users', {
          username: values.username,
          password: values.password,
          fullName: values.fullName,
          role: values.role,
          email: values.email
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        message.success('Пользователь успешно создан');
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Произошла ошибка при сохранении пользователя');
      }
    }
  };

  // Handle user deletion
  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`/api/auth/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      message.success('Пользователь успешно удален');
      fetchUsers();
    } catch (error) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Произошла ошибка при удалении пользователя');
      }
    }
  };

  // Show modal for creating a new user
  const showCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Show modal for editing an existing user
  const showEditModal = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.Username,
      fullName: user.Full_Name,
      role: user.Role,
      email: user.Email,
      status: user.Status
    });
    setModalVisible(true);
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Логин',
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
      render: (status) => status === 'active' ? 'Активен' : 'Неактивен'
    },
    {
      title: 'Последний вход',
      dataIndex: 'Last_Login',
      key: 'lastLogin',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)} 
            type="primary"
            size="small"
          />
          <Popconfirm
            title="Вы уверены, что хотите удалить этого пользователя?"
            onConfirm={() => handleDelete(record.User_ID)}
            okText="Да"
            cancelText="Нет"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Управление пользователями</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          Добавить пользователя
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="User_ID" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      
      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Логин"
            rules={[
              { required: true, message: 'Пожалуйста, введите логин' },
              { min: 3, message: 'Логин должен содержать минимум 3 символа' }
            ]}
          >
            <Input />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              name="password"
              label="Пароль"
              rules={[
                { required: true, message: 'Пожалуйста, введите пароль' },
                { min: 6, message: 'Пароль должен содержать минимум 6 символов' }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          
          <Form.Item
            name="fullName"
            label="ФИО"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Пожалуйста, введите корректный email' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Роль"
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
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Сохранить' : 'Создать'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingUser(null);
              }}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;