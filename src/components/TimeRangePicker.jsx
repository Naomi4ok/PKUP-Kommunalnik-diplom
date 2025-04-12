import React, { useState, useEffect } from 'react';
import './TimeRangePicker.css';

const TimeRangePicker = ({
  label = 'Time Range',
  is24Hour = false,
  onChange = () => {},
  initialFromTime = '',
  initialToTime = '',
  required = false
}) => {
  const [fromTime, setFromTime] = useState(initialFromTime);
  const [toTime, setToTime] = useState(initialToTime);
  const [fromPeriod, setFromPeriod] = useState(() => {
    if (initialFromTime && !is24Hour) {
      const hours = parseInt(initialFromTime.split(':')[0]);
      return hours >= 12 ? 'PM' : 'AM';
    }
    return 'AM';
  });
  const [toPeriod, setToPeriod] = useState(() => {
    if (initialToTime && !is24Hour) {
      const hours = parseInt(initialToTime.split(':')[0]);
      return hours >= 12 ? 'PM' : 'AM';
    }
    return 'AM';
  });

  useEffect(() => {
    if (fromTime && toTime) {
      onChange({
        from: formatTimeOutput(fromTime, fromPeriod),
        to: formatTimeOutput(toTime, toPeriod)
      });
    }
  }, [fromTime, toTime, fromPeriod, toPeriod]);

  const formatTimeOutput = (time, period) => {
    if (!time) return '';
    
    if (is24Hour) return time;
    
    const [hours, minutes] = time.split(':');
    let h = parseInt(hours);
    
    if (period === 'PM' && h !== 12) {
      h += 12;
    } else if (period === 'AM' && h === 12) {
      h = 0;
    }
    
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleTimeChange = (timeType, e) => {
    const newTime = e.target.value;
    
    if (timeType === 'from') {
      setFromTime(newTime);
    } else {
      setToTime(newTime);
    }
  };
  
  const handlePeriodChange = (timeType, newPeriod) => {
    if (timeType === 'from') {
      setFromPeriod(newPeriod);
    } else {
      setToPeriod(newPeriod);
    }
  };

  return (
    <div className="time-range-picker-container">
      {label && (
        <label className="time-range-label">
          {label}{required && <span className="required-mark">*</span>}
        </label>
      )}
      
      <div className="time-range-wrapper">
        <div className="time-input-group">
          <span className="time-label">From</span>
          <div className="time-input-wrapper">
            <input
              type="time"
              className="time-input"
              value={fromTime}
              onChange={(e) => handleTimeChange('from', e)}
              required={required}
            />
            
            {!is24Hour && (
              <div className="period-selector">
                <button 
                  type="button"
                  className={`period-btn ${fromPeriod === 'AM' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('from', 'AM')}
                >
                  AM
                </button>
                <button 
                  type="button"
                  className={`period-btn ${fromPeriod === 'PM' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('from', 'PM')}
                >
                  PM
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="time-range-separator">to</div>
        
        <div className="time-input-group">
          <span className="time-label">To</span>
          <div className="time-input-wrapper">
            <input
              type="time"
              className="time-input"
              value={toTime}
              onChange={(e) => handleTimeChange('to', e)}
              required={required}
            />
            
            {!is24Hour && (
              <div className="period-selector">
                <button 
                  type="button"
                  className={`period-btn ${toPeriod === 'AM' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('to', 'AM')}
                >
                  AM
                </button>
                <button 
                  type="button"
                  className={`period-btn ${toPeriod === 'PM' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('to', 'PM')}
                >
                  PM
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;