/**
 * URL de perfil global (usuarios de sistema) vs perfil bajo contexto de negocio.
 */
export function getProfileHref(scopeBusinessId: string | null | undefined): string {
  if (scopeBusinessId) return `/${scopeBusinessId}/profile`;
  return "/profile";
}

export function isProfilePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/profile" || /\/[^/]+\/profile\/?$/.test(pathname);
}
