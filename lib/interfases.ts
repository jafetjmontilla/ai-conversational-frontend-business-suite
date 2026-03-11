// Roles del sistema (suite general)
export const systemRoles = ['system_admin', 'system_operator', 'system_viewer'] as const;
export type SystemRole = typeof systemRoles[number];

// Roles por negocio
export const businessRoles = ['business_admin', 'business_editor', 'business_viewer'] as const;
export type BusinessRole = typeof businessRoles[number];

// Todos los roles que puede tener un usuario en el sistema (rol global)
export const roles = [...systemRoles] as const;
export type Role = SystemRole;

export interface Permission {
  action: string;
  resource: string;
  conditions?: {
    role?: Role[];
    businessRole?: BusinessRole[];
    emailVerified?: boolean;
    custom?: (user: any) => boolean;
  };
}

export interface PermissionConfig {
  [key: string]: Permission;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  photoURL: string;
  updatedAt: string;
  createdAt: string;
  token?: string;
  code?: string;
  used?: boolean;
  expiresAt?: string;
  createdBy?: string;
  whatsappSent?: boolean;
  uid?: string;
}

// Tipos de config del worker (conversaciones, RAG, herramientas)
export interface KnowledgeSource {
  sourceId: string;
  name: string;
  roles: string[];
}

export interface PersonalityConfig {
  tone: string;
  language: string;
  customInstructions?: string;
}

export interface GlobalResponses {
  greeting?: string;
  goodbye?: string;
  noData?: string;
}

/** Herramienta disponible para que el modelo decida cuándo llamar (ej. get_saldo). */
export interface ToolConfig {
  name: string;
  description: string;
  params?: string[];
}

/** Auth de un data provider (en lectura solo apiKeyMasked; en edición se envía apiKey para cambiar). */
export interface DataProviderAuth {
  type: "header" | "bearer";
  headerName?: string;
  apiKey?: string;
  apiKeyMasked?: boolean;
}

/** Proveedor de datos: REST (baseUrl) o GraphQL (endpoint). */
export interface DataProvider {
  id: string;
  kind: "rest" | "graphql";
  baseUrl?: string | null;
  endpoint?: string | null;
  auth?: DataProviderAuth | null;
  tools: string[];
}

export interface BusinessConfig {
  conversationTimeout: number;
  messageLimit?: number;
  personality: PersonalityConfig;
  knowledgeSources: KnowledgeSource[];
  globalResponses: GlobalResponses;
  tools?: ToolConfig[];
  dataProviders?: DataProvider[];
}

export interface MetaCloudApiNumber {
  phoneNumberId: string;
  phoneNumber: string;
  accessToken: string;
  verifyToken: string;
}

export interface BaileysApiNumber {
  sessionId: string;
  phoneNumber?: string | null;
}

export interface WhatsappsConfig {
  metaCloudApiNumbers: MetaCloudApiNumber[];
  baileysApiNumbers: BaileysApiNumber[];
}

/** @deprecated Usar WhatsappsConfig.metaCloudApiNumbers */
export interface WhatsAppConfig {
  phoneNumberId: string;
  phoneNumber: string;
  accessToken: string;
  verifyToken: string;
}

/** Dirección física o de facturación. */
export interface BusinessAddress {
  street?: string;
  number?: string;
  sector?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
}

/** Numeración de factura: prefijo y rangos autorizados. */
export interface InvoiceNumbering {
  prefix?: string;
  rangeFrom?: number;
  rangeTo?: number;
}

