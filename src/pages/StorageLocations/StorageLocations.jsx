import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Breadcrumb, 
  Spin, 
  Tabs,
  Row, 
  Col, 
  Tag, 
  Button, 
  Empty, 
  Modal, 
  Form, 
  Input, 
  message, 
  Popconfirm
} from 'antd';
import { 
  HomeOutlined, 
  ToolOutlined, 
  PartitionOutlined, 
  AppstoreOutlined, 
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import '../../styles/StorageLocations/StorageLocations.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const StorageLocations = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tools');
  const [storageLocations, setStorageLocations] = useState({
    tools: [],
    spares: [],
    materials: [],
    equipment: []
  });
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationType, setLocationType] = useState('tools');
  const [form] = Form.useForm();

  // Fetch all storage locations on component mount
  useEffect(() => {
    fetchStorageLocations();
  }, []);

  // Function to fetch storage locations
  const fetchStorageLocations = async () => {
    setLoading(true);
    try {
      // Fetch storage data for each type
      const toolsResponse = await fetch('/api/storage/tools');
      const sparesResponse = await fetch('/api/storage/spares');
      const materialsResponse = await fetch('/api/storage/materials');
      const equipmentResponse = await fetch('/api/storage/equipment');

      if (!toolsResponse.ok || !sparesResponse.ok || !materialsResponse.ok || !equipmentResponse.ok) {
        throw new Error('Failed to fetch storage locations');
      }

      const toolsData = await toolsResponse.json();
      const sparesData = await sparesResponse.json();
      const materialsData = await materialsResponse.json();
      const equipmentData = await equipmentResponse.json();

      setStorageLocations({
        tools: toolsData,
        spares: sparesData,
        materials: materialsData,
        equipment: equipmentData
      });
    } catch (error) {
      message.error(`Error fetching storage locations: ${error.message}`);
      // Placeholder data for demonstration
      setStorageLocations({
        tools: [
          { id: 1, name: 'Основной склад', description: 'Склад инструментов, главное здание', itemCount: 127 },
          { id: 2, name: 'Центральный гараж', description: 'Гараж для хранения ремонтных инструментов', itemCount: 45 },
          { id: 3, name: 'Инструментальная комната 1', description: 'Комната для хранения строительных инструментов', itemCount: 84 },
          { id: 4, name: 'Склад 3', description: 'Склад для хранения электроинструментов', itemCount: 32 }
        ],
        spares: [
          { id: 1, name: 'Склад запчастей №1', description: 'Основной склад для хранения запчастей', itemCount: 213 },
          { id: 2, name: 'Склад запчастей №2', description: 'Склад для хранения запчастей для спецтехники', itemCount: 78 },
          { id: 3, name: 'Гараж 2', description: 'Место для хранения автозапчастей', itemCount: 146 }
        ],
        materials: [
          { id: 1, name: 'Склад стройматериалов', description: 'Основной склад для хранения стройматериалов', itemCount: 95 },
          { id: 2, name: 'Склад цемента', description: 'Склад для хранения сыпучих материалов', itemCount: 24 },
          { id: 3, name: 'Склад №5', description: 'Склад для хранения обрабатываемых материалов', itemCount: 57 },
          { id: 4, name: 'Склад металла', description: 'Склад для хранения металлических конструкций', itemCount: 36 }
        ],
        equipment: [
          { id: 1, name: 'Насосная станция №1', description: 'Локация насосного оборудования', itemCount: 12 },
          { id: 2, name: 'Котельная', description: 'Локация отопительного оборудования', itemCount: 8 },
          { id: 3, name: 'Электроподстанция', description: 'Локация электрического оборудования', itemCount: 15 },
          { id: 4, name: 'Компрессорная', description: 'Локация компрессорного оборудования', itemCount: 6 },
          { id: 5, name: 'Цех №3', description: 'Локация производственного оборудования', itemCount: 22 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Open modal for adding new location
  const showAddModal = (type) => {
    setModalType('add');
    setLocationType(type);
    setCurrentLocation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Open modal for editing existing location
  const showEditModal = (type, location) => {
    setModalType('edit');
    setLocationType(type);
    setCurrentLocation(location);
    form.setFieldsValue({
      name: location.name,
      description: location.description
    });
    setIsModalVisible(true);
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'add') {
        // API call to add new location
        // const response = await fetch(`/api/storage/${locationType}`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values)
        // });
        
        // if (!response.ok) throw new Error('Failed to add location');
        
        // Simulate API response for demonstration
        const newLocation = {
          id: Math.floor(Math.random() * 1000),
          name: values.name,
          description: values.description,
          itemCount: 0
        };
        
        setStorageLocations(prev => ({
          ...prev,
          [locationType]: [...prev[locationType], newLocation]
        }));
        
        message.success('Место хранения успешно добавлено');
      } else {
        // API call to update location
        // const response = await fetch(`/api/storage/${locationType}/${currentLocation.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values)
        // });
        
        // if (!response.ok) throw new Error('Failed to update location');
        
        // Simulate API response for demonstration
        setStorageLocations(prev => ({
          ...prev,
          [locationType]: prev[locationType].map(item => 
            item.id === currentLocation.id ? 
            { ...item, name: values.name, description: values.description } : 
            item
          )
        }));
        
        message.success('Место хранения успешно обновлено');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      message.error(`Ошибка: ${error.message}`);
    }
  };

  // Handle location deletion
  const handleDelete = async (type, id) => {
    try {
      // API call to delete location
      // const response = await fetch(`/api/storage/${type}/${id}`, {
      //   method: 'DELETE'
      // });
      
      // if (!response.ok) throw new Error('Failed to delete location');
      
      // Simulate API response for demonstration
      setStorageLocations(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== id)
      }));
      
      message.success('Место хранения успешно удалено');
    } catch (error) {
      message.error(`Ошибка: ${error.message}`);
    }
  };

  // Function to get icon by type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'tools':
        return <ToolOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
      case 'spares':
        return <PartitionOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'materials':
        return <DatabaseOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />;
      case 'equipment':
        return <AppstoreOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      default:
        return <EnvironmentOutlined style={{ fontSize: '24px' }} />;
    }
  };

  // Render location cards for a given type
  const renderLocationCards = (type) => {
    const locations = storageLocations[type];
    
    if (!locations || locations.length === 0) {
      return (
        <Empty 
          description="Нет добавленных мест хранения" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    return (
      <Row gutter={[16, 16]}>
        {locations.map(location => (
          <Col xs={24} sm={12} md={8} lg={6} key={location.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="storage-location-card"
                hoverable
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => showEditModal(type, location)} 
                  />,
                  <Popconfirm
                    title="Удаление места хранения"
                    description="Вы уверены, что хотите удалить это место хранения?"
                    onConfirm={() => handleDelete(type, location.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button type="text" icon={<DeleteOutlined />} danger />
                  </Popconfirm>
                ]}
              >
                <div className="storage-location-card-content">
                  <div className="storage-location-icon">
                    {getTypeIcon(type)}
                  </div>
                  <div className="storage-location-info">
                    <Title level={4}>{location.name}</Title>
                    <Text type="secondary">{location.description}</Text>
                    <div className="storage-location-count">
                      <Tag color="blue">{location.itemCount} {
                        type === 'tools' ? 'инструментов' :
                        type === 'spares' ? 'запчастей' :
                        type === 'materials' ? 'материалов' :
                        'оборудования'
                      }</Tag>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="storage-locations-container">
      {/* Breadcrumbs */}
      <Breadcrumb className="storage-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Места хранения
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="storage-locations-card">
        <div className="storage-locations-header">
          <Title level={2}>Места хранения и локации</Title>
        </div>

        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            tabBarExtraContent={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showAddModal(activeTab)}
              >
                Добавить {
                  activeTab === 'tools' ? 'место хранения инструментов' :
                  activeTab === 'spares' ? 'место хранения запчастей' :
                  activeTab === 'materials' ? 'место хранения материалов' :
                  'локацию оборудования'
                }
              </Button>
            }
          >
            <TabPane 
              tab={
                <span>
                  <ToolOutlined />
                  Инструменты
                </span>
              } 
              key="tools"
            >
              {renderLocationCards('tools')}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <PartitionOutlined />
                  Запчасти
                </span>
              } 
              key="spares"
            >
              {renderLocationCards('spares')}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <DatabaseOutlined />
                  Материалы
                </span>
              } 
              key="materials"
            >
              {renderLocationCards('materials')}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <AppstoreOutlined />
                  Оборудование
                </span>
              } 
              key="equipment"
            >
              {renderLocationCards('equipment')}
            </TabPane>
          </Tabs>
        </Spin>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          modalType === 'add' 
            ? `Добавить ${
                locationType === 'tools' ? 'место хранения инструментов' :
                locationType === 'spares' ? 'место хранения запчастей' :
                locationType === 'materials' ? 'место хранения материалов' :
                'локацию оборудования'
              }`
            : `Редактировать ${
                locationType === 'tools' ? 'место хранения инструментов' :
                locationType === 'spares' ? 'место хранения запчастей' :
                locationType === 'materials' ? 'место хранения материалов' :
                'локацию оборудования'
              }`
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={handleFormSubmit}>
            {modalType === 'add' ? 'Добавить' : 'Сохранить'}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          name="locationForm"
          initialValues={{ name: '', description: '' }}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[
              { 
                required: true, 
                message: 'Пожалуйста, введите название места хранения' 
              }
            ]}
          >
            <Input placeholder="Введите название места хранения" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Описание"
            rules={[
              { 
                required: true, 
                message: 'Пожалуйста, введите описание места хранения' 
              }
            ]}
          >
            <Input.TextArea 
              placeholder="Введите описание места хранения"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StorageLocations;