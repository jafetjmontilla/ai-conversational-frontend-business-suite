# Página de Facturación

## Descripción

La página de facturación permite crear, editar y procesar pagos de facturas de manera interactiva. Incluye un carrusel horizontal de facturas editables y un sistema de pagos con múltiples formas de pago.

## Características

### 🎯 Funcionalidades Principales

- **Carrusel Horizontal**: Las facturas se muestran en un carrusel horizontal deslizable
- **Facturas Editables**: Cada factura es completamente editable en tiempo real
- **Múltiples Formas de Pago**: Sistema de pagos con 6 métodos diferentes
- **Integración con Tasa BCV**: Conversión automática entre Bs. y USD
- **Validación con Zod**: Validación robusta de todos los datos
- **Caché Inteligente**: Uso del hook useTasaBCV para optimizar consultas

### 📱 Componentes

#### 1. Página Principal (`/app/(sidebar)/invoice/page.tsx`)
- Header con título y badges de usuario
- Botón circular para agregar nuevas facturas
- Carrusel horizontal de facturas
- Dialog de pagos

#### 2. Tarjeta de Factura (`InvoiceCard.tsx`)
- Tamaño fijo: 300x380px
- Formulario editable en tiempo real
- Información del cliente (nombre, cédula, teléfono)
- Tabla de items con cantidades, descripciones y precios
- Cálculo automático de totales
- Botón de pago y cierre

#### 3. Dialog de Pagos (`PaymentDialog.tsx`)
- Total destacado en Bs. y USD
- 6 formas de pago diferentes:
  - Efectivo Bs. (con vuelto)
  - Punto
  - Pago Móvil o Transferencia
  - Efectivo Dólar (con vuelto)
  - Zelle
  - Binance
- Validación de pago completo
- Procesamiento de pagos

### 🔧 Hooks Personalizados

#### useTasaBCV
- Obtiene la tasa BCV del día actual
- Caché en localStorage
- Actualización automática por fecha

#### useInvoices
- CRUD completo de facturas
- Integración con API GraphQL
- Manejo de estados de carga y error

### 📊 Schemas de Validación

#### Invoice Schema
```typescript
{
  _id: string;
  clientName: string;
  clientId: string;
  clientPhone: string;
  items: InvoiceItem[];
  totalBs: number;
  totalUsd: number;
  status: 'draft' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

#### InvoiceItem Schema
```typescript
{
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  total: number;
}
```

### 🚀 Flujo de Trabajo

1. **Cargar Página**: Se cargan facturas existentes y la tasa BCV
2. **Crear Factura**: Click en botón + crea factura en blanco
3. **Editar Factura**: Formulario editable en tiempo real
4. **Procesar Pago**: Click en "PAGAR" abre dialog de pagos
5. **Completar Pago**: Seleccionar formas de pago hasta completar total
6. **Guardar**: Pago se procesa y factura se marca como pagada

### 💾 Almacenamiento

- **Facturas Locales**: Se mantienen en estado local hasta guardar
- **Facturas Guardadas**: Se almacenan en base de datos via API
- **Tasa BCV**: Caché en localStorage con validación por fecha

### 🎨 Diseño

- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Carrusel**: Scroll horizontal para múltiples facturas
- **Tamaño Fijo**: Facturas de 300x380px
- **UI Moderna**: Componentes con shadcn/ui
- **Estados Visuales**: Loading, error, éxito

### 🔌 Integración API

#### Queries GraphQL
- `getInvoices`: Obtener lista de facturas
- `getInvoice`: Obtener factura específica
- `getTasasBCV`: Obtener tasa BCV del día

#### Mutations GraphQL
- `createInvoice`: Crear nueva factura
- `updateInvoice`: Actualizar factura existente
- `deleteInvoice`: Eliminar factura
- `processPayment`: Procesar pago de factura

### 📝 Validaciones

- **Campos Requeridos**: Cliente, cédula, teléfono
- **Items Mínimos**: Al menos un item por factura
- **Precios Positivos**: Cantidades y precios >= 0
- **Pago Completo**: Total pagado debe ser >= total factura
- **Tasa BCV**: Validación de tasa válida

### 🚨 Manejo de Errores

- **Validación de Formularios**: Errores en tiempo real
- **Errores de API**: Mensajes descriptivos
- **Confirmaciones**: Diálogos de confirmación para acciones destructivas
- **Fallbacks**: Valores por defecto cuando falla la red

### 🔄 Estados de la Aplicación

- **Loading**: Indicadores de carga durante operaciones
- **Error**: Mensajes de error claros
- **Success**: Confirmaciones de operaciones exitosas
- **Draft**: Facturas en borrador
- **Paid**: Facturas pagadas
- **Cancelled**: Facturas canceladas
