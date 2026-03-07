"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import type { Business, BusinessAddress } from "@/lib/interfases";

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
  timezone: z.string().optional(),
  language: z.string().optional(),
  businessCategory: z.string().optional(),
  defaultTaxPercent: z.number().optional(),
  taxRegime: z.string().optional(),
  digitalSignatureOrStamp: z.string().optional(),
  invoiceNumbering: invoiceNumberingSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

function emptyAddress(): BusinessAddress {
  return { street: "", number: "", sector: "", city: "", stateProvince: "", postalCode: "", country: "" };
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
      timezone: "",
      language: "",
      businessCategory: "",
      defaultTaxPercent: undefined,
      taxRegime: "",
      digitalSignatureOrStamp: "",
      invoiceNumbering: emptyInvoiceNumbering(),
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
    address: b.address
      ? { ...emptyAddress(), ...b.address }
      : emptyAddress(),
    currency: b.currency ?? "",
    timezone: b.timezone ?? "",
    language: b.language ?? "",
    businessCategory: b.businessCategory ?? "",
    defaultTaxPercent: b.defaultTaxPercent ?? undefined,
    taxRegime: b.taxRegime ?? "",
    digitalSignatureOrStamp: b.digitalSignatureOrStamp ?? "",
    invoiceNumbering: b.invoiceNumbering
      ? { ...emptyInvoiceNumbering(), ...b.invoiceNumbering }
      : emptyInvoiceNumbering(),
  };
}

export default function BusinessEditPage() {
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
    resolver: zodResolver(formSchema),
    defaultValues: businessToFormValues(null),
  });

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
            country: values.address.country || undefined,
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
            timezone: values.timezone || undefined,
            language: values.language || undefined,
            businessCategory: values.businessCategory || undefined,
            defaultTaxPercent: toOptionalNumber(values.defaultTaxPercent),
            taxRegime: values.taxRegime || undefined,
            digitalSignatureOrStamp: values.digitalSignatureOrStamp || undefined,
            invoiceNumbering: Object.keys(invoiceNumbering || {}).length ? invoiceNumbering : undefined,
          },
        },
      });
      toast.success("Cambios guardados");
      setBusiness((prev) => (prev ? { ...prev, ...values, address, invoiceNumbering } : null));
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
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Editar negocio</CardTitle>
          <CardDescription>
            {business.name} — <code className="text-sm bg-muted px-1 rounded">{business.businessId ?? business._id}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="identity" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="identity">Identidad</TabsTrigger>
                  <TabsTrigger value="contact">Contacto</TabsTrigger>
                  <TabsTrigger value="regional">Regional</TabsTrigger>
                  <TabsTrigger value="billing">Facturación</TabsTrigger>
                </TabsList>
                <TabsContent value="identity" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">Datos que identifican al negocio en la interfaz y documentos.</p>
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
                    <FormItem><FormLabel>Descripción (opcional)</FormLabel><FormControl><Textarea placeholder="Descripción" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="active" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div><FormLabel className="text-base">Activo</FormLabel><p className="text-sm text-muted-foreground">Desactivar oculta el negocio sin borrarlo.</p></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </TabsContent>
                <TabsContent value="contact" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">Correo, teléfono y dirección física.</p>
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
                      <FormItem><FormLabel>País</FormLabel><FormControl><Input placeholder="Para impuestos y zona horaria" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </TabsContent>
                <TabsContent value="regional" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">Moneda, zona horaria, idioma y categoría del negocio.</p>
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Moneda</FormLabel><FormControl><Input placeholder="ISO 4217: USD, VES, EUR, etc." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="timezone" render={({ field }) => (
                    <FormItem><FormLabel>Zona horaria</FormLabel><FormControl><Input placeholder="Ej. America/Caracas" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="language" render={({ field }) => (
                    <FormItem><FormLabel>Idioma</FormLabel><FormControl><Input placeholder="Para i18n: es, en, etc." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="businessCategory" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de negocio / Categoría</FormLabel><FormControl><Input placeholder="Retail, Servicios, Gastronomía, etc." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </TabsContent>
                <TabsContent value="billing" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">Impuestos, régimen contributivo y numeración de factura.</p>
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
              </Tabs>
              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
