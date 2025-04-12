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
              <span className="ant-input-prefix">
                <svg viewBox="64 64 896 896" focusable="false" className="ant-time-icon" data-icon="clock-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                  <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
                  <path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path>
                </svg>
              </span>
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
              <span className="ant-input-prefix">
                <svg viewBox="64 64 896 896" focusable="false" className="ant-time-icon" data-icon="clock-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                  <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
                  <path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path>
                </svg>
              </span>
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