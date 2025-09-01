import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { BusinessProvider } from '../contexts/BusinessContext'
import { ThemeProvider } from 'next-themes'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '4net - Bienestar y Cuidado Personal',
  description: 'Tu compañero digital para una vida más saludable y equilibrada',
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <BusinessProvider>
              {children}
            </BusinessProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 