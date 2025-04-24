import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import axios from 'axios';
import { EyeOutlined, EyeInvisibleOutlined, LockOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import '../../styles/Auth/Auth.css';
import logo from './assets/logo.png';

const Auth = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  // Добавляем состояние для отображения ошибок в полях
  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });

  // Improved session check - separate function for better code organization
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      try {
        setLoading(true);
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // User is already authenticated, redirect to dashboard
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Token is invalid or expired, remove it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } finally {
        setLoading(false);
        setInitialCheckDone(true);
      }
    } else {
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    // Add focus to username field for better UX
    setTimeout(() => {
      const usernameInput = document.getElementById('username');
      if (usernameInput) usernameInput.focus();
    }, 500);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData({
      ...loginData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Сбрасываем ошибки при изменении полей
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { username: '', password: '' };
    
    if (!loginData.username.trim()) {
      newErrors.username = 'Пожалуйста, введите логин';
      isValid = false;
    }
    
    if (!loginData.password) {
      newErrors.password = 'Пожалуйста, введите пароль';
      isValid = false;
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      message.error('Пожалуйста, проверьте введенные данные');
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        username: loginData.username.trim(),
        password: loginData.password
      });
      
      if (response.data.success) {
        // Store token with improved security
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
        
        // Set timeout to simulate server response and show loading
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error) {
      let errorMessage = 'Ошибка соединения с сервером';
      
      // Improved error handling with specific messages
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          errorMessage = 'Неверный логин или пароль';
          // Установка ошибок для визуального отображения в форме
          setErrors({
            username: 'Неверный логин или пароль',
            password: 'Неверный логин или пароль'
          });
        } else if (status === 403) {
          errorMessage = 'Доступ запрещен. Обратитесь к администратору';
        } else if (status === 429) {
          errorMessage = 'Слишком много попыток входа. Пожалуйста, попробуйте позже';
        } else {
          errorMessage = error.response.data.error || 'Ошибка авторизации';
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Show spinner during initial check to avoid flashing of login form
  if (!initialCheckDone) {
    return (
      <div className="auth-loading-container">
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} 
          tip="Проверка авторизации..." 
        />
      </div>
    );
  }

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
          <h2>Вход в систему</h2>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Логин</label>
              <div className="input-with-icon">
                <UserOutlined className="input-icon" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Введите ваш логин"
                  value={loginData.username}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="username"
                  className={errors.username ? 'error-input' : ''}
                />
              </div>
              {errors.username && <div className="error-message">{errors.username}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <div className="input-with-icon">
                <LockOutlined className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Введите ваш пароль"
                  value={loginData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  className={errors.password ? 'error-input' : ''}
                />
                <span 
                  className="password-toggle-icon" 
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <div className="auth-form-footer">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="white-checkbox"
                />
                <label htmlFor="rememberMe">Запомнить меня</label>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spin 
                    indicator={<LoadingOutlined style={{ fontSize: 16, color: 'white' }} spin />} 
                    className="login-spinner"
                  /> 
                  Вход...
                </>
              ) : 'Войти'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>© {new Date().getFullYear()} ПКУП «Коммунальник»</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;