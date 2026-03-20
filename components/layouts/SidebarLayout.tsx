"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/navigation/AppSidebar"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shield, Building2, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import packageJson from "@/package.json"
import { getBusinessIdFromPathname, useMyBusinesses } from "@/lib/hooks/useAllowed"
import { getProfileHref } from "@/lib/profileRoutes"
import { fetchApiV1, queries } from "@/lib/Fetching"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const roleLabels: Record<string, string> = {
  system_admin: 'Administrador del sistema',
  system_operator: 'Operador del sistema',
  system_viewer: 'Solo lectura (sistema)',
};

const SYSTEM_VALUE = "__system__"

export function SidebarLayout({ children, defaultOpen }: { children: React.ReactNode, defaultOpen?: boolean }) {
  const [slugs, setSlugs] = useState<{ name: string, href: string }[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const pathname = usePathname()
  const { theme } = useThemeContext();
  const { authUser, logout } = useAuth();
  const router = useRouter();
  const { businesses, loading: loadingBusinesses } = useMyBusinesses();
  const currentBusinessId = getBusinessIdFromPathname(pathname || "");
  const selectValue = currentBusinessId || SYSTEM_VALUE;

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
            <div className="flex-1 text-xs" >
              {`ERP V-${packageJson.version}`}
            </div>
            {authUser && (businesses.length > 0 || authUser.customClaims?.role) && (
              <Select
                value={selectValue}
                onValueChange={async (value) => {
                  if (value === SYSTEM_VALUE) {
                    router.push("/dashboard");
                  } else {
                    const business = businesses.find((b) => b.businessId === value);
                    if (business?._id) {
                      try {
                        await fetchApiV1({ query: queries.setCurrentBusiness, type: "json", variables: { id: business._id } });
                      } catch {
                        // ignorar error; la navegación sigue siendo válida
                      }
                    }
                    router.push(`/${value}`);
                  }
                }}
                disabled={loadingBusinesses}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs border-border/50 bg-muted/30">
                  <Building2 className="h-3.5 w-3.5 opacity-70 mr-1.5 shrink-0" />
                  <SelectValue placeholder="Negocio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SYSTEM_VALUE}>Sistema / Dashboard</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b._id} value={b.businessId}>
                      {b.name || b.businessId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {authUser &&
              <div className="flex items-center gap-3 md:translate-y-[2px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 cursor-pointer rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
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
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push(getProfileHref(currentBusinessId))}>
                      <User className="h-4 w-4 mr-2" />
                      Mi perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={async () => {
                        try {
                          const response = await logout();
                          if (response.success) {
                            toast.success("Sesión cerrada");
                            router.push("/login");
                          } else {
                            toast.error("Error al cerrar sesión");
                          }
                        } catch {
                          toast.error("Error al cerrar sesión");
                        }
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
