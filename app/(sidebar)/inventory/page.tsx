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

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<"guardians" | "jaihom">("guardians");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const { open } = useSidebar();

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
            status: true
          }
        }
      });

      setItems(prev => [newItem, ...prev]);
      setEditingItem(newItem._id);
      setEditingField("code");
      setEditValue(newItem.code);
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
      default:
        value = "";
    }
    setEditValue(value);
  };

  const handleSave = async () => {
    if (!editingItem || !editingField) return;

    try {
      let updateData: any = {};

      if (editingField === "code" || editingField === "description") {
        updateData[editingField] = editValue.trim();
      } else if (editingField === "type" || editingField === "store") {
        updateData[editingField] = editValue;
      } else if (editingField === "unitCost" || editingField === "salesPrice") {
        const numValue = parseFloat(editValue);
        if (isNaN(numValue) || numValue < 0) {
          toast.error("El valor debe ser un número válido mayor o igual a 0");
          return;
        }
        updateData[editingField] = numValue;
      }

      const updatedItem = await fetchApiV1({
        query: queries.updateInventoryItem,
        type: "json",
        variables: {
          _id: editingItem,
          args: updateData
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
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleQuantityClick = (item: InventoryItem) => {
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

  const renderEditableCell = (item: InventoryItem, field: string, value: any, isNumber = false, isSelect = false, selectOptions?: { value: string; label: string }[]) => {
    const isEditing = editingItem === item._id && editingField === field;

    if (isEditing) {
      if (isSelect && selectOptions) {
        return (
          <Select
            value={editValue}
            onValueChange={(newValue) => {
              setEditValue(newValue);
              // Auto-save for selects
              setTimeout(() => handleSave(), 100);
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
          onBlur={handleSave}
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
          typeof value === 'number' ? value.toFixed(2) : value
        ) : (
          value
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventario
            </CardTitle>
            <CardDescription>Gestionar productos y servicios</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <InputSearch
                  placeholder="Buscar por código o descripción"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <ToggleGroup
                type="single"
                value={selectedStore}
                onValueChange={(value) => setSelectedStore(value as "guardians" | "jaihom")}
                className="border rounded-md"
              >
                <ToggleGroupItem value="guardians" className="px-3 py-2">
                  Guardians
                </ToggleGroupItem>
                <ToggleGroupItem value="jaihom" className="px-3 py-2">
                  Jaihom
                </ToggleGroupItem>
              </ToggleGroup>
              <Button onClick={handleAddNewItem}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
              <Button
                variant="outline"
                onClick={() => setExcelImportOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div id="scrolls-container" className={`${open ? 'md:w-[calc(100vw-370px)] h-[calc(100vh-245px)]' : 'md:w-[calc(100vw-195px)] h-[calc(100vh-245px)]'} overflow-auto`}>
            <div className="overflow-x-auto">
              <Table className="md:min-w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="md:sticky md:left-0 bg-card z-10 min-w-[120px]">Código</TableHead>
                    <TableHead className="min-w-[200px]">Descripción</TableHead>
                    <TableHead className="min-w-[120px]">Tipo</TableHead>
                    <TableHead className="min-w-[100px]">Cantidad</TableHead>
                    <TableHead className="min-w-[120px]">Costo Unitario</TableHead>
                    <TableHead className="min-w-[120px]">Precio Venta</TableHead>
                    <TableHead className="min-w-[120px]">% Ganancia</TableHead>
                    <TableHead className="min-w-[150px]">Creado el</TableHead>
                    <TableHead className="min-w-[150px]">Actualizado el</TableHead>
                    <TableHead className="min-w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/50">
                      <TableCell className="md:sticky md:left-0 md:z-10 md:bg-card min-w-[120px]">
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
                          className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center font-medium"
                          onClick={() => handleQuantityClick(item)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
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
