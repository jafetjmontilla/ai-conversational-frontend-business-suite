'use client';

import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Dropdown, { StructuredDropdownItem } from '@/components/Dropdown';

export interface UserMenuProps { userLabel: string; userInitial: string; onLogout: () => void; }

export default function UserMenu({ userLabel, userInitial, onLogout }: UserMenuProps) {
  const text = (
    <>
      <Avatar className="h-6 w-6"><AvatarFallback>{userInitial}</AvatarFallback></Avatar>
      <span className="hidden sm:block text-sm font-medium">{userLabel}</span>
    </>
  );
  const items: StructuredDropdownItem[] = [
    {
      value: 'profile',
      label: (<span className="flex items-center"><User className="mr-2" size={16} /><span>Perfil</span></span>), onSelect: () => { }
    },
    {
      value: 'settings',
      label: (<span className="flex items-center"><Settings className="mr-2" size={16} /><span>Configuración</span></span>), onSelect: () => { }
    },
    {
      value: 'sep',
      label: (<hr className="-mx-1 my-1 h-px bg-muted w-full" />),
      onSelect: () => { }, disabled: true
    },
    {
      value: 'logout',
      label: (<span className="flex items-center text-red-600 dark:text-red-400"><LogOut className="mr-2" size={16} /><span>Cerrar sesión</span></span>),
      onSelect: onLogout
    },
  ];

  return (
    <Dropdown text={text} items={items} />
  );
}


