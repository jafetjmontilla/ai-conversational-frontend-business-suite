"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHECKOUT_STAGES_META } from "@/lib/billing/checkoutStages";

export function CommerceCheckoutGuide() {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Etapa</TableHead>
            <TableHead>Qué ocurre</TableHead>
            <TableHead className="w-[200px] hidden md:table-cell">Herramientas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CHECKOUT_STAGES_META.map((stage) => (
            <TableRow key={stage.key}>
              <TableCell className="font-medium text-sm">{stage.label}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{stage.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                {stage.toolsHint}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground p-3 border-t bg-muted/30">
        El worker guarda la etapa en metadata.checkout y filtra qué tools ve el modelo. Auditoría en
        Ops → Checkout.
      </p>
    </div>
  );
}
