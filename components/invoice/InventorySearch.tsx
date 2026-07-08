"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { fetchApiV1, queries } from '@/lib/Fetching';

/** Item seleccionable para una línea de factura (variante de producto vendible). */
export interface InvoiceVariantSelection {
  productVariantId: string;
  productId?: string;
  description: string;
  unitPrice: number;
  sku?: string;
}

interface InventorySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelectItem: (item: InvoiceVariantSelection) => void;
  className?: string;
  /** _id del negocio (Business document). */
  businessId: string;
  exchangeRate: number;
}

type SellableVariantRow = {
  _id: string;
  product_id: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
  product?: { _id: string; name: string; base_price?: number } | null;
};

export function InventorySearch({ value, onChange, onSelectItem, className = "", businessId }: InventorySearchProps) {
  const [searchResults, setSearchResults] = useState<SellableVariantRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (businessId) {
        setIsLoading(true);
        try {
          const results = await fetchApiV1({
            query: queries.getSellableVariants,
            type: "json",
            variables: {
              id: businessId,
              search: value.trim() || undefined,
              limit: 15,
            },
          }) as SellableVariantRow[] | null;
          setSearchResults(results || []);
          setSelectedIndex(-1);
        } catch {
          setSearchResults([]);
          setSelectedIndex(-1);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setSelectedIndex(-1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, businessId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  }, [onChange]);

  const toSelection = useCallback((row: SellableVariantRow): InvoiceVariantSelection => {
    const productName = row.product?.name ?? '';
    const desc = row.sku ? `${productName} - ${row.sku}`.trim() : productName || row.sku || 'Sin nombre';
    const unitPrice = row.price_override ?? row.product?.base_price ?? 0;
    return {
      productVariantId: row._id,
      productId: row.product_id,
      description: desc,
      unitPrice: Number(unitPrice),
      sku: row.sku,
    };
  }, []);

  const handleItemSelect = useCallback((row: SellableVariantRow) => {
    onSelectItem(toSelection(row));
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onSelectItem, toSelection, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleItemSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, searchResults, selectedIndex, handleItemSelect]);

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

  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            setIsFocus(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocus(false);
            }, 200);
          }}
          autoComplete="off"
          placeholder="Buscar producto o SKU..."
          className={`w-full bg-white dark:bg-gray-100 text-left border-0 px-1 ${className}`}
        />
        <div
          onClickCapture={() => {
            onChange('');
            setIsOpen(false);
          }}
          className="absolute -top-6 -right-2 flex md:hidden items-center space-x-1 z-10"
        >
          {value && isFocus && (
            <div className="bg-white rounded-full border-[1px] border-ring text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center">
              <X className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {isOpen && (searchResults.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 -left-10 rounded-[3px] w-[calc(100vw-70px)] md:w-[306px] mt-1 bg-white border border-ring shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="text-sm text-gray-500 px-2 py-1">
              Buscando...
            </div>
          ) : (
            searchResults.map((row, index) => {
              const price = row.price_override ?? row.product?.base_price ?? 0;
              const label = row.product?.name ? `${row.product.name} - ${row.sku}` : row.sku;
              return (
                <div
                  key={row._id}
                  onClick={() => handleItemSelect(row)}
                  className={`px-2.5 py-2.5 md:py-0.5 hover:bg-gray-300 cursor-pointer border-b border-gray-100 last:border-b-0 ${selectedIndex === index ? 'bg-blue-100 hover:bg-blue-200' : ''}`}
                >
                  <div className="flex justify-between items-start text-xs gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{label}</div>
                    </div>
                    <div className="font-semibold w-[55px] text-right">
                      {Number(price).toFixed(2)}
                    </div>
                    <div className="w-5 flex justify-center text-green-600">
                      ({(row.stock_quantity ?? 0).toFixed(0)})
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
