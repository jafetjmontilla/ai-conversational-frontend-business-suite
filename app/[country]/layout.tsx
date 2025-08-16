import { notFound } from 'next/navigation';
import { isValidCountry, getLanguageFromCountry } from '@/lib/countries';
import { CountryProvider } from '@/components/providers/CountryProvider';

interface CountryLayoutProps {
  children: React.ReactNode;
  params: {
    country: string;
  };
}

export default function CountryLayout({ 
  children, 
  params 
}: CountryLayoutProps) {
  const { country } = params;
  
  // Validar que el país sea válido
  if (!isValidCountry(country)) {
    notFound();
  }

  return (
    <CountryProvider country={country}>
      {children}
    </CountryProvider>
  );
}

// Generar rutas estáticas para todos los países soportados
export async function generateStaticParams() {
  const { SUPPORTED_COUNTRIES } = await import('@/lib/countries');
  
  return SUPPORTED_COUNTRIES.map((country) => ({
    country,
  }));
}
