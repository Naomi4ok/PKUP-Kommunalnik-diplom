import { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './AuthInputs.css';

export default function AuthInputs({ onSubmit, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedUsername, setIsFocusedUsername] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const handleEyeMouseDown = useCallback((e) => {
    e.preventDefault();
    setShowPassword(true);
  }, []);
  const handleEyeMouseUp = useCallback(() => setShowPassword(false), []);
  const handleEyeMouseLeave = useCallback(() => setShowPassword(false), []);
  const handleEyeTouchStart = handleEyeMouseDown;
  const handleEyeTouchEnd = handleEyeMouseUp;

  const handleRememberChange = useCallback((e) => {
    setRememberMe(e.target.checked);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit({
      username,
      password,
      rememberMe
    });
  }, [username, password, rememberMe, onSubmit]);

  const usernameHasContent = username.length > 0;
  const passwordHasContent = password.length > 0;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-title">Авторизация</h2>

      {/* Поле логина */}
      <div className="input-container">
        <div className={`input-wrapper ${isFocusedUsername ? 'focused' : ''}`}>
          <div className="input-highlight" />
          <label
            htmlFor="username"
            className={usernameHasContent || isFocusedUsername ? 'label-active' : ''}
          >
            Логин
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setIsFocusedUsername(true)}
            onBlur={() => setIsFocusedUsername(false)}
            className={usernameHasContent || isFocusedUsername ? 'input-active' : ''}
            disabled={loading}
          />
        </div>
      </div>

      {/* Поле пароля */}
      <div className="input-container">
        <div className={`input-wrapper ${isFocusedPassword ? 'focused' : ''}`}>
          <div className="input-highlight" />
          <label
            htmlFor="password"
            className={passwordHasContent || isFocusedPassword ? 'label-active' : ''}
          >
            Пароль
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={handlePasswordChange}
            onFocus={() => setIsFocusedPassword(true)}
            onBlur={() => setIsFocusedPassword(false)}
            className={passwordHasContent || isFocusedPassword ? 'input-active' : ''}
            disabled={loading}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            className="password-toggle"
            onMouseDown={handleEyeMouseDown}
            onMouseUp={handleEyeMouseUp}
            onMouseLeave={handleEyeMouseLeave}
            onTouchStart={handleEyeTouchStart}
            onTouchEnd={handleEyeTouchEnd}
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Remember me и кнопка */}
      <div className="remember-container">
        <input
          id="remember"
          type="checkbox"
          className="remember-checkbox"
          checked={rememberMe}
          onChange={handleRememberChange}
          disabled={loading}
        />
        <label htmlFor="remember" className="remember-label">
          Запомнить меня
        </label>
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={loading}
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}