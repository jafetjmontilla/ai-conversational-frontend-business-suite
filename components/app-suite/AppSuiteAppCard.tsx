"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppSuiteModule } from "@/lib/data/appSuiteApps";
import { isAppAvailable } from "@/lib/data/appSuiteApps";
import { CircleCheck, Info, Star, Users } from "lucide-react";

type AppSuiteAppCardProps = {
  app: AppSuiteModule;
  isInstalled: boolean;
  canManageApps: boolean;
  installing?: boolean;
  onOpenDetails: (app: AppSuiteModule) => void;
  onOpenModule: (app: AppSuiteModule) => void;
  onInstall: (app: AppSuiteModule) => void;
  onUninstall: (app: AppSuiteModule) => void;
};

export function AppSuiteAppCard({
  app,
  isInstalled,
  canManageApps,
  installing,
  onOpenDetails,
  onOpenModule,
  onInstall,
  onUninstall,
}: AppSuiteAppCardProps) {
  const hasRoute = isAppAvailable(app);
  const Icon = app.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border",
        "bg-card/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-300",
        "hover:border-border/80 hover:bg-card/80 hover:shadow-md",
        isInstalled && "border-emerald-500/30"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        <div className="mb-4 flex items-start justify-between">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr shadow-lg transition-transform duration-300 group-hover:scale-105",
              app.iconGradient
            )}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {isInstalled && (
              <Badge className="bg-emerald-600 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600">
                Instalada
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              {app.categoryLabel}
            </Badge>
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-bold">{app.rating}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
          {app.title}
        </h3>
        <p className="mt-1 text-xs font-semibold text-primary/90">{app.tagline}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {app.description}
        </p>

        <div className="mt-4 flex items-start gap-1.5 rounded-xl border border-border/60 bg-muted/40 p-2.5">
          <Users className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <p className="text-[11px] font-medium leading-tight text-muted-foreground">
            <span className="text-foreground">Público:</span> {app.audience}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-3 py-2 text-xs font-bold"
          onClick={() => onOpenDetails(app)}
        >
          Detalles
          <Info className="ml-1.5 h-3 w-3" />
        </Button>

        <div className="flex items-center gap-2">
          {isInstalled && hasRoute && (
            <Button
              size="sm"
              variant="outline"
              className="min-w-[90px] text-xs font-bold"
              onClick={() => onOpenModule(app)}
            >
              Abrir
            </Button>
          )}
          {isInstalled ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={!canManageApps || installing}
              className="min-w-[100px] gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              onClick={() => onUninstall(app)}
            >
              <CircleCheck className="h-3.5 w-3.5" />
              {installing ? "…" : "Activa"}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canManageApps || installing}
              className="min-w-[100px] text-xs font-bold"
              onClick={() => onInstall(app)}
            >
              {installing ? "Instalando…" : app.isBeta ? "Instalar Beta" : hasRoute ? "Instalar" : "Instalar (beta)"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
