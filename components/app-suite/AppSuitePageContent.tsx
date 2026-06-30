"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import {
  APP_SUITE_CATEGORIES,
  APP_SUITE_MODULES,
  getAppRoute,
  type AppSuiteCategory,
  type AppSuiteModule,
} from "@/lib/data/appSuiteApps";
import { AppSuiteAppCard } from "@/components/app-suite/AppSuiteAppCard";
import { AppSuiteDetailDialog } from "@/components/app-suite/AppSuiteDetailDialog";
import { PackageOpen, Search } from "lucide-react";
import { toast } from "sonner";

export function AppSuitePageContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { hasApp, installApp, uninstallApp, effectiveInstalledApps } = useBusinessApps(businessId);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<AppSuiteCategory>("All");
  const [selectedApp, setSelectedApp] = useState<AppSuiteModule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);

  const installedCount = effectiveInstalledApps.length;

  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return APP_SUITE_MODULES.filter((app) => {
      const matchesCategory = category === "All" || app.category === category;
      const matchesSearch =
        !query ||
        app.title.toLowerCase().includes(query) ||
        app.tagline.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.audience.toLowerCase().includes(query) ||
        app.categoryLabel.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, category]);

  const handleOpenDetails = useCallback((app: AppSuiteModule) => {
    setSelectedApp(app);
    setDialogOpen(true);
  }, []);

  const handleOpenModule = useCallback(
    (app: AppSuiteModule) => {
      const route = getAppRoute(businessId, app);
      if (!route) return;
      toast.success(`Abriendo ${app.title}…`);
      router.push(route);
    },
    [businessId, router]
  );

  const handleInstall = useCallback(
    async (app: AppSuiteModule) => {
      if (!canEditCurrentBusiness()) {
        toast.error("No tienes permiso para instalar apps");
        return;
      }
      setBusyAppId(app.id);
      await installApp(app.id);
      setBusyAppId(null);
    },
    [canEditCurrentBusiness, installApp]
  );

  const handleUninstall = useCallback(
    async (app: AppSuiteModule) => {
      if (!canEditCurrentBusiness()) {
        toast.error("No tienes permiso para desinstalar apps");
        return;
      }
      setBusyAppId(app.id);
      await uninstallApp(app.id);
      setBusyAppId(null);
    },
    [canEditCurrentBusiness, uninstallApp]
  );

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No tienes permiso para ver la suite de aplicaciones de este negocio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-10 text-center md:text-left">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 md:justify-between">
          <div />
          <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {installedCount} apps instaladas
          </Badge>
        </div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight text-foreground sm:text-5xl">
          Diseña tu ecosistema{" "}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            empresarial
          </span>
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Instala los módulos que necesitas. El menú mostrará solo las apps activas; en el resto del
          ERP verás funciones deshabilitadas con indicación de qué app las habilita.
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar aplicaciones"
            placeholder="Buscar por aplicación, función o público objetivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
          <span className="mr-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:inline">
            Categorías:
          </span>
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(value) => {
              if (value) setCategory(value as AppSuiteCategory);
            }}
            className="flex flex-wrap justify-start gap-2"
          >
            {APP_SUITE_CATEGORIES.map((cat) => (
              <ToggleGroupItem
                key={cat.value}
                value={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                className="rounded-xl px-4 py-2 text-sm"
                aria-label={cat.label}
              >
                {cat.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No se encontraron aplicaciones</h3>
          <p className="mx-auto mt-1 max-w-md text-muted-foreground">
            Intenta ajustando tu término de búsqueda o seleccionando otra categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((app) => (
            <AppSuiteAppCard
              key={app.id}
              app={app}
              isInstalled={hasApp(app.id)}
              canManageApps={canEditCurrentBusiness()}
              installing={busyAppId === app.id}
              onOpenDetails={handleOpenDetails}
              onOpenModule={handleOpenModule}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
            />
          ))}
        </div>
      )}

      <AppSuiteDetailDialog
        app={selectedApp}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isInstalled={selectedApp ? hasApp(selectedApp.id) : false}
        canManageApps={canEditCurrentBusiness()}
        installing={selectedApp ? busyAppId === selectedApp.id : false}
        onOpenModule={handleOpenModule}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
      />
    </div>
  );
}
