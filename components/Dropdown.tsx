'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';

export interface StructuredDropdownItem {
  value: string;
  label: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

export interface DropdownProps {
  icon?: LucideIcon;
  text?: React.ReactNode;
  items: StructuredDropdownItem[];
  selected?: string;
  align?: 'start' | 'end' | 'center';
  buttonClassName?: string;
}

export default function Dropdown({ icon: Icon, text, items, selected, align = 'end', buttonClassName }: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={['flex items-center gap-2 px-2', buttonClassName].filter(Boolean).join(' ')}>
          {Icon ? <Icon size={16} /> : null}
          {text ? <span className="text-sm">{text}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[10rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-md p-1">
        {items.map((item) => {
          const isSelected = selected !== undefined && item.value === selected;
          return (
            <DropdownMenuItem key={item.value} onClick={item.onSelect} disabled={item.disabled} className="rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer">
              {item.label}
              {isSelected ? (
                <DropdownMenuShortcut>
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                </DropdownMenuShortcut>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

