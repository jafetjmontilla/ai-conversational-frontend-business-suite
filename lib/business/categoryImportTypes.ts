export type ParsedProductCategoryDraft = {
  name: string;
  description?: string | null;
  type: "producto" | "servicio" | "ambos";
  selected?: boolean;
};

export type ProductCategoriesImportDraft = {
  categories: ParsedProductCategoryDraft[];
  warnings: string[];
};

export const PRODUCT_CATEGORIES_IMPORT_PLACEHOLDER = `Ejemplo:

Tienda de ropa: Camisetas, Pantalones, Accesorios, Calzado
Restaurante: Entradas, Platos fuertes, Postres, Bebidas
Consultoría: Estrategia, Implementación, Soporte técnico
`;
