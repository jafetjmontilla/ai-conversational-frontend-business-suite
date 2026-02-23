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

export interface WhatsAppConfig {
  phoneNumberId: string;
  phoneNumber: string;
  accessToken: string;
  verifyToken: string;
}

export interface Business {
  _id: string;
  name: string;
  businessId: string;
  description?: string;
  active: boolean;
  /** Configuración usada por el worker (conversaciones, personalidad, fuentes RAG, herramientas). */
  config?: BusinessConfig;
  whatsapp?: WhatsAppConfig;
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
