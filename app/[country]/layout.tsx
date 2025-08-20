import { notFound } from 'next/navigation';
import { isValidCountry, getLanguageFromCountry } from '@/lib/countries';
import { CountryProvider } from '@/components/providers/CountryProvider';
import Sidebar from '@/components/navigation/Sidebar';
import { cookies } from "next/headers"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from '@/components/navigation/SidebarNew';
// import Navigation from '@/components/Navigation';

interface CountryLayoutProps {
  children: React.ReactNode;
  params: {
    country: string;
  };
}

export default function CountryLayout({ children, params }: CountryLayoutProps) {
  const { country } = params;
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  // Validar que el país sea válido
  if (!isValidCountry(country)) {
    notFound();
  }

  return (
    <CountryProvider country={country}>
      {/* <Navigation /> */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* <Sidebar basePath={`/${country}`} /> */}
          <SidebarProvider defaultOpen={defaultOpen} >
            <AppSidebar basePath={`/${country}`} />
            <SidebarTrigger className='block md:hidden sticky top-10 left-10 z-10' />
            <main className="flex-1">
              {children}
            </main>
          </SidebarProvider>
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
