"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business } from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";

export default function NewServicePage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [saving, setSaving] = useState(false);

  const businessIdDoc = business?._id;

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
        if (!cancelled) setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc) {
      toast.error("Aún no se ha cargado el negocio. Espera un momento e intenta de nuevo.");
      return;
    }
    if (!name.trim()) {
      toast.error("Nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      const created = await fetchApiV1({
        query: queries.createService,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: {
            name: name.trim(),
            description: description.trim(),
            is_available: isAvailable,
            unit_of_measure: unitOfMeasure.trim() || undefined,
          },
        },
      });
      toast.success("Servicio creado");
      router.push(`/${businessId}/services/${(created as { _id: string })._id}`);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  if (!businessId) return null;
  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para crear servicios.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/${businessId}/services`}>Volver al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${businessId}/services`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Nuevo servicio
          </CardTitle>
          <CardDescription>Crea un servicio padre. Luego podrás añadir opciones (ej. 1 hora, 4 horas) con precios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Consultoría"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Disponible para venta</Label>
                <p className="text-xs text-muted-foreground">Puedes desactivar manualmente si se agotan recursos.</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>
            <div>
              <Label>Unidad de medida</Label>
              <Input
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="Ej. Página, Plato, Hora, Copia"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !businessIdDoc || !name.trim()}>
                {saving ? "Guardando…" : !businessIdDoc ? "Cargando…" : "Crear servicio"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${businessId}/services`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
