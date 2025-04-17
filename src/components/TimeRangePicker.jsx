import React, { useState, useEffect } from 'react';
import './TimeRangePicker.css';

const TimeRangePicker = ({
  label = 'Time Range',
  onChange = () => {},
  initialFromTime = '',
  initialToTime = '',
  required = false,
  currentDateTime = '2025-04-12 12:18:53', // Updated time
  currentUser = 'Naomi4ok'
}) => {
  // Parse the current datetime to use as default if no initial times provided
  const parseDefaultTime = () => {
    if (currentDateTime) {
      const dateParts = currentDateTime.split(' ');
      if (dateParts.length === 2) {
        return dateParts[1].substring(0, 5); // Extract HH:MM from the timestamp
      }
    }
    return '12:00';
  };

  const defaultTime = parseDefaultTime();
  
  const [fromTime, setFromTime] = useState(initialFromTime || defaultTime);
  const [toTime, setToTime] = useState(initialToTime || defaultTime);

  useEffect(() => {
    if (fromTime && toTime) {
      onChange({
        from: fromTime,
        to: toTime
      });
    }
  }, [fromTime, toTime, onChange]);

  const handleTimeChange = (timeType, e) => {
    const newTime = e.target.value;
    
    if (timeType === 'from') {
      setFromTime(newTime);
    } else {
      setToTime(newTime);
    }
  };

  return (
    <div className="ant-time-range-picker">
      {label && (
        <label className="ant-form-item-label">
          {label}{required && <span className="ant-form-item-required">*</span>}
        </label>
      )}
      
      <div className="ant-time-range-container">
        <div className="ant-time-picker-wrapper">
          <span className="ant-time-picker-label">From</span>
          <div className="ant-time-picker">
            <div className="ant-input-wrapper">
              <input
                type="time"
                className="ant-input"
                value={fromTime}
                onChange={(e) => handleTimeChange('from', e)}
                required={required}
              />
            </div>
          </div>
        </div>
        
        <div className="ant-time-range-separator">
          <span>~</span>
        </div>
        
        <div className="ant-time-picker-wrapper">
          <span className="ant-time-picker-label">To</span>
          <div className="ant-time-picker">
            <div className="ant-input-wrapper">
              <input
                type="time"
                className="ant-input"
                value={toTime}
                onChange={(e) => handleTimeChange('to', e)}
                required={required}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;