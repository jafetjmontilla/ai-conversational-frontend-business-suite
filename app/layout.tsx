import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/navigation/SidebarNew'
import { cookies } from 'next/headers'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pestilo - Bienestar y Cuidado Personal',
  description: 'Tu compañero digital para una vida más saludable y equilibrada',
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const pathname = usePathname()

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-200`}>
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              {!['/login', '/register'].includes(pathname)
                ? <SidebarProvider defaultOpen={defaultOpen} >
                  <AppSidebar />
                  <SidebarTrigger className='block md:hidden sticky top-10 left-10 z-10' />
                  {children}
                </SidebarProvider>
                : children
              }
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
} 