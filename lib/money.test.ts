import { describe, expect, it } from "vitest";
import {
  addMinor,
  assertMinorUnits,
  formatMinor,
  isCurrencyCode,
  majorToMinor,
  minorToMajor,
  multiplyMinor,
  toCurrencyCode,
} from "@/lib/money";

describe("money", () => {
  it("reconoce las cuatro monedas soportadas", () => {
    expect(["USD", "EUR", "VES", "COP"].every(isCurrencyCode)).toBe(true);
    expect(isCurrencyCode("cop")).toBe(true);
    expect(isCurrencyCode("GBP")).toBe(false);
    expect(toCurrencyCode("cop")).toBe("COP");
    expect(toCurrencyCode("GBP", "VES")).toBe("VES");
  });

  it("convierte major y minor units exactamente", () => {
    expect(majorToMinor("0")).toBe(0);
    expect(majorToMinor("12.34")).toBe(1234);
    expect(() => majorToMinor(-1.5)).toThrow(TypeError);
    expect(majorToMinor(1e2)).toBe(10000);
    expect(minorToMajor(1234)).toBe(12.34);
  });

  it("rechaza redondeos implícitos y valores inseguros", () => {
    expect(() => majorToMinor("1.001")).toThrow(RangeError);
    expect(() => majorToMinor(Number.NaN)).toThrow(TypeError);
    expect(() => majorToMinor(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    expect(() => majorToMinor("90071992547409.92")).toThrow(TypeError);
    expect(() => assertMinorUnits(1.2)).toThrow(TypeError);
  });

  it("suma y multiplica manteniendo enteros seguros", () => {
    expect(addMinor(100, 250, 50)).toBe(400);
    expect(multiplyMinor(125, 3)).toBe(375);
    expect(() => multiplyMinor(125, 1.5)).toThrow(TypeError);
    expect(() => assertMinorUnits(-1)).toThrow(TypeError);
    expect(() => addMinor(Number.MAX_SAFE_INTEGER, 1)).toThrow(TypeError);
  });

  it("formatea siempre con dos decimales y moneda", () => {
    expect(formatMinor(123456, "COP", "es-CO")).toMatch(
      /1[.,]234[.,]56/
    );
    expect(formatMinor(100, "USD", "en-US")).toBe("$1.00");
  });
});
