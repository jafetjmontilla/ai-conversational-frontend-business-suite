"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  normalizePhoneInternational,
} from "@/lib/phoneInternational";
import { cn } from "@/lib/utils";

function toInternationalValue(
  raw: string,
  defaultCountryCode: string = DEFAULT_PHONE_COUNTRY_CODE
): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return normalizePhoneInternational(trimmed, defaultCountryCode) ?? trimmed;
}

export type InputPhoneProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value?: string;
  onChange?: (value: string) => void;
  /** Código ISO numérico por defecto si el número no trae prefijo (ej. `58` para VE). */
  defaultCountryCode?: string;
};

export const InputPhone = React.forwardRef<HTMLInputElement, InputPhoneProps>(
  (
    {
      value = "",
      onChange,
      onBlur,
      onFocus,
      defaultCountryCode = DEFAULT_PHONE_COUNTRY_CODE,
      className,
      ...props
    },
    ref
  ) => {
    const [display, setDisplay] = React.useState(() =>
      toInternationalValue(value, defaultCountryCode)
    );
    const focusedRef = React.useRef(false);

    React.useEffect(() => {
      if (!focusedRef.current) {
        setDisplay(toInternationalValue(value, defaultCountryCode));
      }
    }, [value, defaultCountryCode]);

    const emit = React.useCallback(
      (raw: string) => {
        const international = toInternationalValue(raw, defaultCountryCode);
        onChange?.(international);
        return international;
      },
      [onChange, defaultCountryCode]
    );

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="584241234567"
        className={cn(className)}
        value={display}
        onFocus={(e) => {
          focusedRef.current = true;
          onFocus?.(e);
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDisplay(raw);
          emit(raw);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          const international = emit(display);
          setDisplay(international);
          onBlur?.(e);
        }}
        {...props}
      />
    );
  }
);

InputPhone.displayName = "InputPhone";
