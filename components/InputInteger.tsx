import * as React from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface InputIntegerProps extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type' | 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export const InputInteger = React.forwardRef<HTMLInputElement, InputIntegerProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const min = props?.min as number || undefined;
    const max = props?.max as number || undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Solo permitir números enteros positivos (sin "e", sin decimales, sin negativos)
      const filteredValue = inputValue.replace(/[^0-9]/g, '');

      // Limitar el rango entre min y max
      if (min && max) {
        if (filteredValue === '') {
          onChange('');
        } else {
          const numValue = parseInt(filteredValue, 10);
          if (numValue >= min && numValue <= max) {
            onChange(filteredValue);
          } else if (numValue > max) {
            onChange(value);
          }
        }
      } else {
        onChange(filteredValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevenir la tecla "e", "E", "+", "-", "."
      if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
        e.preventDefault();
      }
    };

    return (
      <Input
        type="number"
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        step={1}
        className={cn(
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
          className
        )}
        {...props}
      />
    );
  }
);

InputInteger.displayName = "InputInteger";

