'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Home, Box, Mail, Flag, Calendar, Users, Bell, MessageSquare, Settings, Menu } from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

const personalItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Box },
  { href: '/mail', label: 'Mail', icon: Mail },
  { href: '/campaigns', label: 'Campaigns', icon: Flag },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contacts', label: 'Contacts', icon: Users },
];

const accountItems: NavItem[] = [
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: 24 },
  { href: '/chat', label: 'Chat', icon: MessageSquare, badge: 8 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ basePath = '' }: { basePath?: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(`${basePath}${href}`);

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    return (
      <Link href={`${basePath}${item.href}`} className={cn('group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors', isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}>
        <span className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', isActive(item.href) ? 'opacity-100' : 'opacity-70')} />
          <span>{item.label}</span>
        </span>
        {typeof item.badge === 'number' ? (
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <aside className="hidden absolute left-8 top-8 md:flex w-72 shrink-0 flex-col rounded-2xl border bg-card text-card-foreground">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="h-6 w-6 rounded-md bg-primary" />
          <span>Marketerz v1.0</span>
        </div>
        <Button variant="ghost" size="icon"><Menu className="h-4 w-4" /></Button>
      </div>
      <div className="px-4 pb-2">
        <div className="inline-flex rounded-full bg-accent p-1 text-xs">
          <button className="rounded-full px-3 py-1 bg-background">Personal</button>
          <button className="rounded-full px-3 py-1 text-muted-foreground">Business</button>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-2 py-2">
        <div className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground">OVERVIEW</div>
        {personalItems.map((item) => (<NavLink key={item.href} item={item} />))}
      </nav>
      <Separator className="my-2" />
      <nav className="flex flex-col gap-1 px-2 py-2">
        <div className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground">ACCOUNT</div>
        {accountItems.map((item) => (<NavLink key={item.href} item={item} />))}
      </nav>
      <div className="mt-auto px-4 py-4">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback>NE</AvatarFallback></Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Nina Egrena</span>
              <span className="text-xs text-muted-foreground">nina.egrena@pestilo.com</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">•••</Button>
        </div>
      </div>
    </aside>
  );
}


