"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Invoice, InvoiceResponse } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, Receipt, CreditCard, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { PaymentDialog } from "@/components/invoice/PaymentDialog";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const businessIdDoc = business?._id;
  const exchangeRate =
    business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
      ? business.billingCustomExchangeRate
      : 1;

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
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const fetchInvoices = () => {
    if (!businessIdDoc) return;
    setLoading(true);
    fetchApiV1({
      query: queries.getInvoices,
      type: "json",
      variables: {
        id: businessIdDoc,
        skip: 0,
        limit: 100,
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

  const handleNewInvoice = async () => {
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.createInvoice,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: {
            clientName: "",
            clientId: "",
            clientPhone: "",
            items: [
              {
                id: "item-0",
                quantity: 0,
                description: "",
                unitPrice: 0,
                total: 0,
                inventoryId: "",
              },
            ],
          },
        },
      });
      toast.success("Factura creada");
      fetchInvoices();
    } catch (e: any) {
      toast.error(e?.message || "Error al crear factura");
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!confirm("¿Eliminar esta factura?")) return;
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.deleteInvoice,
        type: "json",
        variables: { id: businessIdDoc, _id: inv._id },
      });
      toast.success("Factura eliminada");
      fetchInvoices();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
    }
  };

  const openPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentDialogOpen(true);
  };

  if (!businessId) return null;
  if (!canEditCurrentBusiness?.()) {
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
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <Card className="flex flex-col w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Facturación
          </CardTitle>
          <CardDescription>Crear y gestionar facturas del negocio</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-2 flex-1">
          <div className="flex justify-end p-2">
            <Button onClick={handleNewInvoice} disabled={!businessIdDoc || loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva factura
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total Bs</TableHead>
                  <TableHead>Total USD</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay facturas. Crea una con &quot;Nueva factura&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell>
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleString("es", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>{inv.clientName || inv.clientId || "—"}</TableCell>
                      <TableCell>{inv.totalBs?.toFixed(2) ?? "0.00"}</TableCell>
                      <TableCell>{inv.totalUsd?.toFixed(2) ?? "0.00"}</TableCell>
                      <TableCell>
                        <span
                          className={
                            inv.status === "paid"
                              ? "text-green-600"
                              : inv.status === "cancelled"
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }
                        >
                          {inv.status === "paid" ? "Pagada" : inv.status === "cancelled" ? "Anulada" : "Borrador"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mr-2"
                              onClick={() => openPayment(inv)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(inv)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {businessIdDoc && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => (setPaymentDialogOpen(false), setPaymentInvoice(null))}
          invoice={paymentInvoice}
          businessId={businessIdDoc}
          exchangeRate={exchangeRate}
          onSuccess={fetchInvoices}
        />
      )}
    </div>
  );
}
