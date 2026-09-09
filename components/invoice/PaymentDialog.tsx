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
import {
  formatMinor,
  majorToMinor,
  type CurrencyCode,
} from "@/lib/money";

interface PaymentMethodRow {
  id: string;
  name: string;
  amountMajor: string;
  currency: CurrencyCode;
}

function createInitialMethods(
  baseCurrency: CurrencyCode,
  displayCurrency: CurrencyCode
): PaymentMethodRow[] {
  return [
    { id: "1", name: `Efectivo ${baseCurrency}`, amountMajor: "", currency: baseCurrency },
    ...(displayCurrency === baseCurrency
      ? []
      : [{ id: "2", name: `Efectivo ${displayCurrency}`, amountMajor: "", currency: displayCurrency }]),
  ];
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  /** _id del negocio (Business). */
  businessId: string;
  exchangeRate: number;
  baseCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  onSuccess: () => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  invoice,
  businessId,
  exchangeRate,
  baseCurrency,
  displayCurrency,
  onSuccess,
}: PaymentDialogProps) {
  const [methods, setMethods] = useState<PaymentMethodRow[]>(() =>
    createInitialMethods(baseCurrency, displayCurrency)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      setMethods(createInitialMethods(baseCurrency, displayCurrency));
    }
  }, [isOpen, invoice, baseCurrency, displayCurrency]);

  const rowMinor = (row: PaymentMethodRow) =>
    row.amountMajor.trim() ? majorToMinor(row.amountMajor) : 0;
  const safeRowMinor = (row: PaymentMethodRow) => {
    try {
      return rowMinor(row);
    } catch {
      return 0;
    }
  };
  const totalBaseMinor = methods.reduce((total, method) => {
    const amountMinor = safeRowMinor(method);
    if (method.currency === baseCurrency) return total + amountMinor;
    if (method.currency === displayCurrency && exchangeRate > 0) {
      return total + Math.round(amountMinor / exchangeRate);
    }
    return total;
  }, 0);

  const addRow = () => {
    setMethods((prev) => [
      ...prev,
      { id: `pm-${Date.now()}`, name: "Otro", amountMajor: "", currency: baseCurrency },
    ]);
  };

  const updateRow = (id: string, field: keyof PaymentMethodRow, value: string) => {
    setMethods((prev) =>
      prev.map((m) => m.id === id ? { ...m, [field]: value } : m)
    );
  };

  const removeRow = (id: string) => {
    if (methods.length <= 1) return;
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !businessId) return;
    let paymentMethods;
    try {
      paymentMethods = methods
      .filter((m) => m.amountMajor.trim() !== "" && rowMinor(m) > 0)
      .map((m, i) => ({
        id: m.id || `pm-${i}`,
        name: m.name || "Pago",
        amountMinor: rowMinor(m),
        currency: m.currency,
        urlSuport: undefined as string | undefined,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Monto inválido");
      return;
    }
    if (paymentMethods.length === 0) {
      toast.error("Indica al menos un método de pago con monto.");
      return;
    }
    if (totalBaseMinor !== invoice.totalBaseMinor) {
      toast.error(
        `El pago debe completar exactamente ${formatMinor(invoice.totalBaseMinor, invoice.baseCurrency)}.`
      );
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
            totalPaidMinor: totalBaseMinor,
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
            Factura: {invoice?.clientName || "Sin nombre"} — Total{" "}
            {invoice ? formatMinor(invoice.totalDisplayMinor, invoice.displayCurrency) : "—"}
            <br />
            Tasa: 1 {baseCurrency} = {exchangeRate} {displayCurrency}
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
                  placeholder={`Monto ${m.currency}`}
                  value={m.amountMajor}
                  onChange={(e) => updateRow(m.id, "amountMajor", e.target.value)}
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
            Total equivalente: {formatMinor(totalBaseMinor, baseCurrency)}
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
