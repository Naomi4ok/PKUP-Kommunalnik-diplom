import React, { useState } from 'react';
import '../../styles/Auth/Auth.css';
import logo from './assets/logo.png'; // Adjust path based on your project structure

const Auth = () => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData({
      ...loginData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt with:', loginData);
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
              />
            </div>
            
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={loginData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe">Запомнить меня</label>
            </div>
            
            <button type="submit" className="login-button">Войти</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;