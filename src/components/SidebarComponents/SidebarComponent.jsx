import React, { useState, useEffect, useRef, useContext } from 'react';
import { Layout, Menu, Avatar, Divider, Button, Dropdown } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  UserOutlined,
  DashboardOutlined,
  CalendarOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SettingOutlined,
  UserSwitchOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ToolOutlined,
  CarOutlined,
  DatabaseOutlined,
  PartitionOutlined,
  ExperimentOutlined,
  SettingFilled,
  CarryOutOutlined,
  DollarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import Logo from '../Logo'; // Предполагаем, что компонент Logo существует
import './SidebarComponent.css';
import { AuthContext } from '../../context/AuthContext'; // Add this import

const { Sider } = Layout;
const { SubMenu } = Menu;

const SidebarComponent = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate(); // Add this for navigation
  const [animateItems, setAnimateItems] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const userMenuRef = useRef(null);
  const { logout, user } = useContext(AuthContext); // Add this for authentication
  
  // Обработка анимации меню при раскрытии/сворачивании
  useEffect(() => {
    // Сбросить состояние анимации при изменении collapse
    setAnimateItems(false);
    
    // Установить таймаут для запуска анимации после перехода боковой панели
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [collapsed]);

  // Обработка мобильной видимости
  useEffect(() => {
    const handleResize = () => {
      // Если экран маленький, обрабатываем мобильное поведение
      if (window.innerWidth < 768) {
        setMobileVisible(!collapsed);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Закрыть выпадающее меню при клике снаружи
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add logout handler
  const handleLogout = () => {
    logout();
    navigate('/auth');
    setUserMenuVisible(false);
  };

  // Определить все пункты меню
  const allMenuItems = [
    {
      key: '/', // Используем путь как ключ для более простой логики выбора
      icon: <DashboardOutlined />,
      label: 'Панель управления',
      path: '/',
    },

    {
      key: 'storage-locations',
      icon: <EnvironmentOutlined />,
      label: 'Места хранения',
      path: '/storage-locations',
    },

    {
      key: 'expenses',
      icon: <DollarOutlined />,
      label: 'Расходы',
      path: '/expenses',
    },
    
    {
      key: '/employees', // Используем путь как ключ
      icon: <TeamOutlined />,
      label: 'Сотрудники',
      path: '/employees',
    },
    {
      key: '/schedule', // Используем путь как ключ
      icon: <CalendarOutlined />,
      label: 'Расписание задач',
      path: '/schedule',
    },
    {
      key: 'equipment',
      icon: <ToolOutlined />,
      label: 'Техника',
      children: [
        { key: '/equipment', label: 'Оборудование', path: '/equipment', icon: <SettingOutlined /> },
        { key: '/transport', label: 'Транспорт', path: '/transport', icon: <CarOutlined /> },
      ],
    },
    {
      key: 'warehouse',
      icon: <DatabaseOutlined />,
      label: 'Склад',
      children: [
        { key: '/tools', label: 'Инструменты', path: '/tools', icon: <ToolOutlined /> },
        { key: '/spares', label: 'Запчасти', path: '/spares', icon: <PartitionOutlined /> },
        { key: '/materials', label: 'Материалы', path: '/materials', icon: <AppstoreOutlined /> },
      ],
    },
    
    // Add user management item for admins
    ...(user?.role === 'admin' ? [
      {
        key: '/users',
        icon: <UserSwitchOutlined />,
        label: 'Пользователи',
        path: '/users',
      }
    ] : []),
  ];

  // Определить выбранные ключи на основе текущего пути
  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    // Найти элемент или дочерний элемент, соответствующий текущему пути
    for (const item of allMenuItems) {
      if (item.path === currentPath) {
        return [item.key];
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path === currentPath) {
            // Вернуть дочерний ключ и родительский ключ для логики defaultOpenKeys
            return [child.key];
          }
        }
      }
    }
    // Запасной вариант по умолчанию, если совпадений нет
    if (currentPath === '/') return ['/'];
    return [currentPath]; // Возврат к самому пути, если нет прямого совпадения
  };

  // Определить ключи открытия по умолчанию (для подменю)
  const getDefaultOpenKeys = () => {
    const currentPath = location.pathname;
    for (const item of allMenuItems) {
      if (item.children && item.children.some(child => child.path === currentPath)) {
        return [item.key];
      }
    }
    // По умолчанию ничего не открыто
    return [];
  };

  // Обработка переключения сворачивания с анимацией
  const toggleCollapsed = () => {
    setAnimateItems(false); // Сбросить состояние анимации
    setCollapsed(!collapsed);
  };

  // Переключить выпадающее меню пользователя
  const toggleUserMenu = () => {
    setUserMenuVisible(!userMenuVisible);
  
    if (!userMenuVisible && collapsed) {
      const dropdown = document.querySelector('.user-dropdown');
      if (dropdown) {
        const rect = dropdown.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          dropdown.style.left = `${window.innerWidth - rect.width - 10}px`; // Подгонка, чтобы уместиться в области просмотра
        }
      }
    }
  };

  // Рендеринг пунктов меню рекурсивно с задержкой анимации
  const renderMenuItems = (items) => {
    return items.map((item, index) => {
      // Добавить постепенную задержку анимации
      const animationDelay = animateItems ? `${index * 50}ms` : '0ms';
      const itemStyle = { transitionDelay: animationDelay };
      
      if (item.children) {
        return (
          <SubMenu 
            key={item.key} 
            icon={item.icon} 
            title={item.label}
            style={itemStyle}
            className={animateItems ? 'animate-in' : ''}
          >
            {item.children.map((child, childIndex) => (
              <Menu.Item 
                key={child.key} 
                style={{ transitionDelay: `${(index * 50) + (childIndex * 30)}ms` }}
                className={animateItems ? 'animate-in' : ''}
                icon={child.icon} // Добавлена иконка для подпунктов
              >
                <Link to={child.path}>{child.label}</Link>
              </Menu.Item>
            ))}
          </SubMenu>
        );
      }
      return (
        <Menu.Item 
          key={item.key} 
          icon={item.icon}
          style={itemStyle}
          className={animateItems ? 'animate-in' : ''}
        >
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      );
    });
  };

  // Добавить фон для мобильной версии
  const handleBackdropClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  // Get user's initials for avatar fallback
  const getUserInitials = () => {
    if (user?.fullName) {
      // Get initials from full name
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (user?.username) {
      // Use first letter of username as fallback
      return user.username[0].toUpperCase();
    }
    // Default fallback
    return 'U';
  };

  return (
    <>
      {/* Мобильный фон */}
      {!collapsed && mobileVisible && (
        <div 
          className={`mobile-sidebar-backdrop ${!collapsed && mobileVisible ? 'visible' : ''}`} 
          onClick={handleBackdropClick}
        />
      )}
      
      <Sider
        width={250}
        className={`site-sider ${animateItems ? 'animate-ready' : ''}`}
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={80}
      >
        <div className="sidebar-header">
          {/* Убедитесь, что компонент Logo адаптируется к свернутому состоянию */}
          <Logo collapsed={collapsed} lightTheme={true} />
        </div>

        <div className="sidebar-menu-container">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getDefaultOpenKeys()}
            className={`sidebar-menu ${animateItems ? 'items-ready' : ''}`}
          >
            {renderMenuItems(allMenuItems)}
          </Menu>
        </div>

        <div className={`sidebar-footer ${animateItems ? 'animate-in' : ''}`}>

          {/* Раздел профиля пользователя с выпадающим меню */}
          <div 
            ref={userMenuRef}
            className={`sidebar-user ${animateItems ? 'animate-in' : ''} ${userMenuVisible ? 'active' : ''}`}
            style={{ transitionDelay: animateItems ? '150ms' : '0ms' }}
            onClick={toggleUserMenu}
          >
            <Avatar 
              size={collapsed ? 32 : 40} 
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{ 
                backgroundColor: user?.avatar ? 'transparent' : '#0AB101',
                color: user?.avatar ? 'inherit' : '#fff'
              }}
              className={animateItems ? 'animate-in' : ''}
            >
              {!user?.avatar && getUserInitials()}
            </Avatar>
            
            {!collapsed && (
              <div className={`user-info ${animateItems ? 'animate-in' : ''}`}>
                <div className="user-name">{user?.fullName || user?.username || 'Администратор'}</div>
                <div className="user-role">{user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</div>
              </div>
            )}

            {/* Выпадающее меню пользователя */}
            <div className={`user-dropdown ${userMenuVisible ? 'visible' : ''}`}>
              <div className="dropdown-menu">
                <div className="dropdown-item logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                  <LogoutOutlined /> <span>Выход</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sider>

      {/* Кнопка переключения сворачивания с анимацией */}
      <Button
        type="default"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggleCollapsed}
        className={`sidebar-collapse-btn ${collapsed ? 'collapsed' : ''}`}
        aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
      />
    </>
  );
};

export default SidebarComponent;