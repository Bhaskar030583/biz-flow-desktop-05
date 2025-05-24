
import { CurrencyType, TimeFormat, DateFormat } from '@/context/SettingsContext';

/**
 * Format a number as currency based on settings
 */
export const formatCurrency = (amount: number, currency: CurrencyType = 'INR'): string => {
  const currencyConfig = {
    INR: { code: 'INR', locale: 'en-IN' },
    USD: { code: 'USD', locale: 'en-US' },
    EUR: { code: 'EUR', locale: 'en-GB' },
    GBP: { code: 'GBP', locale: 'en-GB' },
    JPY: { code: 'JPY', locale: 'ja-JP' }
  };

  const config = currencyConfig[currency];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2
  }).format(amount);
};

/**
 * Format a date based on settings
 */
export const formatDate = (date: string | Date, format: DateFormat = 'DD/MM/YYYY'): string => {
  const dateObj = new Date(date);
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Format time based on settings
 */
export const formatTime = (date: string | Date, format: TimeFormat = '12h'): string => {
  const dateObj = new Date(date);
  
  if (format === '24h') {
    return dateObj.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  return dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Format datetime based on settings
 */
export const formatDateTime = (
  date: string | Date, 
  dateFormat: DateFormat = 'DD/MM/YYYY', 
  timeFormat: TimeFormat = '12h'
): string => {
  return `${formatDate(date, dateFormat)} ${formatTime(date, timeFormat)}`;
};
