"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Invoice } from "@/lib/interfases";
import { Plus, Trash2 } from "lucide-react";

interface PaymentMethodRow {
  id: string;
  name: string;
  amountBs: number;
  amountUsd: number;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  /** _id del negocio (Business). */
  businessId: string;
  exchangeRate: number;
  onSuccess: () => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  invoice,
  businessId,
  exchangeRate,
  onSuccess,
}: PaymentDialogProps) {
  const [methods, setMethods] = useState<PaymentMethodRow[]>([
    { id: "1", name: "Efectivo Bs", amountBs: 0, amountUsd: 0 },
    { id: "2", name: "Efectivo USD", amountBs: 0, amountUsd: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      setMethods([
        { id: "1", name: "Efectivo Bs", amountBs: 0, amountUsd: 0 },
        { id: "2", name: "Efectivo USD", amountBs: 0, amountUsd: 0 },
      ]);
    }
  }, [isOpen, invoice]);

  const totalPaidBs = methods.reduce((s, m) => s + m.amountBs, 0);
  const totalPaidUsd = methods.reduce((s, m) => s + m.amountUsd, 0);
  const totalPaid = totalPaidUsd + totalPaidBs / (exchangeRate || 1);

  const addRow = () => {
    setMethods((prev) => [
      ...prev,
      { id: `pm-${Date.now()}`, name: "Otro", amountBs: 0, amountUsd: 0 },
    ]);
  };

  const updateRow = (id: string, field: keyof PaymentMethodRow, value: string | number) => {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const next = { ...m, [field]: value };
        if (field === "amountBs") {
          next.amountUsd = Number((Number(value) / (exchangeRate || 1)).toFixed(2));
        } else if (field === "amountUsd") {
          next.amountBs = Number((Number(value) * (exchangeRate || 1)).toFixed(2));
        }
        return next;
      })
    );
  };

  const removeRow = (id: string) => {
    if (methods.length <= 1) return;
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !businessId) return;
    const paymentMethods = methods
      .filter((m) => m.amountBs > 0 || m.amountUsd > 0)
      .map((m, i) => ({
        id: m.id || `pm-${i}`,
        name: m.name || "Pago",
        amountBs: m.amountBs,
        amountUsd: m.amountUsd,
        urlSuport: undefined as string | undefined,
      }));
    if (paymentMethods.length === 0) {
      toast.error("Indica al menos un método de pago con monto.");
      return;
    }
    setLoading(true);
    try {
      await fetchApiV1({
        query: queries.processPayment,
        type: "json",
        variables: {
          id: businessId,
          args: {
            invoiceId: invoice._id,
            paymentMethods,
            totalPaid: totalPaidUsd + totalPaidBs / (exchangeRate || 1),
            exchangeRate: exchangeRate || 1,
          },
        },
      });
      toast.success("Pago procesado");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Procesar pago</DialogTitle>
          <DialogDescription>
            Factura: {invoice?.clientName || "Sin nombre"} — Total Bs: {invoice?.totalBs?.toFixed(2)} — Total USD:{" "}
            {invoice?.totalUsd?.toFixed(2)}
            <br />
            Tasa: 1 USD = {exchangeRate} Bs
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Métodos de pago</Label>
            {methods.map((m) => (
              <div key={m.id} className="flex gap-2 items-center">
                <Input
                  placeholder="Nombre"
                  value={m.name}
                  onChange={(e) => updateRow(m.id, "name", e.target.value)}
                  className="flex-1 min-w-0"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Bs"
                  value={m.amountBs || ""}
                  onChange={(e) => updateRow(m.id, "amountBs", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                  className="w-24"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="USD"
                  value={m.amountUsd || ""}
                  onChange={(e) => updateRow(m.id, "amountUsd", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                  className="w-24"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(m.id)} disabled={methods.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir método
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Total pagado: {totalPaidBs.toFixed(2)} Bs / {totalPaidUsd.toFixed(2)} USD (equiv. {totalPaid.toFixed(2)} USD)
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Procesar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
