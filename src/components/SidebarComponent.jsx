import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Divider, Button, Dropdown } from 'antd';
import { Link, useLocation } from 'react-router-dom';
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
} from '@ant-design/icons';
import Logo from './Logo'; // Assuming Logo component exists
import './SidebarComponent.css';

const { Sider } = Layout;
const { SubMenu } = Menu;

const SidebarComponent = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const [animateItems, setAnimateItems] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const userMenuRef = useRef(null);
  
  // Handle menu animation when expanding/collapsing
  useEffect(() => {
    // Reset animation state when collapse changes
    setAnimateItems(false);
    
    // Set timeout to trigger animations after sidebar transition
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [collapsed]);

  // Handle mobile visibility
  useEffect(() => {
    const handleResize = () => {
      // If screen is small, handle mobile behavior
      if (window.innerWidth < 768) {
        setMobileVisible(!collapsed);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Close dropdown when clicking outside
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

  // Define all menu items
  const allMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      children: [
        { key: '/', label: 'Dashboard', path: '/' },
        { key: '/employees', label: 'Employees', path: '/employees' },
      ],
    },
    {
      key: '/dashboard', // Use path as key for simpler selection logic
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      key: '/schedule', // Use path as key
      icon: <CalendarOutlined />,
      label: 'Schedule',
      path: '/schedule',
    },
  ];

  // Determine selected keys based on the current path
  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    // Find the item or child item matching the current path
    for (const item of allMenuItems) {
      if (item.path === currentPath) {
        return [item.key];
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path === currentPath) {
            // Return the child key and the parent key for defaultOpenKeys logic
            return [child.key];
          }
        }
      }
    }
    // Default fallback if no match (e.g., root path handled by 'home' submenu)
    if (currentPath === '/') return ['/'];
    return [currentPath]; // Fallback to path itself if no direct match
  };

  // Determine default open keys (for submenus)
  const getDefaultOpenKeys = () => {
    const currentPath = location.pathname;
    for (const item of allMenuItems) {
      if (item.children && item.children.some(child => child.path === currentPath)) {
        return [item.key];
      }
    }
    // Keep 'home' open by default if its children aren't active, or adjust as needed
    return ['home'];
  };

  // Handle collapse toggle with animation
  const toggleCollapsed = () => {
    setAnimateItems(false); // Reset animation state
    setCollapsed(!collapsed);
  };

  // Toggle user dropdown menu
  const toggleUserMenu = () => {
    setUserMenuVisible(!userMenuVisible);
  
    if (!userMenuVisible && collapsed) {
      const dropdown = document.querySelector('.user-dropdown');
      if (dropdown) {
        const rect = dropdown.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          dropdown.style.left = `${window.innerWidth - rect.width - 10}px`; // Adjust to fit within the viewport
        }
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Add your logout logic here
    console.log('User logged out');
    setUserMenuVisible(false);
  };

  // Render menu items recursively with animation delay
  const renderMenuItems = (items) => {
    return items.map((item, index) => {
      // Add staggered animation delay
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

  // Add backdrop for mobile
  const handleBackdropClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
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
          {/* Ensure Logo component adapts to collapsed state */}
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

          {/* User profile section with dropdown */}
          <div 
            ref={userMenuRef}
            className={`sidebar-user ${animateItems ? 'animate-in' : ''} ${userMenuVisible ? 'active' : ''}`}
            style={{ transitionDelay: animateItems ? '150ms' : '0ms' }}
            onClick={toggleUserMenu}
          >
            <Avatar 
              size={collapsed ? 32 : 40} 
              icon={<UserOutlined />} 
              className={animateItems ? 'animate-in' : ''}
            />
            {!collapsed && (
              <div className={`user-info ${animateItems ? 'animate-in' : ''}`}>
                <div className="user-name">Admin User</div>
                <div className="user-role">Administrator</div>
              </div>
            )}

            {/* User dropdown menu */}
            <div className={`user-dropdown ${userMenuVisible ? 'visible' : ''}`}>
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); }}>
                  <UserSwitchOutlined /> <span>Profile</span>
                </div>
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); }}>
                  <SettingOutlined /> <span>Settings</span>
                </div>
                <div className="dropdown-item logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                  <LogoutOutlined /> <span>Logout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sider>

      {/* Custom Collapse Trigger Button with animation */}
      <Button
        type="default"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggleCollapsed}
        className={`sidebar-collapse-btn ${collapsed ? 'collapsed' : ''}`}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      />
    </>
  );
};

export default SidebarComponent;