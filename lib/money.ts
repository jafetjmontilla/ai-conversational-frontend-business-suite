export const CURRENCY_CODES = ["USD", "EUR", "VES", "COP"] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

const CURRENCY_SET = new Set<string>(CURRENCY_CODES);
const MINOR_FACTOR = 100;

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCY_SET.has(value.toUpperCase());
}

export function toCurrencyCode(
  value: unknown,
  fallback: CurrencyCode = "USD"
): CurrencyCode {
  return isCurrencyCode(value) ? (value.toUpperCase() as CurrencyCode) : fallback;
}

export function assertMinorUnits(value: unknown, field = "amountMinor"): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} debe ser un entero seguro no negativo en minor units`);
  }
  return value;
}

/**
 * Convierte major units a minor units sin redondeos implícitos.
 * Rechaza importes con más de dos decimales significativos.
 */
export function majorToMinor(value: string | number): number {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("La cantidad debe ser finita");
  }

  const match = String(value)
    .trim()
    .match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match) throw new TypeError("Cantidad monetaria inválida");

  const [, sign, integer, fraction = "", exponentText = "0"] = match;
  const exponent = Number(exponentText);
  if (!Number.isSafeInteger(exponent)) {
    throw new RangeError("Exponente monetario inválido");
  }

  const digits = `${integer}${fraction}`.replace(/^0+(?=\d)/, "");
  const minorScale = exponent - fraction.length + 2;
  let minor: bigint;

  if (minorScale >= 0) {
    minor = BigInt(digits) * BigInt(10) ** BigInt(minorScale);
  } else {
    const divisor = BigInt(10) ** BigInt(-minorScale);
    const raw = BigInt(digits);
    if (raw % divisor !== BigInt(0)) {
      throw new RangeError("La cantidad admite como máximo dos decimales");
    }
    minor = raw / divisor;
  }

  if (sign === "-") minor = -minor;
  return assertMinorUnits(Number(minor));
}

export function minorToMajor(value: number): number {
  return assertMinorUnits(value) / MINOR_FACTOR;
}

export function multiplyMinor(value: number, quantity: number): number {
  assertMinorUnits(value);
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new TypeError("La cantidad debe ser un entero seguro no negativo");
  }
  return assertMinorUnits(value * quantity, "lineTotalMinor");
}

export function addMinor(...values: number[]): number {
  return values.reduce(
    (total, value) =>
      assertMinorUnits(total + assertMinorUnits(value), "totalMinor"),
    0
  );
}

export function formatMinor(
  value: number,
  currency: CurrencyCode,
  locale = "es"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorToMajor(value));
}
