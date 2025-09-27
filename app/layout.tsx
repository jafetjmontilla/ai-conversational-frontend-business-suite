import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import AuthGuard from '../components/AuthGuard'
import { Toaster } from "@/components/ui/sonner"
const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production'
    ? 'http://api2.eventosorganizador.com'
    : process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'http://localhost:3000'
  ),
  title: 'sistemasJaihom - ERP',
  description: 'ERP de sistemasJaihom',
  icons: {
    icon: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sistemasJaihom.com.ve/&size=16',
  },
  openGraph: {
    title: 'sistemasJaihom - ERP',
    description: 'ERP de sistemasJaihom',
    images: 'https://i.ibb.co/FLHz9s58/sistemasJaihom-Logo-Open-Graph.png',
  },
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* <head>
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
      </head> */}
      <body className={`${manrope.className} bg-background text-foreground transition-colors duration-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="sistemasJaihom-theme"
        >
          <AuthProvider>
            <AuthGuard>
              {children}
              <Toaster />
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 