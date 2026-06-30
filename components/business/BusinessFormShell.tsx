"use client";

import type { ReactNode } from "react";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FullViewportDialogContent } from "@/components/FullViewportDialogContent";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BUSINESS_FORM_TABS = [
  { value: "identity", label: "Identidad" },
  { value: "contact", label: "Contacto" },
  { value: "regional", label: "Regional" },
  { value: "billing", label: "Facturación" },
] as const;

interface BusinessFormShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: () => void;
  identityContent: ReactNode;
  children: ReactNode;
}

export function BusinessFormShell({
  isOpen,
  onClose,
  title,
  description,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  identityContent,
  children,
}: BusinessFormShellProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FullViewportDialogContent>
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <Tabs defaultValue="identity" className="flex min-h-0 flex-1 flex-col">
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap justify-start gap-2 rounded-none border-0 bg-transparent p-0"
            >
              {BUSINESS_FORM_TABS.map(({ value, label }) => (
                <TabsTrigger key={value} variant="line" value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TabsContent value="identity" className="space-y-3 pt-3">
                {identityContent}
              </TabsContent>
              {children}
            </div>
          </Tabs>
          <DialogFooter className="shrink-0 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </FullViewportDialogContent>
    </Dialog>
  );
}
