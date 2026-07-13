import type { StorefrontThemeId } from "../types";
import { defaultStorefrontTheme } from "./default";
import type { StorefrontThemeDefinition } from "./types";

export const STOREFRONT_THEMES: StorefrontThemeDefinition[] = [defaultStorefrontTheme];

export const DEFAULT_STOREFRONT_THEME_ID: StorefrontThemeId = "default";

const themeById = new Map(STOREFRONT_THEMES.map((theme) => [theme.id, theme]));

export function getStorefrontTheme(themeId?: string | null): StorefrontThemeDefinition {
  if (themeId && themeById.has(themeId)) {
    return themeById.get(themeId)!;
  }
  return defaultStorefrontTheme;
}

export function listStorefrontThemes(): StorefrontThemeDefinition[] {
  return STOREFRONT_THEMES;
}
