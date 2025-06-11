import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, message, Space, Typography } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LocationMapPicker = ({ visible, onCancel, onSelect, initialLocation = '' }) => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 52.0977, lng: 23.7340 }); // Брест
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placemarkRef = useRef(null);

  // Загружаем Яндекс.Карты динамически
  useEffect(() => {
    if (visible && !window.ymaps) {
      loadYandexMaps();
    } else if (visible && window.ymaps) {
      initializeMap();
    }
  }, [visible]);

  const loadYandexMaps = () => {
    // Создаем скрипт для загрузки Яндекс.Карт
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.REACT_APP_YANDEX_MAPS_API_KEY || 'bbb34908-2490-4221-bb02-957231a8bd00'}&lang=ru_RU`;
    script.onload = () => {
      window.ymaps.ready(() => {
        initializeMap();
      });
    };
    script.onerror = () => {
      message.error('Ошибка загрузки Яндекс.Карт');
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Создаем карту БЕЗ searchControl, чтобы избежать ошибки suggest
      const map = new window.ymaps.Map(mapRef.current, {
        center: [coordinates.lat, coordinates.lng],
        zoom: 13,
        controls: [
          'zoomControl',      // Контроль масштаба
          'typeSelector',     // Переключатель типов карт
          'fullscreenControl' // Полноэкранный режим
          // Убираем 'searchControl' чтобы избежать ошибки suggest
        ]
      });

      // Создаем метку
      const placemark = new window.ymaps.Placemark([coordinates.lat, coordinates.lng], {
        balloonContent: 'Выбранное местоположение',
        hintContent: 'Перетащите метку для изменения местоположения'
      }, {
        preset: 'islands#redDotIcon',
        draggable: true
      });

      // Добавляем метку на карту
      map.geoObjects.add(placemark);

      // Обработчик перетаскивания метки
      placemark.events.add('dragend', function (e) {
        const coords = e.get('target').geometry.getCoordinates();
        setCoordinates({ lat: coords[0], lng: coords[1] });
        reverseGeocode(coords[0], coords[1]);
      });

      // Обработчик клика по карте
      map.events.add('click', function (e) {
        const coords = e.get('coords');
        placemark.geometry.setCoordinates(coords);
        setCoordinates({ lat: coords[0], lng: coords[1] });
        reverseGeocode(coords[0], coords[1]);
      });

      mapInstanceRef.current = map;
      placemarkRef.current = placemark;

      // Если есть начальное местоположение, попробуем его найти
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        setSearchQuery(initialLocation);
        searchLocation(initialLocation);
      }
    } catch (error) {
      console.error('Error initializing Yandex Maps:', error);
      message.error('Ошибка инициализации карты');
    }
  };

  // Обратное геокодирование (получение адреса по координатам)
  const reverseGeocode = async (lat, lng) => {
    try {
      if (!window.ymaps) return;

      const result = await window.ymaps.geocode([lat, lng], {
        results: 1
      });

      const firstGeoObject = result.geoObjects.get(0);
      if (firstGeoObject) {
        const address = firstGeoObject.getAddressLine();
        setSelectedLocation(address);
        
        // Обновляем содержимое балуна
        if (placemarkRef.current) {
          placemarkRef.current.properties.set({
            balloonContent: `<div style="max-width: 200px; word-wrap: break-word;">${address}</div>`,
            hintContent: address.length > 50 ? address.substring(0, 50) + '...' : address
          });
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Поиск местоположения
  const searchLocation = async (query = searchQuery) => {
    if (!query.trim()) {
      message.warning('Введите адрес для поиска');
      return;
    }

    if (!window.ymaps) {
      message.error('Карты еще не загружены');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.ymaps.geocode(query, {
        results: 1
      });

      const firstGeoObject = result.geoObjects.get(0);
      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();
        const address = firstGeoObject.getAddressLine();
        
        setCoordinates({ lat: coords[0], lng: coords[1] });
        setSelectedLocation(address);

        // Обновляем карту и метку
        if (mapInstanceRef.current && placemarkRef.current) {
          mapInstanceRef.current.setCenter(coords, 15);
          placemarkRef.current.geometry.setCoordinates(coords);
          placemarkRef.current.properties.set({
            balloonContent: `<div style="max-width: 200px; word-wrap: break-word;">${address}</div>`,
            hintContent: address.length > 50 ? address.substring(0, 50) + '...' : address
          });
        }
        
        message.success('Местоположение найдено');
      } else {
        message.error('Местоположение не найдено');
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Ошибка поиска');
    } finally {
      setIsLoading(false);
    }
  };

  // Очистка поля поиска
  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSelect = () => {
    if (selectedLocation) {
      onSelect({
        address: selectedLocation,
        coordinates: coordinates
      });
    } else {
      message.warning('Выберите местоположение на карте');
    }
  };

  const handleCancel = () => {
    // Очищаем карту при закрытии
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
      placemarkRef.current = null;
    }
    // Очищаем поле поиска
    setSearchQuery('');
    onCancel();
  };

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>Выберите местоположение на карте</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={820}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Отмена
        </Button>,
        <Button 
          key="select" 
          type="primary" 
          onClick={handleSelect}
          disabled={!selectedLocation}
        >
          Выбрать местоположение
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Введите адрес для поиска (например: Брест, ул. Советская, 1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={() => searchLocation()}
            allowClear
            onClear={clearSearch}
          />
          <Button 
            style={{ height: '42px' }}
            type="primary" 
            icon={<SearchOutlined />}
            loading={isLoading}
            onClick={() => searchLocation()}
            disabled={!searchQuery.trim()}
          >
            Найти
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 4, fontSize: '12px', color: '#8c8c8c' }}>
          Примеры поиска: "Брест", "Минск, пр. Независимости, 4", "Гомель, ул. Ленина"
        </div>
      </div>

      <div 
        ref={mapRef} 
        style={{ 
          height: '400px', 
          width: '100%', 
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          backgroundColor: '#f5f5f5'
        }} 
      />

      {selectedLocation && (
        <div style={{ marginTop: 16 }}>
          <Text strong>
            <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            Выбранное местоположение:
          </Text>
          <div style={{ 
            marginTop: 8, 
            padding: '8px 12px', 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {selectedLocation}
          </div>
          <div style={{ marginTop: 4, fontSize: '12px', color: '#8c8c8c' }}>
            Координаты: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LocationMapPicker;