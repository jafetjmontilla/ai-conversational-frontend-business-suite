'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bold,
  Check,
  ChevronDown,
  Italic,
  MoreHorizontal,
  Settings,
  Underline,
} from 'lucide-react';
import { toast } from 'sonner';

import { ThemeDemo } from '@/components/ThemeDemo';
import { CommentsPanel } from '@/components/CommentsPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SimpleThemeToggle } from '@/components/SimpleThemeToggle';
import { InputSearch } from '@/components/InputSearch';
import { InputPhone } from '@/components/InputPhone';
import { InputInteger } from '@/components/InputInteger';
import { InputContable } from '@/components/inputContable';
import { Toggle, ToggleWithBorder } from '@/components/Toggle';
import { AutocompleteInput } from '@/components/AutocompleteInput';
import { FileIconComponent } from '@/components/FileIconComponent';
import Dropdown from '@/components/Dropdown';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PWAUpdateDialog } from '@/components/PWAUpdateDialog';
import { PageHeader } from '@/components/layouts/PageHeader';
import { FieldHelpText } from '@/components/offerings/FieldHelpText';
import { InventoryModeBadge } from '@/components/offerings/InventoryModeBadge';
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyLead,
  TypographyMuted,
  TypographyLarge,
  TypographySmall,
  TypographyExtraSmall,
  TypographyInlineCode,
  TypographyBlockquote,
  TypographyList,
} from '@/components/Typography';
import { cn } from '@/lib/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InfoNotice } from '@/components/ui/info-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TABLE_DEMO_INVOICES = [
  { invoice: 'INV001', paymentStatus: 'Paid', totalAmount: '$250.00', paymentMethod: 'Credit Card' },
  { invoice: 'INV002', paymentStatus: 'Pending', totalAmount: '$150.00', paymentMethod: 'PayPal' },
  { invoice: 'INV003', paymentStatus: 'Unpaid', totalAmount: '$350.00', paymentMethod: 'Bank Transfer' },
  { invoice: 'INV004', paymentStatus: 'Paid', totalAmount: '$450.00', paymentMethod: 'Credit Card' },
  { invoice: 'INV005', paymentStatus: 'Paid', totalAmount: '$550.00', paymentMethod: 'PayPal' },
  { invoice: 'INV006', paymentStatus: 'Pending', totalAmount: '$200.00', paymentMethod: 'Bank Transfer' },
  { invoice: 'INV007', paymentStatus: 'Unpaid', totalAmount: '$300.00', paymentMethod: 'Credit Card' },
];

