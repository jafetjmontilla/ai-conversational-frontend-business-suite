"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Invoice, InvoiceResponse } from "@/lib/interfases";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

function formatInvoiceDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BusinessSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { business, businessIdDoc, loading: loadingBusiness } = useBusiness(businessSlug);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    if (!businessIdDoc) return;
    setLoadingInvoices(true);
    fetchApiV1({
      query: queries.getInvoices,
      type: "json",
      variables: {
        id: businessIdDoc,
        skip: 0,
        limit: 5,
        sort: { createdAt: -1 },
      },
    })
      .then((res: InvoiceResponse) => setInvoices(res?.results ?? []))
      .catch(() => toast.error("Error al cargar facturas recientes"))
      .finally(() => setLoadingInvoices(false));
  }, [businessIdDoc]);

  const channelSummary = useMemo(() => {
    const list = business?.channels ?? [];
    const cloud = list.filter((c) => c.type === "whatsapp_cloud").length;
    const baileys = list.filter((c) => c.type === "whatsapp_baileys").length;
    const baileysActive = list.filter((c) => c.type === "whatsapp_baileys" && c.active).length;
    const hasGeneric = list.some((c) => c.type === "generic");
    return { cloud, baileys, baileysActive, hasGeneric };
  }, [business]);

  if (!businessSlug) return null;

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver a Negocios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          {loadingBusiness ? "Cargando…" : business?.name ?? businessSlug}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen del negocio y accesos rápidos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Canales
            </CardTitle>
            <CardDescription>Integraciones de mensajería configuradas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingBusiness ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">Cloud API: {channelSummary.cloud}</Badge>
                  <Badge variant="secondary">
                    Baileys: {channelSummary.baileysActive}/{channelSummary.baileys} activas
                  </Badge>
                  <Badge variant={channelSummary.hasGeneric ? "default" : "outline"}>
                    {channelSummary.hasGeneric ? (
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" /> Genérico
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <WifiOff className="h-3 w-3" /> Sin webhook genérico
                      </span>
                    )}
                  </Badge>
                </div>
                {canEditCurrentBusiness() && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${businessSlug}/channels`}>
                      Gestionar canales
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Últimas facturas
            </CardTitle>
            <CardDescription>Las 5 más recientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingInvoices ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin facturas registradas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {invoices.map((inv) => (
                  <li key={inv._id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/${businessSlug}/invoice/${inv._id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {inv.clientName || "Sin cliente"}
                    </Link>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {formatInvoiceDate(inv.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/${businessSlug}/billing/facturas`}>
                Ver facturación
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {canEditCurrentBusiness() && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Asistente IA</CardTitle>
            <CardDescription>Configura el comportamiento y el conocimiento del agente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${businessSlug}/ai/behavior`}>
                <Settings className="h-4 w-4 mr-2" />
                Comportamiento
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${businessSlug}/knowledge/protocols`}>
                <BookOpen className="h-4 w-4 mr-2" />
                Conocimiento
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
