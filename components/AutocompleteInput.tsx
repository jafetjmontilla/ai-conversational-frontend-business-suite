'use client';

import React, { useState, useEffect } from 'react';
import { InputSearch } from '@/components/InputSearch';
import { Label } from '@/components/ui/label';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  options,
  label,
  placeholder = 'Buscar o escribir...',
  required = false,
  className = '',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setSearchValue(newValue);
    onChange(newValue);
  };

  const handleFocus = () => {
    setSearchValue(value);
    if (options.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClick = () => {
    if (options.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.autocomplete-dropdown')) {
      setTimeout(() => setIsOpen(false), 200);
    }
  };

  const handleSelectOption = (option: string) => {
    handleChange(option);
    setIsOpen(false);
  };

  const filteredOptions = searchValue.length > 0
    ? options.filter((option) =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    )
    : options;

  return (
    <div className={`relative ${className}`}>
      {label && <Label>{label}{required && ' *'}</Label>}
      <div className="relative w-full">
        <InputSearch
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onClick={handleClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className="w-full"
        />
        {isOpen && options.length > 0 && (
          <div className="autocomplete-dropdown absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md text-sm">
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(option);
                    }}
                  >
                    {option}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
