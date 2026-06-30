/** Textos de ayuda para configuración de inventario (productos y servicios). */

export const INVENTORY_HELP = {
  productSectionTitle: "Inventario al vender",
  productSectionDescription:
    "Define qué ocurre con el stock cuando este producto aparece en una factura pagada.",

  trackInventoryLabel: "Controlar stock del producto",
  trackInventoryHelp:
    "Actívalo para productos que vendes tal cual (envasados, retail). Al cobrar la factura se descuenta una unidad del SKU de este producto. Ejemplo: lata de refresco, cera envasada.",

  hasBillOfMaterialsLabel: "Receta / lista de materiales (BOM)",
  hasBillOfMaterialsHelp:
    "Actívalo cuando el producto se prepara al momento y consume insumos del almacén. Al vender, no se descuenta stock del producto terminado, sino de cada insumo de la receta. Ejemplo: hamburguesa, plato preparado.",

  bomExclusiveNote:
    "No puedes activar ambos modos a la vez: o controlas stock del producto empaquetado, o consumes insumos al prepararlo.",

  rawMaterialNote:
    "Este artículo es insumo o materia prima. Su stock se gestiona por variante (SKU) y se usa en recetas de otros productos o servicios; no aplica configuración de venta directa.",

  requiredMaterialsTitle: "Insumos por unidad vendida",
  requiredMaterialsHelp:
    "Indica cuánto de cada materia prima se consume por cada unidad que vendes. Las cantidades se multiplican por la cantidad facturada.",

  requiredMaterialsEmpty:
    "Agrega al menos un insumo para guardar la receta. Busca variantes de productos marcados como insumo o materia prima.",

  serviceBomTitle: "Insumos del servicio",
  serviceBomDescription:
    "Opcional. Si agregas insumos, al cobrar una factura con este servicio se descontará stock de materias primas automáticamente.",
  servicePureHelp:
    "Servicio puro: sin insumos. No se mueve inventario al vender (ej. corte de cabello básico, consultoría, delivery).",
  serviceWithMaterialsHelp:
    "Servicio con insumos: al vender se descuentan los materiales definidos abajo (ej. tinte, revelador, guantes).",
  serviceNoTrackInventory:
    "Los servicios no tienen stock propio. La disponibilidad se controla con el interruptor «Disponible para venta» y, si hay receta, con el stock de los insumos.",

  availabilityLabel: "Disponible para venta",
  availabilityHelp:
    "Desactiva manualmente el servicio si no puedes atenderlo, aunque queden insumos en almacén.",

  unitOfMeasureHelp:
    "Unidad en la que se vende o factura el servicio (hora, copia, sesión, etc.). No afecta el descuento de insumos.",

  scenarioExamples: {
    directProduct: "Producto directo → controlar stock del producto.",
    preparedProduct: "Preparación inmediata → receta con insumos.",
    serviceWithBom: "Servicio con insumos → receta (sin stock del servicio).",
    pureService: "Servicio puro → sin movimiento de inventario.",
  },
} as const;
