"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { InventoryItem } from "@/lib/interfases";
import { Plus, Edit3, Trash2, Package, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ExcelImportDialog from "@/components/ExcelImportDialog";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import QuantityUpdateDialog from "@/components/QuantityUpdateDialog";
import { useTasaBCV } from "@/hooks/useTasaBCV";
import { useAllowed } from "@/lib/hooks/useAllowed";

// Función utilitaria para redondear a 2 decimales
const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<"guardians" | "jaihom">("guardians");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [originalValue, setOriginalValue] = useState<string>("");
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const { open } = useSidebar();
  const { tasaBCV } = useTasaBCV();
  const { hasRole, getCurrentRole } = useAllowed();

  // Aplicar filtro automático de tienda según el rol del usuario
  useEffect(() => {
    if (hasRole('customerServiceG')) {
      setSelectedStore('guardians');
    } else if (hasRole('customerServiceJ')) {
      setSelectedStore('jaihom');
    }
  }, [hasRole]);

  const fetchItems = async () => {
    try {
      const res: InventoryItem[] = await fetchApiV1({
        query: queries.getInventoryItems,
        type: "json"
      });
      setItems(res || []);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      toast.error("Error al cargar el inventario");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddNewItem = async () => {
    try {
      const newItem = await fetchApiV1({
        query: queries.createInventoryItem,
        type: "json",
        variables: {
          args: {
            code: `ITEM-${Date.now()}`,
            description: "Nuevo producto",
            type: "mercancia",
            store: selectedStore,
            quantity: 0,
            unitCost: 0,
            salesPrice: 0,
            status: true,
            tasaBCV: tasaBCV?.tasa || 0
          }
        }
      });

      setItems(prev => [newItem, ...prev]);
      setEditingItem(newItem._id);
      setEditingField("code");
      setEditValue(newItem.code);
      setOriginalValue(newItem.code);
      toast.success("Nuevo producto agregado");
    } catch (error) {
      console.error("Error al crear producto:", error);
      toast.error("Error al crear el producto");
    }
  };

  const handleEdit = (item: InventoryItem, field: string) => {
    setEditingItem(item._id);
    setEditingField(field);

    let value = "";
    switch (field) {
      case "code":
        value = item.code;
        break;
      case "description":
        value = item.description;
        break;
      case "type":
        value = item.type;
        break;
      case "store":
        value = item.store;
        break;
      case "unitCost":
        value = item.unitCost.toString();
        break;
      case "salesPrice":
        value = item.salesPrice.toString();
        break;
      case "unitCostUsd":
        value = (item.unitCostUsd || 0).toString();
        break;
      case "salesPriceUsd":
        value = (item.salesPriceUsd || 0).toString();
        break;
      default:
        value = "";
    }
    setEditValue(value);
    setOriginalValue(value); // Guardar el valor original
  };

  const handleSave = async () => {
    if (!editingItem || !editingField) return;

    try {
      let updateData: any = {};

      if (editingField === "code" || editingField === "description") {
        updateData[editingField] = editValue.trim();
      } else if (editingField === "type" || editingField === "store") {
        updateData[editingField] = editValue;
      } else if (editingField === "unitCost" || editingField === "salesPrice" || editingField === "unitCostUsd" || editingField === "salesPriceUsd") {
        const numValue = parseFloat(editValue);
        if (isNaN(numValue) || numValue < 0) {
          toast.error("El valor debe ser un número válido mayor o igual a 0");
          return;
        }
        updateData[editingField] = roundToTwoDecimals(numValue);
      }

      const updatedItem = await fetchApiV1({
        query: queries.updateInventoryItem,
        type: "json",
        variables: {
          _id: editingItem,
          args: {
            ...updateData,
            tasaBCV: tasaBCV?.tasa || 0
          }
        }
      });

      setItems(prev => prev.map(item =>
        item._id === editingItem ? updatedItem : item
      ));

      setEditingItem(null);
      setEditingField(null);
      setEditValue("");
      setOriginalValue("");
      toast.success("Producto actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      toast.error("Error al actualizar el producto");
    }
  };

  const handleBlur = () => {
    // Solo guardar si el valor realmente cambió
    if (editValue.trim() !== originalValue.trim()) {
      handleSave();
    } else {
      // Si no cambió, solo cancelar la edición
      handleCancel();
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditingField(null);
    setEditValue("");
    setOriginalValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleQuantityClick = (item: InventoryItem) => {
    // No permitir editar cantidad para servicios
    if (item.type === "servicio") {
      return;
    }
    setSelectedItem(item);
    setQuantityDialogOpen(true);
  };

  const handleQuantityDialogClose = () => {
    setQuantityDialogOpen(false);
    setSelectedItem(null);
  };

  const handleQuantityUpdate = () => {
    fetchItems(); // Recargar la lista
  };

  const handleExcelImportSuccess = () => {
    fetchItems(); // Recargar la lista después de importar
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto ${item.code}?`)) {
      return;
    }

    try {
      await fetchApiV1({
        query: queries.deleteInventoryItem,
        type: "json",
        variables: {
          _id: item._id
        }
      });

      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = q
        ? item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
        : true;
      const matchesStore = item.store === selectedStore;
      return matchesQuery && matchesStore;
    });
  }, [items, query, selectedStore]);

  const renderEditableCell = (item: InventoryItem, field: string, value: any, isNumber = false, isSelect = false, selectOptions?: { value: string; label: string }[], isUSD = false) => {
    const isEditing = editingItem === item._id && editingField === field;

    if (isEditing) {
      if (isSelect && selectOptions) {
        return (
          <Select
            value={editValue}
            onValueChange={async (newValue) => {
              setEditValue(newValue);
              // Auto-save for selects with the new value
              const updateData: any = {};
              updateData[editingField] = newValue;

              try {
                const updatedItem = await fetchApiV1({
                  query: queries.updateInventoryItem,
                  type: "json",
                  variables: {
                    _id: editingItem,
                    args: {
                      ...updateData,
                      tasaBCV: tasaBCV?.tasa || 0
                    }
                  }
                });

                setItems(prev => prev.map(item =>
                  item._id === editingItem ? updatedItem : item
                ));

                setEditingItem(null);
                setEditingField(null);
                setEditValue("");
                toast.success("Producto actualizado correctamente");
              } catch (error) {
                console.error("Error al actualizar producto:", error);
                toast.error("Error al actualizar el producto");
              }
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          type={isNumber ? "number" : "text"}
          step={isNumber ? "0.01" : undefined}
          min={isNumber ? "0" : undefined}
          className="h-8 text-sm"
          autoFocus
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
        onClick={() => handleEdit(item, field)}
      >
        {isNumber ? (
          typeof value === 'number' ? (
            isUSD ? `$${value.toFixed(2)}` : value.toFixed(2)
          ) : value
        ) : (
          value
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full h-full">
      <Card className='flex flex-col w-full h-full overflow-hidden'>
        <CardHeader className='h-[72px]'>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventario
            </CardTitle>
            <CardDescription>Gestionar productos y servicios</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-2 w-full flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-1 md:gap-2 p-2 pt-0">
            {/* Barra de búsqueda */}
            <div className="flex items-center w-full justify-between gap-1 md:gap-4 text-[10px] md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 flex-1">
                <div className="flex-1">
                  <InputSearch
                    placeholder="Buscar por código o descripción"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <Button onClick={handleAddNewItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExcelImportOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </Button>
              </div>
            </div>
            {/* Filtros de tienda */}
            {!hasRole('customerServiceG') && !hasRole('customerServiceJ') && (
              <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm">
                <span className="font-medium">Tienda:</span>
                <ToggleGroup
                  type="single"
                  value={selectedStore}
                  onValueChange={(value) => setSelectedStore(value as "guardians" | "jaihom")}
                  className="border rounded-md"
                >
                  <ToggleGroupItem value="guardians" className="px-3 py-1 text-[10px] md:text-sm">
                    Guardians
                  </ToggleGroupItem>
                  <ToggleGroupItem value="jaihom" className="px-3 py-1 text-[10px] md:text-sm">
                    Jaihom
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </div>
          <div id="scrolls-table-container" className={`${open ? 'md:w-[calc(100vw-338px)]' : 'md:w-[calc(100vw-164px)]'} relative`}>
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="md:sticky md:left-0 md:bg-background md:z-30 min-w-[120px] md:border-r">Código</TableHead>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead className="min-w-[120px]">Tipo</TableHead>
                  <TableHead className="min-w-[100px]">Cantidad</TableHead>
                  <TableHead className="min-w-[120px]">Costo Unitario</TableHead>
                  <TableHead className="min-w-[120px]">Precio Venta</TableHead>
                  <TableHead className="min-w-[120px]">Costo USD</TableHead>
                  <TableHead className="min-w-[120px]">Precio USD</TableHead>
                  <TableHead className="min-w-[120px]">% Ganancia</TableHead>
                  <TableHead className="min-w-[150px]">Creado el</TableHead>
                  <TableHead className="min-w-[150px]">Actualizado el</TableHead>
                  <TableHead className="min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-16 w-16 text-gray-300" />
                        <p className="text-lg text-gray-500">No hay productos</p>
                        <p className="text-sm text-gray-400">
                          {query
                            ? "No se encontraron productos con los filtros aplicados"
                            : "No hay productos registrados en el sistema"
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item._id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="md:sticky md:left-0 md:bg-background md:z-10 min-w-[120px] md:border-r">
                        {renderEditableCell(item, "code", item.code)}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        {renderEditableCell(item, "description", item.description)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {renderEditableCell(item, "type", item.type === "mercancia" ? "Mercancía" : "Servicio", false, true, [
                          { value: "mercancia", label: "Mercancía" },
                          { value: "servicio", label: "Servicio" }
                        ])}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <div
                          className={`p-1 rounded min-h-[32px] flex items-center font-medium ${item.type === "servicio"
                            ? "text-muted-foreground cursor-default"
                            : "cursor-pointer hover:bg-muted/50"
                            }`}
                          onClick={() => handleQuantityClick(item)}
                          title={item.type === "servicio" ? "Los servicios no tienen cantidad" : "Hacer clic para editar cantidad"}
                        >
                          {item.quantity}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {renderEditableCell(item, "unitCost", item.unitCost, true)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {renderEditableCell(item, "salesPrice", item.salesPrice, true)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {renderEditableCell(item, "unitCostUsd", item.unitCostUsd, true, false, undefined, true)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {renderEditableCell(item, "salesPriceUsd", item.salesPriceUsd, true, false, undefined, true)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <span className={`font-medium ${item.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.profitPercentage.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Resumen */}
          {filtered && filtered.length > 0 && (
            <div className="p-4 mt-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Mostrando {filtered.length} productos
                  {query && " (filtrados)"}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Total Mercancías: <strong>{filtered.filter(item => item.type === 'mercancia').length}</strong>
                  </span>
                  <span>
                    Total Servicios: <strong>{filtered.filter(item => item.type === 'servicio').length}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <QuantityUpdateDialog
        isOpen={quantityDialogOpen}
        onClose={handleQuantityDialogClose}
        item={selectedItem}
        onSuccess={handleQuantityUpdate}
      />

      <ExcelImportDialog
        isOpen={excelImportOpen}
        onClose={() => setExcelImportOpen(false)}
        onSuccess={handleExcelImportSuccess}
      />
    </div>
  );
}
