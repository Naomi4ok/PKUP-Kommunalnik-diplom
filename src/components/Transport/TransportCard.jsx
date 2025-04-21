import React from 'react';
import { Card, Typography, Tag, Dropdown, Menu, Tooltip, Button } from 'antd';
import { 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  KeyOutlined,
  ToolOutlined,
  FireOutlined,
  CarOutlined,
  SettingOutlined
} from '@ant-design/icons';
import './TransportCard.css';

const { Text, Title } = Typography;

const TransportCard = ({ data, onEdit, onDelete }) => {
  // Define status colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'Исправен': return 'green';
      case 'Требует ТО': return 'blue';
      case 'Ремонтируется': return 'orange';
      case 'Неисправен': return 'red';
      default: return 'default';
    }
  };

  // Card actions menu
  const actionsMenu = (
    <Menu>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={onEdit}>
        Редактировать
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={onDelete} danger>
        Удалить
      </Menu.Item>
    </Menu>
  );

  return (
    <Card
      className="transport-card"
      bodyStyle={{ padding: 0 }}
      bordered={false}
      cover={
        <div className="transport-card-image-container">
          {data.imageUrl ? (
            <img alt={data.model} src={data.imageUrl} className="transport-card-image" />
          ) : (
            <div className="transport-card-no-image">
              <CarOutlined className="no-image-icon" />
              <div>Нет изображения</div>
            </div>
          )}
          {data.brandLogo && (
            <div className="transport-card-brand-logo">
              <img src={data.brandLogo} alt={data.brand} />
            </div>
          )}
          <Tag 
            className="transport-card-status-tag" 
            color={getStatusColor(data.technicalCondition)}
          >
            {data.technicalCondition}
          </Tag>
        </div>
      }
    >
      <div className="transport-card-content">
        <div className="transport-card-header">
          <Title level={4} className="transport-card-title">{data.brand} {data.model}</Title>
          <Text className="transport-card-year">{data.year} г.</Text>
        </div>
        
        <div className="transport-card-details">
          <div className="transport-card-detail-item">
            <KeyOutlined className="detail-icon" />
            <Text>Гос. номер: <span className="detail-value">{data.licenseNumber}</span></Text>
          </div>
          
          <div className="transport-card-detail-item">
            <CarOutlined className="detail-icon" />
            <Text>Назначение: <span className="detail-value">{data.purpose}</span></Text>
          </div>
          
          <div className="transport-card-detail-item">
            <FireOutlined className="detail-icon" />
            <Text>Топливо: <span className="detail-value">{data.fuelType}</span></Text>
          </div>
          
          <div className="transport-card-detail-item">
            <ToolOutlined className="detail-icon" />
            <Text>Трансмиссия: <span className="detail-value">{data.transmissionType}</span></Text>
          </div>
          
          <div className="transport-card-detail-item">
            <UserOutlined className="detail-icon" />
            <Text>Ответственный: <span className="detail-value">{data.assignedEmployee}</span></Text>
          </div>
          
          <div className="transport-card-detail-item">
            <CalendarOutlined className="detail-icon" />
            <Tooltip title="Дата последнего ТО">
              <Text>Последнее ТО: <span className="detail-value">{data.lastMaintenance}</span></Text>
            </Tooltip>
          </div>
        </div>
        
        <Dropdown overlay={actionsMenu} trigger={['click']} placement="bottomCenter">
          <Button 
            type="primary" 
            className="transport-card-actions-button" 
            icon={<SettingOutlined />}
          >
            Действия
          </Button>
        </Dropdown>
      </div>
    </Card>
  );
};

export default TransportCard;