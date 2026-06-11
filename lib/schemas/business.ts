import * as z from "zod";
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

export const baseBusinessFormSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  legalName: z.string().min(1, "Requerido"),
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

export const createBusinessFormSchema = baseBusinessFormSchema.extend({
  mainUserName: z.string().min(1, "Requerido"),
  mainUserEmail: z.string().min(1, "Requerido").email("Correo inválido"),
  mainUserPhone: z.string().min(6, "Mínimo 6 caracteres"),
});

export const editBusinessFormSchema = baseBusinessFormSchema.extend({
  active: z.boolean(),
});

export type BaseBusinessFormValues = z.infer<typeof baseBusinessFormSchema>;
export type CreateBusinessFormValues = z.infer<typeof createBusinessFormSchema>;
export type EditBusinessFormValues = z.infer<typeof editBusinessFormSchema>;

function emptyAddress(): BusinessAddress {
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

function emptyInvoiceNumbering() {
  return { prefix: "", rangeFrom: undefined, rangeTo: undefined };
}

export function emptyCreateBusinessValues(): CreateBusinessFormValues {
  return {
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
  };
}

export function businessToFormValues(b: Business): EditBusinessFormValues {
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

function toOptionalNumber(v: number | undefined): number | undefined {
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}

function buildAddressPayload(address: BaseBusinessFormValues["address"]) {
  if (!address || !(address.street || address.city || address.country)) return undefined;
  return {
    street: address.street || undefined,
    number: address.number || undefined,
    sector: address.sector || undefined,
    city: address.city || undefined,
    stateProvince: address.stateProvince || undefined,
    postalCode: address.postalCode || undefined,
    country: address.country || undefined,
  };
}

function buildInvoiceNumberingPayload(invoiceNumbering: BaseBusinessFormValues["invoiceNumbering"]) {
  if (
    !invoiceNumbering ||
    !(invoiceNumbering.prefix || invoiceNumbering.rangeFrom != null || invoiceNumbering.rangeTo != null)
  ) {
    return undefined;
  }
  return {
    prefix: invoiceNumbering.prefix || undefined,
    rangeFrom: toOptionalNumber(invoiceNumbering.rangeFrom),
    rangeTo: toOptionalNumber(invoiceNumbering.rangeTo),
  };
}

export function buildBusinessArgs(values: BaseBusinessFormValues) {
  const address = buildAddressPayload(values.address);
  const invoiceNumbering = buildInvoiceNumberingPayload(values.invoiceNumbering);
  return {
    name: values.name,
    description: values.description || undefined,
    legalName: values.legalName,
    taxId: values.taxId || undefined,
    slogan: values.slogan || undefined,
    logoUrl: values.logoUrl || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    address: address && Object.keys(address).length ? address : undefined,
    currency: values.currency || undefined,
    timezone: values.timezone || undefined,
    language: values.language || undefined,
    businessCategory: values.businessCategory || undefined,
    defaultTaxPercent: toOptionalNumber(values.defaultTaxPercent),
    taxRegime: values.taxRegime || undefined,
    digitalSignatureOrStamp: values.digitalSignatureOrStamp || undefined,
    invoiceNumbering: invoiceNumbering && Object.keys(invoiceNumbering).length ? invoiceNumbering : undefined,
  };
}
