import moment from 'moment';

// Константа для московского времени (GMT+3)
const MOSCOW_TIMEZONE = '+03:00';

/**
 * Форматирует timestamp в московское время
 * @param {string|Date} timestamp - временная метка
 * @param {string} format - формат вывода (по умолчанию DD.MM.YYYY HH:mm:ss)
 * @returns {string} отформатированная дата
 */
export const formatToMoscowTime = (timestamp, format = 'DD.MM.YYYY HH:mm:ss') => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return moment(date).utcOffset(MOSCOW_TIMEZONE).format(format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Получает текущее время в московском часовом поясе
 * @param {string} format - формат вывода
 * @returns {string} текущее время
 */
export const getCurrentMoscowTime = (format = 'DD.MM.YYYY HH:mm:ss') => {
  return moment().utcOffset(MOSCOW_TIMEZONE).format(format);
};

/**
 * Проверяет, является ли дата прошедшей (в московском времени)
 * @param {string|Date} date - дата для проверки
 * @returns {boolean} true если дата в прошлом
 */
export const isDateInPastMoscow = (date) => {
  if (!date) return false;
  
  const checkDate = moment(date).utcOffset(MOSCOW_TIMEZONE).startOf('day');
  const today = moment().utcOffset(MOSCOW_TIMEZONE).startOf('day');
  
  return checkDate.isBefore(today);
};