"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Invoice, InvoiceResponse } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, Receipt } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { InvoiceCard, formatNumber } from "@/components/invoice/InvoiceCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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

  const exchangeRate =
    business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
      ? business.billingCustomExchangeRate
      : 1;

  const fetchInvoices = () => {
    if (!businessIdDoc) return;
    setLoading(true);
    fetchApiV1({
      query: queries.getInvoices,
      type: "json",
      variables: {
        id: businessIdDoc,
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
  };

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchInvoices();
  }, [businessIdDoc]);

  const addNewInvoice = () => {
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
              <Button onClick={addNewInvoice} className="flex items-center gap-2 shrink-0" disabled={!businessIdDoc}>
                <Plus className="h-4 w-4" />
                Nueva Factura
              </Button>
            )}
          </CardTitle>
          <CardDescription>Crear y gestionar facturas</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden p-2 md:px-6">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="w-full h-[410px] flex relative flex-shrink-0">
              {localInvoices.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 w-full">
                  <div className="text-center">
                    <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No hay facturas en edición</p>
                    <p className="text-sm text-gray-400">Haz clic en &quot;Nueva Factura&quot; para crear una nueva factura</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end items-end w-full mt-2 md:mt-0">
              <div className="flex flex-col w-full md:w-[320px] md:max-h-[125px] overflow-y-auto">
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
                      <span className={`flex items-center w-32 h-6 px-2 justify-start border-l border-r border-b border-primary ${index === 0 ? "border-t" : ""}`}>
                        {new Date(invoice.createdAt).toLocaleString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                      <span className={`flex items-center flex-1 h-6 px-2 justify-end border-r border-b border-primary ${index === 0 ? "border-t" : ""}`}>
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
