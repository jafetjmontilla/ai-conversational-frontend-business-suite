"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AppSuiteModule } from "@/lib/data/appSuiteApps";
import { isAppAvailable } from "@/lib/data/appSuiteApps";
import { CheckCircle2, Star, Users } from "lucide-react";

type AppSuiteDetailDialogProps = {
  app: AppSuiteModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInstalled: boolean;
  canManageApps: boolean;
  installing?: boolean;
  onOpenModule: (app: AppSuiteModule) => void;
  onInstall: (app: AppSuiteModule) => void;
  onUninstall: (app: AppSuiteModule) => void;
};

export function AppSuiteDetailDialog({
  app,
  open,
  onOpenChange,
  isInstalled,
  canManageApps,
  installing,
  onOpenModule,
  onInstall,
  onUninstall,
}: AppSuiteDetailDialogProps) {
  if (!app) return null;

  const hasRoute = isAppAvailable(app);
  const Icon = app.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 sm:rounded-2xl">
        <div className={cn("relative h-32 bg-gradient-to-r", app.iconGradient)}>
          <div className="absolute -bottom-8 left-6">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-tr shadow-lg",
                app.iconGradient
              )}
            >
              <Icon className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-12">
          <DialogHeader className="space-y-0 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {app.categoryLabel}
                </span>
                <DialogTitle className="mt-1 text-2xl">{app.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-sm text-amber-500 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{app.rating}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  ({app.reviews} calificaciones)
                </span>
              </div>
            </div>
          </DialogHeader>

          <p className="mt-4 border-l-2 border-primary pl-3 text-lg font-medium italic text-foreground/90">
            &ldquo;{app.tagline}&rdquo;
          </p>

          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Descripción ampliada
            </h4>
            <p className="mt-1 leading-relaxed text-muted-foreground">{app.description}</p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Público Objetivo Perfecto</h4>
                <p className="mt-1 text-sm text-muted-foreground">{app.audience}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Características Clave
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
              {app.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 sm:justify-between">
            <div>
              <span className="block text-xs text-muted-foreground">Tipo de Licencia</span>
              <span className="text-sm font-semibold text-foreground">
                Gratis durante la Beta / Premium
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {isInstalled && hasRoute && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenModule(app);
                    onOpenChange(false);
                  }}
                >
                  Abrir módulo
                </Button>
              )}
              {isInstalled ? (
                <Button
                  variant="secondary"
                  disabled={!canManageApps || installing}
                  onClick={() => onUninstall(app)}
                >
                  {installing ? "Procesando…" : "Desinstalar"}
                </Button>
              ) : (
                <Button
                  disabled={!canManageApps || installing}
                  onClick={() => onInstall(app)}
                >
                  {installing ? "Instalando…" : "Instalar módulo"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
