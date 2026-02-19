import React from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import Toaster from "@/components/ui/sonner"

const AuthGuard = dynamic(
  () => import('@/components/AuthGuard').then((m) => ({ default: m.AuthGuard })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
      </div>
    ),
  }
)
const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production'
    ? 'http://api2.eventosorganizador.com'
    : process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'http://localhost:3000'
  ),
  title: '4net - ERP',
  description: 'ERP de 4net',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://4net.com.ve/&size=16',
    apple: '/images/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '4net ERP',
  },
  openGraph: {
    title: '4net - ERP',
    description: 'ERP de 4net',
    images: 'https://i.ibb.co/B20cdqDy/4net-Logo-Open-Graph.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <script src="/register-sw.js" defer></script>
      </head>
      <body className={`${manrope.className} bg-background text-foreground transition-colors duration-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="4netERP-theme"
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