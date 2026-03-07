"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import type { BusinessAddress } from "@/lib/interfases";

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
  mainUserName: z.string().min(1, "Requerido"),
  mainUserEmail: z.string().min(1, "Requerido").email("Correo inválido"),
  mainUserPhone: z.string().min(6, "Mínimo 6 caracteres"),
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

interface BusinessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BusinessFormModal({ isOpen, onClose, onSuccess }: BusinessFormModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      mainUserName: "",
      mainUserEmail: "",
      mainUserPhone: "",
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
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        description: "",
        mainUserName: "",
        mainUserEmail: "",
        mainUserPhone: "",
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
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const address =
        values.address && (values.address.street || values.address.city || values.address.country)
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
      const invoiceNumbering =
        values.invoiceNumbering &&
        (values.invoiceNumbering.prefix || values.invoiceNumbering.rangeFrom != null || values.invoiceNumbering.rangeTo != null)
          ? {
              prefix: values.invoiceNumbering.prefix || undefined,
              rangeFrom: toOptionalNumber(values.invoiceNumbering.rangeFrom),
              rangeTo: toOptionalNumber(values.invoiceNumbering.rangeTo),
            }
          : undefined;
      await fetchApiV1({
        query: queries.createBusiness,
        type: "json",
        variables: {
          args: {
            name: values.name,
            description: values.description || undefined,
            mainUserName: values.mainUserName.trim(),
            mainUserEmail: values.mainUserEmail.trim().toLowerCase(),
            mainUserPhone: values.mainUserPhone.trim(),
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
      toast.success("Negocio creado. Se envió la invitación al usuario principal.");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Error al crear negocio");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo negocio</DialogTitle>
          <DialogDescription>
            El identificador (businessId) se genera automáticamente. Completa identidad, contacto y el usuario principal que recibirá la invitación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="identity" className="text-xs">Identidad</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs">Contacto</TabsTrigger>
                <TabsTrigger value="regional" className="text-xs">Regional</TabsTrigger>
                <TabsTrigger value="billing" className="text-xs">Facturación</TabsTrigger>
                <TabsTrigger value="user" className="text-xs">Usuario</TabsTrigger>
              </TabsList>
              <TabsContent value="identity" className="space-y-3 pt-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre comercial *</FormLabel><FormControl><Input placeholder="Nombre que ven los clientes" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="legalName" render={({ field }) => (
                  <FormItem><FormLabel>Razón social</FormLabel><FormControl><Input placeholder="Nombre legal" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taxId" render={({ field }) => (
                  <FormItem><FormLabel>ID fiscal</FormLabel><FormControl><Input placeholder="RIF, NIT, RFC, VAT" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slogan" render={({ field }) => (
                  <FormItem><FormLabel>Eslogan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="logoUrl" render={({ field }) => (
                  <FormItem><FormLabel>Logo (URL)</FormLabel><FormControl><Input placeholder="SVG o PNG" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Descripción" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>
              <TabsContent value="contact" className="space-y-3 pt-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Correo principal</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+58 412 1234567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address.street" render={({ field }) => (
                  <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-2">
                  <FormField control={form.control} name="address.number" render={({ field }) => (
                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.sector" render={({ field }) => (
                    <FormItem><FormLabel>Sector</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField control={form.control} name="address.city" render={({ field }) => (
                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.stateProvince" render={({ field }) => (
                    <FormItem><FormLabel>Estado / Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField control={form.control} name="address.postalCode" render={({ field }) => (
                    <FormItem><FormLabel>Código postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.country" render={({ field }) => (
                    <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </TabsContent>
              <TabsContent value="regional" className="space-y-3 pt-3">
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem><FormLabel>Moneda</FormLabel><FormControl><Input placeholder="USD, VES, EUR" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <FormItem><FormLabel>Zona horaria</FormLabel><FormControl><Input placeholder="America/Caracas" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem><FormLabel>Idioma</FormLabel><FormControl><Input placeholder="es, en" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="businessCategory" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de negocio</FormLabel><FormControl><Input placeholder="Retail, Servicios, etc." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>
              <TabsContent value="billing" className="space-y-3 pt-3">
                <FormField control={form.control} name="defaultTaxPercent" render={({ field }) => (
                  <FormItem><FormLabel>% impuesto</FormLabel><FormControl><Input type="number" step={0.01} {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taxRegime" render={({ field }) => (
                  <FormItem><FormLabel>Régimen contributivo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="digitalSignatureOrStamp" render={({ field }) => (
                  <FormItem><FormLabel>Firma / Sello</FormLabel><FormControl><Input placeholder="URL o referencia" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="invoiceNumbering.prefix" render={({ field }) => (
                  <FormItem><FormLabel>Prefijo factura</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-2">
                  <FormField control={form.control} name="invoiceNumbering.rangeFrom" render={({ field }) => (
                    <FormItem><FormLabel>Rango desde</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="invoiceNumbering.rangeTo" render={({ field }) => (
                    <FormItem><FormLabel>Rango hasta</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </TabsContent>
              <TabsContent value="user" className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">Usuario principal que recibirá la invitación por correo/WhatsApp.</p>
                <FormField control={form.control} name="mainUserName" render={({ field }) => (
                  <FormItem><FormLabel>Nombre *</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mainUserEmail" render={({ field }) => (
                  <FormItem><FormLabel>Correo *</FormLabel><FormControl><Input type="email" placeholder="juan@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mainUserPhone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono *</FormLabel><FormControl><Input placeholder="+58 412 1234567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creando..." : "Crear negocio"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
