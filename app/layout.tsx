import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import AuthGuard from '../components/AuthGuard'
const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '4net - ERP',
  description: 'ERP de 4net',
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${manrope.className} bg-background text-foreground transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 