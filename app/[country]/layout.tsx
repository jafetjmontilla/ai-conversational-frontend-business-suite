import { notFound } from 'next/navigation';
import { isValidCountry, getLanguageFromCountry } from '@/lib/countries';
import { CountryProvider } from '@/components/providers/CountryProvider';
import Sidebar from '@/components/navigation/Sidebar';
// import Navigation from '@/components/Navigation';

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
      {/* <Navigation /> */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <Sidebar basePath={`/${country}`} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
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
