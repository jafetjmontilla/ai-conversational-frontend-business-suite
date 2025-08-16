'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCountryConfig, type CountryConfig } from '@/lib/countries';

interface CountryContextType {
  country: CountryConfig;
  countryCode: string;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

interface CountryProviderProps {
  children: React.ReactNode;
  country: string;
}

export function CountryProvider({ children, country }: CountryProviderProps) {
  const { i18n } = useTranslation();
  const countryConfig = getCountryConfig(country);

  useEffect(() => {
    // Cambiar el idioma basado en el país
    if (i18n.language !== countryConfig.language) {
      i18n.changeLanguage(countryConfig.language);
    }
  }, [countryConfig.language, i18n]);

  const contextValue: CountryContextType = {
    country: countryConfig,
    countryCode: country,
  };

  return (
    <CountryContext.Provider value={contextValue}>
      {children}
    </CountryContext.Provider>
  );
}

// Hook para usar el contexto de país
export function useCountry() {
  const context = useContext(CountryContext);
  
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  
  return context;
}
