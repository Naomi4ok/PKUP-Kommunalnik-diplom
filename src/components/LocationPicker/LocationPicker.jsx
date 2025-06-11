import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Modal, Input, Button, message, Row, Col } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import './LocationPicker.css';

// Исправляем проблему с иконками маркеров в Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Компонент для обработки кликов по карте
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const LocationPicker = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  defaultLocation = null 
}) => {
  // Координаты Бреста по умолчанию
  const DEFAULT_COORDS = [52.0979, 23.7348];
  
  const [selectedPosition, setSelectedPosition] = useState(
    defaultLocation 
      ? [defaultLocation.lat, defaultLocation.lng] 
      : null
  );
  const [address, setAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Геокодирование для получения адреса из координат
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        const formattedAddress = formatAddress(data);
        setAddress(formattedAddress);
        return formattedAddress;
      }
    } catch (error) {
      console.error('Ошибка геокодирования:', error);
    }
    return '';
  };

  // Форматирование адреса
  const formatAddress = (data) => {
    const parts = [];
    
    if (data.address) {
      const addr = data.address;
      
      // Добавляем улицу и номер дома
      if (addr.house_number && addr.road) {
        parts.push(`${addr.road}, ${addr.house_number}`);
      } else if (addr.road) {
        parts.push(addr.road);
      }
      
      // Добавляем город
      if (addr.city || addr.town || addr.village) {
        parts.push(addr.city || addr.town || addr.village);
      }
      
      // Добавляем страну
      if (addr.country) {
        parts.push(addr.country);
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : data.display_name;
  };

  // Поиск по адресу
  const searchLocation = async () => {
    if (!searchAddress.trim()) {
      message.warning('Введите адрес для поиска');
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&countrycodes=by`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setSelectedPosition([lat, lng]);
        setAddress(formatAddress(result));
        message.success('Местоположение найдено');
      } else {
        message.error('Местоположение не найдено');
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      message.error('Ошибка поиска местоположения');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Обработка выбора местоположения на карте
  const handleLocationSelect = async (latlng) => {
    setSelectedPosition([latlng.lat, latlng.lng]);
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    message.success('Местоположение выбрано');
  };

  // Подтверждение выбора
  const handleConfirm = () => {
    if (!selectedPosition) {
      message.warning('Пожалуйста, выберите местоположение на карте');
      return;
    }

    onConfirm({
      lat: selectedPosition[0],
      lng: selectedPosition[1],
      address: address || `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`
    });
  };

  // Сброс состояния при открытии/закрытии модального окна
  useEffect(() => {
    if (visible) {
      if (defaultLocation) {
        setSelectedPosition([defaultLocation.lat, defaultLocation.lng]);
        setAddress(defaultLocation.address || '');
      } else {
        setSelectedPosition(null);
        setAddress('');
      }
      setSearchAddress('');
    }
  }, [visible, defaultLocation]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnvironmentOutlined />
          Выбор местоположения на карте
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={800}
      height={600}
      okText="Подтвердить"
      cancelText="Отмена"
      okButtonProps={{ 
        disabled: !selectedPosition,
        icon: <EnvironmentOutlined />
      }}
    >
      <div className="location-picker-container">
        {/* Поиск по адресу */}
        <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
          <Col flex="1">
            <Input
              placeholder="Введите адрес для поиска (например: ул. Ленина, Брест)"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onPressEnter={searchLocation}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={searchLocation}
              loading={isGeocoding}
            >
              Найти
            </Button>
          </Col>
        </Row>

        {/* Выбранный адрес */}
        {selectedPosition && (
          <div className="selected-location-info">
            <p><strong>Выбранное местоположение:</strong></p>
            <p>{address || `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`}</p>
          </div>
        )}

        {/* Карта */}
        <div className="map-container">
          <MapContainer
            center={selectedPosition || DEFAULT_COORDS}
            zoom={selectedPosition ? 16 : 13}
            style={{ height: '400px', width: '100%' }}
            key={selectedPosition ? `${selectedPosition[0]}-${selectedPosition[1]}` : 'default'}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedPosition && (
              <Marker position={selectedPosition} />
            )}
          </MapContainer>
        </div>

        <p className="map-instruction">
          💡 Кликните на карте, чтобы выбрать местоположение, или воспользуйтесь поиском по адресу
        </p>
      </div>
    </Modal>
  );
};

export default LocationPicker;