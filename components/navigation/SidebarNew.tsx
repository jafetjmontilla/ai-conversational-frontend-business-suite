"use client"

import { Sidebar, SidebarGroupContent, SidebarMenuButton, SidebarMenu, SidebarGroup, SidebarContent, SidebarHeader, SidebarMenuItem, useSidebar, SidebarFooter, SidebarMenuBadge } from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import Image from 'next/image'
import React, { FC } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, FileText, Receipt, BarChart3, Users, Bell, Settings, ChevronLeft, ChevronRight, SquareArrowOutUpRight, FileSpreadsheet } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAllowed } from "@/lib/hooks/useAllowed"
import { useAuth } from "@/contexts/AuthContext"
type NavItem = {
  href: string;
  label: string; icon: React.ElementType;
  badge?: number; condition?: boolean
};

export interface AppSidebarProps {
}

export const AppSidebar: FC<AppSidebarProps> = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { state, toggleSidebar, } = useSidebar()
  const { theme } = useThemeContext();
  const { hasRole, hasAnyRole } = useAllowed();
  const { user } = useAuth();

  const buildPersonalItems = (): NavItem[] => [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/thefactory', label: 'Facturas HKA', icon: FileText, condition: hasAnyRole(["admin", "customerService"]) },
    { href: '/retention-iva', label: 'Retención IVA', icon: Receipt, condition: hasAnyRole(["admin", "customerService"]) },
    { href: '/payments-reports', label: 'Pagos Reportes', icon: BarChart3, condition: hasAnyRole(["admin", "customerService"]) },
  ];

  const buildAccountItems = (): NavItem[] => [
    { href: '/notifications', label: 'Notificaciones', icon: Bell, badge: 0 },
    { href: '/users', label: 'Usuarios', icon: Users, condition: hasRole("admin") },
    { href: '/settings', label: 'Configuración', icon: Settings, condition: hasRole("admin") },
    { href: '/theme-demo', label: 'Demo Componentes', icon: FileSpreadsheet, condition: hasRole("admin") },
  ];

  const personalItems = buildPersonalItems()
  const accountItems = buildAccountItems()

  return (
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
              <Image src={theme === "dark" ? `/images/sistemasJaihomLogo.png` : `/images/sistemasJaihomLogo.png`} alt="Logo" width={50} height={30} className="rounded-md" />
              {state == "expanded" && <span className="font-bold text-sm">Erp v1.0</span>}

            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => {
                const isActive = pathname === item.href;
                return (item?.condition === undefined || item?.condition === true) &&
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      asChild
                      onClick={() => router.push(item.href)}
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
            const isActive = pathname === item.href;
            return (item?.condition === undefined || item?.condition === true) &&
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  tooltip={item.label}
                  asChild
                  onClick={() => router.push(item.href)}
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
          <SidebarMenuItem onClick={() => router.push("/profile")} >
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
  )
}