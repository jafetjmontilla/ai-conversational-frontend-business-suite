"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import type { Business, BusinessConfig } from "@/lib/interfases";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const defaultUserMemory = {
  enabled: false,
  maxFacts: 10,
  maxFactLength: 200,
  maxTotalCharsInjected: 1500,
  extractOnMessage: false,
};

const defaultRagSearch = {
  rerank: "none" as const,
  mmrLambda: 0.5,
  candidateMultiplier: 10,
};

const defaultCommerceFlow = {
  enabled: false,
};

const defaultConfig: BusinessConfig = {
  conversationTimeout: 30,
  messageLimit: 100,
  personality: { tone: "casual", language: "es", customInstructions: "" },
  knowledgeSources: [],
  globalResponses: {},
  tools: [],
  dataProviders: [],
  userMemory: { ...defaultUserMemory },
  ragSearch: { ...defaultRagSearch },
  commerceFlow: { ...defaultCommerceFlow },
};

const dataProviderAuthSchema = z.object({
  type: z.enum(["header", "bearer"]),
  headerName: z.string().optional(),
  apiKey: z.string().optional(),
});

const dataProviderSchema = z
  .object({
    id: z.string().min(1, "Indica un Id único (ej. mi-api). Es el que enlazan las herramientas."),
    kind: z.enum(["rest", "graphql"]),
    baseUrl: z.string().optional().or(z.literal("")),
    endpoint: z.string().optional().or(z.literal("")),
    auth: dataProviderAuthSchema.optional(),
  })
  .superRefine((p, ctx) => {
    if (p.kind === "rest" && !(p.baseUrl ?? "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "REST requiere Base URL", path: ["baseUrl"] });
    } else if (p.kind === "rest" && (p.baseUrl ?? "").trim()) {
      try {
        z.string().url().parse((p.baseUrl ?? "").trim());
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL no válida", path: ["baseUrl"] });
      }
    }
    if (p.kind === "graphql" && !(p.endpoint ?? "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GraphQL requiere Endpoint", path: ["endpoint"] });
    } else if (p.kind === "graphql" && (p.endpoint ?? "").trim()) {
      try {
        z.string().url().parse((p.endpoint ?? "").trim());
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL no válida", path: ["endpoint"] });
      }
    }
  });

const toolSchema = z.object({
  name: z.string().min(1, "Nombre de herramienta obligatorio"),
  description: z.string().min(1, "Descripción de herramienta obligatoria"),
  params: z.array(z.string()).optional(),
  providerId: z.string().optional(),
  restMethod: z.enum(["POST", "GET", "PUT", "PATCH", "DELETE"]),
  restPath: z.string().optional(),
});

const knowledgeSourceSchema = z.object({
  sourceId: z.string().min(1, "sourceId de la fuente obligatorio"),
  name: z.string().min(1, "Nombre de la fuente obligatorio"),
  roles: z.array(z.string()),
});

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null || typeof val === "undefined" ? undefined : val;

const formSchema = z.object({
  conversationTimeout: z.coerce.number().min(1).max(1440),
  messageLimit: z.preprocess(emptyToUndefined, z.coerce.number().min(1).max(1000).optional()),
  personality: z.object({
    tone: z.string().min(1, "Tono obligatorio"),
    language: z.string().min(1, "Idioma obligatorio"),
    customInstructions: z.string().optional(),
  }),
  globalResponses: z.object({
    greeting: z.string().optional(),
    goodbye: z.string().optional(),
    noData: z.string().optional(),
    noReplyWithoutRag: z.boolean().optional(),
  }),
  knowledgeSources: z.array(knowledgeSourceSchema),
  tools: z.array(toolSchema),
  dataProviders: z.array(dataProviderSchema),
  userMemory: z.object({
    enabled: z.boolean(),
    maxFacts: z.coerce.number().min(1).max(50),
    maxFactLength: z.coerce.number().min(20).max(2000),
    maxTotalCharsInjected: z.coerce.number().min(200).max(8000),
    extractOnMessage: z.boolean(),
  }),
  ragSearch: z.object({
    rerank: z.enum(["none", "mmr"]),
    mmrLambda: z.coerce.number().min(0).max(1),
    candidateMultiplier: z.coerce.number().min(1).max(20),
    maxL2Distance: z.preprocess(emptyToUndefined, z.coerce.number().min(0.01).max(20).optional()),
  }),
  commerceFlow: z.object({
    enabled: z.boolean(),
  }),
})
  .superRefine((data, ctx) => {
    const ids = new Set(data.dataProviders.map((p) => p.id.trim()).filter(Boolean));
    if (ids.size === 0) return;
    data.tools.forEach((t, i) => {
      if (!t.name?.trim()) return;
      const pid = t.providerId?.trim();
      if (!pid || !ids.has(pid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seleccione un proveedor",
          path: ["tools", i, "providerId"],
        });
      }
    });
  });

type FormValues = z.infer<typeof formSchema>;

