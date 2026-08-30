"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppSuiteModule } from "@/lib/data/appSuiteApps";
import { isAppAvailable } from "@/lib/data/appSuiteApps";
import { Info, Star, Users } from "lucide-react";

type AppSuiteAppCardProps = {
  app: AppSuiteModule;
  isInstalled: boolean;
  isSelected?: boolean;
  canManageApps: boolean;
  installing?: boolean;
  onSelect: (app: AppSuiteModule) => void;
  onOpenDetails: (app: AppSuiteModule) => void;
  onOpenModule: (app: AppSuiteModule) => void;
  onInstall: (app: AppSuiteModule) => void;
};

export function AppSuiteAppCard({
  app,
  isInstalled,
  isSelected,
  canManageApps,
  installing,
  onSelect,
  onOpenDetails,
  onOpenModule,
  onInstall,
}: AppSuiteAppCardProps) {
  const hasRoute = isAppAvailable(app);
  const Icon = app.icon;

  return (
    <div
      onClickCapture={() => onSelect(app)}
      aria-selected={isSelected}
      className={cn(
        "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border",
        "bg-card/60 p-2 md:p-2.5 lg:p-3 !pt-4 shadow-sm backdrop-blur-sm transition-all duration-300",
        "hover:border-border/80 hover:bg-card/80 hover:shadow-md",
        isInstalled && !isSelected && "border-emerald-500/30",
        isSelected &&
        "border-primary ring-2 ring-primary/40 bg-card shadow-md hover:border-primary hover:bg-card"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent transition-opacity duration-300",
          isSelected ? "opacity-100 from-primary/10" : "opacity-0 group-hover:opacity-100"
        )}
      />

      <div>
        <div className="mb-2 flex items-start justify-between md:mb-2.5 lg:mb-3 xl:mb-5">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr shadow-lg transition-transform duration-300 group-hover:scale-105",
              app.iconGradient
            )}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex flex-col items-end gap-0.5 md:gap-1 lg:gap-1 xl:gap-1.5">
            {isInstalled && (
              <Badge className="bg-emerald-600 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 fixed top-0.5 left-0.5">
                Instalada
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              {app.categoryLabel}
            </Badge>
            <div className="flex items-center gap-0.5 text-xs text-amber-500 dark:text-amber-400 md:gap-1 xl:gap-1.5">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-bold">{app.rating}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
          {app.title}
        </h3>
        <p className="text-xs font-semibold text-primary/90">
          {app.tagline}
        </p>
        <p className="line-clamp-2 leading-4 text-sm leading-relaxed text-muted-foreground my-1 md:my-2 lg:my-2.5 xl:my-3">
          {app.description}
        </p>

        <div className="flex items-start gap-1 rounded-xl border border-border/60 bg-muted/40 p-1.5 md:gap-1.5 md:p-2 xl:gap-2 xl:p-4">
          <Users className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <p className="text-[11px] font-medium leading-tight text-muted-foreground">
            <span className="text-foreground">Público:</span> {app.audience}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 border-t border-border/60 pt-2 md:gap-2 md:pt-2.5 lg:pt-3 xl:gap-3 xl:pt-5">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1.5 text-xs font-bold md:px-2.5 md:py-2 lg:px-3 xl:px-4 xl:py-2.5"
          onClick={() => onOpenDetails(app)}
        >
          Detalles
          <Info className="ml-1 h-3 w-3 md:ml-1.5 xl:ml-2" />
        </Button>

        <div className="flex items-center gap-1.5 md:gap-2 xl:gap-2.5">
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
          {!isInstalled && (
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
