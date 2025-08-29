import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { BusinessProvider } from '../contexts/BusinessContext'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/components/providers/I18nProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pestilo - Bienestar y Cuidado Personal',
  description: 'Tu compañero digital para una vida más saludable y equilibrada',
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-200`}>
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <BusinessProvider>
                {children}
              </BusinessProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
} 