/** Segmento de ruta legible (Proveedor 1, Herramienta 2, etc.). */
function humanizeErrorPathSegment(segment: string, parentSegment: string | undefined): string {
  if (/^\d+$/.test(segment)) {
    const n = parseInt(segment, 10) + 1;
    if (parentSegment === "dataProviders") return `Proveedor ${n}`;
    if (parentSegment === "tools") return `Herramienta ${n}`;
    if (parentSegment === "knowledgeSources") return `Fuente ${n}`;
    return `#${n}`;
  }
  const map: Record<string, string> = {
    dataProviders: "Proveedores",
    tools: "Herramientas",
    knowledgeSources: "Fuentes",
    personality: "Personalidad",
    globalResponses: "Respuestas",
    conversationTimeout: "Timeout",
    messageLimit: "Límite de mensajes",
    id: "Id",
    name: "Nombre",
    description: "Descripción",
    sourceId: "sourceId",
    providerId: "Proveedor (herramienta)",
    restMethod: "Método REST",
    restPath: "Ruta REST",
    baseUrl: "Base URL",
    endpoint: "Endpoint",
    auth: "Autenticación",
    ragSearch: "RAG",
    maxL2Distance: "Máx. distancia L2",
  };
  return map[segment] ?? segment;
}

/** Primer error con ruta en español para el toast. */
function firstFieldErrorMessage(errors: FieldErrors<FormValues>): string | undefined {
  function walk(node: unknown, path: string[]): string | undefined {
    if (!node || typeof node !== "object") return undefined;
    const rec = node as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message) {
      const parts = path.map((seg, i) => humanizeErrorPathSegment(seg, i === 0 ? undefined : path[i - 1]));
      const prefix = parts.length ? `${parts.join(" › ")}: ` : "";
      return `${prefix}${rec.message}`;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const found = walk(node[i], [...path, String(i)]);
        if (found) return found;
      }
      return undefined;
    }
    for (const key of Object.keys(rec)) {
      const v = rec[key];
      if (v != null && typeof v === "object") {
        const found = walk(v, [...path, key]);
        if (found) return found;
      }
    }
    return undefined;
  }
  return walk(errors, []);
}

function normalizeRerank(v: string | null | undefined): "none" | "mmr" {
  if (v === "mmr") return "mmr";
  return "none";
}

function mergeWithDefault(config: Partial<BusinessConfig> | null | undefined): BusinessConfig {
  if (!config) return defaultConfig;
  const um = config.userMemory;
  const rs = config.ragSearch;
  const cf = config.commerceFlow;
  return {
    conversationTimeout: config.conversationTimeout ?? defaultConfig.conversationTimeout,
    messageLimit: config.messageLimit ?? defaultConfig.messageLimit,
    personality: {
      ...defaultConfig.personality,
      ...config.personality,
    },
    knowledgeSources: config.knowledgeSources ?? [],
    globalResponses: config.globalResponses ?? {},
    tools: config.tools ?? [],
    dataProviders: config.dataProviders ?? [],
    userMemory: {
      enabled: um?.enabled ?? defaultUserMemory.enabled,
      maxFacts: um?.maxFacts ?? defaultUserMemory.maxFacts,
      maxFactLength: um?.maxFactLength ?? defaultUserMemory.maxFactLength,
      maxTotalCharsInjected: um?.maxTotalCharsInjected ?? defaultUserMemory.maxTotalCharsInjected,
      extractOnMessage: um?.extractOnMessage ?? defaultUserMemory.extractOnMessage,
    },
    ragSearch: {
      rerank: normalizeRerank(rs?.rerank),
      mmrLambda: rs?.mmrLambda ?? defaultRagSearch.mmrLambda,
      candidateMultiplier: rs?.candidateMultiplier ?? defaultRagSearch.candidateMultiplier,
      maxL2Distance: rs?.maxL2Distance,
    },
    commerceFlow: {
      enabled: cf?.enabled ?? defaultCommerceFlow.enabled,
    },
  };
}

