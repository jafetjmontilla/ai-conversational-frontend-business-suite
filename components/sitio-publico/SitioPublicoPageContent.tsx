"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Check, Loader2, Palette, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { getIdToken } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type ThemeTemplate = {
  templateId: string;
  name: string;
  description: string;
  category: string;
  layoutVariants?: Record<string, string>;
  tokens?: {
    colors?: { primary?: string };
    fonts?: { heading?: { family?: string } };
  };
};

type LandingSection = {
  id: string;
  type: string;
  order: number;
  visible: boolean;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaPath?: string;
  items?: { title: string; body?: string }[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/graphql.*$/, "") || "http://localhost:2005";
const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_TENANT_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:3020";

export function SitioPublicoPageContent() {
  const params = useParams();
  const businessSlug = String(params?.businessId || "");
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { business, businessIdDoc, loading: businessLoading } = useBusiness(businessSlug);

  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [publicUrlHint, setPublicUrlHint] = useState<string | null>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [savingLanding, setSavingLanding] = useState(false);

  const publicUrl =
    publicUrlHint ||
    `${PUBLIC_BASE}/t/${business?.businessId || businessSlug}/${business?.language || "es"}`;

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [tplRes, themeRes, landingRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/tenant-theme/templates`, { headers }),
        fetch(`${API_BASE}/api/admin/tenant-theme/${businessIdDoc}`, { headers }),
        fetch(`${API_BASE}/api/admin/landing/${businessIdDoc}`, { headers }),
      ]);
      const tplData = await tplRes.json();
      const themeData = await themeRes.json();
      const landingData = await landingRes.json();
      if (!tplRes.ok) throw new Error(tplData.message || "Error plantillas");
      if (!themeRes.ok) throw new Error(themeData.message || "Error tema");
      if (!landingRes.ok) throw new Error(landingData.message || "Error landing");
      setTemplates(tplData.templates || []);
      setCurrentTemplateId(themeData.theme?.templateId ?? null);
      setPublicUrlHint(themeData.publicUrlHint ?? null);
      setSections(landingData.sections || []);
      setPublished(landingData.published !== false);
    } catch (err: any) {
      toast.error(err.message || "No se pudo cargar el sitio público");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc]);

  useEffect(() => {
    if (businessIdDoc) void load();
  }, [businessIdDoc, load]);

  const applyTemplate = async (templateId: string) => {
    if (!businessIdDoc || !canEditCurrentBusiness) return;
    setApplying(templateId);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/tenant-theme/${businessIdDoc}/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo aplicar");
      setCurrentTemplateId(data.theme?.templateId || templateId);
      toast.success(`Plantilla «${templateId}» aplicada`);
    } catch (err: any) {
      toast.error(err.message || "Error al aplicar plantilla");
    } finally {
      setApplying(null);
    }
  };

  const saveLanding = async () => {
    if (!businessIdDoc || !canEditCurrentBusiness) return;
    setSavingLanding(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/landing/${businessIdDoc}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar");
      setSections(data.sections || sections);
      toast.success("Landing guardada");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar landing");
    } finally {
      setSavingLanding(false);
    }
  };

  const updateSection = (id: string, patch: Partial<LandingSection>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  if (!canViewCurrentBusiness) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Palette className="size-6" />
            Sitio público
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Plantilla visual y contenido de la landing que ven tus clientes.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4 mr-2" />
            Abrir sitio
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">URL pública</CardTitle>
          <CardDescription>Path local o subdominio en producción.</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="text-sm break-all rounded-md bg-muted px-3 py-2 block">{publicUrl}</code>
        </CardContent>
      </Card>

      {businessLoading || loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="size-5 animate-spin" />
          Cargando…
        </div>
      ) : (
        <Tabs defaultValue="theme">
          <TabsList>
            <TabsTrigger value="theme">Plantillas</TabsTrigger>
            <TabsTrigger value="landing">
              <LayoutTemplate className="size-4 mr-1.5" />
              Landing CMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {templates.map((tpl) => {
                const active = currentTemplateId === tpl.templateId;
                const primary = tpl.tokens?.colors?.primary || "221 83% 53%";
                const heading = tpl.tokens?.fonts?.heading?.family || "System";
                return (
                  <Card
                    key={tpl.templateId}
                    className={cn("overflow-hidden", active && "ring-2 ring-primary shadow-md")}
                  >
                    <div className="h-24 relative" style={{ background: `hsl(${primary})` }}>
                      <div className="absolute inset-x-4 bottom-3 rounded-md bg-white/95 px-3 py-2 shadow-sm">
                        <p className="text-xs font-semibold truncate" style={{ fontFamily: heading }}>
                          {business?.name || "Tu marca"}
                        </p>
                      </div>
                      {active ? (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium">
                          <Check className="size-3 text-primary" />
                          Activa
                        </span>
                      ) : null}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tpl.name}</CardTitle>
                      <CardDescription className="line-clamp-3 text-xs">
                        {tpl.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        variant={active ? "secondary" : "default"}
                        disabled={!canEditCurrentBusiness || applying === tpl.templateId || active}
                        onClick={() => applyTemplate(tpl.templateId)}
                      >
                        {applying === tpl.templateId
                          ? "Aplicando…"
                          : active
                            ? "Plantilla activa"
                            : "Usar esta plantilla"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="landing" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={published} onCheckedChange={setPublished} id="published" />
                <Label htmlFor="published">Publicada</Label>
              </div>
              <Button onClick={saveLanding} disabled={!canEditCurrentBusiness || savingLanding}>
                {savingLanding ? "Guardando…" : "Guardar landing"}
              </Button>
            </div>

            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base capitalize">
                      {section.type} <span className="text-muted-foreground text-xs">#{section.order}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Visible</Label>
                      <Switch
                        checked={section.visible !== false}
                        onCheckedChange={(v) => updateSection(section.id, { visible: v })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input
                      value={section.title || ""}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    />
                  </div>
                  {section.type === "hero" ? (
                    <div>
                      <Label className="text-xs">Subtítulo</Label>
                      <Input
                        value={section.subtitle || ""}
                        onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                      />
                    </div>
                  ) : null}
                  <div>
                    <Label className="text-xs">Texto</Label>
                    <Textarea
                      value={section.body || ""}
                      onChange={(e) => updateSection(section.id, { body: e.target.value })}
                      rows={3}
                    />
                  </div>
                  {(section.type === "hero" || section.type === "cta") && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">CTA label</Label>
                        <Input
                          value={section.ctaLabel || ""}
                          onChange={(e) => updateSection(section.id, { ctaLabel: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CTA path</Label>
                        <Input
                          value={section.ctaPath || ""}
                          onChange={(e) => updateSection(section.id, { ctaPath: e.target.value })}
                          placeholder="/catalogo"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
