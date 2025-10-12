"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

interface PWAUpdateDialogProps {
  open: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function PWAUpdateDialog({ open, onUpdate, onDismiss }: PWAUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Nueva Versión Disponible
          </DialogTitle>
          <DialogDescription>
            Hay una nueva versión de la aplicación disponible. Te recomendamos actualizar para obtener las últimas mejoras y correcciones.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">¿Qué incluye esta actualización?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Mejoras de rendimiento</li>
              <li>Correcciones de errores</li>
              <li>Nuevas funcionalidades</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Ahora no
          </Button>
          <Button
            onClick={onUpdate}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