export default function BusinessConfigPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { meData } = useAuth();
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  /** Texto pegado por proveedor (solo UI; no se guarda en BD). */
  const [providerDocSnippets, setProviderDocSnippets] = useState<string[]>([]);
  const [parsingProviderIndex, setParsingProviderIndex] = useState<number | null>(null);
  /** Texto pegado por herramienta para extraer con IA (solo UI). */
  const [toolDocSnippets, setToolDocSnippets] = useState<string[]>([]);
  const [parsingToolIndex, setParsingToolIndex] = useState<number | null>(null);
  /** JSON de parámetros por herramienta para la prueba (solo UI). */
  const [toolTestParamsJson, setToolTestParamsJson] = useState<string[]>([]);
  const [runningToolTestIndex, setRunningToolTestIndex] = useState<number | null>(null);
  const [testToolDialog, setTestToolDialog] = useState<{
    open: boolean;
    title: string;
    body: string;
    isError: boolean;
  }>({ open: false, title: "", body: "", isError: false });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      conversationTimeout: defaultConfig.conversationTimeout,
      messageLimit: defaultConfig.messageLimit,
      personality: defaultConfig.personality,
      globalResponses: { ...defaultConfig.globalResponses, noReplyWithoutRag: false },
      knowledgeSources: [],
      tools: [],
      dataProviders: [],
      userMemory: { ...defaultUserMemory },
      ragSearch: { ...defaultRagSearch },
      commerceFlow: { ...defaultCommerceFlow },
    },
  });

  useEffect(() => {
    if (!businessId) return;
    const isMyBusiness = meData?.business && (meData.business.businessId === businessId || meData.business._id === businessId);
    const load = async () => {
      try {
        let b: Business | null = null;
        if (isMyBusiness && meData?.business) {
          b = meData.business as Business;
        }
        if (!b) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { id: businessId },
          })) as Business | null;
        }
        if (!b && businessId) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          })) as Business | null;
        }
        if (b) {
          setBusiness(b);
          const cfg = mergeWithDefault(b.config);
          form.reset({
            conversationTimeout: cfg.conversationTimeout,
            messageLimit: cfg.messageLimit,
            personality: cfg.personality,
            globalResponses: {
              greeting: cfg.globalResponses?.greeting,
              goodbye: cfg.globalResponses?.goodbye,
              noData: cfg.globalResponses?.noData,
              noReplyWithoutRag: cfg.globalResponses?.noReplyWithoutRag ?? false,
            },
            knowledgeSources: cfg.knowledgeSources ?? [],
            tools: (cfg.tools ?? []).map((t) => ({
              name: t.name,
              description: t.description,
              params: t.params ?? [],
              providerId: t.providerId ?? "",
              restMethod: (t.restMethod ?? "POST") as "POST" | "GET" | "PUT" | "PATCH" | "DELETE",
              restPath: t.restPath ?? "",
            })),
            dataProviders: (cfg.dataProviders ?? []).map((p) => ({
              id: p.id,
              kind: p.kind,
              baseUrl: p.baseUrl ?? "",
              endpoint: p.endpoint ?? "",
              auth: { type: p.auth?.type ?? "bearer", headerName: p.auth?.headerName ?? "", apiKey: "" },
            })),
            userMemory: { ...defaultUserMemory, ...cfg.userMemory },
            ragSearch: { ...defaultRagSearch, ...cfg.ragSearch },
            commerceFlow: { ...defaultCommerceFlow, ...cfg.commerceFlow },
          });
          setProviderDocSnippets(Array((cfg.dataProviders ?? []).length).fill(""));
          setToolDocSnippets(Array((cfg.tools ?? []).length).fill(""));
          setToolTestParamsJson(Array((cfg.tools ?? []).length).fill("{}"));
        } else {
          toast.error("Negocio no encontrado");
          router.push("/businesses");
        }
      } catch (e) {
        toast.error("Error al cargar la configuración");
        router.push("/businesses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId, meData?.business]);

  const onSubmit = async (values: FormValues) => {
    if (!business) return;
    setSaving(true);
    try {
      const config = {
        conversationTimeout: values.conversationTimeout,
        messageLimit: values.messageLimit ?? 100,
        personality: values.personality,
        knowledgeSources: values.knowledgeSources,
        globalResponses: {
          ...values.globalResponses,
          noReplyWithoutRag: values.globalResponses.noReplyWithoutRag === true,
        },
        tools: values.tools.map((t) => ({
          name: t.name.trim(),
          description: t.description.trim(),
          params: t.params ?? [],
          ...(t.providerId?.trim() ? { providerId: t.providerId.trim() } : {}),
          ...(t.restMethod && t.restMethod !== "POST" ? { restMethod: t.restMethod } : {}),
          ...(t.restPath?.trim() ? { restPath: t.restPath.trim() } : {}),
        })),
        dataProviders: values.dataProviders.map((p) => ({
          id: p.id,
          kind: p.kind,
          baseUrl: p.kind === "rest" ? (p.baseUrl?.trim() || undefined) : undefined,
          endpoint: p.kind === "graphql" ? (p.endpoint?.trim() || undefined) : undefined,
          auth: p.auth?.type ? { type: p.auth.type, headerName: p.auth.headerName || undefined, apiKey: p.auth.apiKey?.trim() || undefined } : undefined,
        })),
        userMemory: {
          enabled: values.userMemory.enabled,
          maxFacts: values.userMemory.maxFacts,
          maxFactLength: values.userMemory.maxFactLength,
          maxTotalCharsInjected: values.userMemory.maxTotalCharsInjected,
          extractOnMessage: values.userMemory.extractOnMessage,
        },
        ragSearch: {
          rerank: values.ragSearch.rerank,
          mmrLambda: values.ragSearch.mmrLambda,
          candidateMultiplier: values.ragSearch.candidateMultiplier,
          ...(typeof values.ragSearch.maxL2Distance === "number" && Number.isFinite(values.ragSearch.maxL2Distance)
            ? { maxL2Distance: values.ragSearch.maxL2Distance }
            : {}),
        },
        commerceFlow: {
          enabled: values.commerceFlow.enabled,
        },
      };
      await fetchApiV1({
        query: queries.updateBusiness,
        type: "json",
        variables: {
          id: business._id,
          args: { config },
        },
      });
      toast.success("Configuración guardada");
      setBusiness((prev) => (prev ? { ...prev, config } : null));
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error al guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onSubmitInvalid = (errors: FieldErrors<FormValues>) => {
    const msg =
      firstFieldErrorMessage(errors) ??
      "Revisa los campos obligatorios en todas las pestañas (p. ej. Herramientas: cada herramienta debe usar un Id de proveedor existente).";
    toast.error("No se puede guardar", { description: msg });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!business) return null;

  if (!canEditCurrentBusiness()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para editar la configuración de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver a Negocios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Configuración del negocio</CardTitle>
          <CardDescription>
            {business.name} — Parámetros usados por el worker (conversaciones, personalidad, fuentes RAG, herramientas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="flex w-full flex-wrap gap-1 h-auto min-h-10">
                  <TabsTrigger value="general" className="flex-1 min-w-[5.5rem]">
                    General
                  </TabsTrigger>
                  <TabsTrigger value="personality" className="flex-1 min-w-[5.5rem]">
                    Personalidad
                  </TabsTrigger>
                  <TabsTrigger value="responses" className="flex-1 min-w-[5.5rem]">
                    Respuestas
                  </TabsTrigger>
                  <TabsTrigger value="sources" className="flex-1 min-w-[5.5rem]">
                    Fuentes
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="flex-1 min-w-[5.5rem]">
                    Herramientas
                  </TabsTrigger>
                  <TabsTrigger value="providers" className="flex-1 min-w-[5.5rem]">
                    Proveedores
                  </TabsTrigger>
                  <TabsTrigger value="memory-rag" className="flex-1 min-w-[6.5rem]">
                    Memoria / RAG
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="conversationTimeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeout de conversación (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={1440} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="messageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Límite de mensajes por conversación (opcional)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={1000} {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="personality" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="personality.tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tono</FormLabel>
                        <FormControl>
                          <Input placeholder="ej. casual, formal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personality.language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <FormControl>
                          <Input placeholder="ej. es, en" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personality.customInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrucciones personalizadas</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Instrucciones adicionales para el asistente" className="resize-none min-h-[100px]" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="responses" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="globalResponses.greeting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saludo inicial</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Mensaje de bienvenida" className="resize-none" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="globalResponses.goodbye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Despedida</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Mensaje de despedida" className="resize-none" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="globalResponses.noData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sin datos</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Cuando no hay información disponible" className="resize-none" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="globalResponses.noReplyWithoutRag"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 gap-4">
                        <div className="space-y-0.5">
                          <FormLabel>No responder sin RAG</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Si está activo, cuando la búsqueda en la base de conocimiento no devuelve resultados (y la
                            intención es consulta de negocio), el agente no envía ningún mensaje ni el texto de «Sin datos».
                            No aplica si hay flujo de venta con herramientas que omiten ese comportamiento.
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="sources" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="knowledgeSources"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuentes de conocimiento (RAG)</FormLabel>
                        {field.value.map((_, i) => (
                          <div key={i} className="flex flex-wrap gap-2 items-end rounded-lg border p-3 mb-2">
                            <FormField
                              control={form.control}
                              name={`knowledgeSources.${i}.sourceId`}
                              render={({ field: f }) => (
                                <FormItem className="flex-1 min-w-[120px]">
                                  <FormLabel className="text-xs">sourceId</FormLabel>
                                  <FormControl>
                                    <Input placeholder="id" {...f} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`knowledgeSources.${i}.name`}
                              render={({ field: f }) => (
                                <FormItem className="flex-1 min-w-[120px]">
                                  <FormLabel className="text-xs">Nombre</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nombre" {...f} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`knowledgeSources.${i}.roles`}
                              render={({ field: f }) => (
                                <FormItem className="flex-1 min-w-[160px]">
                                  <FormLabel className="text-xs">Roles (separados por coma)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="rol1, rol2"
                                      {...f}
                                      value={Array.isArray(f.value) ? f.value.join(", ") : ""}
                                      onChange={(e) => f.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => form.setValue("knowledgeSources", field.value.filter((_, j) => j !== i))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("knowledgeSources", [...field.value, { sourceId: "", name: "", roles: [] }])}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Añadir fuente
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="tools" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    En cada herramienta puede pegar un fragmento de documentación, un curl, cabeceras HTTP o una query GraphQL y usar{" "}
                    <span className="font-medium text-foreground">Extraer con IA</span> para rellenar nombre, descripción y parámetros. Elija el proveedor de datos a mano.
                  </p>
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                    <FormField
                      control={form.control}
                      name="commerceFlow.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <FormLabel>Flujo de venta conversacional</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Activa etapas de checkout en el worker (metadata de conversación, filtrado de herramientas por
                              etapa, sin caché de respuestas con datos en vivo). Requiere herramientas y proveedores
                              configurados.
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="tools"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Herramientas (el modelo puede llamarlas para datos en tiempo real)</FormLabel>
                        {field.value.map((_, i) => (
                          <div key={i} className="rounded-lg border p-3 mb-2 space-y-2">
                            <div className="flex gap-2 items-end flex-wrap">
                              <FormField
                                control={form.control}
                                name={`tools.${i}.name`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1 min-w-[120px]">
                                    <FormLabel className="text-xs">Nombre</FormLabel>
                                    <FormControl>
                                      <Input placeholder="ej. get_saldo" {...f} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`tools.${i}.description`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-[2] min-w-[180px]">
                                    <FormLabel className="text-xs">Descripción</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Descripción para el modelo" {...f} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`tools.${i}.providerId`}
                                render={({ field: f }) => (
                                  <FormItem className="min-w-[140px] max-w-[200px]">
                                    <FormLabel className="text-xs">Proveedor</FormLabel>
                                    <FormControl>
                                      <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
                                        value={f.value ?? ""}
                                        onChange={(e) => f.onChange(e.target.value)}
                                      >
                                        <option value="">—</option>
                                        {form.watch("dataProviders").map((p) =>
                                          p.id.trim() ? (
                                            <option key={`${p.id}-${p.kind}`} value={p.id.trim()}>
                                              {p.id.trim()}
                                            </option>
                                          ) : null
                                        )}
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  form.setValue(
                                    "tools",
                                    field.value.filter((_, j) => j !== i)
                                  );
                                  setToolDocSnippets((prev) => prev.filter((_, j) => j !== i));
                                  setToolTestParamsJson((prev) => prev.filter((_, j) => j !== i));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {(() => {
                              const dps = form.watch("dataProviders");
                              const pid = form.watch(`tools.${i}.providerId`)?.trim();
                              const prov = dps.find((p) => p.id.trim() === pid);
                              if (prov?.kind !== "rest") return null;
                              return (
                                <div className="w-full flex flex-wrap gap-2 items-end rounded-md border border-border/60 bg-muted/10 p-3">
                                  <FormField
                                    control={form.control}
                                    name={`tools.${i}.restMethod`}
                                    render={({ field: f }) => (
                                      <FormItem className="min-w-[160px] max-w-[220px]">
                                        <FormLabel className="text-xs">Método REST</FormLabel>
                                        <FormControl>
                                          <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
                                            value={f.value}
                                            onChange={(e) =>
                                              f.onChange(e.target.value as "POST" | "GET" | "PUT" | "PATCH" | "DELETE")
                                            }
                                          >
                                            <option value="POST">POST (proxy tool_request)</option>
                                            <option value="GET">GET directo</option>
                                            <option value="PUT">PUT</option>
                                            <option value="PATCH">PATCH</option>
                                            <option value="DELETE">DELETE</option>
                                          </select>
                                        </FormControl>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                          POST usa el proxy estándar (event tool_request). Otros métodos: HTTP directo a
                                          baseUrl + ruta.
                                        </p>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`tools.${i}.restPath`}
                                    render={({ field: f }) => (
                                      <FormItem className="flex-1 min-w-[200px]">
                                        <FormLabel className="text-xs">Ruta bajo baseUrl (opcional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="ej. /api/facturas/{{id}}/"
                                            className="font-mono text-xs"
                                            {...f}
                                            value={f.value ?? ""}
                                          />
                                        </FormControl>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                          Plantillas tipo {'{{id}}'} con parámetros. GET sin ruta: params como query string.
                                        </p>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              );
                            })()}
                            <div className="space-y-2">
                              <FormLabel className="text-xs">Documentación o petición (curl, cabeceras, OpenAPI, GraphQL…)</FormLabel>
                              <Textarea
                                placeholder="Pegue aquí documentación, un curl, cabeceras desde DevTools o el body de una petición…"
                                className="min-h-[88px] font-mono text-xs"
                                value={toolDocSnippets[i] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setToolDocSnippets((prev) => {
                                    const next = [...prev];
                                    next[i] = v;
                                    return next;
                                  });
                                }}
                              />
                              <div className="flex flex-wrap gap-2 items-center">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={parsingToolIndex === i}
                                  onClick={async () => {
                                    const raw = (toolDocSnippets[i] ?? "").trim();
                                    if (!raw) {
                                      toast.error("Pegue documentación o cabeceras primero");
                                      return;
                                    }
                                    setParsingToolIndex(i);
                                    try {
                                      const parsed = (await fetchApiV1({
                                        query: queries.parseToolConfigFromDocumentation,
                                        type: "json",
                                        variables: { rawText: raw },
                                      })) as {
                                        name: string;
                                        description: string;
                                        params: string[];
                                        warnings: string[];
                                      };
                                      form.setValue(`tools.${i}.name`, parsed.name);
                                      form.setValue(`tools.${i}.description`, parsed.description);
                                      form.setValue(`tools.${i}.params`, parsed.params ?? []);
                                      if (parsed.warnings?.length) {
                                        toast.message("Avisos", { description: parsed.warnings.join(" · ") });
                                      }
                                      toast.success("Campos rellenados; revise y elija el proveedor antes de guardar");
                                    } catch (e: unknown) {
                                      const msg =
                                        e && typeof e === "object" && "message" in e
                                          ? String((e as { message: unknown }).message)
                                          : "Error al analizar";
                                      toast.error(msg);
                                    } finally {
                                      setParsingToolIndex(null);
                                    }
                                  }}
                                >
                                  {parsingToolIndex === i ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : null}
                                  Extraer con IA
                                </Button>
                                <span className="text-xs text-muted-foreground">Gemini en el servidor (GEMINI_API_KEY).</span>
                              </div>
                            </div>
                            <FormField
                              control={form.control}
                              name={`tools.${i}.params`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Parámetros (separados por coma)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="param1, param2"
                                      {...f}
                                      value={Array.isArray(f.value) ? (f.value ?? []).join(", ") : ""}
                                      onChange={(e) => f.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="space-y-2 rounded-md border border-dashed p-3 bg-muted/20">
                              <FormLabel className="text-xs">Parámetros JSON para la prueba</FormLabel>
                              <Textarea
                                className="min-h-[72px] font-mono text-xs"
                                placeholder='{}'
                                value={toolTestParamsJson[i] ?? "{}"}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setToolTestParamsJson((prev) => {
                                    const next = [...prev];
                                    next[i] = v;
                                    return next;
                                  });
                                }}
                              />
                              <div className="flex flex-wrap gap-2 items-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    runningToolTestIndex === i ||
                                    !form.watch(`tools.${i}.name`)?.trim() ||
                                    !form.watch(`tools.${i}.providerId`)?.trim()
                                  }
                                  onClick={async () => {
                                    if (!business?._id) return;
                                    const tName = form.getValues(`tools.${i}.name`)?.trim();
                                    if (!tName) {
                                      toast.error("Indique el nombre de la herramienta");
                                      return;
                                    }
                                    if (!form.getValues(`tools.${i}.providerId`)?.trim()) {
                                      toast.error("Seleccione un proveedor");
                                      return;
                                    }
                                    const rawJson = (toolTestParamsJson[i] ?? "{}").trim() || "{}";
                                    setRunningToolTestIndex(i);
                                    try {
                                      const res = (await fetchApiV1({
                                        query: queries.testBusinessTool,
                                        type: "json",
                                        variables: {
                                          businessDocId: business._id,
                                          toolName: tName,
                                          paramsJson: rawJson === "{}" ? null : rawJson,
                                        },
                                      })) as {
                                        ok: boolean;
                                        resultJson?: string | null;
                                        error?: string | null;
                                      };
                                      if (res.ok) {
                                        setTestToolDialog({
                                          open: true,
                                          title: "Respuesta del proveedor",
                                          body: res.resultJson ?? "",
                                          isError: false,
                                        });
                                      } else {
                                        setTestToolDialog({
                                          open: true,
                                          title: "Error al probar la herramienta",
                                          body: res.error ?? "Error desconocido",
                                          isError: true,
                                        });
                                      }
                                    } catch (e: unknown) {
                                      const msg =
                                        e && typeof e === "object" && "message" in e
                                          ? String((e as { message: unknown }).message)
                                          : "Error de red";
                                      toast.error(msg);
                                    } finally {
                                      setRunningToolTestIndex(null);
                                    }
                                  }}
                                >
                                  {runningToolTestIndex === i ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4 mr-1" />
                                  )}
                                  Probar herramienta
                                </Button>
                                <span className="text-xs text-muted-foreground max-w-[18rem]">
                                  Usa la configuración ya guardada en el servidor (guarde antes si cambió proveedor o URL).
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            form.setValue("tools", [
                              ...field.value,
                              {
                                name: "",
                                description: "",
                                params: [],
                                providerId: "",
                                restMethod: "POST",
                                restPath: "",
                              },
                            ]);
                            setToolDocSnippets((prev) => [...prev, ""]);
                            setToolTestParamsJson((prev) => [...prev, "{}"]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Añadir herramienta
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="providers" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Proveedores de datos (REST o GraphQL) a los que el worker llama para ejecutar herramientas. Asocie cada herramienta a un proveedor en la pestaña Herramientas. La API Key se guarda cifrada; deje vacío para no cambiar.
                  </p>
                  <FormField
                    control={form.control}
                    name="dataProviders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedores de datos</FormLabel>
                        {field.value.map((_, i) => (
                          <Card key={i} className="p-4 mb-4 space-y-3">
                            <div className="flex flex-wrap gap-2 items-end">
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.id`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1 min-w-[100px]">
                                    <FormLabel className="text-xs">Id</FormLabel>
                                    <FormControl>
                                      <Input placeholder="ej. banco-api" {...f} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.kind`}
                                render={({ field: f }) => (
                                  <FormItem className="min-w-[120px]">
                                    <FormLabel className="text-xs">Tipo</FormLabel>
                                    <FormControl>
                                      <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        {...f}
                                        onChange={(e) => f.onChange(e.target.value as "rest" | "graphql")}
                                      >
                                        <option value="rest">REST</option>
                                        <option value="graphql">GraphQL</option>
                                      </select>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  form.setValue(
                                    "dataProviders",
                                    field.value.filter((_, j) => j !== i)
                                  );
                                  setProviderDocSnippets((prev) => prev.filter((_, j) => j !== i));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <FormLabel className="text-xs">Documentación (curl, cabeceras HTTP, etc.)</FormLabel>
                              <Textarea
                                placeholder="Pegue aquí un curl de la API o las cabeceras copiadas desde DevTools…"
                                className="min-h-[100px] font-mono text-xs"
                                value={providerDocSnippets[i] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setProviderDocSnippets((prev) => {
                                    const next = [...prev];
                                    next[i] = v;
                                    return next;
                                  });
                                }}
                              />
                              <div className="flex flex-wrap gap-2 items-center">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={parsingProviderIndex === i}
                                  onClick={async () => {
                                    const raw = (providerDocSnippets[i] ?? "").trim();
                                    if (!raw) {
                                      toast.error("Pegue documentación o cabeceras primero");
                                      return;
                                    }
                                    setParsingProviderIndex(i);
                                    try {
                                      if (!form.getValues(`dataProviders.${i}.auth`)) {
                                        form.setValue(`dataProviders.${i}.auth`, {
                                          type: "bearer",
                                          headerName: "",
                                          apiKey: "",
                                        });
                                      }
                                      const parsed = (await fetchApiV1({
                                        query: queries.parseDataProviderConfigFromDocumentation,
                                        type: "json",
                                        variables: { rawText: raw },
                                      })) as {
                                        kind: string;
                                        baseUrl?: string | null;
                                        endpoint?: string | null;
                                        authType: string;
                                        headerName?: string | null;
                                        apiKey?: string | null;
                                        warnings: string[];
                                      };
                                      const kind = parsed.kind === "graphql" ? "graphql" : "rest";
                                      form.setValue(`dataProviders.${i}.kind`, kind);
                                      if (kind === "rest" && parsed.baseUrl?.trim()) {
                                        form.setValue(`dataProviders.${i}.baseUrl`, parsed.baseUrl.trim());
                                        form.setValue(`dataProviders.${i}.endpoint`, "");
                                      }
                                      if (kind === "graphql" && parsed.endpoint?.trim()) {
                                        form.setValue(`dataProviders.${i}.endpoint`, parsed.endpoint.trim());
                                        form.setValue(`dataProviders.${i}.baseUrl`, "");
                                      }
                                      const authType = parsed.authType === "header" ? "header" : "bearer";
                                      form.setValue(`dataProviders.${i}.auth.type`, authType);
                                      if (authType === "header" && parsed.headerName?.trim()) {
                                        form.setValue(`dataProviders.${i}.auth.headerName`, parsed.headerName.trim());
                                      }
                                      if (parsed.apiKey?.trim()) {
                                        form.setValue(`dataProviders.${i}.auth.apiKey`, parsed.apiKey.trim());
                                      }
                                      if (parsed.warnings?.length) {
                                        toast.message("Avisos", { description: parsed.warnings.join(" · ") });
                                      }
                                      toast.success("Campos rellenados; revise URL y credenciales antes de guardar");
                                    } catch (e: unknown) {
                                      const msg =
                                        e && typeof e === "object" && "message" in e
                                          ? String((e as { message: unknown }).message)
                                          : "Error al analizar";
                                      toast.error(msg);
                                    } finally {
                                      setParsingProviderIndex(null);
                                    }
                                  }}
                                >
                                  {parsingProviderIndex === i ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : null}
                                  Extraer con IA
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Usa Gemini en el servidor (GEMINI_API_KEY).
                                </span>
                              </div>
                            </div>
                            {form.watch(`dataProviders.${i}.kind`) === "rest" ? (
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.baseUrl`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Base URL (REST)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="url"
                                        autoComplete="url"
                                        placeholder="https://api.ejemplo.com"
                                        {...f}
                                        value={f.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : (
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.endpoint`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Endpoint (GraphQL)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="url"
                                        autoComplete="url"
                                        placeholder="https://api.ejemplo.com/graphql"
                                        {...f}
                                        value={f.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.auth.type`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Auth tipo</FormLabel>
                                    <FormControl>
                                      <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={f.value ?? "bearer"}
                                        onChange={(e) => {
                                          f.onChange(e.target.value as "header" | "bearer");
                                          if (!form.getValues(`dataProviders.${i}.auth`)) {
                                            form.setValue(`dataProviders.${i}.auth`, { type: e.target.value as "header" | "bearer", headerName: "", apiKey: "" });
                                          }
                                        }}
                                      >
                                        <option value="bearer">Bearer</option>
                                        <option value="header">Header</option>
                                      </select>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              {form.watch(`dataProviders.${i}.auth.type`) === "header" && (
                                <FormField
                                  control={form.control}
                                  name={`dataProviders.${i}.auth.headerName`}
                                  render={({ field: f }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Nombre del header</FormLabel>
                                      <FormControl>
                                        <Input placeholder="X-API-Key" {...f} value={f.value ?? ""} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              )}
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.auth.apiKey`}
                                render={({ field: f }) => (
                                  <FormItem className={form.watch(`dataProviders.${i}.auth.type`) === "header" ? "sm:col-span-2" : ""}>
                                    <FormLabel className="text-xs">API Key (dejar vacío para no cambiar)</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" autoComplete="off" {...f} value={f.value ?? ""} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </Card>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            form.setValue("dataProviders", [
                              ...field.value,
                              {
                                id: `proveedor-${Date.now()}`,
                                kind: "rest" as const,
                                baseUrl: "",
                                endpoint: "",
                                auth: { type: "bearer", headerName: "", apiKey: "" },
                              },
                            ]);
                            setProviderDocSnippets((prev) => [...prev, ""]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Añadir proveedor
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="memory-rag" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Memoria de usuario (worker)</h3>
                    <p className="text-sm text-muted-foreground">
                      Hechos y preferencias persistentes por usuario; se inyectan en el prompt. Activar &quot;Extraer con IA&quot; añade una llamada a Gemini por mensaje para guardar hechos automáticamente.
                    </p>
                    <FormField
                      control={form.control}
                      name="userMemory.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Memoria activa</FormLabel>
                            <p className="text-xs text-muted-foreground">Si está desactivada, el resto de opciones no tiene efecto.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="userMemory.maxFacts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máx. hechos</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={50} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="userMemory.maxFactLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máx. caracteres por hecho</FormLabel>
                            <FormControl>
                              <Input type="number" min={20} max={2000} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="userMemory.maxTotalCharsInjected"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tope total en prompt</FormLabel>
                            <FormControl>
                              <Input type="number" min={200} max={8000} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="userMemory.extractOnMessage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Extraer hechos con IA</FormLabel>
                            <p className="text-xs text-muted-foreground">Coste adicional por mensaje (Gemini).</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Búsqueda RAG (Knowledge-RAG)</h3>
                    <p className="text-sm text-muted-foreground">
                      Re-ranking MMR diversifica los fragmentos devueltos antes de enviarlos al modelo. Solo aplica en el servicio Python de embeddings/FAISS.
                    </p>
                    <FormField
                      control={form.control}
                      name="ragSearch.maxL2Distance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máx. distancia L2 (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0.01}
                              max={20}
                              step={0.01}
                              placeholder="Sin filtro"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(v === "" ? undefined : Number(v));
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            El worker descarta fragmentos con distancia L2 FAISS mayor que este valor (menor = más parecido al
                            mensaje). Si ninguno cumple, cuenta como RAG vacío (encaja con «No responder sin RAG» y con
                            preguntas faq/protocolo en ruta social). Si lo deja vacío, puede usar el valor por defecto del
                            worker <span className="font-mono text-[10px]">RAG_MAX_L2_DISTANCE_DEFAULT</span> en{" "}
                            <span className="font-mono text-[10px]">.env</span>. Revise{" "}
                            <span className="font-mono text-[10px]">bestScore</span> en los logs para calibrar.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ragSearch.rerank"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modo de re-ranking</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value as "none" | "mmr")}
                            >
                              <option value="none">Ninguno (orden FAISS)</option>
                              <option value="mmr">MMR (diversidad)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                      <FormField
                        control={form.control}
                        name="ragSearch.mmrLambda"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lambda MMR (0–1)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} max={1} step={0.05} {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Más alto = más peso a relevancia; más bajo = más diversidad.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ragSearch.candidateMultiplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Multiplicador de candidatos</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={20} {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Candidatos FAISS ≈ topK × este valor (máx. 100).</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar configuración"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog
        open={testToolDialog.open}
        onOpenChange={(open) => setTestToolDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{testToolDialog.title}</DialogTitle>
          </DialogHeader>
          <pre
            className={`text-xs overflow-auto rounded-md border p-3 flex-1 min-h-0 max-h-[55vh] whitespace-pre-wrap break-words ${
              testToolDialog.isError ? "bg-destructive/10 text-destructive" : "bg-muted"
            }`}
          >
            {testToolDialog.body}
          </pre>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setTestToolDialog((d) => ({ ...d, open: false }))}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
