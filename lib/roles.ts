import {
  businessRoles,
  systemRoles,
  type BusinessRole,
  type OptionSelect,
  type SystemRole,
} from "@/lib/interfases";

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  system_admin: "Administrador del sistema",
  system_operator: "Operador del sistema",
  system_viewer: "Solo lectura (sistema)",
};

export const BUSINESS_ROLE_LABELS: Record<BusinessRole, string> = {
  business_admin: "Administrador del negocio",
  business_editor: "Editor",
  business_viewer: "Solo lectura",
};

const SYSTEM_ROLE_ICONS: Record<SystemRole, string> = {
  system_admin: "⚙️",
  system_operator: "👤",
  system_viewer: "👤",
};

const BUSINESS_ROLE_ICONS: Record<BusinessRole, string> = {
  business_admin: "⚙️",
  business_editor: "✏️",
  business_viewer: "👤",
};

function toRoleOption(value: string, title: string, icon: string): OptionSelect {
  return { value, title, description: "", icon, features: [] };
}

function buildRoleOptions(
  roles: readonly string[],
  labels: Record<string, string>,
  icons: Record<string, string>
): OptionSelect[] {
  return [...roles]
    .map((role) => toRoleOption(role, labels[role], icons[role] ?? "👤"))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const systemRoleOptions = buildRoleOptions(systemRoles, SYSTEM_ROLE_LABELS, SYSTEM_ROLE_ICONS);

export const businessRoleOptions = buildRoleOptions(
  businessRoles,
  BUSINESS_ROLE_LABELS,
  BUSINESS_ROLE_ICONS
);

export function getRoleOptions(scope: "system" | "business"): OptionSelect[] {
  return scope === "business" ? businessRoleOptions : systemRoleOptions;
}

export function getRoleLabel(role: string | undefined | null, fallback = "Sin rol"): string {
  if (!role) return fallback;
  if (role in SYSTEM_ROLE_LABELS) return SYSTEM_ROLE_LABELS[role as SystemRole];
  if (role in BUSINESS_ROLE_LABELS) return BUSINESS_ROLE_LABELS[role as BusinessRole];
  return role;
}
