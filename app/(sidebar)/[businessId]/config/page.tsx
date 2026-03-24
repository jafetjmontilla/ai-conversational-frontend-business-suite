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
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import type { Business, BusinessConfig } from "@/lib/interfases";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
};

const dataProviderAuthSchema = z.object({
  type: z.enum(["header", "bearer"]),
  headerName: z.string().optional(),
  apiKey: z.string().optional(),
});

const dataProviderSchema = z
  .object({
    id: z.string().min(1, "Requerido"),
    kind: z.enum(["rest", "graphql"]),
    baseUrl: z.string().optional().or(z.literal("")),
    endpoint: z.string().optional().or(z.literal("")),
    auth: dataProviderAuthSchema.optional(),
    tools: z.array(z.string()),
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
  name: z.string().min(1, "Requerido"),
  description: z.string().min(1, "Requerido"),
  params: z.array(z.string()).optional(),
});

const knowledgeSourceSchema = z.object({
  sourceId: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  roles: z.array(z.string()),
});

const formSchema = z.object({
  conversationTimeout: z.coerce.number().min(1).max(1440),
  messageLimit: z.coerce.number().min(1).max(1000).optional(),
  personality: z.object({
    tone: z.string().min(1),
    language: z.string().min(1),
    customInstructions: z.string().optional(),
  }),
  globalResponses: z.object({
    greeting: z.string().optional(),
    goodbye: z.string().optional(),
    noData: z.string().optional(),
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
  }),
});

type FormValues = z.infer<typeof formSchema>;

function normalizeRerank(v: string | null | undefined): "none" | "mmr" {
  if (v === "mmr") return "mmr";
  return "none";
}

function mergeWithDefault(config: Partial<BusinessConfig> | null | undefined): BusinessConfig {
  if (!config) return defaultConfig;
  const um = config.userMemory;
  const rs = config.ragSearch;
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      conversationTimeout: defaultConfig.conversationTimeout,
      messageLimit: defaultConfig.messageLimit,
      personality: defaultConfig.personality,
      globalResponses: defaultConfig.globalResponses,
      knowledgeSources: [],
      tools: [],
      dataProviders: [],
      userMemory: { ...defaultUserMemory },
      ragSearch: { ...defaultRagSearch },
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
            globalResponses: cfg.globalResponses ?? {},
            knowledgeSources: cfg.knowledgeSources ?? [],
            tools: cfg.tools ?? [],
            dataProviders: (cfg.dataProviders ?? []).map((p) => ({
              id: p.id,
              kind: p.kind,
              baseUrl: p.baseUrl ?? "",
              endpoint: p.endpoint ?? "",
              auth: { type: p.auth?.type ?? "bearer", headerName: p.auth?.headerName ?? "", apiKey: "" },
              tools: p.tools ?? [],
            })),
            userMemory: { ...defaultUserMemory, ...cfg.userMemory },
            ragSearch: { ...defaultRagSearch, ...cfg.ragSearch },
          });
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
        globalResponses: values.globalResponses,
        tools: values.tools,
        dataProviders: values.dataProviders.map((p) => ({
          id: p.id,
          kind: p.kind,
          baseUrl: p.kind === "rest" ? (p.baseUrl?.trim() || undefined) : undefined,
          endpoint: p.kind === "graphql" ? (p.endpoint?.trim() || undefined) : undefined,
          auth: p.auth?.type ? { type: p.auth.type, headerName: p.auth.headerName || undefined, apiKey: p.auth.apiKey?.trim() || undefined } : undefined,
          tools: p.tools ?? [],
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              <Button type="button" variant="ghost" size="icon" onClick={() => form.setValue("tools", field.value.filter((_, j) => j !== i))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("tools", [...field.value, { name: "", description: "", params: [] }])}
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
                    Proveedores de datos (REST o GraphQL) que ejecutan las herramientas en tiempo real. Cada uno define qué herramientas implementa. La API Key se guarda cifrada; deje vacío para no cambiar.
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
                              <Button type="button" variant="ghost" size="icon" onClick={() => form.setValue("dataProviders", field.value.filter((_, j) => j !== i))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {form.watch(`dataProviders.${i}.kind`) === "rest" ? (
                              <FormField
                                control={form.control}
                                name={`dataProviders.${i}.baseUrl`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Base URL (REST)</FormLabel>
                                    <FormControl>
                                      <Input type="url" placeholder="https://api.ejemplo.com" {...f} value={f.value ?? ""} />
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
                                      <Input type="url" placeholder="https://api.ejemplo.com/graphql" {...f} value={f.value ?? ""} />
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
                            <FormField
                              control={form.control}
                              name={`dataProviders.${i}.tools`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Herramientas (nombres, separados por coma)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="get_saldo, get_movimientos"
                                      value={Array.isArray(f.value) ? (f.value ?? []).join(", ") : ""}
                                      onChange={(e) => f.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </Card>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            form.setValue("dataProviders", [
                              ...field.value,
                              { id: "", kind: "rest" as const, baseUrl: "", endpoint: "", auth: { type: "bearer", headerName: "", apiKey: "" }, tools: [] },
                            ])
                          }
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
    </div>
  );
}
