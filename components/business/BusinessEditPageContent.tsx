"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { Input } from "@/components/ui/input";
import { COUNTRY_OPTIONS, resolveDefaultCountry } from "@/lib/countries";
import { resolveDefaultTimezone, TIMEZONE_OPTIONS } from "@/lib/timezones";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import type { Business, ProductCategory, Attribute } from "@/lib/interfases";
import { Pencil, Plus, Sparkles, Tag, Trash2, X } from "lucide-react";
import { GenerateDescriptionInterviewDialog } from "@/components/business/GenerateDescriptionInterviewDialog";
import { ProductCategoriesImportDialog } from "@/components/business/ProductCategoriesImportDialog";
import { PageHeader } from "@/components/layouts/PageHeader";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Layout } from "react-resizable-panels";
import { useDefaultLayout } from "react-resizable-panels";
import {
  businessEditPanelsGroupId,
  readDesktopPanelOpen,
  writeDesktopPanelOpen,
} from "@/lib/businessEditPanelPreferences";

const DEFAULT_PANEL_LAYOUT: Layout = {
  "panel-left": 65,
  "panel-right": 35,
};
const RIGHT_PANEL_MIN_SIZE = 20;
const RIGHT_PANEL_MAX_SIZE = 30;

function RightPanelShell({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0 border-b px-3 py-3">
        {title ? <p className="pr-8 text-sm font-medium">{title}</p> : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="absolute right-3 top-2.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        {children}
      </div>
    </div>
  );
}

type RightPanelContent =
  | { kind: "idle" }
  | { kind: "category"; category: ProductCategory | null };

function CategoryFormPanel({
  businessId,
  editingCategory,
  onSaved,
  onCancel,
}: {
  businessId: string;
  editingCategory: ProductCategory | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [savingCat, setSavingCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catType, setCatType] = useState<"producto" | "servicio" | "ambos">("producto");
  const [catPricingAttributeId, setCatPricingAttributeId] = useState<string>("__none__");

  useEffect(() => {
    if (!businessId) return;
    fetchApiV1({
      query: queries.getAttributes,
      type: "json",
      variables: { id: businessId },
    })
      .then((res: Attribute[] | null) => setAttributes(Array.isArray(res) ? res : []))
      .catch(() => setAttributes([]));
  }, [businessId]);

  useEffect(() => {
    if (editingCategory) {
      setCatName(editingCategory.name);
      setCatDescription(editingCategory.description || "");
      setCatType(editingCategory.type);
      setCatPricingAttributeId(editingCategory.pricingAttributeId ?? "__none__");
      return;
    }
    setCatName("");
    setCatDescription("");
    setCatType("producto");
    setCatPricingAttributeId("__none__");
  }, [editingCategory]);

  const handleSave = async () => {
    if (!catName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setSavingCat(true);
    try {
      if (editingCategory) {
        await fetchApiV1({
          query: queries.updateProductCategory,
          type: "json",
          variables: {
            _id: editingCategory._id,
            id: businessId,
            args: {
              name: catName.trim(),
              description: catDescription.trim() || undefined,
              type: catType,
              pricingAttributeId:
                catPricingAttributeId === "__none__" ? null : catPricingAttributeId,
            },
          },
        });
        toast.success("Categoría actualizada");
      } else {
        await fetchApiV1({
          query: queries.createProductCategory,
          type: "json",
          variables: {
            id: businessId,
            args: {
              name: catName.trim(),
              description: catDescription.trim() || undefined,
              type: catType,
              pricingAttributeId:
                catPricingAttributeId === "__none__" ? null : catPricingAttributeId,
            },
          },
        });
        toast.success("Categoría creada");
      }
      onSaved();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar categoría";
      toast.error(message);
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            placeholder="Ej. Electrónica, Consultoría"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Descripción</label>
          <Input
            placeholder="Opcional"
            value={catDescription}
            onChange={(e) => setCatDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo</label>
          <Select value={catType} onValueChange={(v) => setCatType(v as typeof catType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Atributo de precio para extras</label>
          <p className="text-xs text-muted-foreground">
            Ej. Tamaño en pizzas — los adicionales indexan precio por priceKey de sus valores.
          </p>
          <Select value={catPricingAttributeId} onValueChange={setCatPricingAttributeId}>
            <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Ninguno</SelectItem>
              {attributes.map((a) => (
                <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={handleSave} disabled={savingCat} size="sm">
          {savingCat ? "Guardando..." : editingCategory ? "Actualizar" : "Agregar"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

const categoryTypes = [
  { value: "producto", label: "Producto" },
  { value: "servicio", label: "Servicio" },
  { value: "ambos", label: "Ambos" },
] as const;

const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  sector: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const invoiceNumberingSchema = z.object({
  prefix: z.string().optional(),
  rangeFrom: z.number().optional(),
  rangeTo: z.number().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  active: z.boolean(),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  slogan: z.string().optional(),
  logoUrl: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
  email: z.union([z.string().email("Correo inválido"), z.literal("")]).optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  currency: z.string().optional(),
  country: z.string().min(1, "Requerido"),
  timezone: z.string().min(1, "Requerido"),
  language: z.string().optional(),
  businessCategory: z.string().optional(),
  defaultTaxPercent: z.number().optional(),
  taxRegime: z.string().optional(),
  digitalSignatureOrStamp: z.string().optional(),
  invoiceNumbering: invoiceNumberingSchema.optional(),
  billingBaseCurrency: z.union([z.enum(["USD", "EUR", "VES"]), z.literal("")]).optional(),
  billingDisplayCurrency: z.union([z.enum(["USD", "EUR", "VES"]), z.literal("")]).optional(),
  billingExchangeRateSource: z.union([z.enum(["bcv_dolar", "bcv_euro", "binance", "custom"]), z.literal("")]).optional(),
  billingCustomExchangeRate: z.number().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

function emptyAddress(): NonNullable<FormValues["address"]> {
  return {
    street: "",
    number: "",
    sector: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "",
  };
}

function emptyInvoiceNumbering(): NonNullable<FormValues["invoiceNumbering"]> {
  return { prefix: "", rangeFrom: undefined, rangeTo: undefined };
}

function toOptionalNumber(v: number | undefined): number | undefined {
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}

function businessToFormValues(b: Business | null): FormValues {
  if (!b) {
    return {
      name: "",
      description: "",
      active: true,
      legalName: "",
      taxId: "",
      slogan: "",
      logoUrl: "",
      email: "",
      phone: "",
      address: emptyAddress(),
      currency: "",
      country: resolveDefaultCountry(),
      timezone: resolveDefaultTimezone(),
      language: "",
      businessCategory: "",
      defaultTaxPercent: undefined,
      taxRegime: "",
      digitalSignatureOrStamp: "",
      invoiceNumbering: emptyInvoiceNumbering(),
      billingBaseCurrency: undefined,
      billingDisplayCurrency: undefined,
      billingExchangeRateSource: undefined,
      billingCustomExchangeRate: undefined,
    };
  }
  return {
    name: b.name ?? "",
    description: b.description ?? "",
    active: b.active ?? true,
    legalName: b.legalName ?? "",
    taxId: b.taxId ?? "",
    slogan: b.slogan ?? "",
    logoUrl: b.logoUrl ?? "",
    email: b.email ?? "",
    phone: b.phone ?? "",
    address: b.address ? { ...emptyAddress(), ...b.address } : emptyAddress(),
    currency: b.currency ?? "",
    country: resolveDefaultCountry(b.country),
    timezone: resolveDefaultTimezone(b.timezone),
    language: b.language ?? "",
    businessCategory: b.businessCategory ?? "",
    defaultTaxPercent: b.defaultTaxPercent ?? undefined,
    taxRegime: b.taxRegime ?? "",
    digitalSignatureOrStamp: b.digitalSignatureOrStamp ?? "",
    invoiceNumbering: b.invoiceNumbering
      ? { ...emptyInvoiceNumbering(), ...b.invoiceNumbering }
      : emptyInvoiceNumbering(),
    billingBaseCurrency: (b.billingBaseCurrency as FormValues["billingBaseCurrency"]) ?? undefined,
    billingDisplayCurrency: (b.billingDisplayCurrency as FormValues["billingDisplayCurrency"]) ?? undefined,
    billingExchangeRateSource: (b.billingExchangeRateSource as FormValues["billingExchangeRateSource"]) ?? undefined,
    billingCustomExchangeRate: b.billingCustomExchangeRate ?? undefined,
  };
}

function CategoriesTab({
  businessId,
  onNewCategory,
  onEditCategory,
  refreshSignal,
}: {
  businessId: string;
  onNewCategory: () => void;
  onEditCategory: (category: ProductCategory) => void;
  refreshSignal?: number;
}) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await fetchApiV1({
        query: queries.getProductCategories,
        type: "json",
        variables: { id: businessId, includeInactive: true },
      });
      setCategories(res || []);
    } catch {
      toast.error("Error al cargar categorías");
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    if (businessId) fetchCategories();
  }, [businessId, refreshSignal]);

  const handleDelete = async (catId: string) => {
    if (!window.confirm("¿Desactivar esta categoría?")) return;
    try {
      await fetchApiV1({
        query: queries.deleteProductCategory,
        type: "json",
        variables: { _id: catId, id: businessId },
      });
      toast.success("Categoría desactivada");
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || "Error al desactivar categoría");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Categorías para clasificar productos y servicios del inventario.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={onNewCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva categoría
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Cargar con IA
          </Button>
        </div>
      </div>

      {loadingCats ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Tag className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No hay categorías creadas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={`flex items-center justify-between rounded-lg border p-3 ${!cat.active ? "opacity-50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{cat.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {categoryTypes.find((t) => t.value === cat.type)?.label || cat.type}
                  </span>
                  {!cat.active && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">Inactiva</span>
                  )}
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => onEditCategory(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {cat.active && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(cat._id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ProductCategoriesImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        businessId={businessId}
        onImported={fetchCategories}
      />
    </div>
  );
}

export function BusinessEditPageContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { meData } = useAuth();
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [aiDescriptionOpen, setAiDescriptionOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(() => readDesktopPanelOpen(businessId));
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState<RightPanelContent>({ kind: "idle" });
  const [categoriesRefreshSignal, setCategoriesRefreshSignal] = useState(0);
  const panelsGroupId = businessEditPanelsGroupId(businessId);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: panelsGroupId,
    storage: typeof window !== "undefined" ? localStorage : undefined,
    panelIds: ["panel-left", "panel-right"],
  });

  const openCategoryPanel = (category: ProductCategory | null) => {
    setRightPanelContent({ kind: "category", category });
    if (isMobile) {
      setMobilePanelOpen(true);
      return;
    }
    setDesktopPanelOpen(true);
    writeDesktopPanelOpen(businessId, true);
  };

  const closeRightPanel = () => {
    setRightPanelContent({ kind: "idle" });
    if (isMobile) {
      setMobilePanelOpen(false);
      return;
    }
    setDesktopPanelOpen(false);
    writeDesktopPanelOpen(businessId, false);
  };

  const handleCategorySaved = () => {
    setCategoriesRefreshSignal((signal) => signal + 1);
    closeRightPanel();
  };

  const rightPanelTitle =
    rightPanelContent.kind === "category"
      ? rightPanelContent.category
        ? "Editar categoría"
        : "Nueva categoría"
      : undefined;

  const rightPanelNode =
    rightPanelContent.kind === "category" ? (
      <CategoryFormPanel
        businessId={businessId}
        editingCategory={rightPanelContent.category}
        onSaved={handleCategorySaved}
        onCancel={closeRightPanel}
      />
    ) : null;

  const showDesktopRightPanel =
    rightPanelContent.kind === "category" && desktopPanelOpen && !isMobile;

  useEffect(() => {
    if (!businessId) return;
    setDesktopPanelOpen(readDesktopPanelOpen(businessId));
    setRightPanelContent({ kind: "idle" });
    setMobilePanelOpen(false);
  }, [businessId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: businessToFormValues(null),
  });
  const isDirty = form.formState.isDirty;
  useUnsavedChangesWarning(isDirty);

  const handleDiscard = () => {
    if (!business) return;
    form.reset(businessToFormValues(business));
    setDiscardDialogOpen(false);
  };

  useEffect(() => {
    if (!businessId) return;
    const isMyBusiness = meData?.business && (meData.business.businessId === businessId || meData.business._id === businessId);
    if (isMyBusiness && meData?.business) {
      const b = meData.business as Business;
      setBusiness(b);
      form.reset(businessToFormValues(b));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let b = await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        }) as Business | null;
        if (!b && businessId) {
          b = await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          }) as Business | null;
        }
        if (cancelled) return;
        if (b) {
          setBusiness(b);
          form.reset(businessToFormValues(b));
        } else {
          toast.error("Negocio no encontrado");
          router.push("/businesses");
        }
      } catch (e) {
        if (!cancelled) {
          toast.error("Error al cargar el negocio");
          router.push("/businesses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId, meData?.business]);

  const onSubmit = async (values: FormValues) => {
    if (!business) return;
    setSaving(true);
    try {
      const address = values.address && (values.address.street || values.address.city || values.address.country)
        ? {
          street: values.address.street || undefined,
          number: values.address.number || undefined,
          sector: values.address.sector || undefined,
          city: values.address.city || undefined,
          stateProvince: values.address.stateProvince || undefined,
          postalCode: values.address.postalCode || undefined,
          country: values.address?.country || undefined,
        }
        : undefined;
      const invoiceNumbering = values.invoiceNumbering && (values.invoiceNumbering.prefix || values.invoiceNumbering.rangeFrom != null || values.invoiceNumbering.rangeTo != null)
        ? {
          prefix: values.invoiceNumbering.prefix || undefined,
          rangeFrom: toOptionalNumber(values.invoiceNumbering.rangeFrom),
          rangeTo: toOptionalNumber(values.invoiceNumbering.rangeTo),
        }
        : undefined;
      await fetchApiV1({
        query: queries.updateBusiness,
        type: "json",
        variables: {
          id: business._id,
          args: {
            name: values.name,
            description: values.description || undefined,
            active: values.active,
            legalName: values.legalName || undefined,
            taxId: values.taxId || undefined,
            slogan: values.slogan || undefined,
            logoUrl: values.logoUrl || undefined,
            email: values.email || undefined,
            phone: values.phone || undefined,
            address: Object.keys(address || {}).length ? address : undefined,
            currency: values.currency || undefined,
            country: resolveDefaultCountry(values.country) || undefined,
            timezone: resolveDefaultTimezone(values.timezone) || undefined,
            language: values.language || undefined,
            businessCategory: values.businessCategory || undefined,
            defaultTaxPercent: toOptionalNumber(values.defaultTaxPercent),
            taxRegime: values.taxRegime || undefined,
            digitalSignatureOrStamp: values.digitalSignatureOrStamp || undefined,
            invoiceNumbering: Object.keys(invoiceNumbering || {}).length ? invoiceNumbering : undefined,
            billingBaseCurrency: values.billingBaseCurrency || undefined,
            billingDisplayCurrency: values.billingDisplayCurrency || undefined,
            billingExchangeRateSource: values.billingExchangeRateSource || undefined,
            billingCustomExchangeRate: values.billingExchangeRateSource === "custom" ? toOptionalNumber(values.billingCustomExchangeRate ?? undefined) : undefined,
          },
        },
      });
      toast.success("Cambios guardados");
      const updatedBusiness: Business = {
        ...business,
        ...values,
        address,
        invoiceNumbering,
        billingBaseCurrency: (values.billingBaseCurrency || undefined) as Business["billingBaseCurrency"],
        billingDisplayCurrency: (values.billingDisplayCurrency || undefined) as Business["billingDisplayCurrency"],
        billingExchangeRateSource: (values.billingExchangeRateSource || undefined) as Business["billingExchangeRateSource"],
        billingCustomExchangeRate: values.billingExchangeRateSource === "custom" ? (values.billingCustomExchangeRate ?? undefined) : undefined,
      };
      setBusiness(updatedBusiness);
      form.reset(businessToFormValues(updatedBusiness));
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
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
            <p className="text-muted-foreground">No tienes permiso para editar este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver a Negocios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <ResizablePanelGroup
        key={showDesktopRightPanel ? "with-right-panel" : "without-right-panel"}
        id={panelsGroupId}
        orientation="horizontal"
        className="h-full min-h-0 w-full"
        defaultLayout={
          showDesktopRightPanel
            ? defaultLayout ?? DEFAULT_PANEL_LAYOUT
            : { "panel-left": 100 }
        }
        onLayoutChanged={onLayoutChanged}
      >
        <ResizablePanel id="panel-left" minSize="35" className="min-w-0">
          <div className="flex h-full min-h-0 flex-col overflow-hidden sm:relative">
            <PageHeader title="Editar negocio" />

            <Form {...form} >
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <Tabs defaultValue="identity" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <TabsList variant="line" className="h-auto sm:w-[calc(100%-300px)] shrink-0 flex-wrap gap-x-2 gap-y-1">
                    <TabsTrigger variant="line" value="identity">Identidad</TabsTrigger>
                    <TabsTrigger variant="line" value="contact">Contacto</TabsTrigger>
                    <TabsTrigger variant="line" value="regional">Regional</TabsTrigger>
                    <TabsTrigger variant="line" value="billing">Facturación</TabsTrigger>
                    <TabsTrigger variant="line" value="categories">Categorías</TabsTrigger>
                  </TabsList>
                  <Card className="min-h-0 flex-1 overflow-y-auto border-none">
                    <CardContent className="!py-0 max-w-6xl">
                      <TabsContent value="identity" className="space-y-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Nombre comercial</FormLabel><FormControl><Input placeholder="El nombre que ven los clientes" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="legalName" render={({ field }) => (
                          <FormItem><FormLabel>Razón social</FormLabel><FormControl><Input placeholder="Nombre legal registrado" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="taxId" render={({ field }) => (
                          <FormItem><FormLabel>ID fiscal / Registro tributario</FormLabel><FormControl><Input placeholder="RIF, NIT, RFC, VAT, etc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="slogan" render={({ field }) => (
                          <FormItem><FormLabel>Eslogan (opcional)</FormLabel><FormControl><Input placeholder="Para personalización de marca" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="logoUrl" render={({ field }) => (
                          <FormItem><FormLabel>Logo</FormLabel><FormControl><Input placeholder="URL de la imagen (SVG o PNG transparente)" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between gap-2">
                              <FormLabel>Descripción (opcional)</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0"
                                onClick={() => setAiDescriptionOpen(true)}
                              >
                                <Sparkles className="h-4 w-4 mr-1.5" />
                                Generar con IA
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea placeholder="Descripción" className="resize-none min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="active" render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div><FormLabel className="text-base">Activo</FormLabel><p className="text-sm text-muted-foreground">Desactivar oculta el negocio sin borrarlo.</p></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                      </TabsContent>
                      <TabsContent value="contact" className="space-y-2">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>Correo electrónico principal</FormLabel><FormControl><Input type="email" placeholder="Para notificaciones del sistema" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Con código de área internacional (ej. +58 412 1234567)" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address.street" render={({ field }) => (
                          <FormItem><FormLabel>Dirección — Calle</FormLabel><FormControl><Input placeholder="Calle y número" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="address.number" render={({ field }) => (
                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="address.sector" render={({ field }) => (
                            <FormItem><FormLabel>Sector</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="address.city" render={({ field }) => (
                            <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="address.stateProvince" render={({ field }) => (
                            <FormItem><FormLabel>Estado / Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="address.postalCode" render={({ field }) => (
                            <FormItem><FormLabel>Código postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="address.country" render={({ field }) => (
                            <FormItem>
                              <FormLabel>País (dirección)</FormLabel>
                              <FormControl>
                                <AutocompleteInput
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  options={COUNTRY_OPTIONS}
                                  placeholder="Buscar país..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </TabsContent>
                      <TabsContent value="regional" className="space-y-2">
                        <FormField control={form.control} name="country" render={({ field }) => (
                          <FormItem>
                            <FormLabel>País (regional) *</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value ?? resolveDefaultCountry()}
                                onChange={field.onChange}
                                options={COUNTRY_OPTIONS}
                                placeholder="Buscar país..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="currency" render={({ field }) => (
                          <FormItem><FormLabel>Moneda</FormLabel><FormControl><Input placeholder="ISO 4217: USD, VES, EUR, etc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="timezone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zona horaria *</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                options={TIMEZONE_OPTIONS}
                                placeholder="Buscar zona horaria..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="language" render={({ field }) => (
                          <FormItem><FormLabel>Idioma</FormLabel><FormControl><Input placeholder="Para i18n: es, en, etc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="businessCategory" render={({ field }) => (
                          <FormItem><FormLabel>Tipo de negocio / Categoría</FormLabel><FormControl><Input placeholder="Retail, Servicios, Gastronomía, etc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </TabsContent>
                      <TabsContent value="billing" className="space-y-2">
                        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                          <p className="text-sm font-medium">Monedas y tasa de cambio</p>
                          <FormField
                            control={form.control}
                            name="billingBaseCurrency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Moneda base para los precios</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar moneda" /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="VES">VES</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="billingDisplayCurrency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mostrar precios en otra moneda</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar moneda" /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="VES">VES</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="billingExchangeRateSource"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tasa para calcular el cambio</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar fuente" /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="bcv_dolar">BCV Dólar</SelectItem>
                                    <SelectItem value="bcv_euro">BCV Euro</SelectItem>
                                    <SelectItem value="binance">Binance</SelectItem>
                                    <SelectItem value="custom">Custom (manual)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {form.watch("billingExchangeRateSource") === "custom" && (
                            <FormField
                              control={form.control}
                              name="billingCustomExchangeRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tasa manual (ej. 1 {form.watch("billingBaseCurrency") || "USD"} = X {form.watch("billingDisplayCurrency") || "VES"})</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step={0.0001}
                                      placeholder="Ej. 36.5"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        <FormField control={form.control} name="defaultTaxPercent" render={({ field }) => (
                          <FormItem><FormLabel>Porcentaje de impuesto predeterminado (%)</FormLabel><FormControl><Input type="number" step={0.01} placeholder="IVA, Tax" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="taxRegime" render={({ field }) => (
                          <FormItem><FormLabel>Régimen contributivo</FormLabel><FormControl><Input placeholder="Persona natural, jurídica, gran contribuyente, etc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="digitalSignatureOrStamp" render={({ field }) => (
                          <FormItem><FormLabel>Firma digital / Sello</FormLabel><FormControl><Input placeholder="URL o referencia para facturación electrónica" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="text-sm font-medium">Numeración de factura</div>
                        <FormField control={form.control} name="invoiceNumbering.prefix" render={({ field }) => (
                          <FormItem><FormLabel>Prefijo</FormLabel><FormControl><Input placeholder="Prefijos autorizados" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="invoiceNumbering.rangeFrom" render={({ field }) => (
                            <FormItem><FormLabel>Rango desde</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="invoiceNumbering.rangeTo" render={({ field }) => (
                            <FormItem><FormLabel>Rango hasta</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </TabsContent>
                      <TabsContent value="categories" className="pt-4">
                        <CategoriesTab
                          businessId={business._id}
                          onNewCategory={() => openCategoryPanel(null)}
                          onEditCategory={(category) => openCategoryPanel(category)}
                          refreshSignal={categoriesRefreshSignal}
                        />
                      </TabsContent>
                    </CardContent>
                  </Card>
                </Tabs>
                <div className="inline-flex items-center gap-8 sm:gap-2 px-8 sm:px-0 py-2 shrink-0 sm:absolute sm:top-0 sm:right-0">
                  <div className="flex-1 sm:flex-none">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={saving || !isDirty}
                      onClick={() => setDiscardDialogOpen(true)}
                    >
                      Descartar cambios
                    </Button>
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={saving || !isDirty}
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>

            <GenerateDescriptionInterviewDialog
              open={aiDescriptionOpen}
              onOpenChange={setAiDescriptionOpen}
              commercialName={form.watch("name")}
              slogan={form.watch("slogan")}
              onGenerated={(description) => form.setValue("description", description, { shouldDirty: true })}
            />

            <ConfirmDeleteDialog
              open={discardDialogOpen}
              onOpenChange={setDiscardDialogOpen}
              onConfirm={handleDiscard}
              title="¿Descartar cambios?"
              description="Se perderán los cambios que no hayas guardado."
              confirmButtonText="Descartar cambios"
              cancelButtonText="Cancelar"
            />
          </div>
        </ResizablePanel>
        {showDesktopRightPanel ? (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="panel-right"
              minSize={`${RIGHT_PANEL_MIN_SIZE}`}
              maxSize={`${RIGHT_PANEL_MAX_SIZE}`}
              className="min-w-0"
            >
              <aside className="relative flex h-full min-h-0 flex-col bg-card">
                <RightPanelShell title={rightPanelTitle} onClose={closeRightPanel}>
                  {rightPanelNode}
                </RightPanelShell>
              </aside>
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
      <Sheet
        open={isMobile && mobilePanelOpen && rightPanelContent.kind === "category"}
        onOpenChange={(open) => {
          if (!open) closeRightPanel();
          else setMobilePanelOpen(true);
        }}
      >
        <SheetContent side="right" className="flex h-full w-[85vw] max-w-md flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>{rightPanelTitle ?? "Panel"}</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col pt-10">
            <RightPanelShell title={rightPanelTitle}>
              {rightPanelNode}
            </RightPanelShell>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