export interface Business {
  _id: string;
  name: string;
  businessId: string;
  description?: string;
  active: boolean;
  legalName?: string;
  taxId?: string;
  slogan?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: BusinessAddress;
  currency?: string;
  timezone?: string;
  language?: string;
  businessCategory?: string;
  defaultTaxPercent?: number;
  taxRegime?: string;
  digitalSignatureOrStamp?: string;
  invoiceNumbering?: InvoiceNumbering;
  /** Moneda base para los precios: USD, EUR, VES. */
  billingBaseCurrency?: "USD" | "EUR" | "VES";
  /** Moneda en la que mostrar precios: USD, EUR, VES. */
  billingDisplayCurrency?: "USD" | "EUR" | "VES";
  /** Fuente de tasa para el cambio: bcv_dolar, bcv_euro, binance, custom. */
  billingExchangeRateSource?: "bcv_dolar" | "bcv_euro" | "binance" | "custom";
  /** Tasa manual cuando la fuente es custom. */
  billingCustomExchangeRate?: number;
  /** Configuración usada por el worker (conversaciones, personalidad, fuentes RAG, herramientas). */
  config?: BusinessConfig;
  whatsapps?: WhatsappsConfig;
  callbackUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessMemberInfo {
  userId: string;
  businessId: string;
  role: string;
}

export type FormFieldInput = {
  name: string;
  label: string;
  placeholder: string;
  icon?: any;
  type: string;
  required: boolean;
  options?: OptionSelect[];
  disabled?: boolean;
}

export interface OptionSelect {
  value: string | boolean;
  title: string;
  description: string;
  features: string[];
  icon?: string;
  color?: string;
}

export interface PriceHistory {
  value: number;
  valorUsd: number;
  updatedAt: string;
  userId: string;
}

export interface QuantityHistory {
  quantity: number;
  concept: string;
  updatedAt: string;
  userId: string;
}

// Facturación e inventario (multi-tenant por business_id)
export interface InvoiceItem {
  _id: string;
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  total: number;
  inventoryId: string;
  invoiceId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  _id: string;
  clientName?: string;
  clientId?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  totalBs: number;
  totalUsd: number;
  status: "draft" | "paid" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceResponse {
  total: number;
  results: Invoice[];
}

export interface PaymentMethod {
  _id: string;
  id: string;
  name: string;
  amountBs: number;
  amountUsd: number;
  paymentId?: string;
  urlSuport?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  invoiceId: string;
  paymentMethods: PaymentMethod[];
  totalPaid: number;
  exchangeRate: number;
  status: string;
  createdAt: string;
}

export interface PaymentResponse {
  total: number;
  results: Payment[];
}

export interface InventoryItem {
  _id: string;
  code: string;
  description: string;
  type: "mercancia" | "servicio";
  category?: string;
  quantity: number;
  unitCost: number;
  salesPrice: number;
  unitCostUsd: number;
  salesPriceUsd: number;
  profitPercentage: number;
  status: boolean;
  costHistory: PriceHistory[];
  priceHistory: PriceHistory[];
  quantityHistory: QuantityHistory[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  _id: string;
  name: string;
  description?: string;
  type: "producto" | "servicio" | "ambos";
  active: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

// ——— Product (maestro) + Variants (SKUs) ———
export interface Product {
  _id: string;
  name: string;
  description: string;
  category_id: string | null;
  base_price: number;
  brand: string;
  status: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attribute {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributeValue {
  _id: string;
  attribute_id: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VariantAttributeMapEntry {
  attribute_value_id: string;
}

export interface ProductVariant {
  _id: string;
  product_id: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
  image_url: string | null;
  attribute_values: VariantAttributeMapEntry[];
  status: boolean;
  /** Soft delete: si está definido, la variante está desactivada (no en ventas; sí en reportes). */
  deleted_at?: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Previsualización de variante (generación cartesiana). */
export interface VariantPreviewItem {
  sku: string;
  attributeValues: { attributeName: string; value: string; attributeValueId?: string }[];
  attribute_value_ids?: string[];
  price_override: number | null;
  stock_quantity: number;
}

export interface GenerateVariantsPreviewPayload {
  combinations: VariantPreviewItem[];
}

export interface StockDeductResult {
  success: boolean;
  variantId?: string;
  sku?: string;
  previousQuantity: number;
  newQuantity: number;
  error?: string;
}

export interface StockInfo {
  found: boolean;
  sku?: string | null;
  variantId?: string | null;
  stock_quantity: number;
}

/** Input para generación: atributo con valores (producto cartesiano). */
export type AttributeValuesForPreview = {
  attributeId: string;
  attributeName: string;
  values: { id: string; value: string }[];
};

export interface PaymentFiltersInput {
  status?: string;
  dateFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  offsetMinutes?: number;
}
