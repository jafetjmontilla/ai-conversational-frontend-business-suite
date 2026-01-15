"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/navigation/AppSidebar"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useTasaBCV } from "@/hooks/useTasaBCV"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  accounting: 'Contabilidad',
  callCenter: 'Call Center',
  technicalSupport: 'Soporte Técnico',
  logicalSupport: 'Soporte Lógico',
  sales: 'Ventas',
  none: 'Sin rol'
};

export function SidebarLayout({ children, defaultOpen }: { children: React.ReactNode, defaultOpen?: boolean }) {
  const [slugs, setSlugs] = useState<{ name: string, href: string }[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const pathname = usePathname()
  const { tasaBCV, loading: tasaLoading, error: tasaError } = useTasaBCV()
  const { theme } = useThemeContext();
  const { authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Actualiza cada minuto

    return () => clearInterval(timer)
  }, [])

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar setSlugs={setSlugs} />
      <div className="flex flex-col w-[100vw] h-[100vh]">
        <div className="flex items-center md:items-end w-full h-10 bg-background border-b border-border shadow-sm px-2 md:px-7 py-1 gap-5 cursor-default">
          <div className="flex-1 flex gap-4 items-center" >
            <span className="md:hidden">
              <Image src={theme === "dark" ? `/images/4net-logo-white.png` : `/images/4net-logo-black.png`} alt="Logo" width={50} height={30} className="rounded-md" />
            </span>
            <div className="flex-1" />
            {authUser &&
              <div className="flex items-center gap-3 md:translate-y-[2px]">
                <div onClick={() => router.push("/profile")} className="flex items-center gap-2 cursor-pointer">
                  <div className="flex flex-col items-end leading-[15px]">
                    <span className="text-sm font-medium text-foreground truncate">
                      {authUser.displayName}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {authUser.email}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8 hidden md:block">
                    <AvatarImage src={authUser.photoURL || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {authUser.displayName?.charAt(0)?.toUpperCase() || authUser.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="hidden md:flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs flex items-center gap-1 border border-border/50">
                      <Shield className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {roleLabels[authUser.customClaims?.role as string] || authUser.customClaims?.role || "Sin rol"}
                      </span>
                    </Badge>
                    {/* <Badge variant="outline" className="h-5 px-1.5 text-xs">
                      Activo
                    </Badge> */}
                  </div>
                </div>
              </div>
            }
            {/* <span className="uppercase">{slugs.find((slug) => slug.href === pathname)?.name}</span> */}
          </div>
          {/* <span id="tasaBCV" className="block">
            {tasaLoading ? 'Cargando...' : tasaError ? 'Error' : tasaBCV ? `$ ${tasaBCV.tasa.toFixed(2)}` : '$ 0.00'}
          </span> */}
          <SidebarTrigger className="bg-white/30 flex items-center justify-center md:hidden" />
          <span className="hidden md:block first-letter:uppercase text-sm">{currentDate.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric', month: 'numeric',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}</span>
        </div>
        {children}
      </div>
    </SidebarProvider>
  )
}
