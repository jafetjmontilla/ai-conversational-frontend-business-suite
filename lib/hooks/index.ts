// Hook principal de permisos
export {
  useAllowed,
  type Plan,
  type Permission,
  type PermissionConfig
} from './useAllowed';

// Hooks especializados
export {
  useRoutinePermissions,
  useExercisePermissions,
  useProgressPermissions,
  useConfigPermissions,
  useExportPermissions,
  useSupportPermissions,
  useEmailPermissions
} from './useAllowed'; 