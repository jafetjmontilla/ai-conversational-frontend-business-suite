"use client"

import { Sidebar, SidebarGroupContent, SidebarMenuButton, SidebarMenu, SidebarGroupLabel, SidebarGroup, SidebarContent, SidebarHeader, SidebarMenuItem, useSidebar, SidebarFooter, SidebarMenuBadge } from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import Image from 'next/image'
import previoLogo from '@/app/previoLogo3.png'
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Box, Mail, Flag, Calendar, Users, Bell, MessageSquare, Settings, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

const personalItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/', label: 'Professionals', icon: Box },
  { href: '/theme-demo', label: 'Services', icon: Mail },
  { href: '/', label: 'Time slots', icon: Users },
  { href: '/theme-demo', label: 'Clients', icon: Flag },
  { href: '/', label: 'Calendar', icon: Calendar },
];

const accountItems: NavItem[] = [
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: 24 },
  { href: '/chat', label: 'Chat', icon: MessageSquare, badge: 8 },
  { href: '/users', label: 'Users', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];


export interface AppSidebarProps {
  basePath: string
}

export function AppSidebar({ basePath }: AppSidebarProps) {
  const router = useRouter()
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar, } = useSidebar()
  console.log({ state, open, openMobile, isMobile })

  return (
    <Sidebar side="left" variant="floating" collapsible="icon" >
      <Button variant="outline" size="icon" className='absolute top-1/2 -right-2 -translate-y-1/2 w-8 h-8 rounded-full' onClick={toggleSidebar} >
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={() => router.push('/')} className="hover:bg-transparent cursor-pointer">
              <div >
                <Image src={previoLogo} alt="Logo" width={28} height={28} className="rounded-md" />
                <span className="font-bold text-lg">App Pulsar v1.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild onClick={() => router.push(item.href)} className="cursor-pointer">
                    <div >
                      <item.icon />
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
              <SidebarMenuButton asChild onClick={() => router.push(item.href)} className="cursor-pointer">
                <div >
                  <item.icon />
                  <span>{item.label}</span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
          <Separator className="my-2" />
          <SidebarMenuItem >
            <SidebarMenuButton >
              <Avatar className="scale-75 -translate-x-[13px]">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>NE</AvatarFallback>
              </Avatar>
              <div className="flex flex-col -translate-x-[13px]">
                <span className="text-sm font-medium">Nina Egrena</span>
                <span className="text-xs text-muted-foreground">nina.egrena@pestilo.com</span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuBadge className="cursor-default">•••</SidebarMenuBadge>
          </SidebarMenuItem>
          <div className="h-6" />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}