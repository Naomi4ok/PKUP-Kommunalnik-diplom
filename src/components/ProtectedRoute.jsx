import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, checkAuth, isAuthenticated } = useContext(AuthContext);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      await checkAuth();
      setChecking(false);
    };
    
    if (!isAuthenticated) {
      verify();
    } else {
      setChecking(false);
    }
  }, [checkAuth, isAuthenticated]);

  if (loading || checking) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" tip="Проверка авторизации..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has required role (if specified)
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;