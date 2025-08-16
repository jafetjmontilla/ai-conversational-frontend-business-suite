import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES } from './lib/countries';

// Función para detectar el país preferido del usuario
function getPreferredCountry(request: NextRequest): string {
  // 1. Usar geolocalización si está disponible (ISO-2)
  const geoCountry = request.geo?.country?.toLowerCase();
  if (geoCountry && SUPPORTED_COUNTRIES.includes(geoCountry)) {
    return geoCountry;
  }

  // 2. Verificar si hay un país guardado en cookies
  const countryFromCookie = request.cookies.get('preferred-country')?.value;
  if (countryFromCookie && SUPPORTED_COUNTRIES.includes(countryFromCookie)) {
    return countryFromCookie;
  }

  // 3. Detectar por el header Accept-Language
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Mapeo simple de idiomas a países por defecto
    const languageToCountry: Record<string, string> = {
      'es': DEFAULT_COUNTRY, // Español -> País por defecto del proyecto
      'en': 'us', // Inglés -> Estados Unidos (por defecto)
      'es-VE': 've',
      'es-MX': 'mx',
      'es-CO': 'co',
      'es-AR': 'ar',
      'es-CL': 'cl',
      'es-PE': 'pe',
      'en-US': 'us',
      'en-CA': 'ca',
      'en-GB': 'gb',
    };

    // Buscar coincidencias exactas primero
    for (const [lang, country] of Object.entries(languageToCountry)) {
      if (acceptLanguage.toLowerCase().includes(lang.toLowerCase())) {
        return country;
      }
    }

    // Buscar por idioma base
    if (acceptLanguage.toLowerCase().includes('es')) {
      return languageToCountry['es']
    };
    if (acceptLanguage.toLowerCase().includes('en')) {
      return languageToCountry['en']
    };
  }

  // 4. País por defecto
  return DEFAULT_COUNTRY;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Ignorar archivos estáticos y API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {

    return NextResponse.next();
  }

  // Verificar si la ruta ya incluye un país válido
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && SUPPORTED_COUNTRIES.includes(firstSegment)) {
    // La ruta ya tiene un país válido, continuar
    const response = NextResponse.next();

    // Guardar el país en las cookies para futuras visitas
    response.cookies.set('preferred-country', firstSegment, {
      maxAge: 60 * 60 * 24 * 365, // 1 año
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  }

  // Si no hay país en la URL, redirigir al país preferido
  const preferredCountry = getPreferredCountry(request);
  const newPathname = `/${preferredCountry}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.redirect(new URL(newPathname, request.url));

  // Guardar el país en las cookies
  response.cookies.set('preferred-country', preferredCountry, {
    maxAge: 60 * 60 * 24 * 365, // 1 año
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
