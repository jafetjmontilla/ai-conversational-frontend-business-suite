"use client"

import { Sidebar, SidebarGroupContent, SidebarMenuButton, SidebarMenu, SidebarGroup, SidebarContent, SidebarHeader, SidebarMenuItem, useSidebar, SidebarFooter, SidebarMenuBadge } from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import Image from 'next/image'
import React, { FC } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Box, Calendar, Users, Bell, MessageSquare, Settings, ChevronLeft, ChevronRight, Calendar1, Stars, ContactRound, SquareArrowOutUpRight, FileSpreadsheet } from 'lucide-react';
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
  const { state, toggleSidebar, } = useSidebar()
  const { theme } = useThemeContext();
  const { hasRole } = useAllowed();
  const { user } = useAuth();

  const buildPersonalItems = (): NavItem[] => [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/', label: 'Profesionales', icon: Box },
    { href: '/theme-demo', label: 'Servicios', icon: Stars },
    { href: '/', label: 'Horarios', icon: Calendar1 },
    { href: '/theme-demo', label: 'Clientes', icon: ContactRound },
    { href: '/', label: 'Calendario', icon: Calendar },
  ];

  const buildAccountItems = (): NavItem[] => [
    { href: '/notifications', label: 'Notificaciones', icon: Bell, badge: 24 },
    { href: '/chat', label: 'Chat', icon: MessageSquare, badge: 8 },
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
              <Image src={theme === "dark" ? `/images/4netWhite.png` : `/images/4netBlack.png`} alt="Logo" width={50} height={30} className="rounded-md" />
              {state == "expanded" && <span className="font-bold text-sm">Erp v1.0</span>}

            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton tooltip={item.label} asChild onClick={() => router.push(item.href)} className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""}`}>
                    <div>
                      <item.icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                      <span>{item.label}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {accountItems.map((item) =>
            (item?.condition === undefined || item?.condition === true) &&
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton tooltip={item.label} asChild onClick={() => router.push(item.href)} className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""}`}>
                <div>
                  <item.icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                  <span>{item.label}</span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            </SidebarMenuItem>
          )}
          <Separator className="my-2" />
          <SidebarMenuItem onClick={() => router.push("/profile")} >
            <SidebarMenuButton className="h-14">
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