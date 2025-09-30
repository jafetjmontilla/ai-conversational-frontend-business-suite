import { z } from 'zod';

// Schema para items de factura
export const invoiceItemSchema = z.object({
  id: z.string(),
  quantity: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  inventoryId: z.string()
});

// Schema para factura
export const invoiceSchema = z.object({
  _id: z.string(),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientId: z.string().min(1, 'La cédula es requerida'),
  clientPhone: z.string().min(1, 'El teléfono es requerido'),
  items: z.array(invoiceItemSchema).min(1, 'Debe tener al menos un item'),
  totalBs: z.number().min(0, 'El total en Bs. debe ser mayor o igual a 0'),
  totalUsd: z.number().min(0, 'El total en USD debe ser mayor o igual a 0'),
  store: z.enum(['guardians', 'jaihom']),
  status: z.enum(['draft', 'paid', 'cancelled']).default('draft'),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Schema para crear factura
export const createInvoiceSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientId: z.string().min(1, 'La cédula es requerida'),
  clientPhone: z.string().min(1, 'El teléfono es requerido'),
  items: z.array(invoiceItemSchema).min(1, 'Debe tener al menos un item'),
  store: z.enum(['guardians', 'jaihom'])
});

// Schema para actualizar factura
export const updateInvoiceSchema = z.object({
  _id: z.string(),
  clientName: z.string().optional(),
  clientId: z.string().optional(),
  clientPhone: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
  store: z.enum(['guardians', 'jaihom']).optional()
});

// Schema para método de pago
export const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  amountBs: z.number().min(0),
  amountUsd: z.number().min(0),
  inputValue: z.string(),
  changeValue: z.string().optional()
});

// Schema para pago
export const paymentSchema = z.object({
  _id: z.string(),
  invoiceId: z.string(),
  paymentMethods: z.array(paymentMethodSchema),
  totalPaid: z.number().min(0),
  tasaBCV: z.number().min(0),
  store: z.enum(['guardians', 'jaihom']),
  status: z.string(),
  createdAt: z.string()
});

// Schema para respuesta de pagos
export const paymentResponseSchema = z.object({
  total: z.number(),
  results: z.array(paymentSchema)
});

// Schema para procesar pago
export const processPaymentSchema = z.object({
  invoiceId: z.string(),
  paymentMethods: z.array(paymentMethodSchema),
  totalPaid: z.number().min(0),
  tasaBCV: z.number().min(0),
  store: z.enum(['guardians', 'jaihom'])
});

// Schema para filtros de factura
export const invoiceFiltersSchema = z.object({
  clientName: z.string().optional(),
  clientId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(['draft', 'paid', 'cancelled']).optional()
});

// Schema para paginación
export const paginationSchema = z.object({
  skip: z.number().min(0).default(0),
  limit: z.number().min(1).max(100).default(10)
});

// Schema para filtros de pagos
export const paymentFiltersSchema = z.object({
  store: z.enum(['guardians', 'jaihom']).optional(),
  status: z.string().optional(),
  dateFilter: z.enum(['today', 'week', 'month', 'year']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  offsetMinutes: z.number().optional()
});

// Tipos TypeScript derivados de los schemas
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
