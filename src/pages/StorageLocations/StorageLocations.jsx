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
  EnvironmentOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Pagination from '../../components/Pagination';
import LocationMapPicker from '../../components/LocationMapPicker/LocationMapPicker'; // Импортируем компонент карты
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationType, setLocationType] = useState('tools');
  const [form] = Form.useForm();

  // Map picker state - НОВОЕ
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState('');

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
      // Если не удалось получить данные, используем пустые массивы
      setStorageLocations({
        tools: [],
        spares: [],
        materials: [],
        equipment: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    setLocationType(key);
    setCurrentPage(1); // Сбрасываем к первой странице при смене вкладки
  };

  // Handle pagination change
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Map picker handlers - НОВЫЕ ФУНКЦИИ
  const handleMapLocationSelect = (locationData) => {
    setSelectedMapLocation(locationData.address);
    // Устанавливаем значение в форму как description для совместимости с бэкендом
    form.setFieldsValue({ description: locationData.address });
    setMapPickerVisible(false);
    message.success('Местоположение выбрано на карте');
  };

  const handleMapPickerCancel = () => {
    setMapPickerVisible(false);
  };

  // Open modal for adding new location
  const showAddModal = (type) => {
    setModalType('add');
    setLocationType(type);
    setCurrentLocation(null);
    form.resetFields();
    // Сброс местоположения карты - НОВОЕ
    setSelectedMapLocation('');
    setIsModalVisible(true);
  };

  // Open modal for editing existing location
  const showEditModal = (type, location) => {
    setModalType('edit');
    setLocationType(type);
    setCurrentLocation(location);
    form.setFieldsValue({
      name: location.name,
      description: location.description || location.address || '' // Используем description или fallback на address
    });
    // Установка местоположения карты - НОВОЕ
    setSelectedMapLocation(location.description || location.address || '');
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
        const response = await fetch(`/api/storage/${locationType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        
        if (!response.ok) throw new Error('Failed to add location');
        
        const newLocation = await response.json();
        
        setStorageLocations(prev => ({
          ...prev,
          [locationType]: [...prev[locationType], newLocation]
        }));
        
        message.success('Место хранения успешно добавлено');
      } else {
        // API call to update location
        const response = await fetch(`/api/storage/${locationType}/${currentLocation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        
        if (!response.ok) throw new Error('Failed to update location');
        
        const updatedLocation = await response.json();
        
        setStorageLocations(prev => ({
          ...prev,
          [locationType]: prev[locationType].map(item => 
            item.id === currentLocation.id ? 
            { ...updatedLocation, itemCount: item.itemCount, linkedEquipment: item.linkedEquipment } : 
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
    const response = await fetch(`/api/storage/${type}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete location');
    
    const result = await response.json();
    
    setStorageLocations(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
    
    if (type === 'equipment' && result.updatedEquipment) {
      message.success(`Место хранения успешно удалено. Информация о местонахождении удалена из ${result.affectedCount} ед. оборудования.`);
    } else if (type === 'tools' && result.updatedTools) {
      message.success(`Место хранения успешно удалено. Информация о местонахождении удалена из ${result.affectedCount} инструментов.`);
    } else if (type === 'spares' && result.updatedSpares) {
      message.success(`Место хранения успешно удалено. Информация о местонахождении удалена из ${result.affectedCount} запчастей.`);
    } else if (type === 'materials' && result.updatedMaterials) {
      message.success(`Место хранения успешно удалено. Информация о местонахождении удалена из ${result.affectedCount} ед. материалов.`);
    } else {
      message.success('Место хранения успешно удалено');
    }
  } catch (error) {
    message.error(`Ошибка: ${error.message}`);
  }
};

  // Function to get icon by type
  const getTypeIcon = (type) => {
    const iconClass = `${type}-icon storage-location-icon`;
    
    switch(type) {
      case 'tools':
        return (
          <div className={iconClass}>
            <ToolOutlined style={{ fontSize: '28px' }} />
          </div>
        );
      case 'spares':
        return (
          <div className={iconClass}>
            <PartitionOutlined style={{ fontSize: '28px' }} />
          </div>
        );
      case 'materials':
        return (
          <div className={iconClass}>
            <DatabaseOutlined style={{ fontSize: '28px' }} />
          </div>
        );
      case 'equipment':
        return (
          <div className={iconClass}>
            <AppstoreOutlined style={{ fontSize: '28px' }} />
          </div>
        );
      default:
        return (
          <div className="storage-location-icon">
            <EnvironmentOutlined style={{ fontSize: '28px' }} />
          </div>
        );
    }
  };

  // Get tag color based on item count
  const getTagColorByCount = (count) => {
    if (count === 0) return 'default';
    if (count < 20) return 'cyan';
    if (count < 50) return 'blue';
    if (count < 100) return 'geekblue';
    return 'purple';
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
    
    // Пагинация: вычисление начального и конечного индексов для отображения
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, locations.length);
    
    // Получение только текущей страницы элементов
    const currentPageItems = locations.slice(startIndex, endIndex);
    
    return (
      <>
        <Row gutter={[20, 20]}>
          {currentPageItems.map(location => (
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
                      description={
                        type === 'equipment' && location.linkedEquipment > 0 ? 
                        `Вы уверены, что хотите удалить это место хранения? Информация о местонахождении будет удалена из ${location.linkedEquipment} ед. оборудования.` :
                        type === 'tools' && location.itemCount > 0 ?
                        `Вы уверены, что хотите удалить это место хранения? Информация о местонахождении будет удалена из ${location.itemCount} инструментов.` :
                        type === 'spares' && location.itemCount > 0 ?
                        `Вы уверены, что хотите удалить это место хранения? Информация о местонахождении будет удалена из ${location.itemCount} запчастей.` :
                        type === 'materials' && location.itemCount > 0 ?
                        `Вы уверены, что хотите удалить это место хранения? Информация о местонахождении будет удалена из ${location.itemCount} ед. материалов.` :
                        "Вы уверены, что хотите удалить это место хранения?"
                      }
                      onConfirm={() => handleDelete(type, location.id)}
                      okText="Да"
                      cancelText="Нет"
                    >
                      <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                  ]}
                >
                  <div className="storage-location-card-content">
                    {getTypeIcon(type)}
                    <div className="storage-location-info">
                      <Title level={4}>{location.name}</Title>
                      <Text type="secondary" className="storage-location-description">
                        <EnvironmentOutlined style={{ marginRight: '4px' }} />
                        {location.description || 'Адрес не указан'}
                      </Text>
                      <div className="storage-location-count">
                        <Tag color={getTagColorByCount(location.itemCount)}>
                          {location.itemCount} {
                            type === 'tools' ? 'инструментов' :
                            type === 'spares' ? 'запчастей' :
                            type === 'materials' ? 'материалов' :
                            'оборудования'
                          }
                        </Tag>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
        
        {/* Добавляем компонент пагинации */}
        {locations.length > 0 && (
          <div className="storage-locations-pagination">
            <Pagination
              totalItems={locations.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 16, 24, 32]}
              initialPageSize={8}
            />
          </div>
        )}
      </>
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
          <Button
            type="primary"
            className="ant-add-storage-button"
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
        </div>

        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
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
          <Button key="submit"
          icon={<SaveOutlined />}
          type="primary"
          className="user-submit-button"
          size="large"
          onClick={handleFormSubmit}>
            {modalType === 'add' ? 'Добавить' : 'Сохранить'}
          </Button>,
          <Button key="cancel"
          onClick={handleCancel}
          size="large"
          >
            
            Отмена
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
            label="Адрес места хранения"
            rules={[
              { 
                required: true, 
                message: 'Пожалуйста, введите адрес места хранения' 
              }
            ]}
          >
            {/* ОБНОВЛЕННОЕ ПОЛЕ АДРЕСА С ИНТЕГРАЦИЕЙ КАРТЫ */}
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 40px)' }}
                placeholder="Введите адрес или выберите на карте"
                value={selectedMapLocation}
                onChange={(e) => {
                  setSelectedMapLocation(e.target.value);
                  form.setFieldsValue({ description: e.target.value });
                }}
              />
              <Button
                style={{ width: '40px', height: '40px' }}
                icon={<EnvironmentOutlined />}
                onClick={() => setMapPickerVisible(true)}
                title="Выбрать на карте"
              />
            </Input.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Location Map Picker Modal - НОВЫЙ КОМПОНЕНТ */}
      <LocationMapPicker
        visible={mapPickerVisible}
        onCancel={handleMapPickerCancel}
        onSelect={handleMapLocationSelect}
        initialLocation={selectedMapLocation}
      />
    </div>
  );
};

export default StorageLocations;