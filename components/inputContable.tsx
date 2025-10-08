import React, { useState, useEffect } from 'react';

interface InputContableProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  autoComplete?: string;
  // ...puedes añadir otras props de input si las necesitas
}

export const InputContable = ({ value, onChange, min = 0, max, ...props }: InputContableProps) => {
  // Mantener el valor como string para permitir estados intermedios como "5."
  const [displayValue, setDisplayValue] = useState<string>('');

  // Sincronizar displayValue cuando value cambia desde el exterior
  useEffect(() => {
    if (value === null) {
      setDisplayValue('');
    } else {
      const currentNumericValue = displayValue === '' ? null : parseFloat(displayValue);
      if (value !== currentNumericValue) {
        setDisplayValue(String(value));
      }
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Solo permitir dígitos, punto decimal y hasta dos decimales
    // Permitir: "", "5", "5.", "5.1", "5.12"
    if (/^\d*\.?\d{0,2}$/.test(inputValue)) {
      setDisplayValue(inputValue);

      const numericValue = inputValue === '' || inputValue === '.' ? null : parseFloat(inputValue);

      // Validar rango si se proporciona
      const isValid =
        numericValue === null ||
        (numericValue >= min && (max === undefined || numericValue <= max));

      if (isValid) {
        onChange(numericValue);
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*\.?[0-9]{0,2}"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
};

