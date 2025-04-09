import React from 'react';
import { Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import './SidebarTrigger.css';

const SidebarTrigger = ({ collapsed, toggle }) => {
  return (
    <div className="sidebar-trigger">
      <Button 
        type="primary" 
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggle}
        className="trigger-button"
      />
    </div>
  );
};

export default SidebarTrigger;