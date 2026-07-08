"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Invoice, InvoiceResponse, InvoiceSource } from "@/lib/interfases";
import { toast } from "sonner";
import { Bot, Plus, Receipt } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { normalizeBillingInternalFlow } from "@/lib/billing/flows";
import { InvoiceCard, formatNumber } from "@/components/invoice/InvoiceCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | InvoiceSource;

export function InvoicesBillingContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const { business, businessIdDoc } = useBusiness(businessId);
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const { onInvoiceCreated, onInvoiceUpdated } = useWebSocketContext();

  const billingFlow = normalizeBillingInternalFlow(business?.billingInternalFlow);

  const exchangeRate =
    business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
      ? business.billingCustomExchangeRate
      : 1;

  const fetchInvoices = useCallback(() => {
    if (!businessIdDoc) return;
    setLoading(true);
    const filters =
      sourceFilter === "all" ? undefined : { source: sourceFilter };
    fetchApiV1({
      query: queries.getInvoices,
      type: "json",
      variables: {
        id: businessIdDoc,
        filters,
        skip: 0,
        limit: 50,
        sort: { createdAt: -1 },
      },
    })
      .then((res: InvoiceResponse) => {
        setInvoices(res?.results ?? []);
      })
      .catch(() => toast.error("Error al cargar facturas"))
      .finally(() => setLoading(false));
  }, [businessIdDoc, sourceFilter]);

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchInvoices();
  }, [businessIdDoc, fetchInvoices]);

  useEffect(() => {
    const unsubCreate = onInvoiceCreated((payload) => {
      if (payload.businessId !== businessIdDoc) return;
      fetchInvoices();
      if (payload.source === "agent") {
        toast.info("Nueva factura del agente", {
          description: "Revisa el listado para cobrar en caja.",
        });
      }
    });
    const unsubUpdate = onInvoiceUpdated((payload) => {
      if (payload.businessId !== businessIdDoc) return;
      fetchInvoices();
    });
    return () => {
      unsubCreate();
      unsubUpdate();
    };
  }, [businessIdDoc, fetchInvoices, onInvoiceCreated, onInvoiceUpdated]);

  const addNewInvoice = async () => {
    if (billingFlow === "editor") {
      if (!businessIdDoc) return;
      setCreating(true);
      try {
        const saved = (await fetchApiV1({
          query: queries.createInvoice,
          type: "json",
          variables: {
            id: businessIdDoc,
            args: { items: [] },
          },
        })) as Invoice | null;
        if (!saved?._id) throw new Error("No se pudo crear la factura");
        router.push(`/${businessId}/billing/facturas/${saved._id}`);
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message || "Error al crear factura");
      } finally {
        setCreating(false);
      }
      return;
    }

    const newInvoice: Invoice = {
      _id: `local-${Date.now()}`,
      clientName: "",
      clientId: "",
      clientPhone: "",
      items: [],
      totalBs: 0,
      totalUsd: 0,
      status: "draft",
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalInvoices(prev => [...prev, newInvoice]);
  };

  const updateLocalInvoice = (id: string, updatedInvoice: Partial<Invoice>) => {
    setLocalInvoices(prev =>
      prev.map(invoice =>
        invoice._id === id ? { ...invoice, ...updatedInvoice } : invoice
      )
    );
  };

  const removeInvoice = (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres cerrar esta factura sin guardar?")) {
      setLocalInvoices(prev => prev.filter(invoice => invoice._id !== id));
    }
  };

  if (!businessId) return null;
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para gestionar facturación de este negocio.</p>
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
              <Receipt className="h-5 w-5" />
              Facturas
            </div>
            {canEditCurrentBusiness?.() && (
              <Button onClick={addNewInvoice} className="flex items-center gap-2 shrink-0" disabled={!businessIdDoc || creating}>
                <Plus className="h-4 w-4" />
                {creating ? "Creando…" : "Nueva Factura"}
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {billingFlow === "carousel"
              ? "Caja rápida arriba; historial abajo (incluye pagadas y anuladas)."
              : "Crea borradores en el editor; historial abajo (incluye pagadas y anuladas)."}
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {(
              [
                { id: "all" as const, label: "Todas" },
                { id: "agent" as const, label: "Agente", icon: Bot },
                { id: "manual" as const, label: "Manual" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.id}
                type="button"
                size="sm"
                variant={sourceFilter === opt.id ? "default" : "outline"}
                className="h-8"
                onClick={() => setSourceFilter(opt.id)}
              >
                {"icon" in opt && opt.icon ? <opt.icon className="h-3.5 w-3.5 mr-1" /> : null}
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden p-2 md:px-6">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="w-full h-[410px] flex relative flex-shrink-0">
              {billingFlow === "carousel" && localInvoices.length > 0 ? (
                <Carousel
                  opts={{
                    align: (isMobile ? "center" : "start") as "center" | "start",
                    skipSnaps: false,
                    dragFree: false,
                  }}
                  className="w-full max-w-full flex-1 flex overflow-hidden absolute"
                >
                  <CarouselContent className="w-full h-full -ml-0 md:-ml-4">
                    {localInvoices.map((invoice) => (
                      <CarouselItem key={invoice._id} className="pl-0 md:pl-4 basis-full md:basis-[340px] h-full">
                        <InvoiceCard
                          setLocalInvoices={setLocalInvoices}
                          invoice={invoice}
                          onUpdate={(updatedInvoice) => updateLocalInvoice(invoice._id, updatedInvoice)}
                          onRemove={() => removeInvoice(invoice._id)}
                          exchangeRate={exchangeRate}
                          businessId={businessIdDoc!}
                          onPaymentSuccess={fetchInvoices}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className={`${state === "collapsed" ? "md:translate-x-[90px]" : "md:translate-x-[266px]"} fixed -left-1.5 md:left-0 md:translate-y-[54px] bg-white hover:bg-gray-50 border border-gray-300 shadow-md`} />
                  <CarouselNext className="fixed -right-1.5 md:right-0 md:-translate-x-[10px] md:translate-y-[54px] bg-white hover:bg-gray-50 border border-gray-300 shadow-md" />
                </Carousel>
              ) : billingFlow === "carousel" ? (
                <div className="flex items-center justify-center h-64 text-gray-500 w-full">
                  <div className="text-center">
                    <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No hay facturas en edición</p>
                    <p className="text-sm text-gray-400">Haz clic en &quot;Nueva Factura&quot; para crear una en el carrusel</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground w-full px-4">
                  <div className="text-center max-w-sm">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Flujo editor activo. Usa &quot;Nueva Factura&quot; para abrir un borrador en pantalla completa.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end items-end w-full mt-2 md:mt-0">
              <div className="flex flex-col w-full md:w-[420px] md:max-h-[125px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : (
                  invoices.map((invoice, index) => (
                    <li
                      key={invoice._id}
                      className="w-full flex items-center text-xs text-primary hover:bg-accent flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/${businessId}/billing/facturas/${invoice._id}`)}
                    >
                      <span
                        className={cn(
                          "flex items-center w-32 h-6 px-2 justify-start border-l border-r border-b border-primary",
                          index === 0 && "border-t"
                        )}
                      >
                        {new Date(invoice.createdAt).toLocaleString("es-VE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      <span
                        className={cn(
                          "flex items-center flex-1 min-w-0 h-6 px-2 justify-start gap-1 border-r border-b border-primary truncate",
                          index === 0 && "border-t"
                        )}
                      >
                        {invoice.source === "agent" && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] shrink-0">
                            Agente
                          </Badge>
                        )}
                        <span className="truncate">{invoice.clientName || invoice.clientPhone || "—"}</span>
                      </span>
                      <span
                        className={cn(
                          "flex items-center w-24 h-6 px-2 justify-end border-r border-b border-primary",
                          index === 0 && "border-t"
                        )}
                      >
                        {formatNumber(invoice.totalBs)}
                      </span>
                      <span className={`flex items-center w-20 h-6 px-2 justify-end border-r border-b border-primary ${index === 0 ? "border-t" : ""}`}>
                        {formatNumber(invoice.totalUsd)}
                      </span>
                      <span className={`flex items-center w-16 h-6 px-2 justify-center border-r border-b border-primary text-[10px] ${index === 0 ? "border-t" : ""} ${invoice.status === "paid" ? "text-green-600" : invoice.status === "cancelled" ? "text-red-600" : "text-muted-foreground"}`}>
                        {invoice.status === "paid" ? "Pagada" : invoice.status === "cancelled" ? "Anulada" : "Borrador"}
                      </span>
                    </li>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
