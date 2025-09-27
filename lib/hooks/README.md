# Hook useAllowed - Sistema de Permisos y Autorizaciones

El hook `useAllowed` adminporciona un sistema completo de permisos y autorizaciones para la aplicación sistemasJaihom, basado en el rol del usuario y otros criterios de seguridad.

## 🚀 Características

- ✅ **Verificación de permisos** basada en roles de usuario
- ✅ **Verificación de email** para funcionalidades críticas
- ✅ **Permisos personalizados** con condiciones específicas
- ✅ **Hooks especializados** para diferentes áreas de la aplicación
- ✅ **Verificación múltiple** (AND/OR) de permisos
- ✅ **Integración completa** con el sistema de autenticación

## 📦 Instalación

El hook ya está disponible en `lib/hooks/useAllowed.ts` y se puede importar directamente:

```typescript
import { useAllowed } from '../lib/hooks/useAllowed';
```

## 🎯 Uso Básico

### Hook Principal

```typescript
import { useAllowed } from '../lib/hooks/useAllowed';

function MiComponente() {
  const { can, hasRole, getCurrentRole } = useAllowed();

  // Verificar un permiso específico
  const puedeCrearRutina = can('rutinas:crear');

  // Verificar si tiene un rol específico
  const esAdmin = hasRole('admin');

  // Obtener el rol actual
  const rolActual = getCurrentRole();

  return (
    <div>
      {puedeCrearRutina && <button>Crear Rutina</button>}
      {esAdmin && <div>Funcionalidades de Administrador</div>}
    </div>
  );
}
```

### Verificación Múltiple

```typescript
const { canAll, canAny } = useAllowed();

// Verificar que tenga TODOS los permisos (AND)
const puedeGestionarRutinas = canAll([
  'rutinas:crear',
  'rutinas:editar',
  'rutinas:eliminar'
]);

// Verificar que tenga AL MENOS UNO de los permisos (OR)
const tieneAccesoPremium = canAny([
  'ejercicios:adminfessional',
  'admingreso:avanzado',
  'estadisticas:detalladas'
]);
```

## 🎨 Hooks Especializados

### Permisos de Rutinas

```typescript
import { useRoutinePermissions } from '../lib/hooks/useAllowed';

function RutinasComponent() {
  const { 
    canCreate, 
    canEdit, 
    canDelete, 
    canUnlimited, 
    hasProfessionalAccess 
  } = useRoutinePermissions();

  return (
    <div>
      {canCreate() && <button>Crear Rutina</button>}
      {canEdit() && <button>Editar</button>}
      {canDelete() && <button>Eliminar</button>}
      {canUnlimited() && <span>Rutinas Ilimitadas</span>}
    </div>
  );
}
```

### Permisos de Ejercicios

```typescript
import { useExercisePermissions } from '../lib/hooks/useAllowed';

function EjerciciosComponent() {
  const { 
    canAccess, 
    canAccessPremium, 
    hasProfessionalAccess 
  } = useExercisePermissions();

  return (
    <div>
      {canAccess() && <div>Ejercicios Básicos</div>}
      {canAccessPremium() && <div>Ejercicios Premium</div>}
    </div>
  );
}
```

### Permisos de Progreso

```typescript
import { useProgressPermissions } from '../lib/hooks/useAllowed';

function ProgresoComponent() {
  const { 
    canView, 
    canViewAdvanced, 
    canViewDetailedStats 
  } = useProgressPermissions();

  return (
    <div>
      {canView() && <div>Progreso Básico</div>}
      {canViewAdvanced() && <div>Progreso Avanzado</div>}
      {canViewDetailedStats() && <div>Estadísticas Detalladas</div>}
    </div>
  );
}
```

### Verificación de Email

```typescript
import { useEmailPermissions } from '../lib/hooks/useAllowed';

function EmailVerificationComponent() {
  const { isEmailVerified, emailVerified } = useEmailPermissions();

  return (
    <div>
      {!emailVerified && (
        <div className="alert">
          Verifica tu email para acceder a todas las funcionalidades
        </div>
      )}
      {isEmailVerified() && <div>Email verificado ✓</div>}
    </div>
  );
}
```

## 🔧 Permisos Disponibles

### Rutinas
- `rutinas:crear` - Crear nuevas rutinas
- `rutinas:editar` - Editar rutinas existentes
- `rutinas:eliminar` - Eliminar rutinas
- `rutinas:ilimitadas` - Crear rutinas ilimitadas (Premium/Pro)

### Ejercicios
- `ejercicios:acceder` - Acceder a ejercicios básicos
- `ejercicios:adminfessional` - Acceder a ejercicios adminfessional

### Progreso y Estadísticas
- `admingreso:ver` - Ver admingreso básico
- `admingreso:avanzado` - Ver admingreso avanzado
- `estadisticas:detalladas` - Ver estadísticas detalladas

