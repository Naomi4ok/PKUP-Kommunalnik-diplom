import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import axios from 'axios';
import '../../styles/Auth/Auth.css';
import logo from './assets/logo.png'; // Adjust path based on your project structure

const Auth = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData({
      ...loginData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginData.username || !loginData.password) {
      message.error('Пожалуйста, введите логин и пароль');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        username: loginData.username,
        password: loginData.password
      });
      
      if (response.data.success) {
        // Store token
        const { token, user } = response.data;
        
        // Store in localStorage if "remember me" is checked, otherwise in sessionStorage
        if (loginData.rememberMe) {
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
          <h2>Авторизация</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Логин</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Иван Иванович"
                value={loginData.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="************"
                value={loginData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={loginData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="rememberMe">Запомнить меня</label>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;