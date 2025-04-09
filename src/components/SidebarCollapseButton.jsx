import React from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './SidebarCollapseButton.css';

const SidebarCollapseButton = ({ collapsed, onToggle }) => {
  return (
    <div 
      className={`sidebar-collapse-button ${collapsed ? 'collapsed' : 'expanded'}`}
      onClick={onToggle}
      role="button"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      tabIndex={0}
    >
      <div className="circle-button">
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </div>
    </div>
  );
};

export default SidebarCollapseButton;