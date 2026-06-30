import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Ticket,
  FileText,
  ChefHat,
  ShoppingBag,
  MessageSquare,
  Zap,
  Monitor,
  LayoutGrid,
  Wallet,
  Truck,
  Boxes,
  Package,
} from "lucide-react";

export type AppSuiteCategory = "All" | "IA" | "Negocios" | "Productividad" | "Finanzas";

export type AppSuiteModule = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  audience: string;
  category: Exclude<AppSuiteCategory, "All">;
  categoryLabel: string;
  rating: number;
  reviews: number;
  features: string[];
  icon: LucideIcon;
  iconGradient: string;
  /** Ruta relativa al negocio; undefined = próximamente */
  routePath?: string;
  /** Muestra "Instalar Beta" en lugar de "Instalar" */
  isBeta?: boolean;
};

export const APP_SUITE_CATEGORIES: { value: AppSuiteCategory; label: string }[] = [
  { value: "All", label: "Todas" },
  { value: "IA", label: "Inteligencia Artificial" },
  { value: "Negocios", label: "Negocios y Ventas" },
  { value: "Productividad", label: "Productividad y Gestión" },
  { value: "Finanzas", label: "Finanzas y Control" },
];

export const APP_SUITE_MODULES: AppSuiteModule[] = [
  {
    id: "gestion-citas",
    title: "Gestión de Citas",
    tagline: "Automatiza tu agenda sin complicaciones.",
    description:
      "Permite que tus clientes reserven, cancelen y reprogramen sus citas las 24 horas del día de manera autónoma. Sincroniza calendarios personales, envía notificaciones automáticas y mitiga inasistencias de manera impecable.",
    audience:
      "Profesionales independientes, centros de estética, clínicas médicas, consultores y academias que venden su tiempo por horas.",
    category: "Productividad",
    categoryLabel: "Productividad y Gestión",
    rating: 4.9,
    reviews: 245,
    icon: Calendar,
    iconGradient: "from-blue-500 to-cyan-600",
    features: [
      "Sincronización bidireccional con Google Calendar",
      "Recordatorios automatizados mediante WhatsApp e Email",
      "Aceptación de anticipos o pagos completos en línea",
      "Gestión multi-miembro del equipo y cabinas",
    ],
  },
  {
    id: "organizador-eventos",
    title: "Organizador de Eventos",
    tagline: "Planificación perfecta de principio a fin.",
    description:
      "Gestiona cronogramas detallados paso a paso, listas dinámicas de invitados con control de acceso, flujos presupuestarios de gastos, y una libreta integrada de proveedores clave para coordinar eventos corporativos o fiestas privadas.",
    audience:
      "Event planners, agencias de marketing, departamentos de RRHH, empresas de catering y particulares organizadores.",
    category: "Productividad",
    categoryLabel: "Productividad y Gestión",
    rating: 4.7,
    reviews: 184,
    icon: Ticket,
    iconGradient: "from-pink-500 to-rose-600",
    features: [
      "Gestión dinámica de listas de invitados con QR",
      "Seguimiento de presupuesto y cotizaciones en tiempo real",
      "Cronograma interactivo min-a-min del evento",
      "Asignación directa de roles y tareas al equipo",
    ],
  },
  {
    id: "facturacion-inventario",
    title: "Facturación e Inventario",
    tagline: "El control total de tu negocio en tiempo real.",
    description:
      "Emite facturas fiscales de forma ágil, calcula impuestos automáticos, actualiza tu stock automáticamente y obtén predicciones inteligentes para reponer existencias antes de quedarte sin mercadería para tus clientes.",
    audience:
      "Pequeñas y medianas empresas (PyMEs), distribuidores, bodegones, ferreterías y tiendas físicas con almacén dinámico.",
    category: "Finanzas",
    categoryLabel: "Finanzas y Control",
    rating: 4.8,
    reviews: 312,
    icon: FileText,
    iconGradient: "from-teal-500 to-emerald-600",
    routePath: "/billing/facturas",
    features: [
      "Facturación multidivisa e impresión simplificada",
      "Control estricto de múltiples almacenes/sucursales",
      "Alertas push de mínimo stock configurables",
      "Módulo simplificado de egresos y gastos corrientes",
    ],
  },
  {
    id: "gestion-proveedores",
    title: "Gestión de Proveedores",
    tagline: "Optimiza tu cadena de suministro y órdenes de compra.",
    description:
      "Centraliza la comunicación, compras y auditoría de tu red de abastecimiento. Registra catálogos de productos por proveedor, genera órdenes de compra automatizadas según tus niveles de stock y evalúa tiempos de entrega y costos para asegurar siempre las mejores condiciones comerciales.",
    audience:
      "Empresas comerciales, fabricantes, constructoras y negocios con cadenas de suministro que necesitan controlar compras y abastecimiento.",
    category: "Productividad",
    categoryLabel: "Productividad y Gestión",
    rating: 4.7,
    reviews: 168,
    icon: Truck,
    iconGradient: "from-slate-600 to-blue-600",
    features: [
      "Historial completo de compras y órdenes generadas",
      "Evaluación de rendimiento, costos y tiempos de entrega (KPIs)",
      "Alertas automáticas de vencimiento de facturas y cuentas por pagar",
      "Catálogo de productos e insumos vinculados por proveedor",
    ],
  },
  {
    id: "gestion-insumos-materia-prima",
    title: "Gestión de Insumos y Materia Prima",
    tagline: "Control total del stock base y mermas en tu producción.",
    description:
      "Administra el corazón de tu cadena productiva con un inventario especializado para recursos en estado bruto. Registra entradas de materiales, calcula costos promedio de adquisición, gestiona el porcentaje de merma o desperdicio, y establece alertas críticas de reabastecimiento para que tu línea de producción nunca se detenga.",
    audience:
      "Fábricas, talleres de manufactura, laboratorios, constructoras y empresas de producción que transforman recursos en productos terminados.",
    category: "Productividad",
    categoryLabel: "Productividad y Gestión",
    rating: 4.7,
    reviews: 142,
    icon: Boxes,
    iconGradient: "from-stone-500 to-amber-600",
    features: [
      "Trazabilidad completa de lotes y fechas de caducidad de insumos",
      "Cálculo automatizado de costos de adquisición y almacenamiento",
      "Control de mermas, desperdicios y devoluciones de material",
      "Alertas de stock mínimo y órdenes automáticas de requisición",
    ],
  },
  {
    id: "procesadora-alimentos",
    title: "Procesadora de Alimentos",
    tagline: "Optimiza tu producción y receta al detalle.",
    description:
      "Lleva el control de la transformación de materia prima en producto terminado. Calcula costos precisos de producción, genera tablas nutricionales automáticamente y asegura la trazabilidad estricta por lotes para cumplir normativas alimentarias.",
    audience:
      "Restaurantes con producción propia, pastelerías, cervecerías artesanales, caterings y manufactureras de alimentos medianas.",
    category: "Productividad",
    categoryLabel: "Productividad y Gestión",
    rating: 4.6,
    reviews: 98,
    icon: ChefHat,
    iconGradient: "from-amber-500 to-orange-600",
    features: [
      "Gestión y estandarización exacta de recetas",
      "Cálculo de mermas y balance de materias primas",
      "Seguimiento estricto por lote y fecha de vencimiento",
      "Generación rápida de fichas técnicas nutricionales",
    ],
  },
  {
    id: "tienda-online",
    title: "Tienda Online",
    tagline: "Lleva tus productos al mundo digital.",
    description:
      "Crea tu plataforma de e-commerce personalizable con facilidad. Cuenta con un carrito de compras interactivo, conexiones con pasarelas de pago líderes mundiales (Stripe, PayPal) y herramientas ágiles de despacho integradas.",
    audience:
      "Emprendedores locales, marcas independientes, distribuidores minoristas y negocios transicionando de físico a digital.",
    category: "Negocios",
    categoryLabel: "Negocios y Ventas",
    rating: 4.9,
    reviews: 421,
    icon: ShoppingBag,
    iconGradient: "from-violet-500 to-fuchsia-600",
    routePath: "/offerings/products",
    features: [
      "Pasarelas de pago listas para usar integradas",
      "Carrito auto-guardado para recuperar ventas perdidas",
      "Cálculo automatizado de costos de envío y aduana",
      "Optimización SEO integral para aumentar tráfico",
    ],
  },
  {
    id: "agente-atencion-cliente",
    title: "Agente de Atención al Cliente",
    tagline: "Soporte inteligente las 24 horas.",
    description:
      "Un poderoso agente dotado de Inteligencia Artificial que comprende el lenguaje natural humano. Resuelve dudas frecuentes, encamina quejas urgentes a agentes reales y ofrece recomendaciones de catálogo durante la noche o fines de semana.",
    audience:
      "Empresas con flujos masivos de chat en vivo, SaaS, tiendas virtuales y firmas con mesas de soporte saturadas.",
    category: "IA",
    categoryLabel: "Inteligencia Artificial",
    rating: 4.8,
    reviews: 195,
    icon: MessageSquare,
    iconGradient: "from-cyan-500 to-blue-600",
    routePath: "/ai/behavior",
    features: [
      "Respuestas automáticas basadas en tu base de datos",
      "Derivación contextual a humanos cuando es crítico",
      "Análisis automatizado de sentimiento del usuario",
      "Soporte inmediato multilingüe las 24 horas",
    ],
  },
  {
    id: "agente-asistente-personal",
    title: "Agente Asistente Personal",
    tagline: "Tu productividad multiplicada por la IA.",
    description:
      "Maximiza tu tiempo productivo delegando en este asistente virtual de IA. Deja que organice tu agenda, redacte y responda correos complejos, sintetice extensos archivos PDF o te recuerde compromisos basados en tus ritmos y comportamientos.",
    audience:
      "Directores ejecutivos, fundadores de startups, consultores senior y freelancers sobrecargados de administración.",
    category: "IA",
    categoryLabel: "Inteligencia Artificial",
    rating: 4.7,
    reviews: 156,
    icon: Zap,
    iconGradient: "from-indigo-500 to-purple-600",
    routePath: "/ai/memory/datos",
    features: [
      "Redacción y filtrado inteligente de correos electrónicos",
      "Generación ágil de resúmenes de reuniones en un clic",
      "Bloqueo automático de bloques de enfoque óptimos",
      "Integración total con Slack, Teams y Whatsapp",
    ],
  },
  {
    id: "landing-page",
    title: "Landing Page",
    tagline: "Convierte visitas en clientes potenciales.",
    description:
      "Un constructor visual intuitivo para lanzar páginas de aterrizaje en minutos. Convierte visitantes en prospectos calificados integrando formularios de captura directos y paneles de analítica optimizados para conversiones rápidas.",
    audience:
      "Profesionales de marketing digital, creadores, emprendedores y marcas que ejecutan campañas publicitarias activas.",
    category: "Negocios",
    categoryLabel: "Negocios y Ventas",
    rating: 4.5,
    reviews: 310,
    icon: Monitor,
    iconGradient: "from-fuchsia-500 to-pink-600",
    features: [
      "Estructura Drag & Drop fácil y rápida",
      "Optimización móvil total de forma automática",
      "Formularios de registro de datos directos a base de datos",
      "Pruebas dinámicas A/B para mejorar la tasa de conversión",
    ],
  },
  {
    id: "productos-servicios",
    title: "Productos y Servicios",
    tagline: "Organiza lo que ofreces a tus clientes.",
    description:
      "Centraliza el inventario de artículos y servicios de tu negocio. Define precios, variantes, atributos y disponibilidad. El agente consulta el catálogo en tiempo real vía herramientas.",
    audience:
      "Cualquier negocio que vende productos físicos, servicios profesionales o una mezcla de ambos.",
    category: "Negocios",
    categoryLabel: "Negocios y Ventas",
    rating: 4.8,
    reviews: 278,
    icon: Package,
    iconGradient: "from-emerald-500 to-teal-600",
    routePath: "/offerings/products",
    features: [
      "Gestión unificada de productos y servicios",
      "Atributos y variantes configurables",
      "Control de stock y precios por ítem",
      "Base para catálogo web y tienda online",
    ],
  },
  {
    id: "catalogo-web",
    title: "Catálogo Web",
    tagline: "Exhibe tus productos con elegancia.",
    description:
      "La vitrina interactiva ideal para mostrar servicios o artículos. Sin flujos de pago complejos, esta solución expone fotos HD, precios detallados, categorías limpias y un botón interactivo de WhatsApp para negociar ventas cara a cara.",
    audience:
      "Negocios locales independientes, talleres artesanales, inmobiliarias independientes y locales gastronómicos.",
    category: "Negocios",
    categoryLabel: "Negocios y Ventas",
    rating: 4.6,
    reviews: 215,
    icon: LayoutGrid,
    iconGradient: "from-sky-500 to-blue-600",
    isBeta: true,
    features: [
      "Enlaces automáticos para iniciar chat de ventas en WhatsApp",
      "Clasificación ágil de productos y subida masiva CSV",
      "Optimización ligera para carga súper rápida en móviles",
      "Diseño limpio y moderno enfocado en lo visual",
    ],
  },
  {
    id: "finanzas-personales",
    title: "Finanzas Personales",
    tagline: "Toma las riendas de tu dinero.",
    description:
      "Simplifica el control de tu economía diaria. Registra tus ingresos de forma simple, clasifica tus gastos automáticos, elabora presupuestos coherentes por secciones y visualiza tu ritmo de ahorro de cara a metas futuras con gráficas atractivas.",
    audience:
      "Estudiantes, jóvenes profesionales, freelancers o cualquier persona interesada en mejorar sus hábitos y balance financiero.",
    category: "Finanzas",
    categoryLabel: "Finanzas y Control",
    rating: 4.8,
    reviews: 295,
    icon: Wallet,
    iconGradient: "from-emerald-500 to-teal-600",
    features: [
      "Registro ágil de transacciones repetitivas",
      "Alertas cuando estás por exceder el tope de presupuesto",
      "Generación automática de gráficos de pastel intuitivos",
      "Sincronización multidispositivo con respaldo en la nube",
    ],
  },
];

export function getAppRoute(businessId: string, app: AppSuiteModule): string | undefined {
  if (!app.routePath) return undefined;
  return `/${businessId}${app.routePath}`;
}

export function isAppAvailable(app: AppSuiteModule): boolean {
  return Boolean(app.routePath);
}

export function countAvailableApps(): number {
  return APP_SUITE_MODULES.filter(isAppAvailable).length;
}
