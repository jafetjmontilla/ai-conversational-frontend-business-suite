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
import { getBusinessIdFromPathname, useAllowed, useBusinessRole, useMyBusinesses } from "@/lib/hooks/useAllowed"
import { useBusinessApps } from "@/lib/hooks/useBusinessApps"
import { getProfileHref } from "@/lib/profileRoutes"
import { resolveNavBreadcrumb } from "@/lib/navigation/businessNav"
import { fetchApiV1, queries } from "@/lib/Fetching"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getRoleLabel } from "@/lib/roles";
import { BusinessProvider } from "@/contexts/BusinessProvider";

const SYSTEM_VALUE = "__system__"

export function SidebarLayout({ children, defaultOpen }: { children: React.ReactNode, defaultOpen?: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const pathname = usePathname()
  const { theme } = useThemeContext();
  const { authUser, logout } = useAuth();
  const router = useRouter();
  const { businesses, loading: loadingBusinesses } = useMyBusinesses();
  const currentBusinessId = getBusinessIdFromPathname(pathname || "");
  const selectValue = currentBusinessId || SYSTEM_VALUE;
  const { installedApps } = useBusinessApps(currentBusinessId);
  const { businessRole } = useBusinessRole(currentBusinessId);
  const { can } = useAllowed({ businessRole: businessRole ?? undefined });

  const activeNavLabel = resolveNavBreadcrumb(
    pathname || "",
    currentBusinessId,
    {
      canViewCurrentBusiness: can("negocio:ver"),
      canEditCurrentBusiness: can("negocio:editar"),
      canManageBusinessUsers: can("negocio:usuarios"),
    },
    {
      canViewBusinesses: can("negocios:ver"),
      canViewUsers: can("usuarios:ver"),
    },
    installedApps
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Actualiza cada minuto

    return () => clearInterval(timer)
  }, [])

  const mainContent = (
    <>
      <AppSidebar />
      <div className="flex flex-col w-[100vw] h-[100vh]">
        <div className="flex items-center w-full h-12 bg-background border-b border-border shadow-sm px-2 gap-5 cursor-default">
          <div className="flex flex-1 justify-between flex gap-4 items-center" >
            <span className="md:hidden">
              <Image src="/images/icons/android-chrome-192x192.png" alt="Logo" width={36} height={36} className="rounded-md" />
            </span>
            {/* <div className="flex-1 flex items-center gap-2 text-xs min-w-0">
              {activeNavLabel && (
                <>
                  <span className="text-muted-foreground shrink-0">/</span>
                  <span className="truncate font-medium text-foreground first-letter:uppercase">
                    {activeNavLabel}
                  </span>
                </>
              )}
            </div> */}
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
                        {getRoleLabel(authUser.customClaims?.role)}
                      </span>
                    </Badge>
                    {/* <Badge variant="outline" className="h-5 px-1.5 text-xs">
                      Activo
                    </Badge> */}
                  </div>
                </div>
              </div>
            }
          </div>
          <SidebarTrigger className="bg-white/30 flex items-center justify-center md:hidden" />
        </div>
        {children}
      </div>
    </>
  );

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {currentBusinessId ? (
        <BusinessProvider businessSlug={currentBusinessId}>{mainContent}</BusinessProvider>
      ) : (
        mainContent
      )}
    </SidebarProvider>
  );
}
