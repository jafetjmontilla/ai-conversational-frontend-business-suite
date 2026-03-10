import { useAuth } from '../../contexts/AuthContext';
import { useMemo, useEffect, useState } from 'react';
import { PermissionConfig, Role, BusinessRole } from '../interfases';
import { fetchApiV1, queries } from '../Fetching';

const DEFAULT_PERMISSIONS: PermissionConfig = {
  // Perfil (cualquier usuario autenticado)
  'configuracion:perfil': {
    action: 'perfil',
    resource: 'configuracion',
    conditions: {
      role: ['system_admin', 'system_operator', 'system_viewer']
    }
  },

  // Negocios (solo sistema)
  'negocios:ver': {
    action: 'ver',
    resource: 'negocios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },
  'negocios:crear': {
    action: 'crear',
    resource: 'negocios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },
  'negocios:editar': {
    action: 'editar',
    resource: 'negocios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },
  'negocios:eliminar': {
    action: 'eliminar',
    resource: 'negocios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },

  // Usuarios del sistema (solo sistema)
  'usuarios:ver': {
    action: 'ver',
    resource: 'usuarios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },
  'usuarios:crear': {
    action: 'crear',
    resource: 'usuarios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },
  'usuarios:editar': {
    action: 'editar',
    resource: 'usuarios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },
  'usuarios:eliminar': {
    action: 'eliminar',
    resource: 'usuarios',
    conditions: { role: ['system_admin', 'system_operator'] }
  },

  // Editar negocio (dentro del negocio: business_admin; desde sistema: system_admin/operator)
  'negocio:editar': {
    action: 'editar',
    resource: 'negocio',
    conditions: {
      role: ['system_admin', 'system_operator'],
      businessRole: ['business_admin']
    }
  },
  // Usuarios del negocio (gestionar miembros)
  'negocio:usuarios': {
    action: 'usuarios',
    resource: 'negocio',
    conditions: {
      role: ['system_admin', 'system_operator'],
      businessRole: ['business_admin']
    }
  }
};

export type UseAllowedOptions = {
  businessRole?: BusinessRole | null;
};

export const useAllowed = (options: UseAllowedOptions = {}) => {
  const { authUser, loading } = useAuth();
  const { businessRole = null } = options;

  const can = useMemo(() => {
    return (permission: string, customPermissions?: PermissionConfig): boolean => {
      if (loading) return false;
      if (!authUser) return false;

      const allPermissions = { ...DEFAULT_PERMISSIONS, ...customPermissions };
      const permissionConfig = allPermissions[permission];
      if (!permissionConfig) return false;

      const { conditions } = permissionConfig;

      if (conditions?.role) {
        const userRole: Role = (authUser.customClaims?.role as Role) || 'system_viewer';
        if (!conditions.role.includes(userRole)) {
          // Para permisos de negocio (editar, usuarios), si no tiene rol sistema permitido, comprobar rol en negocio
          if ((permission === 'negocio:editar' || permission === 'negocio:usuarios') && conditions.businessRole && businessRole) {
            return conditions.businessRole.includes(businessRole);
          }
          return false;
        }
      }

      if ((permission === 'negocio:editar' || permission === 'negocio:usuarios') && conditions?.businessRole && businessRole) {
        return conditions.businessRole.includes(businessRole);
      }

      if (conditions?.emailVerified !== undefined) {
        if (authUser.emailVerified !== conditions.emailVerified) return false;
      }

      if (conditions?.custom && !conditions.custom(authUser)) return false;

      return true;
    };
  }, [authUser, loading, businessRole]);

  const canAll = useMemo(() => {
    return (permissions: string[], customPermissions?: PermissionConfig): boolean => {
      return permissions.every((p) => can(p, customPermissions));
    };
  }, [can]);

  const canAny = useMemo(() => {
    return (permissions: string[], customPermissions?: PermissionConfig): boolean => {
      return permissions.some((p) => can(p, customPermissions));
    };
  }, [can]);

  const getAvailablePermissions = useMemo(() => {
    return (customPermissions?: PermissionConfig): string[] => {
      const all = { ...DEFAULT_PERMISSIONS, ...customPermissions };
      return Object.keys(all).filter((p) => can(p, customPermissions));
    };
  }, [can]);

  const hasRole = useMemo(() => {
    return (role: Role): boolean => {
      if (!authUser) return false;
      return (authUser.customClaims?.role as Role) === role;
    };
  }, [authUser]);

  const hasAnyRole = useMemo(() => {
    return (roles: Role[]): boolean => {
      if (!authUser) return false;
      return roles.includes(authUser.customClaims?.role as Role);
    };
  }, [authUser]);

  const getCurrentRole = useMemo(() => {
    return (): Role | null => {
      if (!authUser) return null;
      return (authUser.customClaims?.role as Role) ?? null;
    };
  }, [authUser]);

  return {
    can,
    canAll,
    canAny,
    getAvailablePermissions,
    hasRole,
    hasAnyRole,
    getCurrentRole,
    loading,
    user: authUser
  };
};

export const useConfigPermissions = () => {
  const { can, hasRole } = useAllowed();
  return {
    canEditProfile: () => can('configuracion:perfil'),
    isSystemAdmin: () => hasRole('system_admin'),
    isSystemOperator: () => hasRole('system_operator')
  };
};

export const useUserPermissions = () => {
  const { can, hasRole, hasAnyRole } = useAllowed();
  return {
    canViewUsers: () => can('usuarios:ver'),
    canCreateUsers: () => can('usuarios:crear'),
    canEditUsers: () => can('usuarios:editar'),
    canDeleteUsers: () => can('usuarios:eliminar'),
    isSystemAdmin: () => hasRole('system_admin'),
    canManageSystem: () => hasAnyRole(['system_admin', 'system_operator'])
  };
};

export const useBusinessPermissions = (businessRole: BusinessRole | null = null) => {
  const { can, hasAnyRole } = useAllowed({ businessRole });
  return {
    canViewBusinesses: () => can('negocios:ver'),
    canCreateBusinesses: () => can('negocios:crear'),
    canEditBusinesses: () => can('negocios:editar'),
    canDeleteBusinesses: () => can('negocios:eliminar'),
    canEditCurrentBusiness: () => can('negocio:editar'),
    canManageBusinessUsers: () => can('negocio:usuarios'),
    canManageSystem: () => hasAnyRole(['system_admin', 'system_operator'])
  };
};

export const useEmailPermissions = () => {
  const { can, user } = useAllowed();
  return {
    isEmailVerified: () => can('email:verificado'),
    emailVerified: user?.emailVerified || false
  };
};

/** Rutas que corresponden al sistema general (no a un negocio). */
export const SYSTEM_PATH_SEGMENTS = [
  'dashboard', 'users', 'businesses', 'profile', 'notifications', 'theme-demo',
  'login', 'register', 'register-invitation', 'forgot-password'
];

/** Dado pathname, devuelve businessId si estamos en una ruta de negocio. */
export function getBusinessIdFromPathname(pathname: string): string | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment || SYSTEM_PATH_SEGMENTS.includes(segment)) return null;
  return segment;
}

/** Hook: obtiene el rol del usuario en el negocio. slugFromUrl = business_id (_id) o businessId (string) según la ruta. Usa meData cuando el slug es el negocio actual (evita fetch). */
export function useBusinessRole(slugFromUrl: string | null) {
  const { meData } = useAuth();
  const [businessRole, setBusinessRole] = useState<BusinessRole | null>(null);
  const [loading, setLoading] = useState(!!slugFromUrl);

  useEffect(() => {
    if (!slugFromUrl) {
      setBusinessRole(null);
      setLoading(false);
      return;
    }
    // Si el slug es el negocio ya cargado en meData, no hacemos fetch
    if (meData?.business && (meData.business.businessId === slugFromUrl || meData.business._id === slugFromUrl)) {
      setBusinessRole((meData.businessRole as BusinessRole) ?? null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchApiV1({ query: queries.getMyBusinessMemberships, type: 'json' }) as { userId: string; business_id: string; role: string }[] | undefined;
        if (cancelled) return;
        let m = list?.find((x) => x.business_id === slugFromUrl);
        if (!m && list?.length) {
          let business = await fetchApiV1({
            query: queries.getBusiness,
            type: 'json',
            variables: { businessId: slugFromUrl },
          }) as { _id: string } | undefined;
          if (!business && slugFromUrl) {
            business = await fetchApiV1({
              query: queries.getBusiness,
              type: 'json',
              variables: { id: slugFromUrl },
            }) as { _id: string } | undefined;
          }
          if (cancelled) return;
          if (business?._id) {
            m = list?.find((x) => x.business_id === business._id) ?? undefined;
          }
        }
        setBusinessRole((m?.role as BusinessRole) ?? null);
      } catch {
        if (!cancelled) setBusinessRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slugFromUrl, meData?.business?._id, meData?.business?.businessId, meData?.businessRole]);

  return { businessRole, loading };
}

export interface MyBusinessItem {
  _id: string;
  name: string;
  businessId: string;
}

/** Hook: lista de negocios del usuario (para selector en header). */
export function useMyBusinesses() {
  const [businesses, setBusinesses] = useState<MyBusinessItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchApiV1({ query: queries.getMyBusinesses, type: 'json' }) as MyBusinessItem[] | undefined;
        if (!cancelled) setBusinesses(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setBusinesses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { businesses, loading };
}
