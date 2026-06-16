export interface Currency {
  code: string;
  symbol: string;
  name: string;
  country: string;
} 

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee',        country: 'India' },
  { code: 'USD', symbol: '$',    name: 'US Dollar',           country: 'United States' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',          country: 'United Arab Emirates' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal',         country: 'Saudi Arabia' },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial',          country: 'Oman' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal',        country: 'Qatar' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar',       country: 'Kuwait' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar',     country: 'Bahrain' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',        country: 'United Kingdom' },
  { code: 'EUR', symbol: '€',   name: 'Euro',                 country: 'Europe' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',      country: 'Canada' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',    country: 'Australia' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',     country: 'Singapore' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit',    country: 'Malaysia' },
];

export const getCurrencyByCode = (code: string): Currency =>
  CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

export const getCurrencyByCountry = (country: string): Currency => {
  const match = CURRENCIES.find(c =>
    c.country.toLowerCase() === country.toLowerCase()
  );
  return match || CURRENCIES[0];
};

export const formatSalaryWithCurrency = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (amount >= 1000000) return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${currency.symbol}${(amount / 1000).toFixed(0)}K`;
  // INR-specific formatting
  if (currencyCode === 'INR') {
    if (amount >= 10000000) return `${currency.symbol}${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000)   return `${currency.symbol}${(amount / 100000).toFixed(1)}L`;
  }
  return `${currency.symbol}${amount.toLocaleString()}`;
};
