import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get token from storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Check if token is valid
    axios.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.data.success) {
        setUser(response.data.user);
      }
    })
    .catch(error => {
      console.error('Auth error:', error);
      setError('Ошибка аутентификации');
      // Clear invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  const login = async (username, password, rememberMe) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', { username, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token in localStorage or sessionStorage
        if (rememberMe) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
        }
        
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка входа';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear token and user data
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout,
      checkAuth,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};