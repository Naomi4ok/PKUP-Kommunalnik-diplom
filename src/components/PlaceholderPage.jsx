import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

// Simple placeholder page component
const PlaceholderPage = ({ title }) => {
  return (
    <div style={{ padding: '40px' }}> {/* Added padding */}
      <Title level={2}>{title}</Title>
      <p>This page is under construction.</p>
    </div>
  );
};

export default PlaceholderPage;