import React, { useState } from 'react';
import './TimeInput.css';

const TimeInput = ({ 
  label = 'Time', 
  is24Hour = false, 
  onChange = () => {},
  value = '',
  required = false
}) => {
  const [time, setTime] = useState(value);
  const [period, setPeriod] = useState(() => {
    if (value && !is24Hour) {
      const hours = parseInt(value.split(':')[0]);
      return hours >= 12 ? 'PM' : 'AM';
    }
    return 'AM';
  });
  
  const handleTimeChange = (e) => {
    const inputTime = e.target.value;
    setTime(inputTime);
    
    if (is24Hour) {
      onChange(inputTime);
    } else {
      // Convert to 12-hour format for display/external use
      const [hours, minutes] = inputTime.split(':');
      const h = period === 'PM' && hours !== '12' 
        ? parseInt(hours) + 12 
        : (period === 'AM' && hours === '12' ? 0 : hours);
      onChange(`${h.toString().padStart(2, '0')}:${minutes}`);
    }
  };
  
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (!is24Hour && time) {
      const [hours, minutes] = time.split(':');
      const h = newPeriod === 'PM' && hours !== '12' 
        ? parseInt(hours) + 12 
        : (newPeriod === 'AM' && hours === '12' ? 0 : parseInt(hours));
      onChange(`${h.toString().padStart(2, '0')}:${minutes}`);
    }
  };

  return (
    <div className="time-input-container">
      {label && <label className="time-input-label">{label}{required && <span className="required-mark">*</span>}</label>}
      <div className="time-input-wrapper">
        <input
          type="time"
          className="time-input"
          value={time}
          onChange={handleTimeChange}
          required={required}
        />
        
        {!is24Hour && (
          <div className="period-selector">
            <button 
              type="button"
              className={`period-btn ${period === 'AM' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('AM')}
            >
              AM
            </button>
            <button 
              type="button"
              className={`period-btn ${period === 'PM' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('PM')}
            >
              PM
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeInput;