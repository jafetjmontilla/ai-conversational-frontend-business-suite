"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Service } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, Briefcase, Trash2, Settings2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { InventoryModeBadge } from "@/components/offerings/InventoryModeBadge";
import { getServiceInventoryMode } from "@/lib/offerings/inventoryModeLabels";

export function ServicesCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!businessIdDoc) {
      setServices([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchApiV1({
      query: queries.getServices,
      type: "json",
      variables: { id: businessIdDoc, includeInactive: true },
    })
      .then((res: Service[] | null) => {
        if (!cancelled) setServices(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar servicios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessIdDoc]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.options?.some((o) => o.name.toLowerCase().includes(q))
    );
  }, [services, query]);

  const handleDelete = async (service: Service) => {
    if (!confirm(`¿Desactivar servicio "${service.name}"?`)) return;
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.deleteService,
        type: "json",
        variables: { id: businessIdDoc, _id: service._id },
      });
      setServices((prev) => prev.filter((s) => s._id !== service._id));
      toast.success("Servicio desactivado");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al desactivar");
    }
  };

  if (!businessId) return null;
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver los servicios de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Servicios
            </div>
            {canEditCurrentBusiness?.() && (
              <Button asChild size="sm" className="shrink-0" disabled={!businessIdDoc || loading}>
                <Link href={`/${businessId}/offerings/services/nuevo`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar servicio
                </Link>
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Servicios independientes del inventario de productos. Cada servicio puede tener opciones con su precio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden p-0 md:p-2">
          <div className="p-2">
            <InputSearch
              placeholder="Buscar por nombre, descripción u opción"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Servicio</TableHead>
                  <TableHead className="min-w-[100px]">Inventario</TableHead>
                  <TableHead className="min-w-[80px]">Opciones</TableHead>
                  <TableHead className="min-w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {query ? "Sin resultados con el filtro." : "No hay servicios. Agrega uno."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((service) => {
                    const mode = getServiceInventoryMode(service);
                    return (
                    <TableRow key={service._id}>
                      <TableCell>
                        <Link
                          href={`/${businessId}/offerings/services/${service._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {service.name}
                        </Link>
                        {service.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{service.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {!service.status && (
                            <span className="text-xs text-amber-600">Inactivo</span>
                          )}
                          {service.is_available === false && (
                            <span className="text-xs text-muted-foreground">No disponible</span>
                          )}
                          {service.cost_review_pending && (
                            <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">Revisar precios</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <InventoryModeBadge mode={mode} />
                      </TableCell>
                      <TableCell>{service.options?.length ?? 0}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button asChild size="sm" variant="outline">
                <Link href={`/${businessId}/offerings/services/${service._id}`}>
                            <Settings2 className="h-3 w-3" />
                          </Link>
                        </Button>
                        {canEditCurrentBusiness?.() && service.status && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(service)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="p-4 mt-2 bg-muted/50 rounded-lg text-sm">
              Mostrando {filtered.length} servicios
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
