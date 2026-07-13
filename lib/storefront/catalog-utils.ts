import type { StorefrontCatalogItem } from "./types";

export const SIZE_LABELS: Record<string, string> = {
  PER: "Personal",
  MED: "Mediana",
  FAM: "Familiar",
  EXT: "Extra",
  SML: "Pequeña",
  LRG: "Grande",
};

export type ProductGroup = {
  key: string;
  name: string;
  category: string;
  description?: string | null;
  variants: StorefrontCatalogItem[];
  minPrice: number;
  maxPrice: number;
};

export function variantLabel(item: StorefrontCatalogItem, siblings: number) {
  if (siblings <= 1) return null;
  const code = item.sku.split("-").pop()?.toUpperCase() ?? "";
  return SIZE_LABELS[code] ?? code;
}

export function deriveCategory(item: StorefrontCatalogItem) {
  const word = item.name.trim().split(/\s+/)[0];
  if (word && word.length > 2) return word;
  if (item.type === "SERVICE") return "Servicios";
  return "Productos";
}

export function productImageUrl(name: string) {
  const seed = encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-").slice(0, 48));
  return `https://picsum.photos/seed/${seed}/800/800`;
}

export function groupCatalogItems(items: StorefrontCatalogItem[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>();
  for (const item of items) {
    const existing = map.get(item.name);
    if (existing) {
      existing.variants.push(item);
      if (!existing.description && item.description) existing.description = item.description;
      existing.minPrice = Math.min(existing.minPrice, item.price);
      existing.maxPrice = Math.max(existing.maxPrice, item.price);
    } else {
      map.set(item.name, {
        key: item.name,
        name: item.name,
        category: deriveCategory(item),
        description: item.description,
        variants: [item],
        minPrice: item.price,
        maxPrice: item.price,
      });
    }
  }
  return Array.from(map.values()).map((group) => ({
    ...group,
    variants: [...group.variants].sort((a, b) => a.price - b.price),
  }));
}
