import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import './DateRangePicker.css';

const DateRangePicker = ({ value, onChange }) => {
  // Преобразуем входные значения moment в JavaScript Date
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    return value && value[0] ? value[0].toDate() : new Date();
  });
  const [currentEndDate, setCurrentEndDate] = useState(() => {
    return value && value[1] ? value[1].toDate() : new Date();
  });
  
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value && value[0] ? value[0].toDate() : new Date();
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  // Обновляем внутреннее состояние при изменении props
  useEffect(() => {
    if (value && value[0]) {
      setCurrentStartDate(value[0].toDate());
    }
    if (value && value[1]) {
      setCurrentEndDate(value[1].toDate());
    }
  }, [value]);

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    // Adjust for Monday as first day of week (0 is Monday, 6 is Sunday)
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      const year = prevMonth.getMonth() === 0 ? prevMonth.getFullYear() - 1 : prevMonth.getFullYear();
      const month = prevMonth.getMonth() === 0 ? 11 : prevMonth.getMonth() - 1;
      return new Date(year, month);
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const year = prevMonth.getMonth() === 11 ? prevMonth.getFullYear() + 1 : prevMonth.getFullYear();
      const month = prevMonth.getMonth() === 11 ? 0 : prevMonth.getMonth() + 1;
      return new Date(year, month);
    });
  };

  const handleSelectDate = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (selectingStartDate || selectedDate < currentStartDate) {
      setCurrentStartDate(selectedDate);
      setSelectingStartDate(false);
      
      // If selecting a new start date that's after the current end date
      if (selectedDate > currentEndDate) {
        setCurrentEndDate(selectedDate);
      }
    } else {
      setCurrentEndDate(selectedDate);
      setIsOpen(false);
      setSelectingStartDate(true);
    }
    
    // Call the parent's onChange with both dates converted to moment objects
    if (onChange) {
      const newStartDate = selectingStartDate ? moment(selectedDate) : moment(currentStartDate);
      const newEndDate = selectingStartDate ? moment(currentEndDate) : moment(selectedDate);
      onChange([newStartDate, newEndDate]);
    }
  };

  const toggleCalendar = (inputType) => {
    if (isOpen && activeInput === inputType) {
      setIsOpen(false);
      setActiveInput(null);
    } else {
      setIsOpen(true);
      setActiveInput(inputType);
      setSelectingStartDate(inputType === 'start');
      setCurrentMonth(inputType === 'start' ? currentStartDate : currentEndDate);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add cells for the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      
      const isStartDate = 
        currentStartDate.getDate() === day && 
        currentStartDate.getMonth() === currentMonth.getMonth() && 
        currentStartDate.getFullYear() === currentMonth.getFullYear();
      
      const isEndDate = 
        currentEndDate.getDate() === day && 
        currentEndDate.getMonth() === currentMonth.getMonth() && 
        currentEndDate.getFullYear() === currentMonth.getFullYear();
      
      const isInRange = 
        currentDate > currentStartDate && 
        currentDate < currentEndDate;
      
      const isToday = 
        new Date().getDate() === day && 
        new Date().getMonth() === currentMonth.getMonth() && 
        new Date().getFullYear() === currentMonth.getFullYear();
      
      let dayClassName = 'calendar-day';
      if (isStartDate) dayClassName += ' start-date';
      if (isEndDate) dayClassName += ' end-date';
      if (isInRange) dayClassName += ' in-range';
      if (isToday) dayClassName += ' today';
      
      days.push(
        <div 
          key={day} 
          onClick={() => handleSelectDate(day)} 
          className={dayClassName}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="date-range-picker-container">
      <div className="date-range-inputs flex items-center">
        <div className="date-input-wrapper relative">
          <input
            type="text"
            className="date-input"
            placeholder="Начальная дата"
            value={formatDate(currentStartDate)}
            readOnly
            onClick={() => toggleCalendar('start')}
          />
          <div 
            className="calendar-icon absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={() => toggleCalendar('start')}
          >
            <Calendar size={20} />
          </div>
        </div>
        <div className="date-separator mx-2">→</div>
        <div className="date-input-wrapper relative">
          <input
            type="text"
            className="date-input"
            placeholder="Конечная дата"
            value={formatDate(currentEndDate)}
            readOnly
            onClick={() => toggleCalendar('end')}
          />
          <div 
            className="calendar-icon absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={() => toggleCalendar('end')}
          >
            <Calendar size={20} />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="calendar-popup">
          <div className="calendar-header">
            <button 
              onClick={handlePrevMonth}
              className="month-nav-button"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="current-month">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button 
              onClick={handleNextMonth}
              className="month-nav-button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="calendar-grid">
            {daysOfWeek.map(day => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
          
          <div className="calendar-footer">
            <button 
              onClick={() => {
                const today = new Date();
                if (selectingStartDate) {
                  setCurrentStartDate(today);
                  setSelectingStartDate(false);
                } else {
                  setCurrentEndDate(today);
                  setSelectingStartDate(true);
                }
                setCurrentMonth(today);
                
                if (onChange) {
                  const newStartDate = moment(selectingStartDate ? today : currentStartDate);
                  const newEndDate = moment(selectingStartDate ? currentEndDate : today);
                  onChange([newStartDate, newEndDate]);
                }
              }}
              className="today-button"
            >
              Сегодня
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="close-button"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;