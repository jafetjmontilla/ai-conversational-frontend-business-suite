/**
 * Lógica para la vista "Creación de Producto" con atributos y variantes.
 * - Definir atributos globales (ya vía getAttributes / createAttribute / createAttributeValue).
 * - Previsualizar tabla de variantes (producto cartesiano) antes de guardar.
 * - Bulk edit de precio/stock por variante.
 *
 * Producto simple: si el usuario no define atributos, usar createProduct (crea producto + una
 * variante por defecto con SKU único) o createProductWithVariants con variantsPreview: [].
 * El inventario queda siempre por SKU.
 */
import type {
  Attribute,
  AttributeValue,
  VariantPreviewItem,
  Product,
  GenerateVariantsPreviewPayload,
  AttributeValuesForPreview,
} from "./interfases";
import { fetchApiV1, queries } from "./Fetching";

/** Opción de valor para un atributo (id + value para el preview). */
export interface AttributeOption {
  attributeId: string;
  attributeName: string;
  values: { id: string; value: string }[];
}

/**
 * Genera el payload para generateVariantsPreview.
 * attributesWithValues: por cada atributo seleccionado, su id, nombre y lista de valores { id, value }.
 */
export function buildPreviewInput(
  productId: string,
  productName: string,
  basePrice: number,
  attributesWithValues: AttributeOption[]
) {
  return {
    product_id: productId,
    product_name: productName,
    base_price: basePrice,
    attributes: attributesWithValues.map((a) => ({
      attributeId: a.attributeId,
      attributeName: a.attributeName,
      values: a.values.map((v) => ({ id: v.id, value: v.value })),
    })),
  };
}

/**
 * Llama a generateVariantsPreview y devuelve las combinaciones.
 * businessId = id del negocio (business _id).
 */
export async function fetchVariantsPreview(
  businessId: string,
  input: ReturnType<typeof buildPreviewInput>
): Promise<VariantPreviewItem[]> {
  const result = (await fetchApiV1({
    query: queries.generateVariantsPreview,
    type: "json",
    variables: { id: businessId, input },
  })) as GenerateVariantsPreviewPayload | undefined;
  return result?.combinations ?? [];
}

/**
 * Convierte atributos con values (del API getAttributes) a AttributeOption[]
 * para usar en buildPreviewInput. attribute.values debe estar poblado.
 */
export function attributesToOptions(attributes: (Attribute & { values?: AttributeValue[] })[]): AttributeOption[] {
  return attributes
    .filter((a) => a.values?.length)
    .map((a) => ({
      attributeId: a._id,
      attributeName: a.name,
      values: (a.values || []).map((v) => ({ id: v._id, value: v.value })),
    }));
}

/**
 * Prepara variantsPreview para createProductWithVariants.
 * Incluye attribute_value_ids si cada fila de la tabla tiene los ids (en el preview
 * se pueden guardar en estado al generar las combinaciones).
 */
export interface VariantPreviewRow extends VariantPreviewItem {
  attribute_value_ids?: string[];
}

export function buildVariantsPreviewInput(rows: VariantPreviewRow[]) {
  return rows.map((r) => ({
    sku: r.sku,
    price_override: r.price_override ?? null,
    stock_quantity: r.stock_quantity ?? 0,
    attribute_value_ids: r.attribute_value_ids ?? (r.attributeValues?.map((av: any) => av.attributeValueId).filter(Boolean) as string[]) ?? [],
  }));
}

/**
 * Crea producto maestro + variantes en una sola llamada.
 */
export async function createProductWithVariants(
  businessId: string,
  product: { name: string; description?: string; category_id?: string | null; base_price?: number; brand?: string },
  variantsPreview: VariantPreviewRow[]
): Promise<Product> {
  const payload = buildVariantsPreviewInput(variantsPreview);
  const result = (await fetchApiV1({
    query: queries.createProductWithVariants,
    type: "json",
    variables: {
      id: businessId,
      product: {
        name: product.name,
        description: product.description ?? "",
        category_id: product.category_id ?? null,
        base_price: product.base_price ?? 0,
        brand: product.brand ?? "",
      },
      variantsPreview: payload,
    },
  })) as Product;
  return result;
}

/**
 * Actualización masiva de variantes (precio, stock, costo, unidad de medida).
 */
export async function bulkUpdateVariants(
  businessId: string,
  items: {
    variant_id: string;
    price_override?: number | null;
    stock_quantity?: number;
    cost_price?: number | null;
    unit_of_measure?: string;
  }[]
) {
  return fetchApiV1({
    query: queries.bulkUpdateVariants,
    type: "json",
    variables: { id: businessId, items },
  });
}

/**
 * Añade variantes a un producto ya existente (tras "Generar variantes").
 * Puede lanzar un error con extensions.code === 'RESTORE_AVAILABLE' y extensions.variantId
 * si uno de los SKU existe en una variante eliminada (el cliente puede llamar a restoreProductVariant).
 */
export async function addVariantsToProduct(
  businessId: string,
  productId: string,
  variants: VariantPreviewRow[]
): Promise<unknown> {
  const payload = buildVariantsPreviewInput(variants);
  return fetchApiV1({
    query: queries.addVariantsToProduct,
    type: "json",
    variables: { id: businessId, product_id: productId, variants: payload },
  });
}

/**
 * Soft delete de una variante (no se borra; queda oculta para ventas, visible en reportes).
 */
export async function softDeleteProductVariant(
  businessId: string,
  variantId: string
): Promise<unknown> {
  return fetchApiV1({
    query: queries.softDeleteProductVariant,
    type: "json",
    variables: { id: businessId, variant_id: variantId },
  });
}

/**
 * Restaura una variante eliminada con stock inicial y registra "Reactivación" en el log.
 */
export async function restoreProductVariant(
  businessId: string,
  variantId: string,
  initialStock: number
): Promise<unknown> {
  return fetchApiV1({
    query: queries.restoreProductVariant,
    type: "json",
    variables: { id: businessId, variant_id: variantId, initialStock },
  });
}
