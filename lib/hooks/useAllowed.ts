import { useAuth } from '../../contexts/AuthContext';
import { useMemo } from 'react';
import { PermissionConfig, Role } from '../interfases';

// Configuración de permisos por defecto
const DEFAULT_PERMISSIONS: PermissionConfig = {
  // Configuración
  'configuracion:perfil': {
    action: 'perfil',
    resource: 'configuracion',
    conditions: {
      role: ['admin', 'customerService']
    }
  },
  'configuracion:avanzada': {
    action: 'avanzada',
    resource: 'configuracion',
    conditions: {
      role: ['admin',]
    }
  },
  'configuracion:sistema': {
    action: 'sistema',
    resource: 'configuracion',
    conditions: {
      role: ['admin']
    }
  },

  // Usuarios (solo para administradores y profesionales)
  'usuarios:ver': {
    action: 'ver',
    resource: 'usuarios',
    conditions: {
      role: ['admin']
    }
  },
  'usuarios:crear': {
    action: 'crear',
    resource: 'usuarios',
    conditions: {
      role: ['admin']
    }
  },
  'usuarios:editar': {
    action: 'editar',
    resource: 'usuarios',
    conditions: {
      role: ['admin']
    }
  },
  'usuarios:eliminar': {
    action: 'eliminar',
    resource: 'usuarios',
    conditions: {
      role: ['admin']
    }
  },

  // Exportación de datos
  'exportar:datos': {
    action: 'datos',
    resource: 'exportar',
    conditions: {
      role: ['admin', 'customerService']
    }
  },
  'exportar:reportes': {
    action: 'reportes',
    resource: 'exportar',
    conditions: {
      role: ['admin', 'customerService']
    }
  },

  // Soporte
  'soporte:prioritario': {
    action: 'prioritario',
    resource: 'soporte',
    conditions: {
      role: ['admin', 'customerService']
    }
  },
  'soporte:gestionar': {
    action: 'gestionar',
    resource: 'soporte',
    conditions: {
      role: ['admin', 'customerService']
    }
  },

  // Email verificado
  'email:verificado': {
    action: 'verificado',
    resource: 'email',
    conditions: {
      emailVerified: true
    }
  }
};

// Hook principal para manejar permisos
export const useAllowed = () => {
  const { authUser, loading } = useAuth();

  // Función para verificar si un usuario tiene un permiso específico
  const can = useMemo(() => {
    return (permission: string, customPermissions?: PermissionConfig): boolean => {
      // Si está cargando, no permitir nada
      if (loading) return false;

      // Si no hay usuario autenticado, no permitir nada
      if (!authUser) return false;

      // Combinar permisos por defecto con permisos personalizados
      const allPermissions = { ...DEFAULT_PERMISSIONS, ...customPermissions };

      // Obtener la configuración del permiso
      const permissionConfig = allPermissions[permission];
      if (!permissionConfig) {
        console.warn(`Permiso no encontrado: ${permission}`);
        return false;
      }

      const { conditions } = permissionConfig;

      // Verificar condiciones de rol
      if (conditions?.role) {
        // Obtener el rol del usuario desde los custom claims
        const userRole: Role = (authUser.customClaims?.role as Role) || 'client';
        if (!conditions.role.includes(userRole)) {
          return false;
        }
      }

      // Verificar si el email está verificado
      if (conditions?.emailVerified !== undefined) {
        if (authUser.emailVerified !== conditions.emailVerified) {
          return false;
        }
      }

      // Verificar condiciones personalizadas
      if (conditions?.custom) {
        if (!conditions.custom(authUser)) {
          return false;
        }
      }

      return true;
    };
  }, [authUser, loading]);

  // Función para verificar múltiples permisos (AND)
  const canAll = useMemo(() => {
    return (permissions: string[], customPermissions?: PermissionConfig): boolean => {
      return permissions.every(permission => can(permission, customPermissions));
    };
  }, [can]);

  // Función para verificar múltiples permisos (OR)
  const canAny = useMemo(() => {
    return (permissions: string[], customPermissions?: PermissionConfig): boolean => {
      return permissions.some(permission => can(permission, customPermissions));
    };
  }, [can]);

  // Función para obtener permisos disponibles para el usuario actual
  const getAvailablePermissions = useMemo(() => {
    return (customPermissions?: PermissionConfig): string[] => {
      const allPermissions = { ...DEFAULT_PERMISSIONS, ...customPermissions };
      return Object.keys(allPermissions).filter(permission =>
        can(permission, customPermissions)
      );
    };
  }, [can]);



  // Función para verificar si el usuario tiene un rol específico
  const hasRole = useMemo(() => {
    return (role: Role): boolean => {
      if (!authUser) return false;
      const userRole: Role = (authUser.customClaims?.role as Role);
      return userRole === role;
    };
  }, [authUser]);

  // Función para verificar si el usuario tiene al menos un rol específico
  const hasAnyRole = useMemo(() => {
    return (roles: Role[]): boolean => {
      if (!authUser) return false;
      const userRole: Role = (authUser.customClaims?.role as Role);
      return roles.includes(userRole);
    };
  }, [authUser]);

  // Función para obtener el rol actual del usuario
  const getCurrentRole = useMemo(() => {
    return (): Role | null => {
      if (!authUser) return null;
      return (authUser.customClaims?.role as Role);
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

// Hook específico para verificar permisos de configuración
export const useConfigPermissions = () => {
  const { can, hasRole } = useAllowed();

  return {
    canEditProfile: () => can('configuracion:perfil'),
    canAdvancedConfig: () => can('configuracion:avanzada'),
    canSystemConfig: () => can('configuracion:sistema'),
    isAdmin: () => hasRole('admin')
  };
};

// Hook específico para verificar permisos de exportación
export const useExportPermissions = () => {
  const { can, hasAnyRole } = useAllowed();

  return {
    canExportData: () => can('exportar:datos'),
    canExportReports: () => can('exportar:reportes'),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'customerService'])
  };
};

// Hook específico para verificar permisos de soporte
export const useSupportPermissions = () => {
  const { can, hasAnyRole } = useAllowed();

  return {
    hasPrioritySupport: () => can('soporte:prioritario'),
    canManageSupport: () => can('soporte:gestionar'),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'customerService'])
  };
};

// Hook específico para verificar permisos de usuarios
export const useUserPermissions = () => {
  const { can, hasAnyRole, hasRole } = useAllowed();

  return {
    canViewUsers: () => can('usuarios:ver'),
    canCreateUsers: () => can('usuarios:crear'),
    canEditUsers: () => can('usuarios:editar'),
    canDeleteUsers: () => can('usuarios:eliminar'),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'customerService']),
    isAdmin: () => hasRole('admin')
  };
};

// Hook específico para verificar verificación de email
export const useEmailPermissions = () => {
  const { can, user } = useAllowed();

  return {
    isEmailVerified: () => can('email:verificado'),
    emailVerified: user?.emailVerified || false
  };
}; 