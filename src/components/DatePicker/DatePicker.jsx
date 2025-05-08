import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './DatePicker.css';

const DatePicker = ({ selectedDate, onChange }) => {
  // Initialize internal state from props
  const [currentSelectedDate, setCurrentSelectedDate] = useState(selectedDate || new Date());
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [isOpen, setIsOpen] = useState(false);

  // Update internal state when prop changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentSelectedDate(selectedDate);
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

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
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setCurrentSelectedDate(newDate);
    setIsOpen(false);
    
    // Call the parent's onChange with the new date
    if (onChange) {
      onChange(newDate);
    }
  };

  const toggleCalendar = () => {
    setIsOpen(!isOpen);
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
      const isSelected = 
        currentSelectedDate.getDate() === day && 
        currentSelectedDate.getMonth() === currentMonth.getMonth() && 
        currentSelectedDate.getFullYear() === currentMonth.getFullYear();
      
      const isToday = 
        new Date().getDate() === day && 
        new Date().getMonth() === currentMonth.getMonth() && 
        new Date().getFullYear() === currentMonth.getFullYear();
      
      let dayClassName = 'calendar-day';
      if (isSelected) dayClassName += ' selected';
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
    <div className="date-picker-container">
      <div className="date-input-wrapper">
        <input
          type="text"
          className="date-input"
          placeholder="Выберите дату"
          value={formatDate(currentSelectedDate)}
          readOnly
          onClick={toggleCalendar}
        />
        <div 
          className="calendar-icon"
          onClick={toggleCalendar}
        >
          <Calendar size={20} />
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
                setCurrentSelectedDate(today);
                setCurrentMonth(today);
                if (onChange) {
                  onChange(today);
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

export default DatePicker;