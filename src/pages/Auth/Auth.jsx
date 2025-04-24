import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import axios from 'axios';
import '../../styles/Auth/Auth.css';
import logo from './assets/logo.png'; // Adjust path based on your project structure
import AuthInputs from '../../components/AuthInputs/AuthInputs';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.data.success) {
          // User is already authenticated, redirect to dashboard
          navigate('/');
        }
      })
      .catch(error => {
        // Token is invalid or expired, remove it
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      });
    }
  }, [navigate]);

  const handleSubmit = async (formData) => {
    if (!formData.username || !formData.password) {
      message.error('Пожалуйста, введите логин и пароль');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        username: formData.username,
        password: formData.password
      });
      
      if (response.data.success) {
        // Store token
        const { token, user } = response.data;
        
        // Store in localStorage if "remember me" is checked, otherwise in sessionStorage
        if (formData.rememberMe) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
        }
        
        message.success('Вход выполнен успешно');
        navigate('/');
      }
    } catch (error) {
      if (error.response) {
        message.error(error.response.data.error || 'Ошибка авторизации');
      } else {
        message.error('Ошибка соединения с сервером');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left-panel">
        <div className="logo-container">
          <img src={logo} alt="ПКУП «КОММУНАЛЬНИК»" className="logo" />
        </div>
        <div className="welcome-content">
          <h1>Здравствуйте,</h1>
          <h1 className="welcome-bold">добро пожаловать!</h1>
          <p className="welcome-message">Порядок вокруг начинается с порядка внутри.</p>
        </div>
        <div className="decorative-dots"></div>
      </div>
      
      <div className="auth-right-panel">
        <div className="login-form-container">
          <AuthInputs onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Auth;