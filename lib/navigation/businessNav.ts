import type { LucideIcon } from "lucide-react";
import { isAppInstalled, type BusinessInstalledApp } from "@/lib/app-suite/capabilities";
import {
  Home,
  Users,
  Building2,
  Pencil,
  UserPlus,
  BookOpen,
  Settings,
  Wrench,
  MessageSquare,
  Package,
  FileText,
  Brain,
  FileSearch,
  ScanSearch,
  House,
  LayoutGrid,
} from "lucide-react";

/** Permiso requerido para mostrar un ítem del menú de negocio. */
export type NavPermission =
  | "negocio:ver"
  | "negocio:editar"
  | "negocio:usuarios";

export type BusinessNavPermissions = {
  canViewCurrentBusiness: boolean;
  canEditCurrentBusiness: boolean;
  canManageBusinessUsers: boolean;
};

export type SystemNavPermissions = {
  canViewBusinesses: boolean;
  canViewUsers: boolean;
};

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: NavPermission;
  /** Si true, resalta cuando pathname === href o empieza por href + "/" */
  matchPrefix?: boolean;
  /** Base para matchPrefix cuando href apunta a una subruta por defecto */
  activePrefix?: string;
  /**
   * Apps requeridas (cualquiera) para mostrar en el menú.
   * Solo aplica a navegación; no ocultar controles en formularios (ver FeatureGate).
   */
  requiredAnyApps?: string[];
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export type NavSlug = {
  name: string;
  href: string;
};

function hasPermission(
  permission: NavPermission | undefined,
  perms: BusinessNavPermissions
): boolean {
  if (!permission) return true;
  switch (permission) {
    case "negocio:ver":
      return perms.canViewCurrentBusiness;
    case "negocio:editar":
      return perms.canEditCurrentBusiness;
    case "negocio:usuarios":
      return perms.canManageBusinessUsers;
    default:
      return true;
  }
}

function filterItemsByInstalledApps(
  items: NavItem[],
  installedApps?: BusinessInstalledApp[] | null
): NavItem[] {
  return items.filter((item) => {
    if (!item.requiredAnyApps?.length) return true;
    return item.requiredAnyApps.some((appId) => isAppInstalled(installedApps, appId));
  });
}

function filterItems(
  items: NavItem[],
  perms: BusinessNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): NavItem[] {
  return filterItemsByInstalledApps(
    items.filter((item) => hasPermission(item.permission, perms)),
    installedApps
  );
}

function filterGroups(
  groups: NavGroup[],
  perms: BusinessNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: filterItems(group.items, perms, installedApps) }))
    .filter((group) => group.items.length > 0);
}

/** Ítem suelto (sin grupo) mostrado arriba del menú de negocio. */
export function buildBusinessTopItems(
  businessId: string,
  perms: BusinessNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): NavItem[] {
  return filterItems(
    [
      {
        id: "resumen",
        href: `/${businessId}`,
        label: "Resumen",
        icon: House,
        permission: "negocio:ver",
      },
      {
        id: "app-suite",
        href: `/${businessId}/app-suite`,
        label: "Suite de aplicaciones",
        icon: LayoutGrid,
        permission: "negocio:ver",
      },
    ],
    perms,
    installedApps
  );
}

