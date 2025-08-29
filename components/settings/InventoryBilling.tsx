'use client';

import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Package } from "lucide-react";

interface InventoryBillingProps {
  cardFocusedId?: string;
  setCardFocusedId: (id: string) => void;
}

export default function InventoryBilling({ cardFocusedId, setCardFocusedId }: InventoryBillingProps) {
  return (
    <Card
      id="inventory-card"
      onClick={(e) => {
        e.stopPropagation();
        setCardFocusedId(e.currentTarget.id)
      }}
      className={`${cardFocusedId === "inventory-card" ? "border-accent" : ""}`}
    >
      <CardHeader>
        <CardTitle>Inventario y Facturación</CardTitle>
        <CardDescription>Gestión interna y control financiero</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Módulo de inventario y facturación próximamente disponible</p>
        </div>
      </CardContent>
    </Card>
  );
}
