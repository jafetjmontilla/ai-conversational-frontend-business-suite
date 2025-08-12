// Hook principal de permisos
export {
  useAllowed,
  type Plan,
  type Permission,
  type PermissionConfig
} from './useAllowed';

// Hooks especializados (se mantienen solo los generales)
export {
  useConfigPermissions,
  useExportPermissions,
  useSupportPermissions,
  useEmailPermissions
} from './useAllowed';