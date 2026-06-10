"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Attribute, AttributeValue } from "@/lib/interfases";
import { toast } from "sonner";
import { Layers, Plus } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";

type AttributeWithValues = Attribute & { values?: AttributeValue[] };

export function AttributesCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [attributes, setAttributes] = useState<AttributeWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const businessIdDoc = business?._id;
  const [newAttrName, setNewAttrName] = useState("");
  const [newValueAttrId, setNewValueAttrId] = useState<string | null>(null);
  const [newValueText, setNewValueText] = useState("");
  const [openNewAttr, setOpenNewAttr] = useState(false);
  const [openNewValue, setOpenNewValue] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        let b = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        })) as Business | null;
        if (!b && businessId) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          })) as Business | null;
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
      setAttributes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchApiV1({
      query: queries.getAttributes,
      type: "json",
      variables: { id: businessIdDoc },
    })
      .then((res: AttributeWithValues[] | null) => {
        if (cancelled) return;
        setAttributes(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar atributos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessIdDoc]);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc || !newAttrName.trim()) {
      toast.error("Nombre del atributo es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const created = (await fetchApiV1({
        query: queries.createAttribute,
        type: "json",
        variables: { id: businessIdDoc, args: { name: newAttrName.trim() } },
      })) as Attribute;
      setAttributes((prev) => [...prev, { ...created, values: [] }]);
      setNewAttrName("");
      setOpenNewAttr(false);
      toast.success("Atributo creado");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al crear atributo");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc || !newValueAttrId || !newValueText.trim()) {
      toast.error("Atributo y valor son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const created = (await fetchApiV1({
        query: queries.createAttributeValue,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: { attribute_id: newValueAttrId, value: newValueText.trim() },
        },
      })) as AttributeValue;
      setAttributes((prev) =>
        prev.map((a) =>
          a._id === newValueAttrId
            ? { ...a, values: [...(a.values || []), created] }
            : a
        )
      );
      setNewValueText("");
      setOpenNewValue(false);
      toast.success("Valor agregado");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al agregar valor");
    } finally {
      setSaving(false);
    }
  };

  if (!businessId) return null;
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver atributos.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8 w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Atributos
            </CardTitle>
            <CardDescription>Solo lectura. No tienes permiso para editar atributos.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : attributes.length === 0 ? (
              <p className="text-muted-foreground py-6">No hay atributos definidos.</p>
            ) : (
              <ul className="space-y-4">
                {attributes.map((attr) => (
                  <li key={attr._id} className="border rounded-lg p-4">
                    <div className="font-medium">{attr.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                      {(attr.values || []).length === 0 ? (
                        <span>Sin valores</span>
                      ) : (
                        (attr.values || []).map((v) => (
                          <span key={v._id} className="bg-muted px-2 py-0.5 rounded">
                            {v.value}
                          </span>
                        ))
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Atributos
          </CardTitle>
          <CardDescription>
            Define atributos (ej. Color, Talla) y sus valores. Se usan al generar variantes en un producto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={openNewAttr} onOpenChange={setOpenNewAttr}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear atributo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateAttribute}>
                  <DialogHeader>
                    <DialogTitle>Nuevo atributo</DialogTitle>
                    <DialogDescription>Ej: Color, Talla, Material</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="attrName">Nombre</Label>
                    <Input
                      id="attrName"
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      placeholder="Ej. Color"
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenNewAttr(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={openNewValue} onOpenChange={setOpenNewValue}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={attributes.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar valor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateValue}>
                  <DialogHeader>
                    <DialogTitle>Agregar valor a un atributo</DialogTitle>
                    <DialogDescription>Ej: Rojo, S, Algodón</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div>
                      <Label>Atributo</Label>
                      <select
                        className="w-full mt-2 h-9 rounded-md border border-input bg-background px-3"
                        value={newValueAttrId ?? ""}
                        onChange={(e) => setNewValueAttrId(e.target.value || null)}
                        required
                      >
                        <option value="">Seleccionar…</option>
                        {attributes.map((a) => (
                          <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="valueText">Valor</Label>
                      <Input
                        id="valueText"
                        value={newValueText}
                        onChange={(e) => setNewValueText(e.target.value)}
                        placeholder="Ej. Rojo"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenNewValue(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Agregar"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : attributes.length === 0 ? (
            <p className="text-muted-foreground py-6">No hay atributos. Crea uno para usarlo al generar variantes.</p>
          ) : (
            <ul className="space-y-4">
              {attributes.map((attr) => (
                <li key={attr._id} className="border rounded-lg p-4">
                  <div className="font-medium">{attr.name}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                    {(attr.values || []).length === 0 ? (
                      <span>Sin valores</span>
                    ) : (
                      (attr.values || []).map((v) => (
                        <span key={v._id} className="bg-muted px-2 py-0.5 rounded">
                          {v.value}
                        </span>
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
