"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, InventoryItem } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, Package, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import QuantityUpdateDialog from "@/components/inventory/QuantityUpdateDialog";

const roundToTwo = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const businessIdDoc = business?._id;

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        let b = await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        }) as Business | null;
        if (!b && businessId) {
          b = await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          }) as Business | null;
        }
        if (cancelled) return;
        setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  useEffect(() => {
    if (!businessIdDoc) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchApiV1({
      query: queries.getInventoryItems,
      type: "json",
      variables: {
        id: businessIdDoc,
        description: query.trim() || undefined,
        limit: 500,
      },
    })
      .then((res: InventoryItem[] | { results?: InventoryItem[] }) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res && "results" in res ? res.results ?? [] : []);
        setItems(list);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar inventario");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessIdDoc, query]);

  const handleAddNew = async () => {
    if (!businessIdDoc) return;
    const exchangeRate = business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
      ? business.billingCustomExchangeRate
      : 1;
    try {
      const newItem = await fetchApiV1({
        query: queries.createInventoryItem,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: {
            code: `ITEM-${Date.now()}`,
            description: "Nuevo producto",
            type: "mercancia",
            quantity: 0,
            unitCost: 0,
            salesPrice: 0,
            status: true,
            exchangeRate,
          },
        },
      }) as InventoryItem;
      setItems((prev) => [newItem, ...prev]);
      setEditingItem(newItem._id);
      setEditingField("code");
      setEditValue(newItem.code);
      setOriginalValue(newItem.code);
      toast.success("Producto agregado");
    } catch (e: any) {
      toast.error(e?.message || "Error al crear producto");
    }
  };

  const handleEdit = (item: InventoryItem, field: string) => {
    setEditingItem(item._id);
    setEditingField(field);
    const val =
      field === "code" ? item.code
        : field === "description" ? item.description
          : field === "type" ? item.type
            : field === "unitCost" ? String(item.unitCost)
              : field === "salesPrice" ? String(item.salesPrice)
                : field === "unitCostUsd" ? String(item.unitCostUsd ?? 0)
                  : field === "salesPriceUsd" ? String(item.salesPriceUsd ?? 0)
                    : "";
    setEditValue(val);
    setOriginalValue(val);
  };

  const handleSave = async () => {
    if (!editingItem || !editingField || !businessIdDoc) return;
    const exchangeRate = business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
      ? business.billingCustomExchangeRate
      : 1;
    const updateData: any = {};
    if (["code", "description"].includes(editingField)) updateData[editingField] = editValue.trim();
    else if (editingField === "type") updateData.type = editValue;
    else if (["unitCost", "salesPrice", "unitCostUsd", "salesPriceUsd"].includes(editingField)) {
      const n = parseFloat(editValue);
      if (Number.isNaN(n) || n < 0) {
        toast.error("Valor debe ser un número ≥ 0");
        return;
      }
      updateData[editingField] = roundToTwo(n);
    }
    try {
      const updated = await fetchApiV1({
        query: queries.updateInventoryItem,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: editingItem,
          args: { ...updateData, exchangeRate },
        },
      }) as InventoryItem;
      setItems((prev) => prev.map((i) => (i._id === editingItem ? updated : i)));
      setEditingItem(null);
      setEditingField(null);
      setEditValue("");
      setOriginalValue("");
      toast.success("Producto actualizado");
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar");
    }
  };

  const handleBlur = () => {
    if (editValue.trim() !== originalValue.trim()) handleSave();
    else {
      setEditingItem(null);
      setEditingField(null);
      setEditValue("");
      setOriginalValue("");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`¿Eliminar ${item.code}?`)) return;
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.deleteInventoryItem,
        type: "json",
        variables: { id: businessIdDoc, _id: item._id },
      });
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success("Producto eliminado");
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.code.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  const renderCell = (
    item: InventoryItem,
    field: string,
    value: string | number,
    isNumber = false,
    isUsd = false
  ) => {
    const isEditing = editingItem === item._id && editingField === field;
    if (isEditing && field !== "type") {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setEditingItem(null);
              setEditingField(null);
              setEditValue("");
              setOriginalValue("");
            }
          }}
          type={isNumber ? "number" : "text"}
          step={isNumber ? "0.01" : undefined}
          min={isNumber ? "0" : undefined}
          className="h-8 text-sm"
          autoFocus
        />
      );
    }
    if (field === "type") {
      const isEditingType = editingItem === item._id && editingField === "type";
      if (isEditingType) {
        return (
          <Select
            value={editValue}
            onValueChange={(v) => {
              setEditValue(v);
              if (!businessIdDoc) return;
              fetchApiV1({
                query: queries.updateInventoryItem,
                type: "json",
                variables: {
                  id: businessIdDoc,
                  _id: item._id,
                  args: {
                    type: v,
                    exchangeRate:
                      business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
                        ? business.billingCustomExchangeRate
                        : 1,
                  },
                },
              })
                .then((updated: InventoryItem) => {
                  setItems((prev) => prev.map((i) => (i._id === item._id ? updated : i)));
                  setEditingItem(null);
                  setEditingField(null);
                  setEditValue("");
                  toast.success("Tipo actualizado");
                })
                .catch((e: any) => toast.error(e?.message || "Error"));
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mercancia">Mercancía</SelectItem>
              <SelectItem value="servicio">Servicio</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      return (
        <div
          className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
          onClick={() => handleEdit(item, "type")}
        >
          {item.type === "mercancia" ? "Mercancía" : "Servicio"}
        </div>
      );
    }
    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
        onClick={() => handleEdit(item, field)}
      >
        {isNumber && typeof value === "number"
          ? isUsd
            ? `$${value.toFixed(2)}`
            : value.toFixed(2)
          : String(value)}
      </div>
    );
  };

  if (!businessId) return null;
  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para gestionar el inventario de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <Card className="flex flex-col w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventario
          </CardTitle>
          <CardDescription>Productos y servicios del negocio</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-2 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row gap-2 p-2">
            <div className="flex-1">
              <InputSearch
                placeholder="Buscar por código o descripción"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleAddNew} size="sm" disabled={!businessIdDoc || loading}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Código</TableHead>
                  <TableHead className="min-w-[180px]">Descripción</TableHead>
                  <TableHead className="min-w-[100px]">Tipo</TableHead>
                  <TableHead className="min-w-[80px]">Cantidad</TableHead>
                  <TableHead className="min-w-[100px]">Costo unit.</TableHead>
                  <TableHead className="min-w-[100px]">Precio venta</TableHead>
                  <TableHead className="min-w-[90px]">Costo USD</TableHead>
                  <TableHead className="min-w-[90px]">Precio USD</TableHead>
                  <TableHead className="min-w-[80px]">% Gan.</TableHead>
                  <TableHead className="min-w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {query ? "Sin resultados con el filtro." : "No hay productos. Agrega uno."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{renderCell(item, "code", item.code)}</TableCell>
                      <TableCell>{renderCell(item, "description", item.description)}</TableCell>
                      <TableCell>{renderCell(item, "type", item.type)}</TableCell>
                      <TableCell>
                        <div
                          className={`p-1 rounded min-h-[32px] flex items-center font-medium ${
                            item.type === "servicio" ? "text-muted-foreground cursor-default" : "cursor-pointer hover:bg-muted/50"
                          }`}
                          onClick={() => item.type === "mercancia" && (setSelectedItem(item), setQuantityDialogOpen(true))}
                          title={item.type === "servicio" ? "Servicios no tienen cantidad" : "Editar cantidad"}
                        >
                          {item.quantity}
                        </div>
                      </TableCell>
                      <TableCell>{renderCell(item, "unitCost", item.unitCost, true)}</TableCell>
                      <TableCell>{renderCell(item, "salesPrice", item.salesPrice, true)}</TableCell>
                      <TableCell>{renderCell(item, "unitCostUsd", item.unitCostUsd ?? 0, true, true)}</TableCell>
                      <TableCell>{renderCell(item, "salesPriceUsd", item.salesPriceUsd ?? 0, true, true)}</TableCell>
                      <TableCell>
                        <span className={item.profitPercentage >= 0 ? "text-green-600" : "text-red-600"}>
                          {item.profitPercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="p-4 mt-2 bg-muted/50 rounded-lg text-sm">
              Mostrando {filtered.length} productos · Mercancías: {filtered.filter((i) => i.type === "mercancia").length} ·
              Servicios: {filtered.filter((i) => i.type === "servicio").length}
            </div>
          )}
        </CardContent>
      </Card>
      {businessIdDoc && (
        <QuantityUpdateDialog
          isOpen={quantityDialogOpen}
          onClose={() => (setQuantityDialogOpen(false), setSelectedItem(null))}
          item={selectedItem}
          businessId={businessIdDoc}
          onSuccess={() => {
            if (!businessIdDoc) return;
            fetchApiV1({
              query: queries.getInventoryItems,
              type: "json",
              variables: { id: businessIdDoc, description: query.trim() || undefined, limit: 500 },
            }).then((res: InventoryItem[] | { results?: InventoryItem[] }) => {
              const list = Array.isArray(res) ? res : (res && "results" in res ? res.results ?? [] : []);
              setItems(list);
            });
          }}
        />
      )}
    </div>
  );
}
