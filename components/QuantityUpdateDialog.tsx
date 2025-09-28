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
import { InventoryItem } from "@/lib/interfases";

interface QuantityUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export default function QuantityUpdateDialog({
  isOpen,
  onClose,
  item,
  onSuccess,
}: QuantityUpdateDialogProps) {
  const [newQuantity, setNewQuantity] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !newQuantity || !concept.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("La cantidad debe ser un número válido mayor o igual a 0");
      return;
    }

    setIsLoading(true);
    try {
      await fetchApiV1({
        query: queries.updateItemQuantity,
        type: "json",
        variables: {
          args: {
            itemId: item._id,
            newQuantity: quantity,
            concept: concept.trim(),
          },
        },
      });

      toast.success("Cantidad actualizada correctamente");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      toast.error("Error al actualizar la cantidad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewQuantity("");
    setConcept("");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Cantidad</DialogTitle>
          <DialogDescription>
            Modifica la cantidad del producto: {item?.code} - {item?.description}
            <br />
            <span className="text-sm text-muted-foreground">
              Cantidad actual: {item?.quantity}
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newQuantity">Nueva Cantidad</Label>
            <Input
              id="newQuantity"
              type="number"
              step="0.01"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="Ingresa la nueva cantidad"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Describe el motivo del cambio (ej: Ajuste de inventario, Venta, Compra, etc.)"
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
