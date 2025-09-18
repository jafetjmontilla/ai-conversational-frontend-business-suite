// Tipos TypeScript para reportes de pagos y retenciones IVA

export interface PaymentReportResult {
  id_factura: string;
  estado: string;
  total_cobrado: number;
  accion?: string;
  messages: string[];
  referencia?: string;
  fecha_pago?: string;
  saldo: number;
  total: number;
  forma_pago: number;
  telefono?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchPaymentReportResults {
  total: number;
  results: PaymentReportResult[];
}

export interface Supplier {
  _id: string;
  letterIdentifier: string;
  numberIdentifier: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface FetchSupplierResults {
  total: number;
  results: Supplier[];
}

export interface TasaBCV {
  _id: string;
  tasa: number;
  fecha: string;
  createdAt: string;
}

export interface FetchTasaBCVResults {
  total: number;
  results: TasaBCV[];
}

export interface UploadFile {
  _id: string;
  lote: string;
  path: string;
  createdAt: string;
}

export interface FetchUploadFilesResults {
  total: number;
  results: UploadFile[];
}

// Tipos para los argumentos de las queries
export interface PaymentReportArgs {
  rangeDate?: {
    gt: string;
    lt: string;
  };
  estado?: string;
}

export interface SupplierArgs {
  // Agregar filtros específicos si es necesario
}

export interface SupplierInput {
  _id?: string;
  letterIdentifier: string;
  numberIdentifier: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface TasaBCVSort {
  fecha?: number;
  createdAt?: number;
}

export interface SupplierSort {
  name?: number;
  createdAt?: number;
}

export interface TransaccionArgs {
  // Agregar filtros específicos si es necesario
}

export interface TransaccionSort {
  fecha?: number;
  createdAt?: number;
}

export interface FacturaArgs {
  // Agregar filtros específicos si es necesario
}

export interface FacturaSort {
  fecha_pago?: number;
  createdAt?: number;
}

export interface DateRange {
  gt: string;
  lt: string;
}

// Tipos para formas de pago
export interface FormaPago {
  id: number;
  nombre: string;
}

// Constantes para formas de pago
export const FORMAS_PAGO: FormaPago[] = [
  {
    id: 37407,
    nombre: "BOTON DE PAGO BDV"
  },
  {
    id: 37524,
    nombre: "PAGO MOVIL PORTAL DEL PAGO"
  },
  {
    id: 37515,
    nombre: "TRANSFERENCIA PORTAL PAGO"
  },
  {
    id: 37516,
    nombre: "SELLE PORTAL PAGO"
  },
];

// Función para obtener el nombre de la forma de pago
export const getFormaPagoNombre = (id: number): string => {
  const formaPago = FORMAS_PAGO.find(fp => fp.id === id);
  return formaPago ? formaPago.nombre : `ID: ${id}`;
};
