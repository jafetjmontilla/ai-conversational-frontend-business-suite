import { useAuth } from '../../contexts/AuthContext';
import { useMemo } from 'react';

// Tipos para permisos
export type Plan = 'free' | 'premium' | 'pro';
export type Role = 'admin' | 'professional' | 'client';

export interface Permission {
  action: string;
  resource: string;
  conditions?: {
    plan?: Plan[];
    role?: Role[];
    emailVerified?: boolean;
    custom?: (user: any) => boolean;
  };
}

export interface PermissionConfig {
  [key: string]: Permission;
}

// Configuración de permisos por defecto
const DEFAULT_PERMISSIONS: PermissionConfig = {
  // Rutinas
  'rutinas:crear': {
    action: 'crear',
    resource: 'rutinas',
    conditions: {
      plan: ['free', 'premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'rutinas:editar': {
    action: 'editar',
    resource: 'rutinas',
    conditions: {
      plan: ['free', 'premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'rutinas:eliminar': {
    action: 'eliminar',
    resource: 'rutinas',
    conditions: {
      plan: ['free', 'premium', 'pro'],
      role: ['admin', 'professional']
    }
  },
  'rutinas:ilimitadas': {
    action: 'ilimitadas',
    resource: 'rutinas',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },

  // Ejercicios
  'ejercicios:acceder': {
    action: 'acceder',
    resource: 'ejercicios',
    conditions: {
      plan: ['free', 'premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'ejercicios:premium': {
    action: 'premium',
    resource: 'ejercicios',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'ejercicios:crear': {
    action: 'crear',
    resource: 'ejercicios',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional']
    }
  },
  'ejercicios:editar': {
    action: 'editar',
    resource: 'ejercicios',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional']
    }
  },
  'ejercicios:eliminar': {
    action: 'eliminar',
    resource: 'ejercicios',
    conditions: {
      plan: ['pro'],
      role: ['admin']
    }
  },

  // Progreso y estadísticas
  'progreso:ver': {
    action: 'ver',
    resource: 'progreso',
    conditions: {
      plan: ['free', 'premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'progreso:avanzado': {
    action: 'avanzado',
    resource: 'progreso',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'estadisticas:detalladas': {
    action: 'detalladas',
    resource: 'estadisticas',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'estadisticas:globales': {
    action: 'globales',
    resource: 'estadisticas',
    conditions: {
      plan: ['pro'],
      role: ['admin', 'professional']
    }
  },

  // Configuración
  'configuracion:perfil': {
    action: 'perfil',
    resource: 'configuracion',
    conditions: {
      plan: ['free', 'premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'configuracion:avanzada': {
    action: 'avanzada',
    resource: 'configuracion',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'configuracion:sistema': {
    action: 'sistema',
    resource: 'configuracion',
    conditions: {
      plan: ['pro'],
      role: ['admin']
    }
  },

  // Usuarios (solo para administradores y profesionales)
  'usuarios:ver': {
    action: 'ver',
    resource: 'usuarios',
    conditions: {
      plan: ['premium', 'pro'],
      role: ['admin', 'professional']
    }
  },
  'usuarios:crear': {
    action: 'crear',
    resource: 'usuarios',
    conditions: {
      plan: ['pro'],
      role: ['admin']
    }
  },
  'usuarios:editar': {
    action: 'editar',
    resource: 'usuarios',
    conditions: {
      plan: ['pro'],
      role: ['admin', 'professional']
    }
  },
  'usuarios:eliminar': {
    action: 'eliminar',
    resource: 'usuarios',
    conditions: {
      plan: ['pro'],
      role: ['admin']
    }
  },

  // Exportación de datos
  'exportar:datos': {
    action: 'datos',
    resource: 'exportar',
    conditions: {
      plan: ['pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'exportar:reportes': {
    action: 'reportes',
    resource: 'exportar',
    conditions: {
      plan: ['pro'],
      role: ['admin', 'professional']
    }
  },

  // Soporte
  'soporte:prioritario': {
    action: 'prioritario',
    resource: 'soporte',
    conditions: {
      plan: ['pro'],
      role: ['admin', 'professional', 'client']
    }
  },
  'soporte:gestionar': {
    action: 'gestionar',
    resource: 'soporte',
    conditions: {
      plan: ['pro'],
      role: ['admin', 'professional']
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

      // Verificar condiciones de plan
      if (conditions?.plan) {
        // Obtener el plan del usuario desde los custom claims
        const userPlan: Plan = (authUser.customClaims?.plan as Plan) || 'free';
        if (!conditions.plan.includes(userPlan)) {
          return false;
        }
      }

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

  // Función para verificar si el usuario tiene un plan específico
  const hasPlan = useMemo(() => {
    return (plan: Plan): boolean => {
      if (!authUser) return false;
      const userPlan: Plan = (authUser.customClaims?.plan as Plan) || 'free';
      return userPlan === plan;
    };
  }, [authUser]);

  // Función para verificar si el usuario tiene al menos un plan específico
  const hasAnyPlan = useMemo(() => {
    return (plans: Plan[]): boolean => {
      if (!authUser) return false;
      const userPlan: Plan = (authUser.customClaims?.plan as Plan) || 'free';
      return plans.includes(userPlan);
    };
  }, [authUser]);

  // Función para obtener el plan actual del usuario
  const getCurrentPlan = useMemo(() => {
    return (): Plan | null => {
      if (!authUser) return null;
      return (authUser.customClaims?.plan as Plan) || 'gratuito';
    };
  }, [authUser]);

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = useMemo(() => {
    return (role: Role): boolean => {
      if (!authUser) return false;
      const userRole: Role = (authUser.customClaims?.role as Role) || 'client';
      return userRole === role;
    };
  }, [authUser]);

  // Función para verificar si el usuario tiene al menos un rol específico
  const hasAnyRole = useMemo(() => {
    return (roles: Role[]): boolean => {
      if (!authUser) return false;
      const userRole: Role = (authUser.customClaims?.role as Role) || 'client';
      return roles.includes(userRole);
    };
  }, [authUser]);

  // Función para obtener el rol actual del usuario
  const getCurrentRole = useMemo(() => {
    return (): Role | null => {
      if (!authUser) return null;
      return (authUser.customClaims?.role as Role) || 'Cliente';
    };
  }, [authUser]);

  return {
    can,
    canAll,
    canAny,
    getAvailablePermissions,
    hasPlan,
    hasAnyPlan,
    getCurrentPlan,
    hasRole,
    hasAnyRole,
    getCurrentRole,
    loading,
    user: authUser
  };
};

// Hook específico para verificar permisos de rutinas
export const useRoutinePermissions = () => {
  const { can, hasAnyPlan, hasAnyRole } = useAllowed();

  return {
    canCreate: () => can('rutinas:crear'),
    canEdit: () => can('rutinas:editar'),
    canDelete: () => can('rutinas:eliminar'),
    canUnlimited: () => can('rutinas:ilimitadas'),
    hasPremiumAccess: () => hasAnyPlan(['premium', 'pro']),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'professional'])
  };
};

// Hook específico para verificar permisos de ejercicios
export const useExercisePermissions = () => {
  const { can, hasAnyPlan, hasAnyRole, hasRole } = useAllowed();

  return {
    canAccess: () => can('ejercicios:acceder'),
    canAccessPremium: () => can('ejercicios:premium'),
    canCreate: () => can('ejercicios:crear'),
    canEdit: () => can('ejercicios:editar'),
    canDelete: () => can('ejercicios:eliminar'),
    hasPremiumAccess: () => hasAnyPlan(['premium', 'pro']),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'professional']),
    isAdmin: () => hasRole('admin')
  };
};

// Hook específico para verificar permisos de progreso
export const useProgressPermissions = () => {
  const { can, hasAnyPlan, hasAnyRole } = useAllowed();

  return {
    canView: () => can('progreso:ver'),
    canViewAdvanced: () => can('progreso:avanzado'),
    canViewDetailedStats: () => can('estadisticas:detalladas'),
    canViewGlobalStats: () => can('estadisticas:globales'),
    hasPremiumAccess: () => hasAnyPlan(['premium', 'pro']),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'professional'])
  };
};

// Hook específico para verificar permisos de configuración
export const useConfigPermissions = () => {
  const { can, hasAnyPlan, hasRole } = useAllowed();

  return {
    canEditProfile: () => can('configuracion:perfil'),
    canAdvancedConfig: () => can('configuracion:avanzada'),
    canSystemConfig: () => can('configuracion:sistema'),
    hasPremiumAccess: () => hasAnyPlan(['premium', 'pro']),
    isAdmin: () => hasRole('admin')
  };
};

// Hook específico para verificar permisos de exportación
export const useExportPermissions = () => {
  const { can, hasPlan, hasAnyRole } = useAllowed();

  return {
    canExportData: () => can('exportar:datos'),
    canExportReports: () => can('exportar:reportes'),
    hasProPlan: () => hasPlan('pro'),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'professional'])
  };
};

// Hook específico para verificar permisos de soporte
export const useSupportPermissions = () => {
  const { can, hasPlan, hasAnyRole } = useAllowed();

  return {
    hasPrioritySupport: () => can('soporte:prioritario'),
    canManageSupport: () => can('soporte:gestionar'),
    hasProPlan: () => hasPlan('pro'),
    hasProfessionalAccess: () => hasAnyRole(['admin', 'professional'])
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
    hasProfessionalAccess: () => hasAnyRole(['admin', 'professional']),
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