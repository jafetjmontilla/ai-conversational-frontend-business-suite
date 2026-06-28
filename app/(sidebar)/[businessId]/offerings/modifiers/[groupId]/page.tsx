"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  ModifierCatalogItem,
  ModifierGroup,
  ModifierPriceBehavior,
  ModifierSelectionType,
} from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { RequiredMaterialsEditor } from "@/components/offerings/RequiredMaterialsEditor";
import type { RequiredMaterial } from "@/lib/interfases";

type OptionDraft = {
  catalogItemId: string;
  displayName: string;
  priceOverride: string;
  sortOrder: number;
  isDefault: boolean;
};

export default function ModifierGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const groupId = params?.groupId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = canEditCurrentBusiness();
  const { businessIdDoc } = useBusinessApps(businessId);

  const [group, setGroup] = useState<ModifierGroup | null>(null);
  const [modifierItems, setModifierItems] = useState<ModifierCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [selectionType, setSelectionType] = useState<ModifierSelectionType>("SINGLE");
  const [minSelections, setMinSelections] = useState("0");
  const [maxSelections, setMaxSelections] = useState("1");
  const [priceBehavior, setPriceBehavior] = useState<ModifierPriceBehavior>("ADDITIONAL");
  const [includedQuantity, setIncludedQuantity] = useState("0");
  const [options, setOptions] = useState<OptionDraft[]>([]);

  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [newItemBom, setNewItemBom] = useState(false);
  const [newItemMaterials, setNewItemMaterials] = useState<RequiredMaterial[]>([]);
  const [creatingItem, setCreatingItem] = useState(false);

  const [addOptionOpen, setAddOptionOpen] = useState(false);
  const [pickItemId, setPickItemId] = useState("");

  const load = async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const [g, items] = await Promise.all([
        fetchApiV1({
          query: queries.getModifierGroup,
          type: "json",
          variables: { id: businessIdDoc, _id: groupId },
        }),
        fetchApiV1({
          query: queries.getModifierCatalogItems,
          type: "json",
          variables: { id: businessIdDoc, includeInactive: false },
        }),
      ]);
      const grp = g as ModifierGroup;
      setGroup(grp);
      setModifierItems(Array.isArray(items) ? items : []);
      setName(grp.name);
      setIsRequired(grp.isRequired);
      setSelectionType(grp.selectionType);
      setMinSelections(String(grp.minSelections));
      setMaxSelections(String(grp.maxSelections));
      setPriceBehavior(grp.priceBehavior);
      setIncludedQuantity(String(grp.includedQuantity ?? 0));
      setOptions(
        (grp.options ?? []).map((o, idx) => ({
          catalogItemId: o.catalogItemId,
          displayName: o.displayName ?? "",
          priceOverride: o.priceOverride != null ? String(o.priceOverride) : "",
          sortOrder: o.sortOrder ?? idx,
          isDefault: o.isDefault ?? false,
        }))
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessIdDoc && groupId) load();
  }, [businessIdDoc, groupId]);

  const handleSave = async () => {
    if (!businessIdDoc) return;
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateModifierGroup,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: groupId,
          args: {
            name: name.trim(),
            isRequired,
            selectionType,
            minSelections: parseInt(minSelections, 10) || 0,
            maxSelections: parseInt(maxSelections, 10) || 1,
            priceBehavior,
            includedQuantity: parseInt(includedQuantity, 10) || 0,
            options: options.map((o, idx) => ({
              catalogItemId: o.catalogItemId,
              displayName: o.displayName.trim() || undefined,
              priceOverride: o.priceOverride ? parseFloat(o.priceOverride) : undefined,
              sortOrder: idx,
              isDefault: o.isDefault,
            })),
          },
        },
      });
      toast.success("Grupo actualizado");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim() || !businessIdDoc) return;
    setCreatingItem(true);
    try {
      const created = await fetchApiV1({
        query: queries.createModifierCatalogItem,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: {
            name: newItemName.trim(),
            price: parseFloat(newItemPrice) || 0,
            hasBillOfMaterials: newItemBom,
            requiredMaterials: newItemBom ? newItemMaterials : [],
          },
        },
      });
      const item = created as ModifierCatalogItem;
      setModifierItems((prev) => [...prev, item]);
      setOptions((prev) => [
        ...prev,
        {
          catalogItemId: item._id,
          displayName: "",
          priceOverride: "",
          sortOrder: prev.length,
          isDefault: false,
        },
      ]);
      setCreateItemOpen(false);
      setNewItemName("");
      setNewItemPrice("0");
      setNewItemBom(false);
      setNewItemMaterials([]);
      toast.success("Opción de modificador creada");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setCreatingItem(false);
    }
  };

  const itemLabel = (catalogItemId: string) => {
    const fromGroup = group?.options?.find((o) => o.catalogItemId === catalogItemId)?.catalogItem;
    const fromList = modifierItems.find((i) => i._id === catalogItemId);
    const item = fromGroup ?? fromList;
    return item ? `${item.name} (${item.sku})` : catalogItemId;
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground p-4">Cargando…</p>;
  }

  if (!group) {
    return <p className="text-sm text-destructive p-4">Grupo no encontrado</p>;
  }

  return (
    <div className="space-y-6 p-1 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${businessId}/offerings/modifiers`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">Configuración del grupo de modificadores</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas del grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nombre</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is-required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
              disabled={!canEdit}
            />
            <Label htmlFor="is-required">Obligatorio para el cliente</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de selección</Label>
              <Select
                value={selectionType}
                onValueChange={(v) => setSelectionType(v as ModifierSelectionType)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Una opción (radio)</SelectItem>
                  <SelectItem value="MULTIPLE">Varias opciones (checkbox)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comportamiento de precio</Label>
              <Select
                value={priceBehavior}
                onValueChange={(v) => setPriceBehavior(v as ModifierPriceBehavior)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADDITIONAL">Siempre suma al precio</SelectItem>
                  <SelectItem value="INCLUDED">Incluye N gratis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mínimo</Label>
              <Input
                type="number"
                min={0}
                value={minSelections}
                onChange={(e) => setMinSelections(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Máximo</Label>
              <Input
                type="number"
                min={1}
                value={maxSelections}
                onChange={(e) => setMaxSelections(e.target.value)}
                disabled={!canEdit || selectionType === "SINGLE"}
              />
            </div>
            {priceBehavior === "INCLUDED" && (
              <div className="space-y-2">
                <Label>Incluidas gratis</Label>
                <Input
                  type="number"
                  min={0}
                  value={includedQuantity}
                  onChange={(e) => setIncludedQuantity(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            )}
          </div>

          {canEdit && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar reglas"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Opciones del grupo</CardTitle>
            <CardDescription>Cada opción es un ítem de catálogo con su propio inventario/BOM.</CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateItemOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva opción
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAddOptionOpen(true)}>
                Añadir existente
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin opciones. Crea o añade modificadores.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem</TableHead>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Precio override</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((o, idx) => (
                  <TableRow key={`${o.catalogItemId}-${idx}`}>
                    <TableCell className="text-sm">{itemLabel(o.catalogItemId)}</TableCell>
                    <TableCell>
                      <Input
                        value={o.displayName}
                        onChange={(e) =>
                          setOptions((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, displayName: e.target.value } : x))
                          )
                        }
                        placeholder="Opcional"
                        disabled={!canEdit}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={o.priceOverride}
                        onChange={(e) =>
                          setOptions((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, priceOverride: e.target.value } : x))
                          )
                        }
                        placeholder="Auto"
                        disabled={!canEdit}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={o.isDefault}
                        onCheckedChange={(checked) =>
                          setOptions((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, isDefault: checked } : x))
                          )
                        }
                        disabled={!canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {canEdit && options.length > 0 && (
            <Button className="mt-4" onClick={handleSave} disabled={saving} size="sm">
              Guardar opciones
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={createItemOpen} onOpenChange={setCreateItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva opción de modificador</DialogTitle>
            <DialogDescription>
              Se crea como CatalogItem independiente (precio, stock o receta propios).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Precio adicional</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="new-bom" checked={newItemBom} onCheckedChange={setNewItemBom} />
              <Label htmlFor="new-bom">Descuenta insumos (receta)</Label>
            </div>
            {newItemBom && (
              <RequiredMaterialsEditor
                businessIdDoc={businessIdDoc}
                materials={newItemMaterials}
                onChange={setNewItemMaterials}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateItemOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateItem} disabled={creatingItem}>
              {creatingItem ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOptionOpen} onOpenChange={setAddOptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir opción existente</DialogTitle>
          </DialogHeader>
          <Select value={pickItemId} onValueChange={setPickItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un modificador" />
            </SelectTrigger>
            <SelectContent>
              {modifierItems
                .filter((i) => !options.some((o) => o.catalogItemId === i._id))
                .map((i) => (
                  <SelectItem key={i._id} value={i._id}>
                    {i.name} ({i.sku})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!pickItemId) return;
                setOptions((prev) => [
                  ...prev,
                  {
                    catalogItemId: pickItemId,
                    displayName: "",
                    priceOverride: "",
                    sortOrder: prev.length,
                    isDefault: false,
                  },
                ]);
                setPickItemId("");
                setAddOptionOpen(false);
              }}
            >
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
