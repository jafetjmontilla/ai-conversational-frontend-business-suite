import React from 'react'
import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import Toaster from "@/components/ui/sonner"
import { APP_ICONS, APP_LOGO } from "@/lib/branding"
import { AuthGuardClient } from '@/components/AuthGuardClient'

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
    icon: [
      { url: APP_ICONS.favicon, sizes: 'any' },
      { url: APP_ICONS.favicon16, sizes: '16x16', type: 'image/png' },
      { url: APP_ICONS.favicon32, sizes: '32x32', type: 'image/png' },
    ],
    apple: APP_ICONS.apple,
    shortcut: APP_ICONS.favicon,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '4net ERP',
  },
  openGraph: {
    title: '4net - ERP',
    description: 'ERP de 4net',
    images: APP_LOGO,
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
            <AuthGuardClient>
              {children}
              <Toaster />
            </AuthGuardClient>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 