"use client";

import { Button } from '@/components/ui/button';

export type Store = 'guardians' | 'jaihom';

interface StoreToggleProps {
  selectedStore: Store;
  onStoreChange: (store: Store) => void;
}

export function StoreToggle({ selectedStore, onStoreChange }: StoreToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedStore === 'guardians' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStoreChange('guardians')}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedStore === 'guardians'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
      >
        Guardians
      </Button>
      <Button
        variant={selectedStore === 'jaihom' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStoreChange('jaihom')}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedStore === 'jaihom'
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
      >
        Jaihom
      </Button>
    </div>
  );
}
