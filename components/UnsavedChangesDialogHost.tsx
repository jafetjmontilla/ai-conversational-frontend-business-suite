"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { registerUnsavedChangesDialog } from "@/lib/unsavedChangesGuard";

const DEFAULT_TITLE = "¿Descartar cambios?";

export function UnsavedChangesDialogHost() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    return registerUnsavedChangesDialog((message) => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setDescription(message);
        setOpen(true);
      });
    });
  }, []);

  const finish = (confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish(false);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{DEFAULT_TITLE}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => finish(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={() => finish(true)}>
            Salir sin guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
