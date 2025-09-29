"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { fetchApiV1, queries } from '@/lib/Fetching';

export interface InventoryItem {
  _id: string;
  code: string;
  description: string;
  salesPrice: number;
  quantity: number;
  type: 'mercancia' | 'servicio';
  store: 'guardians' | 'jaihom';
}

interface InventorySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelectItem: (item: InventoryItem) => void;
  placeholder?: string;
  className?: string;
  store?: 'guardians' | 'jaihom';
  tasaBCV: number;
}

export function InventorySearch({ value, onChange, onSelectItem, placeholder = "Buscar artículo...", className = "", store = "guardians", tasaBCV }: InventorySearchProps) {
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.length > 0) {
        setIsLoading(true);
        setError(null);

        try {
          const results = await fetchApiV1({
            query: queries.getInventoryItemsByStore,
            type: "json",
            variables: {
              description: value,
              store: store
            }
          });
          setSearchResults(results || []);
        } catch (err) {
          console.error('Error al buscar en inventario:', err);
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, store]);

  // Memoizar la función de búsqueda para evitar re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  }, [onChange]);

  const handleItemSelect = useCallback((item: InventoryItem) => {
    onSelectItem(item);
    setIsOpen(false);
  }, [onSelectItem]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true)
            setIsFocus(true)
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocus(false)
            }, 200)
          }}
          className={`w-full bg-white dark:bg-gray-100 text-left border-0 outline-none px-1 ${className}`}
        />
        <div
          onClickCapture={() => {
            console.log('clearInput');
            onChange('');
            setIsOpen(false);
          }}
          className="absolute -top-6 -right-2 flex md:hidden items-center space-x-1 z-10">
          {value && isFocus && (
            <div
              className="bg-white rounded-full border-[1px] border-ring text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {isOpen && (searchResults.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 -left-10 rounded-[3px] w-[320px] *h-[140px] mt-1 bg-white border border-ring shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="text-sm text-gray-500">
              Buscando...
            </div>
          ) : (
            searchResults.map((item) => (
              <div
                key={item._id}
                onClick={() => handleItemSelect(item)}
                className="px-2.5 py-2.5 md:py-0.5 hover:bg-gray-300 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start text-xs gap-2">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.description}
                    </div>
                  </div>
                  <div className="font-semibold w-[35px] text-right">
                    {(item.salesPrice / tasaBCV).toFixed(2)}
                  </div>
                  <div className="font-semibold w-[55px] text-right">
                    {item.salesPrice.toFixed(2)}
                  </div>
                  <div className="w-5 flex justify-center text-green-600">
                    {"(" + item.quantity + ")"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