function TableDemo() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {TABLE_DEMO_INVOICES.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

type Comment = {
  _id?: string;
  comment?: string;
  attachments?: Array<{ name: string; size: number }>;
  createdAt?: string;
  uid?: string;
  displayName?: string;
};

const SECTIONS = [
  { id: 'theme', label: 'Theme demo' },
  { id: 'comments', label: 'Comments' },
  { id: 'primitives', label: 'UI primitives' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'typography', label: 'Typography' },
  { id: 'shared', label: 'Shared' },
  { id: 'catalog', label: 'Catálogo' },
] as const;

const COMPONENT_CATALOG: { folder: string; files: string[] }[] = [
  {
    folder: 'ui/',
    files: [
      'alert', 'auto-resize-textarea', 'avatar', 'badge', 'button', 'calendar', 'card',
      'carousel', 'command', 'dialog', 'dropdown-menu', 'form', 'info-notice', 'input',
      'label', 'navigation-menu', 'popover', 'select', 'separator', 'sheet', 'sidebar',
      'skeleton', 'sonner', 'switch', 'table', 'tabs', 'textarea', 'toggle', 'toggle-group', 'tooltip',
    ],
  },
  {
    folder: '(raíz)',
    files: [
      'AttachedFilesDisplay', 'AutocompleteInput', 'BusinessFormCreateEdit', 'BusinessMemberFormModal',
      'CommentsPanel', 'ConfirmDeleteDialog', 'Dropdown', 'FileIconComponent', 'FileUpload',
      'FormFieldInputs', 'FullViewportDialogContent', 'InputComments', 'inputContable',
      'InputInteger', 'InputPhone', 'InputSearch', 'InstallPWA', 'ListComments',
      'NotificationHandler', 'PWAUpdateDialog', 'QuillEditor', 'SimpleThemeToggle',
      'SwiperPastedAndDropFiles', 'ThemeDemo', 'ThemeToggle', 'Toggle', 'Typography', 'UserFormModal',
    ],
  },
  { folder: 'ai/', files: ['AiBehaviorPageContent', 'AiMemoryAjustesPageContent', 'AiToolsPageContent'] },
  { folder: 'app-suite/', files: ['AppSuiteAppCard', 'AppSuiteDetailDialog', 'AppSuitePageContent', 'FeatureGate', 'ProductSellableField'] },
  { folder: 'auth/', files: ['LoginForm', 'PasswordRecoveryForm', 'RegisterInvitationForm', 'RegisterStep1', 'RegisterStep2'] },
  {
    folder: 'billing/',
    files: [
      'AgentInvoiceBanner', 'BillingConfigContent', 'CommerceAgentSettings', 'CommerceCheckoutGuide',
      'InternalBillingAppGate', 'InternalBillingAppPrompt', 'InternalBillingUsageBar',
      'InvoicesBillingContent', 'OrdersContent', 'PaymentsReportContent', 'PaymentSummaryContent',
    ],
  },
  {
    folder: 'business/',
    files: [
      'BusinessEditPageContent', 'BusinessFormFields', 'BusinessFormShell', 'CreateBusinessForm',
      'EditBusinessForm', 'GenerateDescriptionDialog', 'GenerateDescriptionInterviewDialog',
      'ProductCategoriesImportDialog',
    ],
  },
  { folder: 'business-config/', files: ['BusinessCacheTabContent', 'BusinessConfigForm'] },
  { folder: 'catalog/', files: ['AttributesCatalogContent', 'ProductEditPanel', 'ProductsCatalogContent', 'ServicesCatalogContent'] },
  { folder: 'channels/', files: ['ChannelAgentEngineSelect', 'ChannelsPageContent'] },
  { folder: 'cse/', files: ['CseTestChat', 'TeachFromChatModal'] },
  { folder: 'inventory/', files: ['QuantityUpdateDialog'] },
  { folder: 'invoice/', files: ['InventorySearch', 'InvoiceCard', 'InvoiceLineModifiers', 'InvoiceLineNoteField', 'PaymentDialog'] },
  {
    folder: 'knowledge/',
    files: [
      'KnowledgeAuditContent', 'KnowledgeDraftItemRow', 'KnowledgeIndexedItemRow', 'KnowledgeItemFormFields',
      'ProtocolDraftForm', 'ProtocolsPageContent', 'ProtocolStepsEditor', 'StringListEditor',
    ],
  },
  { folder: 'layouts/', files: ['PageHeader', 'SectionTabLayout', 'SidebarLayout'] },
  { folder: 'navigation/', files: ['AppSidebar'] },
  {
    folder: 'offerings/',
    files: [
      'CatalogAvailabilityPreview', 'FieldHelpText', 'InventoryModeBadge', 'InventoryScenarioHints',
      'ModifierGroupSectionsEditor', 'ModifierGroupsLinker', 'OfferingArchivedSection',
      'OfferingsGenerateDialog', 'OfferingsImportWizard', 'OfferingsLayoutToolbar', 'PriceMatrixEditor',
      'ProductInventorySection', 'RequiredMaterialsEditor',
    ],
  },
  { folder: 'ops/', files: ['CheckoutAuditContent', 'PromptLogsContent'] },
  { folder: 'pae/', files: ['PaeContactsContent', 'PaeDevicesContent', 'PaeEpisodesContent', 'PaeProactiveContent', 'PaeSkillsContent', 'PaeWorkflowsContent'] },
  { folder: 'profile/', files: ['ProfilePageContent'] },
  { folder: 'sitio-publico/', files: ['SitioPublicoPageContent'] },
  { folder: 'user-memories/', files: ['UserMemoriesContent'] },
  { folder: 'users/', files: ['BusinessUsersPageContent', 'UsersAndInvitationsTable'] },
];

function getDeviceType(width: number): string {
  if (width < 640) return 'Móvil';
  if (width < 1024) return 'Tablet';
  return 'Escritorio';
}

function DemoSection({
  id,
  title,
  description,
  active,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 space-y-4 rounded-xl border p-4 sm:p-6 transition-colors duration-200',
        active
          ? 'border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/30'
          : 'border-border bg-card/30',
      )}
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DemoBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export function UiDemoPageContent() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [disableAttachments, setDisableAttachments] = useState(false);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [deviceType, setDeviceType] = useState('');
  const [phone, setPhone] = useState('');
  const [integer, setInteger] = useState('12');
  const [amount, setAmount] = useState<number | null>(1250.5);
  const [autocomplete, setAutocomplete] = useState('');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [switchOn, setSwitchOn] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);
  const [dropdownSelected, setDropdownSelected] = useState('es');
  const [autoText, setAutoText] = useState('Escribe y el área crece…');
  const [activeSection, setActiveSection] = useState<string>('theme');

  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 0;
      const h = typeof window !== 'undefined' ? window.innerHeight : 0;
      setResolution({ width: w, height: h });
      setDeviceType(w > 0 ? getDeviceType(w) : '');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  const totalComponents = useMemo(
    () => COMPONENT_CATALOG.reduce((acc, g) => acc + g.files.length, 0),
    [],
  );

  return (
    <TooltipProvider>
      <div className="min-h-[100dvh] bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">UI Kit · Business Suite</p>
              <p className="truncate text-xs text-muted-foreground">
                Demo pública de components/* · {totalComponents} entradas en catálogo
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SimpleThemeToggle />
              <ThemeToggle />
            </div>
          </div>
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {s.label}
                </a>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
          <PageHeader
            title="Catálogo de componentes"
            description="Incluye ThemeDemo, CommentsPanel y demos interactivas de primitivos y shared. Los *Content de dominio quedan listados (requieren contexto de negocio)."
            actions={
              <Label className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                {resolution.width || '—'} × {resolution.height || '—'} · {deviceType || '—'}
              </Label>
            }
          />

          <DemoSection
            id="theme"
            title="Theme demo"
            description="Estado del tema, paleta y selectores (ThemeDemo). Inputs, toggles, buttons, tabs y table viven abajo en sus secciones."
            active={activeSection === 'theme'}
          >
            <div className="rounded-lg border border-border bg-card">
              <ThemeDemo />
            </div>
          </DemoSection>

          <DemoSection
            id="comments"
            title="Comments"
            description="Panel de comentarios de theme-demo (InputComments + ListComments)."
            active={activeSection === 'comments'}
          >
            <Card>
              <CardHeader>
                <CardTitle>CommentsPanel</CardTitle>
                <CardDescription>
                  Editor Quill, adjuntos y emojis (mismo bloque que /theme-demo).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={disabled}
                      onChange={(e) => setDisabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-muted-foreground">Deshabilitar comentarios</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={disableAttachments}
                      onChange={(e) => setDisableAttachments(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-muted-foreground">Deshabilitar adjuntos</span>
                  </label>
                </div>
                <CommentsPanel
                  comments={comments}
                  disabled={disabled}
                  disableAttachments={disableAttachments}
                  onCommentAdded={(comment) => {
                    setComments((prev) => [
                      ...prev,
                      {
                        ...comment,
                        uid: 'current-user-id',
                        displayName: 'Usuario Actual',
                      },
                    ]);
                  }}
                  onDeleteComment={(commentId) => {
                    if (commentId) {
                      setComments((prev) => prev.filter((c) => c._id !== commentId));
                    }
                  }}
                  onDownloadFile={(fileName) => {
                    toast.message(`Descargar: ${fileName}`);
                  }}
                  currentUserId="current-user-id"
                />
              </CardContent>
            </Card>
          </DemoSection>

          <DemoSection
            id="primitives"
            title="UI primitives (shadcn)"
            description="components/ui/* — botones, badges, cards, alerts, tabs, table, calendar, etc."
            active={activeSection === 'primitives'}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DemoBlock title="Button">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">outline</Button>
                  <Button>default</Button>
                  <Button variant="secondary">secondary</Button>
                  <Button variant="destructive">destructive</Button>
                  <Button variant="ghost">ghost</Button>
                  <Button variant="link">link</Button>
                  <Button size="sm">sm</Button>
                  <Button size="lg">lg</Button>
                  <Button size="icon" aria-label="Más">
                    <MoreHorizontal />
                  </Button>
                </div>
              </DemoBlock>

              <DemoBlock title="Badge">
                <div className="flex flex-wrap gap-2">
                  <Badge>default</Badge>
                  <Badge variant="secondary">secondary</Badge>
                  <Badge variant="outline">outline</Badge>
                  <Badge variant="destructive">destructive</Badge>
                  <InventoryModeBadge
                    mode={{
                      key: 'recipe',
                      label: 'Receta',
                      variant: 'outline',
                      title: 'Producto con BOM',
                    }}
                  />
                </div>
              </DemoBlock>

              <DemoBlock title="Alert + InfoNotice">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Aviso</AlertTitle>
                  <AlertDescription>Alert default del design system.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Alert destructive.</AlertDescription>
                </Alert>
                <div className="-mx-2 sm:-mx-8">
                  <InfoNotice title="InfoNotice">
                    Aviso informativo reutilizable con acento primary.
                  </InfoNotice>
                </div>
              </DemoBlock>

              <DemoBlock title="Avatar · Switch · Skeleton">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src="https://picsum.photos/seed/kiterai-ui/80" alt="Avatar" />
                    <AvatarFallback>KI</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Switch checked={switchOn} onCheckedChange={setSwitchOn} id="demo-switch" />
                    <Label htmlFor="demo-switch">{switchOn ? 'On' : 'Off'}</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </DemoBlock>

              <DemoBlock title="Card · ejemplos de tema">
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h5 className="mb-2 font-medium text-foreground">Tarjeta de Ejemplo</h5>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Este es un ejemplo de cómo se ven los componentes en el tema actual.
                    </p>
                    <Button size="sm">Botón Primario</Button>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h5 className="mb-2 font-medium text-foreground">Tarjeta con Borde</h5>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Componente con borde para mostrar contraste.
                    </p>
                    <Button size="sm" variant="outline">
                      Botón Secundario
                    </Button>
                  </div>
                </div>
              </DemoBlock>

              <DemoBlock title="Select · Tabs">
                <div className="space-y-2">
                  <Label>Select</Label>
                  <Select defaultValue="es">
                    <SelectTrigger>
                      <SelectValue placeholder="Idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Tabs defaultValue="account">
                  <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account" className="text-sm text-muted-foreground">
                    hola 1
                  </TabsContent>
                  <TabsContent value="password" className="text-sm text-muted-foreground">
                    hola 2
                  </TabsContent>
                </Tabs>
              </DemoBlock>

              <DemoBlock title="Calendar" className="md:col-span-2">
                <Calendar
                  mode="single"
                  selected={calendarDate}
                  onSelect={setCalendarDate}
                  className="rounded-md border"
                />
              </DemoBlock>

              <DemoBlock title="Table" className="md:col-span-2">
                <TableDemo />
              </DemoBlock>

              <DemoBlock title="Separator · Tooltip · Sonner">
                <p className="text-sm">Arriba</p>
                <Separator />
                <p className="text-sm">Abajo</p>
                <div className="flex flex-wrap gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm">
                        Hover tooltip
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Texto del tooltip</TooltipContent>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.success('Toast de ejemplo')}
                  >
                    Toast success
                  </Button>
                </div>
              </DemoBlock>

              <DemoBlock title="Toggle groups (Toggle.tsx)">
                <div className="flex flex-wrap gap-2 items-end">
                  <Toggle
                    size="sm"
                    type="single"
                    items={[
                      { value: 'bold', label: 'Bold', icon: <Bold /> },
                      { value: 'italic', label: 'Italic', icon: <Italic /> },
                      { value: 'underline', label: 'Underline', icon: <Underline /> },
                    ]}
                  />
                  <ToggleWithBorder
                    size="xs"
                    type="single"
                    items={[
                      { value: 'bold', label: 'Bold', icon: <Bold /> },
                      { value: 'italic', label: 'Italic', icon: <Italic /> },
                      { value: 'underline', label: 'Underline', icon: <Underline /> },
                    ]}
                  />
                </div>
              </DemoBlock>
            </div>
          </DemoSection>

          <DemoSection
            id="inputs"
            title="Inputs compartidos"
            description="Input, Textarea, InputSearch, Phone, Integer, Contable, Autocomplete, AutoResize."
            active={activeSection === 'inputs'}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DemoBlock title="Input / Textarea / Search">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <InputSearch placeholder="Buscar" className="w-full sm:w-80" />
                  <Input type="email" placeholder="email" className="w-full sm:w-80" />
                  <Input type="password" placeholder="password" className="w-full sm:w-80" />
                </div>
                <Textarea placeholder="Textarea estándar" rows={3} />
                <AutoResizeTextarea
                  value={autoText}
                  onChange={(e) => setAutoText(e.target.value)}
                  minRows={1}
                  maxRows={4}
                />
                <FieldHelpText>FieldHelpText bajo el campo.</FieldHelpText>
              </DemoBlock>

              <DemoBlock title="Phone · Integer · Contable · Autocomplete">
                <div className="space-y-1">
                  <Label>Teléfono</Label>
                  <InputPhone value={phone} onChange={setPhone} placeholder="+58…" />
                </div>
                <div className="space-y-1">
                  <Label>Entero</Label>
                  <InputInteger value={integer} onChange={setInteger} min={0} max={999} />
                </div>
                <div className="space-y-1">
                  <Label>Contable</Label>
                  <InputContable value={amount} onChange={setAmount} />
                </div>
                <AutocompleteInput
                  label="Autocomplete"
                  value={autocomplete}
                  onChange={setAutocomplete}
                  options={['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto']}
                  placeholder="Ciudad…"
                />
              </DemoBlock>
            </div>
          </DemoSection>

          <DemoSection
            id="overlays"
            title="Overlays"
            description="Dialog, Sheet, Popover, Dropdown, ConfirmDelete, PWAUpdate."
            active={activeSection === 'overlays'}
          >
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Diálogo de ejemplo</DialogTitle>
                    <DialogDescription>Contenido de Dialog de shadcn.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button type="button">Aceptar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Panel lateral</SheetTitle>
                    <SheetDescription>Sheet de ejemplo.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    Popover <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-sm">
                  Contenido del popover.
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Menu <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dropdown
                icon={Settings}
                text="Idioma"
                selected={dropdownSelected}
                items={[
                  {
                    value: 'es',
                    label: (
                      <span className="flex items-center gap-2">
                        ES {dropdownSelected === 'es' ? <Check className="h-3 w-3" /> : null}
                      </span>
                    ),
                    onSelect: () => setDropdownSelected('es'),
                  },
                  {
                    value: 'en',
                    label: 'EN',
                    onSelect: () => setDropdownSelected('en'),
                  },
                ]}
              />

              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                ConfirmDelete
              </Button>
              <Button variant="secondary" onClick={() => setPwaOpen(true)}>
                PWAUpdate
              </Button>
            </div>

            <ConfirmDeleteDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title="¿Eliminar elemento?"
              description="Esta acción no se puede deshacer."
              onConfirm={() => {
                toast.success('Eliminado (demo)');
                setDeleteOpen(false);
              }}
            />
            <PWAUpdateDialog
              open={pwaOpen}
              onUpdate={() => {
                toast.message('Actualizar (demo)');
                setPwaOpen(false);
              }}
              onDismiss={() => setPwaOpen(false)}
            />
          </DemoSection>

          <DemoSection
            id="typography"
            title="Typography"
            description="components/Typography.tsx + emoji / flags (ex ThemeDemo Countrys)."
            active={activeSection === 'typography'}
          >
            <DemoBlock title="Countrys / emoji">
              <p>Me encanta la comida mexicana 🌮 y su bandera 🇲🇽.</p>
            </DemoBlock>
            <div className="max-w-2xl space-y-3 rounded-lg border border-border p-6">
              <TypographyH1>Heading 1</TypographyH1>
              <TypographyH2>Heading 2</TypographyH2>
              <TypographyH3>Heading 3</TypographyH3>
              <TypographyH4>Heading 4</TypographyH4>
              <TypographyLead>Lead: texto de introducción más grande.</TypographyLead>
              <TypographyP>
                Párrafo con <TypographyInlineCode>código inline</TypographyInlineCode>.
              </TypographyP>
              <TypographyLarge>Large</TypographyLarge>
              <TypographySmall>Small</TypographySmall>
              <TypographyExtraSmall>Extra small</TypographyExtraSmall>
              <TypographyMuted>Muted text</TypographyMuted>
              <TypographyBlockquote>Blockquote de ejemplo.</TypographyBlockquote>
              <TypographyList>
                <li>Ítem uno</li>
                <li>Ítem dos</li>
              </TypographyList>
            </div>
          </DemoSection>

          <DemoSection
            id="shared"
            title="Shared extras"
            description="FileIcon y otros átomos que no necesitan negocio."
            active={activeSection === 'shared'}
          >
            <DemoBlock title="FileIconComponent">
              <div className="flex flex-wrap gap-4">
                {['pdf', 'docx', 'xlsx', 'png', 'mp4'].map((ext) => (
                  <div key={ext} className="flex w-14 flex-col items-center gap-1">
                    <FileIconComponent extension={ext} className="h-10 w-10" />
                    <span className="text-[10px] text-muted-foreground">.{ext}</span>
                  </div>
                ))}
              </div>
            </DemoBlock>
          </DemoSection>

          <DemoSection
            id="catalog"
            title="Índice components/*"
            description="Listado de archivos. Los *Content / páginas de dominio no se montan aquí (Auth, BusinessProvider, GraphQL)."
            active={activeSection === 'catalog'}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COMPONENT_CATALOG.map((group) => (
                <Card key={group.folder}>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-mono text-sm">{group.folder}</CardTitle>
                    <CardDescription>{group.files.length} archivos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="max-h-48 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                      {group.files.map((f) => (
                        <li key={f} className="truncate font-mono">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoSection>

          <div className="border-t border-border pt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Ir a login
            </Link>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
