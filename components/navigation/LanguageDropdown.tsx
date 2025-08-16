'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import Dropdown, { StructuredDropdownItem } from '@/components/Dropdown';

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const current = (i18n.language || 'es').startsWith('en') ? 'en' : 'es';

  const change = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng); try { localStorage.setItem('preferred-language', lng); } catch { } if (typeof document !== 'undefined') { document.documentElement.lang = lng; }
  };

  const items: StructuredDropdownItem[] = [
    {
      value: 'es',
      label: (<span className="flex items-center"><span className="mr-2">🇪🇸</span><span>Español</span></span>),
      onSelect: () => change('es')
    },
    {
      value: 'en',
      label: (<span className="flex items-center"><span className="mr-2">🇺🇸</span><span>English</span></span>),
      onSelect: () => change('en')
    },
  ];

  return (
    <Dropdown icon={Languages} text={<span className="uppercase">{current}</span>} items={items} selected={current} />

  );
}


