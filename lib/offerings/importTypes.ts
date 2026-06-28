export type OfferingsImportScope = "ALL" | "ATTRIBUTES" | "PRODUCTS" | "SERVICES" | "MODIFIERS";

export type ParsedAttributeDraft = {
  name: string;
  values: string[];
  selected?: boolean;
};

export type ParsedProductVariantAttributeDraft = {
  name: string;
  values: string[];
};

export type ParsedProductVariantAttributeValueDraft = {
  attribute_name: string;
  value: string;
};

export type ParsedProductVariantDraft = {
  sku?: string | null;
  attribute_values: ParsedProductVariantAttributeValueDraft[];
  price_override?: number | null;
  stock_quantity?: number | null;
};

export type ParsedProductDraft = {
  name: string;
  description?: string | null;
  base_price?: number | null;
  brand?: string | null;
  category_hint?: string | null;
  is_sellable?: boolean | null;
  needs_variants?: boolean | null;
  variant_attributes?: ParsedProductVariantAttributeDraft[];
  variants?: ParsedProductVariantDraft[];
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

export type ParsedModifierOptionDraft = {
  name: string;
  price: number;
  displayName?: string | null;
  isDefault?: boolean | null;
};

export type ParsedModifierGroupDraft = {
  name: string;
  isRequired?: boolean | null;
  selectionType?: "SINGLE" | "MULTIPLE" | null;
  minSelections?: number | null;
  maxSelections?: number | null;
  priceBehavior?: "ADDITIONAL" | "INCLUDED" | null;
  includedQuantity?: number | null;
  options: ParsedModifierOptionDraft[];
  product_hints?: string[] | null;
  service_hints?: string[] | null;
  selected?: boolean;
};

export type OfferingsImportDraft = {
  attributes: ParsedAttributeDraft[];
  products: ParsedProductDraft[];
  services: ParsedServiceDraft[];
  modifierGroups: ParsedModifierGroupDraft[];
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
  { value: "ALL", label: "Todo (atributos, productos, servicios y modificadores)" },
  { value: "ATTRIBUTES", label: "Solo atributos" },
  { value: "PRODUCTS", label: "Solo productos" },
  { value: "SERVICES", label: "Solo servicios" },
  { value: "MODIFIERS", label: "Solo modificadores / adicionales" },
];

export const OFFERINGS_IMPORT_PLACEHOLDER = `Ejemplo — menú / tarifario:

Peluquería:
- Corte hombre $12
- Corte mujer $18
- Barba $8
- Tintura desde $35

Productos:
Camiseta básica algodón — $15 (tallas S, M, L, XL; colores rojo, azul, negro)
Pizza Margarita — $10 (tamaños personal $10, mediana $14, familiar $18)
Extras pizza: BBQ $1.50, Ranch $1.50, Queso extra $2 (aplica a Pizza Margarita)
Cerveza Corona 355ml — $2.50
`;