/** Grupos del menú lateral dentro del ámbito de un negocio. */
export function buildBusinessNavGroups(
  businessId: string,
  perms: BusinessNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): NavGroup[] {
  const base = `/${businessId}`;

  const groups: NavGroup[] = [
    {
      id: "negocio",
      label: "Negocio",
      items: [
        {
          id: "edit",
          href: `${base}/edit`,
          label: "Datos del negocio",
          icon: Pencil,
          permission: "negocio:editar",
        },
        {
          id: "users",
          href: `${base}/users`,
          label: "Usuarios y accesos",
          icon: UserPlus,
          permission: "negocio:usuarios",
        },
        {
          id: "channels",
          href: `${base}/channels`,
          label: "Canales",
          icon: MessageSquare,
          permission: "negocio:editar",
        },
      ],
    },
    {
      id: "catalogo",
      label: "Catálogo y ventas",
      items: [
        {
          id: "offerings",
          href: `${base}/offerings/products`,
          activePrefix: `${base}/offerings`,
          label: "Productos y servicios",
          icon: Package,
          permission: "negocio:ver",
          matchPrefix: true,
          requiredAnyApps: ["productos-servicios"],
        },
        {
          id: "billing",
          href: `${base}/billing/facturas`,
          activePrefix: `${base}/billing`,
          label: "Facturación interna",
          icon: FileText,
          permission: "negocio:ver",
          matchPrefix: true,
          requiredAnyApps: ["facturacion-inventario"],
        },
      ],
    },
    {
      id: "ia",
      label: "Asistente IA",
      items: [
        {
          id: "behavior",
          href: `${base}/ai/behavior`,
          label: "Comportamiento",
          icon: Settings,
          permission: "negocio:editar",
          matchPrefix: true,
          requiredAnyApps: ["agente-atencion-cliente"],
        },
        {
          id: "knowledge",
          href: `${base}/knowledge/protocols`,
          activePrefix: `${base}/knowledge`,
          label: "Conocimiento",
          icon: BookOpen,
          permission: "negocio:editar",
          matchPrefix: true,
          requiredAnyApps: ["agente-atencion-cliente"],
        },
        {
          id: "knowledge-audit",
          href: `${base}/ai/audit`,
          label: "Auditoría conocimiento",
          icon: ScanSearch,
          permission: "negocio:editar",
          matchPrefix: true,
          requiredAnyApps: ["agente-atencion-cliente"],
        },
        {
          id: "tools",
          href: `${base}/ai/tools`,
          label: "Herramientas",
          icon: Wrench,
          permission: "negocio:editar",
          matchPrefix: true,
          requiredAnyApps: ["agente-atencion-cliente"],
        },
        {
          id: "memory",
          href: `${base}/ai/memory/datos`,
          activePrefix: `${base}/ai/memory`,
          label: "Memoria y PAE",
          icon: Brain,
          permission: "negocio:ver",
          matchPrefix: true,
          requiredAnyApps: ["agente-asistente-personal"],
        },
      ],
    },
    {
      id: "avanzado",
      label: "Avanzado",
      items: [
        {
          id: "ops",
          href: `${base}/ops/logs`,
          activePrefix: `${base}/ops`,
          label: "Logs y auditoría",
          icon: FileSearch,
          permission: "negocio:ver",
          matchPrefix: true,
        },
      ],
    },
  ];

  return filterGroups(groups, perms, installedApps);
}

/** Menú principal en ámbito sistema (sin businessId). */
export function buildSystemNavItems(): NavItem[] {
  return [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
    },
  ];
}

/** Ítems del footer en ámbito sistema. */
export function buildAccountNavItems(perms: SystemNavPermissions): NavItem[] {
  const items: NavItem[] = [];

  if (perms.canViewBusinesses) {
    items.push({
      id: "businesses",
      href: "/businesses",
      label: "Negocios",
      icon: Building2,
    });
  }

  if (perms.canViewUsers) {
    items.push({
      id: "users",
      href: "/users",
      label: "Usuarios",
      icon: Users,
    });
  }

  return items;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const matchBase = item.activePrefix ?? item.href;
  if (item.matchPrefix) {
    return pathname === matchBase || pathname.startsWith(`${matchBase}/`);
  }
  return pathname === item.href;
}

/** Todos los ítems visibles del ámbito negocio (top + grupos), aplanados. */
export function flattenBusinessNavItems(
  businessId: string,
  perms: BusinessNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): NavItem[] {
  const top = buildBusinessTopItems(businessId, perms, installedApps);
  const groups = buildBusinessNavGroups(businessId, perms, installedApps);
  return [...top, ...groups.flatMap((g) => g.items)];
}

/** Lista plana para breadcrumbs: negocio + sistema + cuenta. */
export function buildNavSlugs(
  businessId: string | null,
  businessPerms: BusinessNavPermissions,
  systemPerms: SystemNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): NavSlug[] {
  if (businessId) {
    return flattenBusinessNavItems(businessId, businessPerms, installedApps).map((item) => ({
      name: item.label,
      href: item.href,
    }));
  }

  return [
    ...buildSystemNavItems().map((item) => ({ name: item.label, href: item.href })),
    ...buildAccountNavItems(systemPerms).map((item) => ({ name: item.label, href: item.href })),
  ];
}

/** Resuelve el breadcrumb usando la config completa de navegación. */
export function resolveNavBreadcrumb(
  pathname: string,
  businessId: string | null,
  businessPerms: BusinessNavPermissions,
  systemPerms: SystemNavPermissions,
  installedApps?: BusinessInstalledApp[] | null
): string | undefined {
  const allItems: NavItem[] = businessId
    ? flattenBusinessNavItems(businessId, businessPerms, installedApps)
    : [...buildSystemNavItems(), ...buildAccountNavItems(systemPerms)];

  const sorted = [...allItems].sort((a, b) => b.href.length - a.href.length);

  for (const item of sorted) {
    if (isNavItemActive(pathname, item)) {
      return item.label;
    }
  }

  return undefined;
}
