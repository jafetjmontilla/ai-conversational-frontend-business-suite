"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  ModifierCatalogItem,
  ModifierGroup,
  ModifierPriceBehavior,
} from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import {
  groupToSectionDrafts,
  ModifierGroupSectionsEditor,
  type SectionDraft,
} from "@/components/offerings/ModifierGroupSectionsEditor";

function sectionsToMutationInput(sections: SectionDraft[]) {
  return sections.map((section, idx) => ({
    sectionId: section.sectionId,
    name: section.name.trim(),
    selectionType: section.selectionType,
    minSelections: parseInt(section.minSelections, 10) || 0,
    maxSelections: parseInt(section.maxSelections, 10) || 1,
    priceBehavior: section.inheritPriceBehavior ? undefined : section.priceBehavior,
    includedQuantity:
      !section.inheritPriceBehavior && section.priceBehavior === "INCLUDED"
        ? parseInt(section.includedQuantity, 10) || 0
        : undefined,
    sortOrder: idx,
    options: section.options.map((o, optIdx) => ({
      catalogItemId: o.catalogItemId,
      priceOverride: o.priceOverride ? parseFloat(o.priceOverride) : undefined,
      sortOrder: optIdx,
      isDefault: o.isDefault,
    })),
  }));
}

function buildGroupSnapshot(
  groupName: string,
  groupRequired: boolean,
  groupPriceBehavior: ModifierPriceBehavior,
  groupIncludedQuantity: string,
  groupSections: SectionDraft[]
) {
  return JSON.stringify({
    name: groupName.trim(),
    isRequired: groupRequired,
    priceBehavior: groupPriceBehavior,
    includedQuantity: groupIncludedQuantity,
    sections: sectionsToMutationInput(groupSections),
  });
}

export default function ModifierGroupDetailPage() {
  const params = useParams();
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
  const [priceBehavior, setPriceBehavior] = useState<ModifierPriceBehavior>("ADDITIONAL");
  const [includedQuantity, setIncludedQuantity] = useState("0");
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [suggestedPriceKeys, setSuggestedPriceKeys] = useState<string[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return (
      buildGroupSnapshot(name, isRequired, priceBehavior, includedQuantity, sections) !==
      savedSnapshot
    );
  }, [savedSnapshot, name, isRequired, priceBehavior, includedQuantity, sections]);

  const applyLoadedGroup = (grp: ModifierGroup, items: ModifierCatalogItem[]) => {
    setGroup(grp);
    setModifierItems(items);
    setName(grp.name);
    setIsRequired(grp.isRequired);
    setPriceBehavior(grp.priceBehavior);
    setIncludedQuantity(String(grp.includedQuantity ?? 0));
    const nextSections = groupToSectionDrafts(grp, items);
    setSections(nextSections);
    setSavedSnapshot(
      buildGroupSnapshot(
        grp.name,
        grp.isRequired,
        grp.priceBehavior,
        String(grp.includedQuantity ?? 0),
        nextSections
      )
    );
  };

  const load = async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const [g, catalogItems] = await Promise.all([
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
      const items = Array.isArray(catalogItems) ? catalogItems : [];
      applyLoadedGroup(grp, items);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessIdDoc && groupId) load();
  }, [businessIdDoc, groupId]);

  useEffect(() => {
    if (!businessIdDoc) return;
    (async () => {
      try {
        const attrs = (await fetchApiV1({
          query: queries.getAttributes,
          type: "json",
          variables: { id: businessIdDoc },
        })) as Array<{ values?: Array<{ code?: string; value: string }> }>;
        const keys = new Set<string>();
        for (const a of attrs ?? []) {
          for (const v of a.values ?? []) {
            if (v.code) keys.add(v.code);
          }
        }
        setSuggestedPriceKeys(Array.from(keys));
      } catch {
        setSuggestedPriceKeys([]);
      }
    })();
  }, [businessIdDoc]);

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
            priceBehavior,
            includedQuantity: parseInt(includedQuantity, 10) || 0,
            sections: sectionsToMutationInput(sections),
          },
        },
      });
      toast.success("Grupo actualizado");
      setSavedSnapshot(
        buildGroupSnapshot(name, isRequired, priceBehavior, includedQuantity, sections)
      );
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground p-4">Cargando…</p>;
  }

  if (!group) {
    return <p className="text-sm text-destructive p-4">Grupo no encontrado</p>;
  }

  return (
    <div className="space-y-6 p-1 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${businessId}/offerings/modifiers`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            Configura secciones con reglas propias (una o varias opciones).
          </p>
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
            <Label htmlFor="is-required">Obligatorio para el cliente (al menos una opción)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Comportamiento de precio por defecto</Label>
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
            {priceBehavior === "INCLUDED" && (
              <div className="space-y-2">
                <Label>Incluidas gratis (por defecto)</Label>
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
        </CardContent>
      </Card>

      <ModifierGroupSectionsEditor
        businessIdDoc={businessIdDoc}
        canEdit={canEdit}
        group={group}
        modifierItems={modifierItems}
        sections={sections}
        onSectionsChange={setSections}
        onModifierItemsChange={setModifierItems}
        suggestedPriceKeys={suggestedPriceKeys}
      />

      {canEdit && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? "Guardando…" : "Guardar grupo"}
          </Button>
          {isDirty && (
            <Badge variant="secondary" className="font-normal">
              Cambios sin guardar
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
