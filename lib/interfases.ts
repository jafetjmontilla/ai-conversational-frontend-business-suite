
// Define el arreglo de roles
export const roles = ['admin', 'accounting', 'callCenter', 'technicalSupport', 'logicalSupport', 'technicalSupportSupervisor', 'sales', 'none'] as const;

// Crea el tipo a partir del arreglo
export type Role = typeof roles[number];

export interface Permission {
  action: string;
  resource: string;
  conditions?: {
    role?: Role[];
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
  zoneId?: number;
  active: boolean;
  emailVerified: boolean;
  photoURL: string;
  updatedAt: string;
  createdAt: string;
  // Campos para invitaciones (opcionales)
  token?: string;
  code?: string;
  used?: boolean;
  expiresAt?: string;
  createdBy?: string;
  whatsappSent?: boolean;
  uid?: string; // Los usuarios tienen uid, las invitaciones no
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

// Interfaces para inventario
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
