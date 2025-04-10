import React from 'react';
import { Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import './SidebarTrigger.css';

const SidebarTrigger = ({ collapsed, toggle }) => {
  return (
    <div className="sidebar-trigger" style={{ left: collapsed ? '90px' : '260px' }}>
      <Button 
        className="trigger-button white-button"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggle}
      />
    </div>
  );
};

export default SidebarTrigger;