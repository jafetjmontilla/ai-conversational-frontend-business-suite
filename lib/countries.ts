export interface CountryConfig {
  code: string;
  name: string;
  language: string;
  flag: string;
  currency: string;
}

export const COUNTRIES: Record<string, CountryConfig> = {
  've': {
    code: 've',
    name: 'Venezuela',
    language: 'es',
    flag: '🇻🇪',
    currency: 'VES'
  },
  'mx': {
    code: 'mx',
    name: 'México',
    language: 'es',
    flag: '🇲🇽',
    currency: 'MXN'
  },
  'co': {
    code: 'co',
    name: 'Colombia',
    language: 'es',
    flag: '🇨🇴',
    currency: 'COP'
  },
  'ar': {
    code: 'ar',
    name: 'Argentina',
    language: 'es',
    flag: '🇦🇷',
    currency: 'ARS'
  },
  'cl': {
    code: 'cl',
    name: 'Chile',
    language: 'es',
    flag: '🇨🇱',
    currency: 'CLP'
  },
  'pe': {
    code: 'pe',
    name: 'Perú',
    language: 'es',
    flag: '🇵🇪',
    currency: 'PEN'
  },
  'us': {
    code: 'us',
    name: 'United States',
    language: 'en',
    flag: '🇺🇸',
    currency: 'USD'
  },
  'ca': {
    code: 'ca',
    name: 'Canada',
    language: 'en',
    flag: '🇨🇦',
    currency: 'CAD'
  },
  'gb': {
    code: 'gb',
    name: 'United Kingdom',
    language: 'en',
    flag: '🇬🇧',
    currency: 'GBP'
  }
};

export const DEFAULT_COUNTRY = 'ar';
export const SUPPORTED_COUNTRIES = Object.keys(COUNTRIES);

// Funciones de utilidad
export function getCountryConfig(countryCode: string): CountryConfig {
  return COUNTRIES[countryCode] || COUNTRIES[DEFAULT_COUNTRY];
}

export function getLanguageFromCountry(countryCode: string): string {
  return getCountryConfig(countryCode).language;
}

export function isValidCountry(countryCode: string): boolean {
  return countryCode in COUNTRIES;
}

export function getCountriesByLanguage(language: string): CountryConfig[] {
  return Object.values(COUNTRIES).filter(country => country.language === language);
}
