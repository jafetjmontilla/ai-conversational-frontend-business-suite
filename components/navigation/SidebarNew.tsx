"use client"

import { Sidebar, SidebarGroupContent, SidebarMenuButton, SidebarMenu, SidebarGroupLabel, SidebarGroup, SidebarContent, SidebarHeader, SidebarMenuItem, useSidebar, SidebarFooter, SidebarMenuBadge } from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import Image from 'next/image'
import previoLogo from '@/app/previoLogo3.png'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Box, Calendar, Users, Bell, MessageSquare, Settings, ChevronLeft, ChevronRight, Calendar1, Stars, ContactRound, SquareArrowOutUpRight, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next'
import LanguageDropdown from "./LanguageDropdown"

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

const buildPersonalItems = (t: (k: string) => string): NavItem[] => [
  { href: '/dashboard', label: t('navigation:dashboard'), icon: Home },
  { href: '/', label: t('navigation:professionals'), icon: Box },
  { href: '/theme-demo', label: t('navigation:services'), icon: Stars },
  { href: '/', label: t('navigation:timeSlots'), icon: Calendar1 },
  { href: '/theme-demo', label: t('navigation:clients'), icon: ContactRound },
  { href: '/', label: t('navigation:calendar'), icon: Calendar },
];

const buildAccountItems = (t: (k: string) => string): NavItem[] => [
  { href: '/notifications', label: t('navigation:notifications'), icon: Bell, badge: 24 },
  { href: '/chat', label: t('navigation:chat'), icon: MessageSquare, badge: 8 },
  { href: '/users', label: t('navigation:users'), icon: Users },
  { href: '/settings', label: t('navigation:settings'), icon: Settings },
  { href: '/theme-demo', label: t('navigation:demoComponents'), icon: FileSpreadsheet },
];

export interface AppSidebarProps {
  basePath: string
}

export function AppSidebar({ basePath }: AppSidebarProps) {
  const router = useRouter()
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar, } = useSidebar()
  const { t } = useTranslation(['navigation'])
  const personalItems = buildPersonalItems(t)
  const accountItems = buildAccountItems(t)

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
              <Image src={previoLogo} alt="Logo" width={30} height={30} className="rounded-md" />
              {state == "expanded" && <span className="font-bold text-sm">App Pulsar v1.0</span>}
              {state == "expanded" && <LanguageDropdown />}
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
          {accountItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton tooltip={item.label} asChild onClick={() => router.push(item.href)} className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""}`}>
                <div>
                  <item.icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                  <span>{item.label}</span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
          <Separator className="my-2" />
          <SidebarMenuItem >
            <SidebarMenuButton className="h-14">
              <Avatar className="scale-[80%] -translate-x-[12px]">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>NE</AvatarFallback>
              </Avatar>
              <div className="flex flex-col -translate-x-[13px]">
                <span className="text-sm font-medium">Nina Egrena</span>
                <span className="text-xs text-muted-foreground">nina.egrena@pestilo.com</span>
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