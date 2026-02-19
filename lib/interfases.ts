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

export interface Business {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
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
