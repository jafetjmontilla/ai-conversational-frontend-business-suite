const FALLBACK_TIMEZONES = [
  "Africa/Abidjan",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Caracas",
  "America/Chicago",
  "America/Denver",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Panama",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Atlantic/Canary",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Pacific/Auckland",
  "UTC",
];

function getSupportedTimezones(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  if (typeof intl.supportedValuesOf === "function") {
    return intl.supportedValuesOf("timeZone").sort((a: string, b: string) =>
      a.localeCompare(b)
    );
  }
  return FALLBACK_TIMEZONES;
}

/** IANA timezone identifiers, sorted alphabetically. */
export const TIMEZONE_OPTIONS: string[] = getSupportedTimezones();

/** Zona horaria del navegador/sistema (IANA). */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/** Usa la zona guardada o, si está vacía, la del navegador. */
export function resolveDefaultTimezone(timezone?: string | null): string {
  const trimmed = timezone?.trim();
  if (trimmed) return trimmed;
  return getBrowserTimezone();
}