### Configuración
- `configuracion:perfil` - Editar perfil básico
- `configuracion:avanzada` - Configuración avanzada

### Exportación
- `exportar:datos` - Exportar datos (solo Pro)

### Soporte
- `soporte:prioritario` - Soporte prioritario (solo Pro)

### Email
- `email:verificado` - Email verificado

## 🎛️ Roles de Usuario

### Rol Gratuito
- ✅ Rutinas básicas (limitadas)
- ✅ Ejercicios básicos
- ✅ Progreso básico
- ✅ Configuración de perfil

### Rol Premium
- ✅ Todo del rol gratuito
- ✅ Rutinas ilimitadas
- ✅ Ejercicios adminfessional
- ✅ Progreso avanzado
- ✅ Estadísticas detalladas
- ✅ Configuración avanzada

### Rol Pro
- ✅ Todo del rol adminfessional
- ✅ Exportación de datos
- ✅ Soporte prioritario

## 🔒 Permisos Personalizados

Puedes crear permisos personalizados con condiciones específicas:

```typescript
const customPermissions = {
  'mi-permiso:especial': {
    action: 'especial',
    resource: 'mi-permiso',
    conditions: {
      rol: ['adminfessional', 'admin'],
      emailVerified: true,
      custom: (user) => {
        // Lógica personalizada
        return user.displayName?.includes('VIP') || false;
      }
    }
  }
};

const { can } = useAllowed();
const tienePermisoEspecial = can('mi-permiso:especial', customPermissions);
```

## 🚨 Consideraciones de Seguridad

1. **Siempre verificar en el backend**: Los permisos del frontend son solo para UX
2. **No confiar solo en el frontend**: Implementar verificaciones en el servidor
3. **Actualizar permisos dinámicamente**: Los permisos se actualizan automáticamente
4. **Manejar estados de carga**: El hook maneja automáticamente el estado de carga

## 🔄 Integración con Backend

Para obtener el rol real del usuario desde el backend:

```typescript
// En el futuro, esto vendría del backend
const userRol = await fetchUserRol(authUser.uid);
```

## 📝 Ejemplos de Uso Completo

### Componente con Múltiples Permisos

```typescript
import { useAllowed } from '../lib/hooks/useAllowed';

function DashboardComponent() {
  const { 
    can, 
    canAll, 
    hasRole, 
    getCurrentRole,
    loading 
  } = useAllowed();

  if (loading) {
    return <div>Cargando permisos...</div>;
  }

  const rolActual = getCurrentRole();
  const puedeGestionarTodo = canAll([
    'rutinas:crear',
    'rutinas:editar',
    'rutinas:eliminar'
  ]);

  return (
    <div>
      <h1>Dashboard - Rol: {rolActual}</h1>
      
      {/* Sección de Rutinas */}
      <section>
        <h2>Rutinas</h2>
        {can('rutinas:crear') && <button>Crear Nueva</button>}
        {can('rutinas:ilimitadas') && <span>✓ Ilimitadas</span>}
      </section>

      {/* Sección Premium */}
      {hasRole('adminfessional') && (
        <section>
          <h2>Funcionalidades Premium</h2>
          {can('ejercicios:adminfessional') && <div>Ejercicios Premium</div>}
          {can('estadisticas:detalladas') && <div>Estadísticas Avanzadas</div>}
        </section>
      )}

      {/* Sección Pro */}
      {hasRole('admin') && (
        <section>
          <h2>Funcionalidades Pro</h2>
          {can('exportar:datos') && <button>Exportar Datos</button>}
          {can('soporte:prioritario') && <div>Soporte Prioritario</div>}
        </section>
      )}
    </div>
  );
}
```

## 🎯 Mejores Prácticas

1. **Usar hooks especializados** para áreas específicas
2. **Verificar permisos antes de renderizar** componentes sensibles
3. **Proporcionar feedback visual** cuando no se tienen permisos
4. **Manejar estados de carga** aadminpiadamente
5. **Documentar permisos personalizados** claramente
6. **Testear diferentes roles** de usuario

## 🔧 Configuración Avanzada

### Agregar Nuevos Permisos

```typescript
// En useAllowed.ts, agregar al DEFAULT_PERMISSIONS
'notificaciones:push': {
  action: 'push',
  resource: 'notificaciones',
  conditions: {
    rol: ['adminfessional', 'admin'],
    emailVerified: true
  }
}
```

### Crear Nuevos Hooks Especializados

```typescript
export const useNotificationPermissions = () => {
  const { can, hasAnyRole } = useAllowed();

  return {
    canSendPush: () => can('notificaciones:push'),
    hasProfessionalAccess: () => hasAnyRole(['adminfessional', 'admin'])
  };
};
``` 