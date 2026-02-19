// Hook principal de permisos
export { useAllowed } from './useAllowed';

// Hooks especializados
export {
  useConfigPermissions,
  useUserPermissions,
  useBusinessPermissions,
  useEmailPermissions,
  useBusinessRole,
  getBusinessIdFromPathname,
  SYSTEM_PATH_SEGMENTS,
} from './useAllowed';