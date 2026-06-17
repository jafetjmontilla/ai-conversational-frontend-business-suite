export type OfferingsImportScope = "ALL" | "ATTRIBUTES" | "PRODUCTS" | "SERVICES";

export type ParsedAttributeDraft = {
  name: string;
  values: string[];
  selected?: boolean;
};

export type ParsedProductDraft = {
  name: string;
  description?: string | null;
  base_price?: number | null;
  brand?: string | null;
  category_hint?: string | null;
  is_sellable?: boolean | null;
  selected?: boolean;
};

export type ParsedServiceOptionDraft = {
  name: string;
  price: number;
  durationMinutes?: number | null;
};

export type ParsedServiceDraft = {
  name: string;
  description?: string | null;
  unit_of_measure?: string | null;
  options: ParsedServiceOptionDraft[];
  selected?: boolean;
};

export type OfferingsImportDraft = {
  attributes: ParsedAttributeDraft[];
  products: ParsedProductDraft[];
  services: ParsedServiceDraft[];
  warnings: string[];
};

export type OfferingsImportRowResult = {
  kind: string;
  name: string;
  status: string;
  message?: string | null;
};

export type OfferingsImportResult = {
  created: OfferingsImportRowResult[];
  skipped: OfferingsImportRowResult[];
  errors: OfferingsImportRowResult[];
};

export const OFFERINGS_IMPORT_SCOPE_OPTIONS: { value: OfferingsImportScope; label: string }[] = [
  { value: "ALL", label: "Todo (atributos, productos y servicios)" },
  { value: "ATTRIBUTES", label: "Solo atributos" },
  { value: "PRODUCTS", label: "Solo productos" },
  { value: "SERVICES", label: "Solo servicios" },
];

export const OFFERINGS_IMPORT_PLACEHOLDER = `Ejemplo — menú / tarifario:

Peluquería:
- Corte hombre $12
- Corte mujer $18
- Barba $8
- Tintura desde $35

Productos:
Camiseta básica algodón — $15 (tallas S, M, L, XL; colores rojo, azul, negro)
`;
