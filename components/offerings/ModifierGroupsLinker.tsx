"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { ModifierGroup } from "@/lib/interfases";
import { toast } from "sonner";
import Link from "next/link";
import { Layers } from "lucide-react";

type ModifierGroupsLinkerProps = {
  businessId: string;
  entityId: string;
  entityType: "product" | "service";
  selectedGroupIds: string[];
  disabled?: boolean;
  onSaved?: (groupIds: string[]) => void;
};

export function ModifierGroupsLinker({
  businessId,
  entityId,
  entityType,
  selectedGroupIds,
  disabled,
  onSaved,
}: ModifierGroupsLinkerProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedGroupIds));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(new Set(selectedGroupIds));
  }, [selectedGroupIds]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApiV1({
        query: queries.getModifierGroups,
        type: "json",
        variables: { id: businessId, includeInactive: false },
      });
      setGroups(Array.isArray(res) ? res : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const toggle = (groupId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const modifierGroupIds = Array.from(selected);
      const mutation =
        entityType === "product" ? queries.setProductModifierGroups : queries.setServiceModifierGroups;
      await fetchApiV1({
        query: mutation,
        type: "json",
        variables: { id: businessId, _id: entityId, modifierGroupIds },
      });
      toast.success("Grupos de modificadores actualizados");
      onSaved?.(modifierGroupIds);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5" />
          Adicionales y modificadores
        </CardTitle>
        <CardDescription>
          Grupos de opciones que el cliente puede elegir al comprar este{" "}
          {entityType === "product" ? "producto" : "servicio"} (extras, salsas, garantías, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando grupos…</p>
        ) : groups.length === 0 ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>No hay grupos de modificadores configurados.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${businessId}/offerings/modifiers`}>Crear grupos de modificadores</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g._id} className="flex items-start gap-3 rounded-md border p-3">
                <input
                  type="checkbox"
                  id={`mod-group-${g._id}`}
                  checked={selected.has(g._id)}
                  onChange={() => toggle(g._id)}
                  disabled={disabled || saving}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`mod-group-${g._id}`} className="font-medium cursor-pointer">
                    {g.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {g.selectionType === "SINGLE" ? "Una opción" : "Varias opciones"}
                    {g.isRequired ? " · Obligatorio" : " · Opcional"}
                    {" · "}
                    {g.options.length} opción(es)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {groups.length > 0 && !disabled && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Guardando…" : "Guardar grupos vinculados"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
