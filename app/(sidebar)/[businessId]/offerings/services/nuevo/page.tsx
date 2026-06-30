"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { OfferingsGenerateDialog } from "@/components/offerings/OfferingsGenerateDialog";
import type { OfferingsImportDraft, ParsedServiceOptionDraft } from "@/lib/offerings/importTypes";

export default function NewServicePage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusinessApps(businessId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [pendingOptions, setPendingOptions] = useState<ParsedServiceOptionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const handleGenerateResult = (draft: OfferingsImportDraft) => {
    const svc = draft.services[0];
    if (!svc) {
      toast.warning("No se detectó un servicio en el texto");
      return;
    }
    setName(svc.name);
    setDescription(svc.description ?? "");
    setUnitOfMeasure(svc.unit_of_measure ?? "");
    setPendingOptions(svc.options ?? []);
    toast.success("Campos rellenados. Revisa antes de guardar.");
  };

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
      const created = (await fetchApiV1({
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
      })) as { _id: string };
      for (const opt of pendingOptions) {
        if (!opt.name?.trim()) continue;
        await fetchApiV1({
          query: queries.createServiceOption,
          type: "json",
          variables: {
            id: businessIdDoc,
            args: {
              service_id: created._id,
              name: opt.name.trim(),
              price: opt.price ?? 0,
              durationMinutes: opt.durationMinutes ?? undefined,
            },
          },
        });
      }
      toast.success(
        pendingOptions.length
          ? `Servicio creado con ${pendingOptions.length} opción(es)`
          : "Servicio creado"
      );
      router.push(`/${businessId}/offerings/services/${created._id}`);
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
              <Link href={`/${businessId}/offerings/services`}>Volver al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${businessId}/offerings/services`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Nuevo servicio
              </CardTitle>
              <CardDescription>
                Crea un servicio padre. Luego podrás añadir opciones (ej. 1 hora, 4 horas) con precios.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar con IA
            </Button>
          </div>
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
            {pendingOptions.length > 0 && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Opciones detectadas por IA (se crearán al guardar):</p>
                <ul className="mt-1 text-muted-foreground list-disc pl-5">
                  {pendingOptions.map((o, i) => (
                    <li key={i}>
                      {o.name} — ${o.price}
                      {o.durationMinutes ? ` (${o.durationMinutes} min)` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !businessIdDoc || !name.trim()}>
                {saving ? "Guardando…" : !businessIdDoc ? "Cargando…" : "Crear servicio"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${businessId}/offerings/services`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <OfferingsGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        businessIdDoc={businessIdDoc}
        scope="SERVICES"
        title="Generar servicio con IA"
        description="Describe el servicio y sus precios. Se rellenará el formulario y las opciones detectadas."
        onResult={handleGenerateResult}
      />
    </div>
  );
}
