"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { InventoryItem } from "@/lib/interfases";

interface QuantityUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  /** _id del negocio (Business). */
  businessId: string;
  onSuccess: () => void;
}

export default function QuantityUpdateDialog({
  isOpen,
  onClose,
  item,
  businessId,
  onSuccess,
}: QuantityUpdateDialogProps) {
  const [newQuantity, setNewQuantity] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !businessId || newQuantity === "" || !concept.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    const quantity = parseFloat(newQuantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error("La cantidad debe ser un número mayor o igual a 0");
      return;
    }
    setIsLoading(true);
    try {
      await fetchApiV1({
        query: queries.updateItemQuantity,
        type: "json",
        variables: {
          id: businessId,
          _id: item._id,
          newQuantity: quantity,
          concept: concept.trim(),
        },
      });
      toast.success("Cantidad actualizada");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al actualizar la cantidad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewQuantity("");
    setConcept("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar cantidad</DialogTitle>
          <DialogDescription>
            Producto: {item?.code} — {item?.description}
            <br />
            <span className="text-sm text-muted-foreground">Cantidad actual: {item?.quantity}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newQuantity">Nueva cantidad</Label>
            <Input
              id="newQuantity"
              type="number"
              step="0.01"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="Nueva cantidad"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Motivo del cambio (ej: Ajuste, Venta, Compra)"
              required
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
