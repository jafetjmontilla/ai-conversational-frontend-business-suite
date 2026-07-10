"use client";

import { useState } from "react";
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
import type {
  ModifierCatalogItem,
  ModifierGroup,
  ModifierPriceBehavior,
  ModifierSelectionType,
  PriceMatrixEntry,
} from "@/lib/interfases";
import { PriceMatrixEditor, priceMatrixToInput } from "@/components/offerings/PriceMatrixEditor";
import { RequiredMaterialsEditor } from "@/components/offerings/RequiredMaterialsEditor";
import type { RequiredMaterial } from "@/lib/interfases";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { offeringDeleteToast } from "@/components/offerings/OfferingArchivedSection";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { Grid3X3, MoreVertical, Pencil, Plus, Trash2, Unlink } from "lucide-react";

export type OptionDraft = {
  catalogItemId: string;
  itemName: string;
  itemSku: string;
  priceOverride: string;
  sortOrder: number;
  isDefault: boolean;
};

export type SectionDraft = {
  sectionId: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelections: string;
  maxSelections: string;
  inheritPriceBehavior: boolean;
  priceBehavior: ModifierPriceBehavior;
  includedQuantity: string;
  options: OptionDraft[];
};

export function createSectionDraft(
  partial?: Partial<SectionDraft> & { name?: string }
): SectionDraft {
  return {
    sectionId: partial?.sectionId ?? crypto.randomUUID(),
    name: partial?.name ?? "Nueva sección",
    selectionType: partial?.selectionType ?? "MULTIPLE",
    minSelections: partial?.minSelections ?? "0",
    maxSelections: partial?.maxSelections ?? "5",
    inheritPriceBehavior: partial?.inheritPriceBehavior ?? true,
    priceBehavior: partial?.priceBehavior ?? "ADDITIONAL",
    includedQuantity: partial?.includedQuantity ?? "0",
    options: partial?.options ?? [],
  };
}

export function groupToSectionDrafts(
  grp: ModifierGroup,
  modifierItems: ModifierCatalogItem[]
): SectionDraft[] {
  const mapOption = (
    o: ModifierGroup["options"][number],
    idx: number
  ): OptionDraft => {
    const item = o.catalogItem ?? modifierItems.find((i) => i._id === o.catalogItemId);
    return {
      catalogItemId: o.catalogItemId,
      itemName: item?.name ?? "",
      itemSku: item?.sku ?? "",
      priceOverride: o.priceOverride != null ? String(o.priceOverride) : "",
      sortOrder: o.sortOrder ?? idx,
      isDefault: o.isDefault ?? false,
    };
  };

  if (grp.sections?.length) {
    return grp.sections.map((section) => ({
      sectionId: section.sectionId,
      name: section.name,
      selectionType: section.selectionType,
      minSelections: String(section.minSelections),
      maxSelections: String(section.maxSelections),
      inheritPriceBehavior: section.priceBehavior == null,
      priceBehavior: section.priceBehavior ?? grp.priceBehavior,
      includedQuantity: String(section.includedQuantity ?? grp.includedQuantity ?? 0),
      options: (section.options ?? []).map(mapOption),
    }));
  }

  if (!(grp.options ?? []).length) {
    return [createSectionDraft({ name: "Opciones", selectionType: "MULTIPLE" })];
  }

  return [
    createSectionDraft({
      sectionId: crypto.randomUUID(),
      name: "Opciones",
      selectionType: grp.selectionType,
      minSelections: String(grp.minSelections),
      maxSelections: String(grp.maxSelections),
      inheritPriceBehavior: true,
      priceBehavior: grp.priceBehavior,
      includedQuantity: String(grp.includedQuantity ?? 0),
      options: (grp.options ?? []).map(mapOption),
    }),
  ];
}

