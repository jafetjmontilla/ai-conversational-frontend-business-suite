"use client"

import {
  Sidebar,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarContent,
  SidebarHeader,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, SquareArrowOutUpRight } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAllowed, useBusinessRole, getBusinessIdFromPathname } from "@/lib/hooks/useAllowed"
import { getProfileHref, isProfilePath } from "@/lib/profileRoutes"
import { useAuth } from "@/contexts/AuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  buildAccountNavItems,
  buildBusinessNavGroups,
  buildBusinessTopItems,
  buildSystemNavItems,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation/businessNav"
import packageJson from '../../package.json' assert { type: 'json' };

function NavMenuItems({
  items,
  loading,
  pathname,
  state,
  onNavigate,
}: {
  items: NavItem[];
  loading: boolean;
  pathname: string;
  state: "expanded" | "collapsed";
  onNavigate: (item: NavItem) => void;
}) {
  return (
    <>
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item);
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              tooltip={item.label}
              asChild
              onClick={() => !loading && onNavigate(item)}
              className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""} ${isActive ? "bg-accent text-accent-foreground" : ""}`}
            >
              <div>
                <Icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { state, toggleSidebar } = useSidebar();
  const { theme } = useThemeContext();
  const businessId = getBusinessIdFromPathname(pathname);
  const { businessRole } = useBusinessRole(businessId);
  const { can } = useAllowed({ businessRole: businessRole ?? undefined });
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const versionLabel = packageJson.version ? `Business Suite v${packageJson.version}` : "Business Suite";

  const businessPerms = useMemo(
    () => ({
      canViewCurrentBusiness: can('negocio:ver'),
      canEditCurrentBusiness: can('negocio:editar'),
      canManageBusinessUsers: can('negocio:usuarios'),
    }),
    [can]
  );

  const systemPerms = useMemo(
    () => ({
      canViewBusinesses: can('negocios:ver'),
      canViewUsers: can('usuarios:ver'),
    }),
    [can]
  );

  const isSystemScope = !businessId;

  const topItems = useMemo(
    () => (businessId ? buildBusinessTopItems(businessId, businessPerms) : []),
    [businessId, businessPerms]
  );

  const navGroups = useMemo(
    () => (businessId ? buildBusinessNavGroups(businessId, businessPerms) : []),
    [businessId, businessPerms]
  );

  const systemItems = useMemo(
    () => (isSystemScope ? buildSystemNavItems() : []),
    [isSystemScope]
  );

  const accountItems = useMemo(
    () => (isSystemScope ? buildAccountNavItems(systemPerms) : []),
    [isSystemScope, systemPerms]
  );

  const handleNavigation = async (item: NavItem) => {
    if (isNavItemActive(pathname, item)) return;
    setLoading(true);
    setCurrentPath(item.href);
    router.push(item.href);
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (isMobile) toggleSidebar();
  };

  useEffect(() => {
    if (pathname === currentPath) setLoading(false);
  }, [pathname, currentPath]);

  return (
    <>
      {loading && typeof window !== 'undefined' && createPortal(
        <div className="min-h-screen flex items-center justify-center bg-white/30 dark:bg-black/20 fixed top-0 left-0 w-full h-full z-[1000]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>,
        document.body
      )}
      <Sidebar side="left" variant="floating" collapsible="icon">
        <Button variant="secondary" size="icon" className="absolute top-1/2 -right-2 -translate-y-1/2 w-8 h-8 rounded-full" onClick={toggleSidebar}>
          {state === "collapsed"
            ? <div className="flex"><ChevronRight className="w-4 h-4 translate-x-1" /><ChevronRight className="w-4 h-4 -translate-x-1" /></div>
            : <div className="flex"><ChevronLeft className="w-4 h-4 translate-x-1" /><ChevronLeft className="w-4 h-4 -translate-x-1" /></div>}
        </Button>
        <SidebarHeader>
          <SidebarMenu>
            <div className="pl-1 flex w-full h-14 items-center overflow-hidden -translate-x-1">
              <div className="flex text-nowrap gap-2 items-center hover:scale-105 transition-all duration-200 ease-linear cursor-pointer">
                <Image src={theme === "dark" ? `/images/4net-logo-white.png` : `/images/4net-logo-black.png`} alt="Business Suite" width={50} height={30} className="rounded-md" />
                {state === "expanded" && <span className="font-bold text-sm">{versionLabel}</span>}
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          {isSystemScope ? (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <NavMenuItems
                    items={systemItems}
                    loading={loading}
                    pathname={pathname}
                    state={state}
                    onNavigate={handleNavigation}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <>
              {topItems.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <NavMenuItems
                        items={topItems}
                        loading={loading}
                        pathname={pathname}
                        state={state}
                        onNavigate={handleNavigation}
                      />
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
              {navGroups.map((group) => (
                <SidebarGroup key={group.id}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <NavMenuItems
                        items={group.items}
                        loading={loading}
                        pathname={pathname}
                        state={state}
                        onNavigate={handleNavigation}
                      />
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </>
          )}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {accountItems.map((item) => {
              const isActive = isNavItemActive(pathname, item);
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    asChild
                    onClick={() => !loading && handleNavigation(item)}
                    className={`cursor-pointer ${state === "collapsed" ? "rounded-sm" : ""} ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    <div>
                      <Icon style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
                      <span>{item.label}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            <Separator className="my-2" />
            <SidebarMenuItem onClick={() => !loading && handleNavigation({
              id: "profile",
              href: getProfileHref(businessId),
              label: "Perfil",
              icon: SquareArrowOutUpRight,
            })}>
              <SidebarMenuButton className={`h-14 ${isProfilePath(pathname) ? "bg-accent text-accent-foreground" : ""}`}>
                <Avatar className="scale-[80%] -translate-x-[12px]">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>NE</AvatarFallback>
                </Avatar>
                <div className="flex flex-col -translate-x-[13px]">
                  <span className="text-sm font-medium">{user?.displayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuBadge className="translate-y-3">
                <SquareArrowOutUpRight className="w-4 h-4" />
              </SidebarMenuBadge>
            </SidebarMenuItem>
            <div className={`${state === "collapsed" ? "h-6" : "h-0"} transition-all`} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
