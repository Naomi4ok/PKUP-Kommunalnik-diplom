import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Row, 
  Col, 
  Input, 
  Space, 
  Dropdown, 
  Menu, 
  Empty, 
  Modal, 
  message,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ExportOutlined, 
  MoreOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TransportCard from '../../components/Transport/TransportCard';
import '../../styles/Transport/Transport.css';

const { Title } = Typography;
const { Search } = Input;

const Transport = () => {
  const navigate = useNavigate();
  const [transportList, setTransportList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    purpose: null,
    condition: null,
    brand: null,
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        setLoading(true);
        // Use the correct endpoint '/api/transportation' instead of '/api/transport'
        const response = await fetch('/api/transportation');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Process the data to match our component's expected format
        const formattedData = data.map(item => ({
          id: item.Transport_ID,
          brand: item.Brand,
          brandLogo: item.BrandLogo,
          model: item.Model,
          year: item.Year,
          licenseNumber: item.LicenseNumber,
          purpose: item.Purpose,
          fuelType: item.FuelType,
          transmissionType: item.TransmissionType,
          technicalCondition: item.TechnicalCondition,
          lastMaintenance: item.LastMaintenance,
          assignedEmployee: item.AssignedEmployeeName || 'Не назначен',
          imageUrl: item.Image ? `data:image/jpeg;base64,${item.Image}` : null,
          description: item.Description,
          registrationDate: item.RegistrationDate,
          nextScheduledService: item.NextScheduledService
        }));
        
        setTransportList(formattedData);
        setFilteredList(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching transport data:", error);
        message.error("Не удалось загрузить данные о транспорте");
        setLoading(false);
        
        // Fall back to mock data if API call fails
        const mockData = [
          {
            id: 1,
            brand: 'МАЗ',
            brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/MAZ_logo.svg/200px-MAZ_logo.svg.png',
            model: '5550C5',
            year: 2021,
            licenseNumber: 'А123ВС78',
            purpose: 'Мусоровоз',
            fuelType: 'Дизель',
            transmissionType: 'Механическая',
            technicalCondition: 'Исправен',
            lastMaintenance: '15.03.2025',
            assignedEmployee: 'Иванов Петр',
            imageUrl: 'https://via.placeholder.com/300/0000FF/FFFFFF?text=МАЗ+5550C5'
          },
          {
            id: 2,
            brand: 'Volvo',
            brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Volvo_symbol.svg/200px-Volvo_symbol.svg.png',
            model: 'FM 440',
            year: 2020,
            licenseNumber: 'В456СТ78',
            purpose: 'Грузовик',
            fuelType: 'Дизель',
            transmissionType: 'Автоматическая',
            technicalCondition: 'Требует ТО',
            lastMaintenance: '10.04.2025',
            assignedEmployee: 'Петрова Мария',
            imageUrl: 'https://via.placeholder.com/300/FF0000/FFFFFF?text=Volvo+FM+440'
          },
          {
            id: 3,
            brand: 'МТЗ',
            brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Belarus-MTZ_logo.svg/200px-Belarus-MTZ_logo.svg.png',
            model: 'Беларус-82.1',
            year: 2019,
            licenseNumber: 'Т789УФ78',
            purpose: 'Трактор',
            fuelType: 'Дизель',
            transmissionType: 'Механическая',
            technicalCondition: 'Исправен',
            lastMaintenance: '28.02.2025',
            assignedEmployee: 'Смирнов Алексей',
            imageUrl: 'https://via.placeholder.com/300/00FF00/FFFFFF?text=МТЗ+Беларус-82.1'
          },
          // More mock data items...
        ];
        
        setTransportList(mockData);
        setFilteredList(mockData);
        setLoading(false);
      }
    };

    fetchTransportData();
  }, []);

  // Filter data when search or filters change
  useEffect(() => {
    let result = [...transportList];
    
    // Apply search filter
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(item => 
        item.brand?.toLowerCase().includes(lowerCaseSearch) || 
        item.model?.toLowerCase().includes(lowerCaseSearch) || 
        item.licenseNumber?.toLowerCase().includes(lowerCaseSearch) ||
        item.assignedEmployee?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Apply purpose filter
    if (filters.purpose) {
      result = result.filter(item => item.purpose === filters.purpose);
    }
    
    // Apply condition filter
    if (filters.condition) {
      result = result.filter(item => item.technicalCondition === filters.condition);
    }
    
    // Apply brand filter
    if (filters.brand) {
      result = result.filter(item => item.brand === filters.brand);
    }
    
    setFilteredList(result);
  }, [transportList, searchText, filters]);

  // Handle search input
  const handleSearch = (value) => {
    setSearchText(value);
  };
  
  // Navigate to add form
  const handleAddTransport = () => {
    navigate('/transport/add');
  };
  
  // Navigate to edit form
  const handleEditTransport = (id) => {
    navigate(`/transport/edit/${id}`);
  };
  
  // Show delete confirmation
  const showDeleteConfirm = (id) => {
    setConfirmDelete(id);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (confirmDelete) {
      try {
        setLoading(true);
        
        // Use the correct endpoint '/api/transportation' instead of '/api/transport'
        const response = await fetch(`/api/transportation/${confirmDelete}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        // Update local state
        const updatedList = transportList.filter(item => item.id !== confirmDelete);
        setTransportList(updatedList);
        message.success("Транспортное средство успешно удалено");
        setConfirmDelete(null);
      } catch (error) {
        console.error("Error deleting transport:", error);
        message.error("Не удалось удалить транспортное средство");
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Get unique values for filters
  const getBrands = () => {
    const brands = [...new Set(transportList.map(item => item.brand))];
    return brands
      .filter(brand => brand) // Remove undefined/null values
      .map(brand => ({ key: brand, label: brand }));
  };
  
  const getPurposes = () => {
    const purposes = [...new Set(transportList.map(item => item.purpose))];
    return purposes
      .filter(purpose => purpose) // Remove undefined/null values
      .map(purpose => ({ key: purpose, label: purpose }));
  };
  
  // Filter menus
  const purposeMenu = (
    <Menu 
      onClick={({key}) => setFilters({...filters, purpose: key === 'all' ? null : key})}
      items={[
        { key: 'all', label: 'Все типы' },
        ...getPurposes()
      ]}
    />
  );
  
  const conditionMenu = (
    <Menu 
      onClick={({key}) => setFilters({...filters, condition: key === 'all' ? null : key})}
      items={[
        { key: 'all', label: 'Все состояния' },
        { key: 'Исправен', label: 'Исправен' },
        { key: 'Требует ТО', label: 'Требует ТО' },
        { key: 'Ремонтируется', label: 'Ремонтируется' },
        { key: 'Неисправен', label: 'Неисправен' },
      ]}
    />
  );
  
  const brandMenu = (
    <Menu 
      onClick={({key}) => setFilters({...filters, brand: key === 'all' ? null : key})}
      items={[
        { key: 'all', label: 'Все бренды' },
        ...getBrands()
      ]}
    />
  );

  return (
    <div className="transport-container">
      <div className="transport-header">
        <Title level={2}>Управление транспортом</Title>
        <div className="transport-actions">
          <Space size="middle" wrap>
            <Search
              placeholder="Поиск транспорта"
              allowClear
              onSearch={handleSearch}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Dropdown overlay={purposeMenu} trigger={['click']}>
              <Button icon={<FilterOutlined />}>
                Назначение {filters.purpose ? `: ${filters.purpose}` : ''}
              </Button>
            </Dropdown>
            <Dropdown overlay={conditionMenu} trigger={['click']}>
              <Button icon={<FilterOutlined />}>
                Состояние {filters.condition ? `: ${filters.condition}` : ''}
              </Button>
            </Dropdown>
            <Dropdown overlay={brandMenu} trigger={['click']}>
              <Button icon={<FilterOutlined />}>
                Бренд {filters.brand ? `: ${filters.brand}` : ''}
              </Button>
            </Dropdown>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddTransport}
            >
              Добавить транспорт
            </Button>
            <Button 
              icon={<ExportOutlined />} 
              onClick={() => message.info("Функционал экспорта будет реализован позже")}
            >
              Экспорт
            </Button>
          </Space>
        </div>
      </div>

      <div className="transport-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Загрузка данных..." />
          </div>
        ) : filteredList.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredList.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <TransportCard 
                  data={item}
                  onEdit={() => handleEditTransport(item.id)}
                  onDelete={() => showDeleteConfirm(item.id)}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Транспортные средства не найдены" />
        )}
      </div>

      <Modal
        title="Подтверждение удаления"
        open={confirmDelete !== null}
        onOk={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        okText="Да, удалить"
        cancelText="Отмена"
      >
        <p>Вы уверены, что хотите удалить это транспортное средство? Это действие нельзя отменить.</p>
      </Modal>
    </div>
  );
};

export default Transport;