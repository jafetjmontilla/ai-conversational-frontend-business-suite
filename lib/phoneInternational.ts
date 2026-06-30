/** Código de país por defecto cuando el número no trae prefijo internacional (+ / 00). */
export const DEFAULT_PHONE_COUNTRY_CODE = '58';

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function isUsCaNationalElevenDigits(d: string): boolean {
  return d.length === 11 && d.startsWith('1');
}

/** Móvil venezolano típico: 10 dígitos que empiezan en 4 (412, 424, …). */
function isVeMobileTenDigits(d: string): boolean {
  return d.length === 10 && d.startsWith('4');
}

/**
 * Normaliza a formato internacional con prefijo `+` (ej. +584121067092).
 * - Si ya viene con `+` o `00`, solo se limpia a `+` y dígitos.
 * - Si no hay código internacional explícito, se antepone `+58` salvo heurística US/CA (11 dígitos empezando en 1).
 * - Números locales VE con 0 inicial: se quita el 0 y se antepone +58.
 */
export function normalizePhoneInternational(
  input: string,
  defaultCountryCode: string = DEFAULT_PHONE_COUNTRY_CODE
): string | undefined {
  const raw = input.trim();
  if (!raw) return undefined;

  let s = raw.replace(/[\s().-]/g, '');
  if (s.startsWith('00')) {
    s = `+${s.slice(2)}`;
  }

  if (s.startsWith('+')) {
    const rest = digitsOnly(s.slice(1));
    if (!rest) return undefined;
    return `+${rest}`;
  }

  const d = digitsOnly(s);
  if (!d) return undefined;

  if (d.startsWith(defaultCountryCode)) {
    return `+${d}`;
  }
  if (d.startsWith('0')) {
    return `+${defaultCountryCode}${d.slice(1)}`;
  }
  if (isUsCaNationalElevenDigits(d)) {
    return `+${d}`;
  }
  if (isVeMobileTenDigits(d)) {
    return `+${defaultCountryCode}${d}`;
  }
  return `+${defaultCountryCode}${d}`;
}
