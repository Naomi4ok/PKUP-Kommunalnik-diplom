import React from 'react';
import { Card, Typography, Tag, Divider, Avatar, Space, Tooltip } from 'antd';
import { CarOutlined, CalendarOutlined, NumberOutlined, SettingOutlined, UserOutlined, ToolOutlined } from '@ant-design/icons';
import './TransportCard.css';

const { Text, Title } = Typography;

const TransportCard = ({ 
  transportData,
  onClick = () => {},
  imageBaseUrl = '/images/transports/',
  logoBaseUrl = '/images/brands/'
}) => {
  const {
    image,
    brand,
    brandLogo,
    model,
    year,
    licensePlate,
    fuelType,
    transmissionType,
    purpose,
    condition,
    responsiblePerson,
    lastMaintenanceDate
  } = transportData;

  // Format date to display in DD.MM.YYYY format
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Helper to determine condition tag color
  const getConditionColor = (condition) => {
    switch(condition?.toLowerCase()) {
      case 'рабочее':
        return 'success';
      case 'требует обслуживания':
        return 'warning';
      case 'в ремонте':
        return 'error';
      case 'списано':
        return 'default';
      default:
        return 'default';
    }
  };

  // Helper to determine fuel type icon
  const getFuelTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'дизель':
        return '🛢️';
      case 'электрический':
        return '⚡';
      case 'бензин':
        return '⛽';
      case 'газ':
        return '💨';
      default:
        return '🛢️';
    }
  };

  return (
    <Card 
      hoverable
      className="transport-card"
      cover={
        <div className="transport-card-image-container">
          <img 
            src={`${imageBaseUrl}${image}`} 
            alt={`${brand} ${model}`} 
            className="transport-card-image"
          />
          <div className="transport-card-license">
            <Tag color="blue" icon={<NumberOutlined />}>{licensePlate}</Tag>
          </div>
        </div>
      }
      onClick={onClick}
    >
      <div className="transport-card-header">
        <div className="transport-card-brand">
          <Avatar 
            src={`${logoBaseUrl}${brandLogo}`} 
            size="small"
            className="transport-card-logo"
          />
          <Title level={5} className="transport-card-brand-name">{brand}</Title>
        </div>
        <Text className="transport-card-year">
          <CalendarOutlined /> {year}
        </Text>
      </div>
      
      <Divider className="transport-card-divider" />
      
      <Title level={5} className="transport-card-model">
        <CarOutlined /> {model}
      </Title>
      
      <Space direction="vertical" className="transport-card-specs" size="small">
        <div className="transport-card-spec-item">
          <Text type="secondary">Тип топлива:</Text>
          <Tooltip title={fuelType}>
            <Text>{getFuelTypeIcon(fuelType)} {fuelType}</Text>
          </Tooltip>
        </div>
        <div className="transport-card-spec-item">
          <Text type="secondary">Трансмиссия:</Text>
          <Text>{transmissionType}</Text>
        </div>
        <div className="transport-card-spec-item">
          <Text type="secondary">Назначение:</Text>
          <Text>{purpose}</Text>
        </div>
      </Space>
      
      <Divider className="transport-card-divider" />
      
      <div className="transport-card-footer">
        <div className="transport-card-condition">
          <Text type="secondary">Состояние:</Text>
          <Tag color={getConditionColor(condition)}>{condition}</Tag>
        </div>
        
        <div className="transport-card-responsible">
          <Text type="secondary">Ответственный:</Text>
          <Text><UserOutlined /> {responsiblePerson}</Text>
        </div>
        
        <div className="transport-card-maintenance">
          <Text type="secondary">Последнее ТО:</Text>
          <Text><ToolOutlined /> {formatDate(lastMaintenanceDate)}</Text>
        </div>
      </div>
    </Card>
  );
};

export default TransportCard;