type ModifierGroupSectionsEditorProps = {
  businessIdDoc: string | null | undefined;
  canEdit: boolean;
  group: ModifierGroup | null;
  modifierItems: ModifierCatalogItem[];
  sections: SectionDraft[];
  onSectionsChange: (sections: SectionDraft[]) => void;
  onModifierItemsChange: (items: ModifierCatalogItem[]) => void;
  onCatalogItemDeleted?: () => void;
  suggestedPriceKeys: string[];
};

function resolveCatalogItem(
  catalogItemId: string,
  group: ModifierGroup | null,
  modifierItems: ModifierCatalogItem[]
): ModifierCatalogItem | undefined {
  const fromGroup = group?.options?.find((o) => o.catalogItemId === catalogItemId)?.catalogItem;
  const fromList = modifierItems.find((i) => i._id === catalogItemId);
  return fromGroup ?? fromList ?? undefined;
}

export function ModifierGroupSectionsEditor({
  businessIdDoc,
  canEdit,
  group,
  modifierItems,
  sections,
  onSectionsChange,
  onModifierItemsChange,
  onCatalogItemDeleted,
  suggestedPriceKeys,
}: ModifierGroupSectionsEditorProps) {
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [createTargetSectionIdx, setCreateTargetSectionIdx] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [newItemBom, setNewItemBom] = useState(false);
  const [newItemMaterials, setNewItemMaterials] = useState<RequiredMaterial[]>([]);
  const [creatingItem, setCreatingItem] = useState(false);

  const [addOptionOpen, setAddOptionOpen] = useState(false);
  const [addTargetSectionIdx, setAddTargetSectionIdx] = useState<number | null>(null);
  const [pickItemId, setPickItemId] = useState("");

  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixItemId, setMatrixItemId] = useState<string | null>(null);
  const [matrixEntries, setMatrixEntries] = useState<PriceMatrixEntry[]>([]);
  const [matrixSaving, setMatrixSaving] = useState(false);

  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("0");
  const [editItemUnit, setEditItemUnit] = useState("unidad");
  const [editItemAvailable, setEditItemAvailable] = useState(true);
  const [editItemBom, setEditItemBom] = useState(false);
  const [editItemMaterials, setEditItemMaterials] = useState<RequiredMaterial[]>([]);
  const [savingEditItem, setSavingEditItem] = useState(false);

  const [deleteItemTarget, setDeleteItemTarget] = useState<{
    catalogItemId: string;
    name: string;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const usedCatalogItemIds = new Set(
    sections.flatMap((s) => s.options.map((o) => o.catalogItemId))
  );

  const updateSection = (idx: number, patch: Partial<SectionDraft>) => {
    onSectionsChange(
      sections.map((section, i) => (i === idx ? { ...section, ...patch } : section))
    );
  };

  const updateSectionOptions = (sectionIdx: number, options: OptionDraft[]) => {
    updateSection(sectionIdx, { options });
  };

  const openCreateItem = (sectionIdx: number) => {
    setCreateTargetSectionIdx(sectionIdx);
    setCreateItemOpen(true);
  };

  const openAddExisting = (sectionIdx: number) => {
    setAddTargetSectionIdx(sectionIdx);
    setPickItemId("");
    setAddOptionOpen(true);
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim() || !businessIdDoc || createTargetSectionIdx == null) return;
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
      onModifierItemsChange([...modifierItems, item]);
      onSectionsChange(
        sections.map((section, idx) =>
          idx === createTargetSectionIdx
            ? {
              ...section,
              options: [
                ...section.options,
                {
                  catalogItemId: item._id,
                  itemName: item.name,
                  itemSku: item.sku,
                  priceOverride: "",
                  sortOrder: section.options.length,
                  isDefault: false,
                },
              ],
            }
            : section
        )
      );
      setCreateItemOpen(false);
      setNewItemName("");
      setNewItemPrice("0");
      setNewItemBom(false);
      setNewItemMaterials([]);
      toast.success("Opción creada");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setCreatingItem(false);
    }
  };

  const itemLabel = (catalogItemId: string) => {
    const item = resolveCatalogItem(catalogItemId, group, modifierItems);
    if (!item) return catalogItemId;
    return `${item.name} · ${item.sku}`;
  };

  const openMatrixEditor = (catalogItemId: string) => {
    const item = modifierItems.find((i) => i._id === catalogItemId);
    setMatrixItemId(catalogItemId);
    setMatrixEntries(priceMatrixToInput(item?.priceMatrix));
    setMatrixOpen(true);
  };

  const handleSaveMatrix = async () => {
    if (!businessIdDoc || !matrixItemId) return;
    setMatrixSaving(true);
    try {
      const updated = (await fetchApiV1({
        query: queries.updateModifierCatalogItem,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: matrixItemId,
          args: {
            priceMatrix: matrixEntries.filter((e) => e.priceKey.trim()),
          },
        },
      })) as ModifierCatalogItem;
      onModifierItemsChange(
        modifierItems.map((i) => (i._id === matrixItemId ? { ...i, ...updated } : i))
      );
      toast.success("Matriz de precios actualizada");
      setMatrixOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar matriz");
    } finally {
      setMatrixSaving(false);
    }
  };

  const openEditItem = (catalogItemId: string) => {
    const item = resolveCatalogItem(catalogItemId, group, modifierItems);
    if (!item) return;
    setEditItemId(catalogItemId);
    setEditItemName(item.name);
    setEditItemPrice(String(item.price ?? 0));
    setEditItemUnit(item.unitOfMeasure ?? "unidad");
    setEditItemAvailable(item.isAvailable !== false);
    setEditItemBom(item.hasBillOfMaterials ?? false);
    setEditItemMaterials(item.requiredMaterials ?? []);
    setEditItemOpen(true);
  };

  const handleSaveEditItem = async () => {
    if (!businessIdDoc || !editItemId || !editItemName.trim()) return;
    setSavingEditItem(true);
    try {
      const updated = (await fetchApiV1({
        query: queries.updateModifierCatalogItem,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: editItemId,
          args: {
            name: editItemName.trim(),
            price: parseFloat(editItemPrice) || 0,
            unitOfMeasure: editItemUnit.trim() || "unidad",
            isAvailable: editItemAvailable,
            hasBillOfMaterials: editItemBom,
            requiredMaterials: editItemBom ? editItemMaterials : [],
          },
        },
      })) as ModifierCatalogItem;
      onModifierItemsChange(
        modifierItems.map((i) => (i._id === editItemId ? { ...i, ...updated } : i))
      );
      onSectionsChange(
        sections.map((section) => ({
          ...section,
          options: section.options.map((o) =>
            o.catalogItemId === editItemId
              ? { ...o, itemName: updated.name, itemSku: updated.sku }
              : o
          ),
        }))
      );
      toast.success("Opción actualizada");
      setEditItemOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setSavingEditItem(false);
    }
  };

  const removeOptionFromSection = (sectionIdx: number, optIdx: number) => {
    updateSectionOptions(
      sectionIdx,
      sections[sectionIdx].options.filter((_, i) => i !== optIdx)
    );
    toast.info("Opción quitada de la sección. Guarda el grupo para aplicar el cambio.");
  };

  const handleConfirmDeleteItem = async () => {
    if (!businessIdDoc || !deleteItemTarget) return;
    setDeletingItem(true);
    try {
      const result = (await fetchApiV1({
        query: queries.deleteModifierCatalogItem,
        type: "json",
        variables: { id: businessIdDoc, _id: deleteItemTarget.catalogItemId },
      })) as { mode: "HARD" | "SOFT"; referenceCount: number };
      offeringDeleteToast(`Modificador «${deleteItemTarget.name}»`, result, toast);
      const deletedId = deleteItemTarget.catalogItemId;
      onModifierItemsChange(modifierItems.filter((i) => i._id !== deletedId));
      onSectionsChange(
        sections.map((section) => ({
          ...section,
          options: section.options.filter((o) => o.catalogItemId !== deletedId),
        }))
      );
      setDeleteItemTarget(null);
      onCatalogItemDeleted?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingItem(false);
    }
  };

  return (
    <>
      {canEdit && (
        <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2 bg-muted/30">
          Los cambios de sección, override y opción por defecto se guardan con{" "}
          <span className="font-medium">Guardar grupo</span>. Editar, archivar o eliminar una
          opción se aplica de inmediato.
        </p>
      )}
      <div className="space-y-4">
        {sections.map((section, sectionIdx) => (
          <Card key={section.sectionId}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-base">Sección</CardTitle>
                <CardDescription>
                  Cada sección tiene su propio tipo de selección (una o varias opciones).
                </CardDescription>
              </div>
              {canEdit && sections.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSectionsChange(sections.filter((_, i) => i !== sectionIdx))}
                  aria-label="Eliminar sección"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la sección</Label>
                  <Input
                    value={section.name}
                    onChange={(e) => updateSection(sectionIdx, { name: e.target.value })}
                    disabled={!canEdit}
                    placeholder="Ej. Borde, Ingredientes extras"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de selección</Label>
                  <Select
                    value={section.selectionType}
                    onValueChange={(v) =>
                      updateSection(sectionIdx, {
                        selectionType: v as ModifierSelectionType,
                        maxSelections: v === "SINGLE" ? "1" : section.maxSelections,
                      })
                    }
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={section.minSelections}
                    onChange={(e) => updateSection(sectionIdx, { minSelections: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={section.maxSelections}
                    onChange={(e) => updateSection(sectionIdx, { maxSelections: e.target.value })}
                    disabled={!canEdit || section.selectionType === "SINGLE"}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`inherit-price-${section.sectionId}`}
                  checked={section.inheritPriceBehavior}
                  onCheckedChange={(checked) =>
                    updateSection(sectionIdx, { inheritPriceBehavior: checked })
                  }
                  disabled={!canEdit}
                />
                <Label htmlFor={`inherit-price-${section.sectionId}`}>
                  Usar comportamiento de precio del grupo
                </Label>
              </div>

              {!section.inheritPriceBehavior && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Comportamiento de precio</Label>
                    <Select
                      value={section.priceBehavior}
                      onValueChange={(v) =>
                        updateSection(sectionIdx, { priceBehavior: v as ModifierPriceBehavior })
                      }
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
                  {section.priceBehavior === "INCLUDED" && (
                    <div className="space-y-2">
                      <Label>Incluidas gratis</Label>
                      <Input
                        type="number"
                        min={0}
                        value={section.includedQuantity}
                        onChange={(e) =>
                          updateSection(sectionIdx, { includedQuantity: e.target.value })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Opciones</Label>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openCreateItem(sectionIdx)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Nueva
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAddExisting(sectionIdx)}>
                      Añadir existente
                    </Button>
                  </div>
                )}
              </div>

              {section.options.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin opciones en esta sección.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Override</TableHead>
                      <TableHead>Matriz</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="w-[52px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.options.map((o, optIdx) => (
                      <TableRow key={`${section.sectionId}-${o.catalogItemId}`}>
                        <TableCell>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="truncate text-sm">{o.itemName || "—"}</span>
                            {canEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => openEditItem(o.catalogItemId)}
                                aria-label={`Editar ${o.itemName}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {o.itemSku || "—"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={o.priceOverride}
                            onChange={(e) => {
                              const next = section.options.map((x, i) =>
                                i === optIdx ? { ...x, priceOverride: e.target.value } : x
                              );
                              updateSectionOptions(sectionIdx, next);
                            }}
                            placeholder="Auto"
                            disabled={!canEdit}
                            className="h-8 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const item = modifierItems.find((i) => i._id === o.catalogItemId);
                            const count = item?.priceMatrix?.length ?? 0;
                            return (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8"
                                disabled={!canEdit}
                                onClick={() => openMatrixEditor(o.catalogItemId)}
                              >
                                <Grid3X3 className="h-3 w-3 mr-1" />
                                {count ? `${count} keys` : "Fija"}
                              </Button>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={o.isDefault}
                            onCheckedChange={(checked) => {
                              const next = section.options.map((x, i) =>
                                i === optIdx ? { ...x, isDefault: checked } : x
                              );
                              updateSectionOptions(sectionIdx, next);
                            }}
                            disabled={!canEdit}
                          />
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Acciones de la opción"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditItem(o.catalogItemId)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar opción
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => removeOptionFromSection(sectionIdx, optIdx)}
                                >
                                  <Unlink className="h-4 w-4 mr-2" />
                                  Quitar de esta sección
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setDeleteItemTarget({
                                      catalogItemId: o.catalogItemId,
                                      name: o.itemName || itemLabel(o.catalogItemId),
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar modificador
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}

        {canEdit && (
          <Button
            variant="outline"
            onClick={() => onSectionsChange([...sections, createSectionDraft()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Añadir sección
          </Button>
        )}
      </div>

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
                .filter((i) => !usedCatalogItemIds.has(i._id))
                .map((i) => (
                  <SelectItem key={i._id} value={i._id}>
                    <span>{i.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{i.sku}</span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!pickItemId || addTargetSectionIdx == null) return;
                const picked = modifierItems.find((i) => i._id === pickItemId);
                onSectionsChange(
                  sections.map((section, idx) =>
                    idx === addTargetSectionIdx
                      ? {
                        ...section,
                        options: [
                          ...section.options,
                          {
                            catalogItemId: pickItemId,
                            itemName: picked?.name ?? "",
                            itemSku: picked?.sku ?? "",
                            priceOverride: "",
                            sortOrder: section.options.length,
                            isDefault: false,
                          },
                        ],
                      }
                      : section
                  )
                );
                setPickItemId("");
                setAddOptionOpen(false);
              }}
            >
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={matrixOpen} onOpenChange={setMatrixOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Matriz de precios</DialogTitle>
            <DialogDescription>
              {matrixItemId ? itemLabel(matrixItemId) : ""} — precios según tamaño de la variante
              principal.
            </DialogDescription>
          </DialogHeader>
          <PriceMatrixEditor
            value={matrixEntries}
            onChange={setMatrixEntries}
            disabled={!canEdit || matrixSaving}
            suggestedKeys={suggestedPriceKeys}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatrixOpen(false)}>
              Cancelar
            </Button>
            {canEdit && (
              <Button onClick={handleSaveMatrix} disabled={matrixSaving}>
                {matrixSaving ? "Guardando…" : "Guardar matriz"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar opción de modificador</DialogTitle>
            <DialogDescription>
              Cambios en precio, receta y disponibilidad se guardan de inmediato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editItemName} onChange={(e) => setEditItemName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio adicional</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editItemPrice}
                  onChange={(e) => setEditItemPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad de medida</Label>
                <Input
                  value={editItemUnit}
                  onChange={(e) => setEditItemUnit(e.target.value)}
                  placeholder="unidad"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-available"
                checked={editItemAvailable}
                onCheckedChange={setEditItemAvailable}
              />
              <Label htmlFor="edit-available">Disponible para venta</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="edit-bom" checked={editItemBom} onCheckedChange={setEditItemBom} />
              <Label htmlFor="edit-bom">Descuenta insumos (receta)</Label>
            </div>
            {editItemBom && (
              <RequiredMaterialsEditor
                businessIdDoc={businessIdDoc}
                materials={editItemMaterials}
                onChange={setEditItemMaterials}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditItem} disabled={savingEditItem}>
              {savingEditItem ? "Guardando…" : "Guardar opción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteItemTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletingItem) setDeleteItemTarget(null);
        }}
        onConfirm={() => void handleConfirmDeleteItem()}
        loading={deletingItem}
        title={`Eliminar modificador «${deleteItemTarget?.name ?? ""}»`}
        description={
          <>
            Si no está en facturas ni en otros grupos, se eliminará permanentemente. Si está en
            uso, se archivará y dejará de aparecer al configurar nuevos artículos.
          </>
        }
      />
    </>
  );
}
