export interface Currency {
  code: string;
  symbol: string;
  name: string;
  country: string;
} 

export const CURRENCIES: Currency[] = [
  // Indian Subcontinent
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee',         country: 'India' },
  { code: 'PKR', symbol: '₨',    name: 'Pakistani Rupee',      country: 'Pakistan' },
  { code: 'BDT', symbol: '৳',    name: 'Bangladeshi Taka',     country: 'Bangladesh' },
  { code: 'LKR', symbol: 'Rs',   name: 'Sri Lankan Rupee',     country: 'Sri Lanka' },
  { code: 'NPR', symbol: 'Rs',   name: 'Nepalese Rupee',       country: 'Nepal' },
  // Gulf / Middle East
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',           country: 'United Arab Emirates' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal',          country: 'Saudi Arabia' },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial',           country: 'Oman' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal',         country: 'Qatar' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar',        country: 'Kuwait' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar',      country: 'Bahrain' },
  { code: 'JOD', symbol: 'JD',   name: 'Jordanian Dinar',      country: 'Jordan' },
  { code: 'ILS', symbol: '₪',   name: 'Israeli Shekel',       country: 'Israel' },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira',         country: 'Turkey' },
  { code: 'IQD', symbol: 'IQD',  name: 'Iraqi Dinar',          country: 'Iraq' },
  // Americas
  { code: 'USD', symbol: '$',    name: 'US Dollar',            country: 'United States' },
  { code: 'CAD', symbol: 'C$',   name: 'Canadian Dollar',      country: 'Canada' },
  { code: 'MXN', symbol: '$',    name: 'Mexican Peso',         country: 'Mexico' },
  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real',       country: 'Brazil' },
  { code: 'ARS', symbol: '$',    name: 'Argentine Peso',       country: 'Argentina' },
  { code: 'CLP', symbol: '$',    name: 'Chilean Peso',         country: 'Chile' },
  { code: 'COP', symbol: '$',    name: 'Colombian Peso',       country: 'Colombia' },
  { code: 'PEN', symbol: 'S/',   name: 'Peruvian Sol',         country: 'Peru' },
  // Europe
  { code: 'EUR', symbol: '€',   name: 'Euro',                 country: 'Europe' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',        country: 'United Kingdom' },
  { code: 'CHF', symbol: 'Fr',   name: 'Swiss Franc',          country: 'Switzerland' },
  { code: 'SEK', symbol: 'kr',   name: 'Swedish Krona',        country: 'Sweden' },
  { code: 'NOK', symbol: 'kr',   name: 'Norwegian Krone',      country: 'Norway' },
  { code: 'DKK', symbol: 'kr',   name: 'Danish Krone',         country: 'Denmark' },
  { code: 'PLN', symbol: 'zł',   name: 'Polish Zloty',         country: 'Poland' },
  { code: 'CZK', symbol: 'Kč',   name: 'Czech Koruna',         country: 'Czech Republic' },
  { code: 'HUF', symbol: 'Ft',   name: 'Hungarian Forint',     country: 'Hungary' },
  { code: 'RON', symbol: 'lei',  name: 'Romanian Leu',         country: 'Romania' },
  { code: 'RUB', symbol: '₽',   name: 'Russian Ruble',        country: 'Russia' },
  { code: 'UAH', symbol: '₴',   name: 'Ukrainian Hryvnia',    country: 'Ukraine' },
  // Asia Pacific
  { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar',     country: 'Singapore' },
  { code: 'MYR', symbol: 'RM',   name: 'Malaysian Ringgit',    country: 'Malaysia' },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht',            country: 'Thailand' },
  { code: 'IDR', symbol: 'Rp',   name: 'Indonesian Rupiah',    country: 'Indonesia' },
  { code: 'PHP', symbol: '₱',   name: 'Philippine Peso',      country: 'Philippines' },
  { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong',      country: 'Vietnam' },
  { code: 'KRW', symbol: '₩',   name: 'South Korean Won',     country: 'South Korea' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',         country: 'Japan' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',         country: 'China' },
  { code: 'HKD', symbol: 'HK$',  name: 'Hong Kong Dollar',     country: 'Hong Kong' },
  { code: 'TWD', symbol: 'NT$',  name: 'Taiwan Dollar',        country: 'Taiwan' },
  // Africa
  { code: 'ZAR', symbol: 'R',    name: 'South African Rand',   country: 'South Africa' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',       country: 'Nigeria' },
  { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',      country: 'Kenya' },
  { code: 'GHS', symbol: 'GH₵',  name: 'Ghanaian Cedi',        country: 'Ghana' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound',       country: 'Egypt' },
  // Oceania
  { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',    country: 'Australia' },
  { code: 'NZD', symbol: 'NZ$',  name: 'New Zealand Dollar',   country: 'New Zealand' },
];

export const getCurrencyByCode = (code: string): Currency =>
  CURRENCIES.find(c => c.code === code) || { code, symbol: code, name: code, country: '' };

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
