"use client"

import { Sidebar, SidebarGroupContent, SidebarMenuButton, SidebarMenu, SidebarGroup, SidebarContent, SidebarHeader, SidebarMenuItem, useSidebar, SidebarFooter, SidebarMenuBadge } from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import Image from 'next/image'
import React, { Dispatch, FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Receipt, Users, Bell, Settings, ChevronLeft, ChevronRight, SquareArrowOutUpRight, FileSpreadsheet, Package, Banknote, FileText } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAllowed } from "@/lib/hooks/useAllowed"
import { useAuth } from "@/contexts/AuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import packageJson from '../../package.json' assert { type: 'json' };

type NavItem = {
  href: string;
  label: string; icon: React.ElementType;
  badge?: number; condition?: boolean
};

export interface AppSidebarProps {
  setSlugs: Dispatch<React.SetStateAction<{ name: string, href: string }[]>>
}

export function AppSidebar({ setSlugs }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const { theme } = useThemeContext();
  const { hasRole, hasAnyRole } = useAllowed();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const versionLabel = packageJson.version ? `Erp v${packageJson.version}` : "Erp";

  const handleNavigation = async (href: string, label: string) => {
    if (pathname === href) {
      return;
    }
    setLoading(true);
    setCurrentPath(href);
    router.push(href);
    // Cerrar sidebar en móvil
    await new Promise(resolve => setTimeout(resolve, 800));
    if (isMobile) {
      toggleSidebar();
    }
  };

  useEffect(() => {
    if (pathname === currentPath) {
      setLoading(false);
    }
  }, [pathname])


  const buildPersonalItems = (): NavItem[] => [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/invoice', label: 'Facturación', icon: Receipt, condition: hasAnyRole(["admin", "customerServiceG", "customerServiceJ"]) },
    { href: '/inventory', label: 'Inventario', icon: Package, condition: hasAnyRole(["admin", "customerServiceG", "customerServiceJ"]) },
    { href: '/reportPayments', label: 'Reporte de Pagos', icon: Banknote, condition: hasAnyRole(["admin", "customerServiceG", "customerServiceJ"]) },
    { href: '/reportInvoices', label: 'Reporte de Facturas', icon: FileText, condition: hasAnyRole(["admin", "customerServiceG", "customerServiceJ"]) },

  ];

  const buildAccountItems = (): NavItem[] => [
    { href: '/notifications', label: 'Notificaciones', icon: Bell, badge: 0 },
    { href: '/users', label: 'Usuarios', icon: Users, condition: hasRole("admin") },
    { href: '/settings', label: 'Configuración', icon: Settings, condition: hasRole("admin") },
    { href: '/theme-demo', label: 'Demo Componentes', icon: FileSpreadsheet, condition: hasRole("admin") },
  ];

  useEffect(() => {
    setSlugs([
      ...buildPersonalItems().map((item) => ({ name: item.label, href: item.href })),
      ...buildAccountItems().map((item) => ({ name: item.label, href: item.href })
      )]
    )
  }, [])

  const personalItems = buildPersonalItems()
  const accountItems = buildAccountItems()

  return (
    <>
      {loading && typeof window !== 'undefined' && createPortal(
        <div className="min-h-screen flex items-center justify-center bg-white/30 dark:bg-black/20 fixed top-0 left-0 w-full h-full z-[1000]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>,
        document.body
      )}
      <Sidebar side="left" variant="floating" collapsible="icon" >
        <Button variant="secondary" size="icon" className='absolute top-1/2 -right-2 -translate-y-1/2 w-8 h-8 rounded-full' onClick={toggleSidebar} >
          {state == "collapsed"
            ? <div className="flex">
              <ChevronRight className="w-4 h-4 translate-x-1" />
              <ChevronRight className="w-4 h-4 -translate-x-1" />
            </div>
            : <div className="flex">
              <ChevronLeft className="w-4 h-4 translate-x-1" />
              <ChevronLeft className="w-4 h-4 -translate-x-1" />
            </div>}
        </Button>
        <SidebarHeader>
          <SidebarMenu>
            <div className="pl-1 flex w-full h-14 items-center overflow-hidden -translate-x-1">
              <div className="flex text-nowrap gap-2 items-center hover:scale-105 transition-all duration-200 ease-linear cursor-pointer">
                <Image src={theme === "dark" ? `/images/sistemasJaihomLogoBorderNone.png` : `/images/sistemasJaihomLogoBorderNone.png`} alt="Logo" width={50} height={30} className="rounded-md" />
                {state == "expanded" && <span className="font-bold text-sm">{versionLabel}</span>}

              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {personalItems.map((item) => {
                  const isActive = currentPath === item.href;
                  return (item?.condition === undefined || item?.condition === true) &&
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        asChild
                        onClick={() => !loading && handleNavigation(item.href, item.label)}
                        className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""} ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                      >
                        <div>
                          <item.icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                          <span>{item.label}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {accountItems.map((item) => {
              const isActive = currentPath === item.href;
              return (item?.condition === undefined || item?.condition === true) &&
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    asChild
                    onClick={() => !loading && handleNavigation(item.href, item.label)}
                    className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""} ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    <div>
                      <item.icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                      <span>{item.label}</span>
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                </SidebarMenuItem>
            })}
            <Separator className="my-2" />
            <SidebarMenuItem onClick={() => !loading && handleNavigation("/profile", "Perfil")} >
              <SidebarMenuButton className={`h-14 ${pathname === "/profile" ? "bg-accent text-accent-foreground" : ""}`}>
                <Avatar className="scale-[80%] -translate-x-[12px]">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>NE</AvatarFallback>
                </Avatar>
                <div className="flex flex-col -translate-x-[13px]">
                  <span className="text-sm font-medium">{user?.displayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </SidebarMenuButton>
              {/* <SidebarMenuAction className="translate-y-3">
              <Plus />  
            </SidebarMenuAction> */}
              <SidebarMenuBadge className="translate-y-3">
                <SquareArrowOutUpRight className="w-4 h-4" />
              </SidebarMenuBadge>
            </SidebarMenuItem>
            <div className={`${state === "collapsed" ? "h-6" : "h-0"} transition-all`} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}