import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import moment from 'moment';
import './DateRangePicker.css';

const DateRangePicker = ({ value, onChange }) => {
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
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // For portal positioning
  const inputStartRef = useRef(null);
  const inputEndRef = useRef(null);
  const dateRangePickerRef = useRef(null);
  const calendarPopupRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState({});

  // Update calendar position under input
  const updatePopupPosition = () => {
    const ref = activeInput === 'end' ? inputEndRef : inputStartRef;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPopupStyle({
        position: 'absolute',
        top: `${rect.bottom + window.scrollY + 4}px`,
        left: `${rect.left + window.scrollX}px`,
        zIndex: 3000,
        minWidth: `${rect.width}px`,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePopupPosition();
      window.addEventListener('scroll', updatePopupPosition, true);
      window.addEventListener('resize', updatePopupPosition);
      return () => {
        window.removeEventListener('scroll', updatePopupPosition, true);
        window.removeEventListener('resize', updatePopupPosition);
      };
    }
  // eslint-disable-next-line
  }, [isOpen, activeInput]);

  // Обработчик клика вне календаря
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем клик вне основного контейнера и вне popup календаря
      if (
        dateRangePickerRef.current && 
        !dateRangePickerRef.current.contains(event.target) &&
        calendarPopupRef.current &&
        !calendarPopupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setActiveInput(null);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };

    // Добавляем обработчик события только когда календарь открыт
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Очищаем обработчик при размонтировании или когда календарь закрывается
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update internal state when props change
  useEffect(() => {
    if (value && value[0]) setCurrentStartDate(value[0].toDate());
    if (value && value[1]) setCurrentEndDate(value[1].toDate());
  }, [value]);

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Generate array of years (current year ± 50 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 50; year <= currentYear + 50; year++) {
      years.push(year);
    }
    return years;
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
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

      if (selectedDate > currentEndDate) {
        setCurrentEndDate(selectedDate);
      }
    } else {
      setCurrentEndDate(selectedDate);
      setIsOpen(false);
      setActiveInput(null);
      setSelectingStartDate(true);
    }

    if (onChange) {
      const newStartDate = selectingStartDate ? moment(selectedDate) : moment(currentStartDate);
      const newEndDate = selectingStartDate ? moment(currentEndDate) : moment(selectedDate);
      onChange([newStartDate, newEndDate]);
    }
  };

  const handleYearSelect = (year) => {
    setCurrentMonth(prevMonth => new Date(year, prevMonth.getMonth()));
    setShowYearPicker(false);
  };

  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), monthIndex));
    setShowMonthPicker(false);
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
      setTimeout(updatePopupPosition, 0); // пересчитать позицию после рендера
    }
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  const toggleYearPicker = (e) => {
    e.stopPropagation();
    setShowYearPicker(!showYearPicker);
    setShowMonthPicker(false);
  };

  const toggleMonthPicker = (e) => {
    e.stopPropagation();
    setShowMonthPicker(!showMonthPicker);
    setShowYearPicker(false);
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
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
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

  const renderYearPicker = () => {
    const years = generateYears();
    const currentYear = currentMonth.getFullYear();
    
    return (
      <div className="picker-dropdown year-picker">
        <div className="picker-list">
          {years.map(year => (
            <div
              key={year}
              onClick={() => handleYearSelect(year)}
              className={`picker-item ${year === currentYear ? 'selected' : ''}`}
            >
              {year}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthPicker = () => {
    const currentMonthIndex = currentMonth.getMonth();
    
    return (
      <div className="picker-dropdown month-picker">
        <div className="picker-list">
          {months.map((month, index) => (
            <div
              key={index}
              onClick={() => handleMonthSelect(index)}
              className={`picker-item ${index === currentMonthIndex ? 'selected' : ''}`}
            >
              {month}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Календарь в portal
  const calendarPopup = isOpen ? createPortal(
    <div className="calendar-popup" style={popupStyle} ref={calendarPopupRef}>
      <div className="calendar-header">
        <button
          onClick={handlePrevMonth}
          className="month-nav-button"
          type="button"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="current-month-year">
          <div className="month-selector" onClick={toggleMonthPicker}>
            <span className="month-text">{months[currentMonth.getMonth()]}</span>
            <ChevronDown size={14} className={`dropdown-icon ${showMonthPicker ? 'rotated' : ''}`} />
          </div>
          <div className="year-selector" onClick={toggleYearPicker}>
            <span className="year-text">{currentMonth.getFullYear()}</span>
            <ChevronDown size={14} className={`dropdown-icon ${showYearPicker ? 'rotated' : ''}`} />
          </div>
          {showYearPicker && renderYearPicker()}
          {showMonthPicker && renderMonthPicker()}
        </div>
        <button
          onClick={handleNextMonth}
          className="month-nav-button"
          type="button"
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
          type="button"
        >
          Сегодня
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            setActiveInput(null);
            setShowYearPicker(false);
            setShowMonthPicker(false);
          }}
          className="close-button"
          type="button"
        >
          Закрыть
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="date-range-picker-container" style={{ position: 'relative' }} ref={dateRangePickerRef}>
      <div className="date-range-inputs flex items-center">
        <div className="date-input-wrapper relative">
          <input
            type="text"
            className="date-range-input"
            placeholder="Начальная дата"
            value={formatDate(currentStartDate)}
            readOnly
            ref={inputStartRef}
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
            className="date-range-input"
            placeholder="Конечная дата"
            value={formatDate(currentEndDate)}
            readOnly
            ref={inputEndRef}
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
      {calendarPopup}
    </div>
  );
};

export default DateRangePicker;