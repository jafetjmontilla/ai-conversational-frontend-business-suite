import type { Product, Service } from "@/lib/interfases";

export type InventoryModeKey =
  | "raw_material"
  | "direct_stock"
  | "recipe"
  | "digital"
  | "service_pure"
  | "service_bom";

export type InventoryModeBadge = {
  key: InventoryModeKey;
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  title: string;
};

export function getProductInventoryMode(product: Product): InventoryModeBadge {
  if (product.is_sellable === false) {
    return {
      key: "raw_material",
      label: "Insumo",
      variant: "secondary",
      title: "Materia prima: stock por SKU, usada en recetas de otros artículos.",
    };
  }
  if (product.hasBillOfMaterials) {
    return {
      key: "recipe",
      label: "Receta",
      variant: "default",
      title: "Al vender se descuentan los insumos de la receta, no stock del producto terminado.",
    };
  }
  if (product.trackInventory === false) {
    return {
      key: "digital",
      label: "Sin stock",
      variant: "outline",
      title: "No controla inventario al vender (digital, ilimitado o configuración manual).",
    };
  }
  return {
    key: "direct_stock",
    label: "Stock directo",
    variant: "default",
    title: "Al vender se descuenta una unidad del SKU de este producto.",
  };
}

export function getServiceInventoryMode(service: Service): InventoryModeBadge {
  const hasBom =
    service.hasBillOfMaterials === true ||
    (service.requiredMaterials?.length ?? 0) > 0 ||
    (service.materials?.length ?? 0) > 0;

  if (hasBom) {
    return {
      key: "service_bom",
      label: "Con insumos",
      variant: "default",
      title: "Al vender se descuentan materias primas de la receta del servicio.",
    };
  }
  return {
    key: "service_pure",
    label: "Servicio puro",
    variant: "outline",
    title: "Sin movimiento de inventario al facturar.",
  };
}
