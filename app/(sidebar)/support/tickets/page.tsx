'use client';

import React, { useState, useEffect, useRef, ComponentType } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AutocompleteInput } from '@/components/AutocompleteInput';
import { QuillEditor, PastedAndDropFile } from '@/components/QuillEditor';
import { FileUpload, UploadedFile, FileUploadRef } from '@/components/FileUpload';
import { Interweave } from 'interweave';
import { HashtagMatcher, UrlMatcher, UrlProps } from 'interweave-autolink';
import Link from 'next/link';
import { User } from '@/lib/interfases';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { useSupportPermissions } from '@/lib/hooks/useAllowed';
import { useRouter } from 'next/navigation';
import { InputComments } from '@/components/InputComments';

interface TicketUser {
  _id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

interface WisphubZona {
  id: number;
  nombre: string;
}

interface WisphubCliente {
  id_servicio: number;
  nombre?: string;
  apellido?: string;
  usuario?: string;
  ip?: string;
  telefono?: string;
  zona?: WisphubZona;
  [key: string]: any;
}

interface TicketZona {
  id: number;
  nombre: string;
}

interface TicketCliente {
  cliente: string; // nombre completo
  usuario?: string;
  ip?: string;
  id_servicio: number;
  zona?: TicketZona;
}

interface Ticket {
  _id: string;
  number: number;
  subject: string;
  failureReason?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  createdBy_id?: string;
  createdBy?: TicketUser;
  finishedBy_id?: string;
  finishedBy?: TicketUser;
  status?: string;
  priority?: string;
  technician_id?: string;
  technician?: TicketUser;
  department?: string;
  reportOrigin?: string;
  description?: string;
  ticketFileAttachment?: string[];
  service?: any;
  zoneId: number;
  responses?: any[];
  updatedAt?: string;
  cliente?: TicketCliente;
}

interface TicketsResponse {
  total: number;
  results: Ticket[];
}

export default function TicketsPage() {
  const { authUser } = useAuth();
  const router = useRouter();
  const { canViewSupport, canCreateEditTickets, canDeleteTickets } = useSupportPermissions();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [issues, setIssues] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const fileUploadRef = useRef<FileUploadRef>(null);
  const [filterByTechnicalSupport, setFilterByTechnicalSupport] = useState(true);
  const [clienteSearchText, setClienteSearchText] = useState('');
  const [clienteOptions, setClienteOptions] = useState<WisphubCliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<TicketCliente | null>(null);
  const [isClienteDropdownOpen, setIsClienteDropdownOpen] = useState(false);
  const [zonaNombre, setZonaNombre] = useState<string>('');
  const clienteDropdownRef = useRef<HTMLDivElement>(null);
  const [viewDialogStatus, setViewDialogStatus] = useState<string>('');
  const [viewDialogFailureReason, setViewDialogFailureReason] = useState<string>('');

  const [formData, setFormData] = useState({
    subject: '',
    failureReason: '',
    status: '',
    priority: '',
    technician_id: '',
    department: '',
    reportOrigin: '',
    description: '',
    zoneId: 0,
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const sort: any = {};
      if (sortColumn) {
        sort[sortColumn] = sortDirection === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = -1; // Por defecto ordenar por fecha de creación descendente
      }

      const response: TicketsResponse = await fetchApiV1({
        query: queries.getTickets,
        type: 'json',
        variables: {
          sort,
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
        },
      });

      let filteredTickets = response.results || [];

      // Aplicar filtros
      if (statusFilter !== 'all') {
        filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
      }
      if (priorityFilter !== 'all') {
        filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter);
      }

      setTickets(filteredTickets);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error al cargar tickets:', error);
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketSettings = async () => {
    try {
      const response = await fetchApiV1({
        query: queries.getTicketSettings,
        type: 'json',
        variables: {}
      });

      if (response && response.length > 0) {
        setIssues(response[0].issues || []);
      }
    } catch (error: any) {
      console.error('Error loading ticket settings:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response: User[] = await fetchApiV1({
        query: queries.getUsers,
        type: 'json',
        variables: {}
      });
      setUsers(response || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const searchClientes = async (searchText: string) => {
    if (!searchText || searchText.length < 2) {
      setClienteOptions([]);
      return;
    }
    try {
      const response = await fetchApiV1({
        query: queries.getWisphubClientes,
        type: 'json',
        variables: {
          searchText,
        }
      });
      if (response && response.results) {
        setClienteOptions(response.results);
      } else {
        setClienteOptions([]);
      }
    } catch (error: any) {
      console.error('Error searching clientes:', error);
      setClienteOptions([]);
    }
  };

  useEffect(() => {
    if (dialogOpen) {
      loadTicketSettings();
      loadUsers();
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!canViewSupport()) {
      toast.error('No tienes permiso para acceder a esta página');
      router.push('/dashboard');
      return;
    }
    if (authUser) {
      fetchTickets();
      loadTicketSettings();
      loadUsers();
    }
  }, [authUser, currentPage, sortColumn, sortDirection, statusFilter, priorityFilter]);


  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Función para obtener el departamento basado en el rol del usuario
  const getDepartmentByRole = (role?: string): string => {
    const roleToDepartment: { [key: string]: string } = {
      'technicalSupport': 'soporte_tecnico',
      'logicalSupport': 'soporte_tecnico',
      'technicalSupportSupervisor': 'soporte_tecnico',
      'accounting': 'finanzas',
      'sales': 'ventas',
      'callCenter': 'quejas_sugerencias',
      'admin': 'soporte_tecnico',
      'client': 'soporte_tecnico',
    };
    return roleToDepartment[role || ''] || 'soporte_tecnico';
  };

  const handleNewClick = () => {
    const userRole = authUser?.customClaims?.role;
    setSelectedTicket(null);
    setFormData({
      subject: '',
      failureReason: '',
      status: 'open', // Estado por defecto: abierto
      priority: 'normal', // Prioridad por defecto: normal
      technician_id: '',
      department: getDepartmentByRole(userRole), // Departamento basado en rol
      reportOrigin: 'oficina', // Reportado desde por defecto: oficina
      description: '',
      zoneId: 0,
    });
    setAttachedFiles([]);
    setFilterByTechnicalSupport(true);
    setSelectedCliente(null);
    setClienteSearchText('');
    setClienteOptions([]);
    setZonaNombre('');
    setDialogOpen(true);
  };

  const handleEditClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      subject: ticket.subject || '',
      failureReason: ticket.failureReason || '',
      status: ticket.status || '',
      priority: ticket.priority || '',
      technician_id: ticket.technician_id || '',
      department: ticket.department || '',
      reportOrigin: ticket.reportOrigin || '',
      description: ticket.description || '',
      zoneId: ticket.zoneId || 0,
    });
    if (ticket.cliente) {
      setSelectedCliente(ticket.cliente);
      setClienteSearchText(ticket.cliente.cliente || '');
      // Si el ticket tiene zona guardada, mostrarla
      if (ticket.cliente.zona) {
        setZonaNombre(ticket.cliente.zona.nombre);
      } else {
        setZonaNombre('');
      }
    } else {
      setSelectedCliente(null);
      setClienteSearchText('');
      setZonaNombre('');
    }
    setClienteOptions([]);
    // Cargar archivos existentes si hay
    if (ticket.ticketFileAttachment && ticket.ticketFileAttachment.length > 0) {
      const existingFiles: UploadedFile[] = ticket.ticketFileAttachment.map((url, index) => {
        const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}${url}`;
        return {
          _id: `existing-${index}`,
          path: fullUrl,
          url: fullUrl,
          filename: url.split('/').pop() || `archivo-${index}`,
          originalName: url.split('/').pop() || `archivo-${index}`,
          size: 0,
        };
      });
      setAttachedFiles(existingFiles);
    } else {
      setAttachedFiles([]);
    }
    setDialogOpen(true);
  };

  const handleViewClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setViewDialogStatus(ticket.status || '');
    setViewDialogFailureReason(ticket.failureReason || '');
    setViewDialogOpen(true);
  };

  const handleSaveViewDialogChanges = async (newStatus?: string, newFailureReason?: string) => {
    if (!selectedTicket) return;

    try {
      const statusToSave = newStatus !== undefined ? newStatus : viewDialogStatus;
      const failureReasonToSave = newFailureReason !== undefined ? newFailureReason : viewDialogFailureReason;

      const args: any = {
        status: statusToSave || undefined,
        failureReason: failureReasonToSave || undefined,
      };

      await fetchApiV1({
        query: queries.updateTicket,
        type: 'json',
        variables: {
          id: selectedTicket._id,
          args,
        },
      });
      toast.success('Cambios guardados correctamente');
      fetchTickets();
      // Actualizar el ticket seleccionado con los nuevos valores
      setSelectedTicket({
        ...selectedTicket,
        status: statusToSave,
        failureReason: failureReasonToSave,
      });
      if (newStatus !== undefined) {
        setViewDialogStatus(newStatus);
      }
      if (newFailureReason !== undefined) {
        setViewDialogFailureReason(newFailureReason);
      }
    } catch (error: any) {
      toast.error(`Error al guardar cambios: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleCommentAdded = async (comment: any) => {
    if (!selectedTicket) return;

    try {
      // Obtener las respuestas actuales del ticket
      const currentResponses = selectedTicket.responses || [];

      // Agregar la nueva respuesta
      const newResponse = {
        response: comment.comment,
        createdAt: new Date().toISOString(),
        author: {
          id: authUser?.customClaims?._id || 0,
          name: authUser?.displayName || authUser?.email || 'Usuario',
        },
        files: comment.attachments?.map((att: any) => att.name) || [],
      };

      const args: any = {
        responses: [...currentResponses, newResponse],
      };

      await fetchApiV1({
        query: queries.updateTicket,
        type: 'json',
        variables: {
          id: selectedTicket._id,
          args,
        },
      });

      // Actualizar el ticket seleccionado
      setSelectedTicket({
        ...selectedTicket,
        responses: [...currentResponses, newResponse],
      });

      fetchTickets();
    } catch (error: any) {
      toast.error(`Error al agregar comentario: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const args: any = {
        status: 'closed',
      };

      await fetchApiV1({
        query: queries.updateTicket,
        type: 'json',
        variables: {
          id: selectedTicket._id,
          args,
        },
      });

      toast.success('Ticket cerrado correctamente');
      setViewDialogStatus('closed');
      setSelectedTicket({
        ...selectedTicket,
        status: 'closed',
      });
      fetchTickets();
    } catch (error: any) {
      toast.error(`Error al cerrar ticket: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleCancelTicket = async () => {
    if (!selectedTicket) return;

    try {
      const args: any = {
        status: 'cancelled',
      };

      await fetchApiV1({
        query: queries.updateTicket,
        type: 'json',
        variables: {
          id: selectedTicket._id,
          args,
        },
      });

      toast.success('Ticket cancelado correctamente');
      setViewDialogStatus('cancelled');
      setSelectedTicket({
        ...selectedTicket,
        status: 'cancelled',
      });
      fetchTickets();
    } catch (error: any) {
      toast.error(`Error al cancelar ticket: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;

    try {
      await fetchApiV1({
        query: queries.deleteTicket,
        type: 'json',
        variables: {
          id: ticketToDelete._id,
        },
      });
      toast.success('Ticket eliminado correctamente');
      fetchTickets();
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    } catch (error: any) {
      toast.error(`Error al eliminar ticket: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Si hay archivos seleccionados pendientes de subir, subirlos primero
      let allAttachedFiles = [...attachedFiles];
      if (fileUploadRef.current) {
        const uploadedFiles = await fileUploadRef.current.uploadFiles();
        allAttachedFiles = [...allAttachedFiles, ...uploadedFiles];
      }

      // Preparar lista de URLs de archivos para el ticket
      const fileUrls = allAttachedFiles.map(file => {
        // Usar path o url, priorizando path
        const filePath = file.path || file.url;
        if (!filePath) return '';
        // Si la URL ya es completa, usarla; si no, construirla
        if (filePath.startsWith('http')) {
          return filePath;
        }
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}${filePath}`;
      }).filter(url => url !== '');

      const args: any = {
        subject: formData.subject,
        failureReason: formData.failureReason || undefined,
        status: formData.status || undefined,
        priority: formData.priority || undefined,
        technician_id: formData.technician_id || undefined,
        department: formData.department || undefined,
        reportOrigin: formData.reportOrigin || undefined,
        description: formData.description || undefined,
        ticketFileAttachment: fileUrls.length > 0 ? fileUrls : undefined,
        zoneId: formData.zoneId || undefined,
        cliente: selectedCliente || undefined,
      };

      if (selectedTicket) {
        await fetchApiV1({
          query: queries.updateTicket,
          type: 'json',
          variables: {
            id: selectedTicket._id,
            args,
          },
        });
        toast.success('Ticket actualizado correctamente');
      } else {
        await fetchApiV1({
          query: queries.createTicket,
          type: 'json',
          variables: {
            args,
          },
        });
        toast.success('Ticket creado correctamente');
      }

      fetchTickets();
      setDialogOpen(false);
      setSelectedTicket(null);
      setAttachedFiles([]);
      setFilterByTechnicalSupport(true);
      setSelectedCliente(null);
      setClienteSearchText('');
      setClienteOptions([]);
      setFormData({
        subject: '',
        failureReason: '',
        status: '',
        priority: '',
        technician_id: '',
        department: '',
        reportOrigin: '',
        description: '',
        zoneId: 0,
      });
    } catch (error: any) {
      toast.error(`Error al ${selectedTicket ? 'actualizar' : 'crear'} ticket: ${error.message || 'Error desconocido'}`);
    }
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, any> = {
      open: { label: 'Abierto', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
      in_progress: { label: 'En Progreso', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
      resolved: { label: 'Resuelto', className: 'bg-green-500 hover:bg-green-600 text-white' },
      closed: { label: 'Cerrado', className: 'bg-gray-500 hover:bg-gray-600 text-white' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelado' },
    };
    const config = variants[status || ''] || { variant: 'secondary' as const, label: status || 'Sin estado' };
    if (config.className) {
      return <Badge className={config.className}>{config.label}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    const variants: Record<string, any> = {
      baja: { label: 'Baja', className: 'bg-gray-500 hover:bg-gray-600 text-white' },
      normal: { label: 'Normal', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
      alta: { label: 'Alta', className: 'bg-orange-500 hover:bg-orange-600 text-white' },
      muy_alta: { variant: 'destructive' as const, label: 'Muy Alta' },
    };
    const config = variants[priority || ''] || { variant: 'secondary' as const, label: priority || 'Sin prioridad' };
    if (config.className) {
      return <Badge className={config.className}>{config.label}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTicketNumber = (number?: number): string => {
    if (!number) return '';
    return String(number).padStart(5, '0');
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!canViewSupport()) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No tienes permiso para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && tickets.length === 0) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total de tickets: {total}
          </p>
        </div>
        {canCreateEditTickets() && (
          <Button onClick={handleNewClick}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="muy_alta">Muy Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('number')}
                >
                  <div className="flex items-center">
                    Número
                    {getSortIcon('number')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('subject')}
                >
                  <div className="flex items-center">
                    Asunto
                    {getSortIcon('subject')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Estado
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    Prioridad
                    {getSortIcon('priority')}
                  </div>
                </TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Fecha Creación
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay tickets disponibles
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell className="font-medium">{ticket.number || '-'}</TableCell>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>
                      {ticket.technician?.name || ticket.technician?.email || '-'}
                    </TableCell>
                    <TableCell>
                      {ticket.cliente?.zona?.nombre || '-'}
                    </TableCell>
                    <TableCell>
                      {ticket.createdAt
                        ? format(new Date(ticket.createdAt), 'PPp', { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewClick(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canCreateEditTickets() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(ticket)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteTickets() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(ticket)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setFilterByTechnicalSupport(true);
          setSelectedCliente(null);
          setClienteSearchText('');
          setClienteOptions([]);
          setZonaNombre('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket ? 'Editar Ticket' : 'Nuevo Ticket'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <div className="relative" ref={clienteDropdownRef}>
                  <Input
                    value={clienteSearchText}
                    onChange={(e) => {
                      const value = e.target.value;
                      setClienteSearchText(value);
                      if (value.length >= 2) {
                        searchClientes(value);
                        setIsClienteDropdownOpen(true);
                      } else {
                        setClienteOptions([]);
                        setIsClienteDropdownOpen(false);
                      }
                    }}
                    onFocus={() => {
                      if (clienteOptions.length > 0) {
                        setIsClienteDropdownOpen(true);
                      }
                    }}
                    onBlur={(e) => {
                      // Delay para permitir el click en las opciones
                      setTimeout(() => {
                        if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(document.activeElement)) {
                          setIsClienteDropdownOpen(false);
                        }
                      }, 200);
                    }}
                    placeholder="Buscar cliente por nombre, apellido o usuario"
                    className="w-full"
                  />
                  {isClienteDropdownOpen && clienteOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md text-sm max-h-60 overflow-y-auto">
                      {clienteOptions.map((cliente) => (
                        <div
                          key={cliente.id_servicio}
                          className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || cliente.usuario || '';
                            const zonaId = cliente.zona?.id || 0;
                            const zonaNombre = cliente.zona?.nombre || '';
                            setSelectedCliente({
                              cliente: nombreCompleto,
                              usuario: cliente.usuario,
                              ip: cliente.ip,
                              id_servicio: cliente.id_servicio,
                              zona: cliente.zona ? { id: cliente.zona.id, nombre: cliente.zona.nombre } : undefined
                            });
                            setClienteSearchText(nombreCompleto);
                            setFormData({ ...formData, zoneId: zonaId });
                            setZonaNombre(zonaNombre);
                            setIsClienteDropdownOpen(false);
                          }}
                        >
                          <div className="font-medium">
                            {`${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || cliente.usuario || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID Servicio: {cliente.id_servicio}
                            {cliente.usuario && ` • Usuario: ${cliente.usuario}`}
                            {cliente.ip && ` • IP: ${cliente.ip}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <AutocompleteInput
                  value={formData.subject}
                  onChange={(value) => setFormData({ ...formData, subject: value })}
                  options={issues}
                  label="Asunto"
                  placeholder="Buscar o escribir asunto"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="muy_alta">Muy Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Técnico</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="filter-technical-support" className="text-sm font-normal cursor-pointer">
                      Solo Soporte Técnico
                    </Label>
                    <Switch
                      id="filter-technical-support"
                      checked={filterByTechnicalSupport}
                      onCheckedChange={setFilterByTechnicalSupport}
                    />
                  </div>
                </div>
                <Select
                  value={formData.technician_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, technician_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2 flex-1">
                      {formData.technician_id && formData.technician_id !== 'none' ? (() => {
                        const selectedUser = users.find(u => u._id === formData.technician_id);
                        if (selectedUser) {
                          return (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={selectedUser.photoURL || ''} />
                                <AvatarFallback className="text-xs">
                                  {selectedUser.name?.charAt(0)?.toUpperCase() || selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <SelectValue>{selectedUser.name || selectedUser.email}</SelectValue>
                            </>
                          );
                        }
                        return <SelectValue placeholder="Seleccionar técnico" />;
                      })() : <SelectValue placeholder="Seleccionar técnico" />}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {users
                      .filter((user) => !filterByTechnicalSupport || user.role === 'technicalSupport' || user.role === 'technicalSupportSupervisor')
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.photoURL || ''} />
                              <AvatarFallback className="text-xs">
                                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name || user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zona ID</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.zoneId}
                    disabled
                    className="flex-1"
                  />
                  {zonaNombre && (
                    <Label className="text-sm text-muted-foreground font-normal">
                      {zonaNombre}
                    </Label>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soporte_tecnico">Soporte Técnico</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="ventas">Ventas</SelectItem>
                    <SelectItem value="quejas_sugerencias">Quejas y Sugerencias</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reportado Desde</Label>
                <Select
                  value={formData.reportOrigin}
                  onValueChange={(value) => setFormData({ ...formData, reportOrigin: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="portal_cliente">Portal Cliente</SelectItem>
                    <SelectItem value="via_telefonica">Vía telefónica</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="redes_sociales">Redes sociales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <QuillEditor
                value={formData.description || '<p><br></p>'}
                setValue={(value) => setFormData({ ...formData, description: value })}
                setPastedAndDropFiles={() => { }}
                pastedAndDropFiles={[]}
                disableEmojis={true}
              />
            </div>
            <div>
              <FileUpload
                ref={fileUploadRef}
                label="Archivos adjuntos"
                multiple={true}
                maxSize={10}
                category="ticket"
                uploadOnSave={true}
                onFilesChange={setAttachedFiles}
                existingFiles={attachedFiles}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de visualización */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                Detalles del Ticket {selectedTicket?.number ? `#${formatTicketNumber(selectedTicket.number)}` : ''}
                {getStatusBadge(selectedTicket?.status || '')}
                <Label className="font-semibold ml-6">Prioridad</Label>
                {getPriorityBadge(selectedTicket?.priority)}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Asunto</Label>
                <p>{selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="font-semibold">Razón de Falla</Label>
                <Input
                  value={viewDialogFailureReason}
                  onChange={(e) => setViewDialogFailureReason(e.target.value)}
                  onBlur={(e) => handleSaveViewDialogChanges(undefined, e.target.value)}
                  placeholder="Ingrese la razón de falla"
                />
              </div>
              {selectedTicket.description && (
                <div>
                  <Label className="font-semibold">Descripción</Label>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap border-[1px] border-gray-200 p-4 rounded-2xl">
                    <Interweave
                      className="transition-all"
                      content={selectedTicket.description}
                      matchers={[
                        new UrlMatcher('url', {}, (props: UrlProps) => (
                          <Link href={props?.url || '#'} target="_blank" className="text-primary underline break-all">
                            {props?.children}
                          </Link>
                        )),
                        new HashtagMatcher('hashtag')
                      ]}
                    />
                  </div>
                </div>
              )}
              {selectedTicket.cliente && (
                <div>
                  <Label className="font-semibold">Cliente</Label>
                  <div className="space-y-1">
                    <p className="font-medium">{selectedTicket.cliente.cliente || '-'}</p>
                    {selectedTicket.cliente.usuario && (
                      <p className="text-sm text-muted-foreground">Usuario: {selectedTicket.cliente.usuario}</p>
                    )}
                    {selectedTicket.cliente.ip && (
                      <p className="text-sm text-muted-foreground">IP: {selectedTicket.cliente.ip}</p>
                    )}
                    {selectedTicket.cliente.id_servicio && (
                      <p className="text-sm text-muted-foreground">ID Servicio: {selectedTicket.cliente.id_servicio}</p>
                    )}
                    {selectedTicket.cliente.zona && (
                      <p className="text-sm text-muted-foreground">Zona: {selectedTicket.cliente.zona.nombre} (ID: {selectedTicket.cliente.zona.id})</p>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Técnico</Label>
                  {selectedTicket.technician ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedTicket.technician.photoURL || ''} />
                        <AvatarFallback>
                          {selectedTicket.technician.name?.charAt(0)?.toUpperCase() || selectedTicket.technician.email?.charAt(0)?.toUpperCase() || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <p>
                        {selectedTicket.technician.name || selectedTicket.technician.email || '-'}
                      </p>
                    </div>
                  ) : (
                    <p>-</p>
                  )}
                </div>
                <div>
                  <Label className="font-semibold">Zona ID</Label>
                  <p>{selectedTicket.zoneId || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Departamento</Label>
                  <p>
                    {selectedTicket.department === 'soporte_tecnico' ? 'Soporte Técnico' :
                      selectedTicket.department === 'finanzas' ? 'Finanzas' :
                        selectedTicket.department === 'ventas' ? 'Ventas' :
                          selectedTicket.department === 'quejas_sugerencias' ? 'Quejas y Sugerencias' :
                            selectedTicket.department === 'otro' ? 'Otro' :
                              selectedTicket.department || '-'}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Reportado Desde</Label>
                  <p>
                    {selectedTicket.reportOrigin === 'oficina' ? 'Oficina' :
                      selectedTicket.reportOrigin === 'portal_cliente' ? 'Portal Cliente' :
                        selectedTicket.reportOrigin === 'via_telefonica' ? 'Vía telefónica' :
                          selectedTicket.reportOrigin === 'presencial' ? 'Presencial' :
                            selectedTicket.reportOrigin === 'redes_sociales' ? 'Redes sociales' :
                              selectedTicket.reportOrigin || '-'}
                  </p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Comentarios</Label>
                <div className="border-[1px] border-gray-200 rounded-lg">
                  {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                      {selectedTicket.responses.map((response: any, index: number) => (
                        <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {response.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{response.author?.name || 'Usuario'}</span>
                            <span className="text-xs text-muted-foreground">
                              {response.createdAt ? format(new Date(response.createdAt), 'PPp', { locale: es }) : ''}
                            </span>
                          </div>
                          <div className="ml-8">
                            <Interweave
                              content={response.response}
                              matchers={[
                                new UrlMatcher('url', {}, (props: UrlProps) => (
                                  <Link href={props?.url || '#'} target="_blank" className="text-primary underline break-all">
                                    {props?.children}
                                  </Link>
                                )),
                                new HashtagMatcher('hashtag')
                              ]}
                            />
                            {response.files && response.files.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {response.files.map((file: string, fileIndex: number) => (
                                  <div key={fileIndex} className="text-sm text-muted-foreground">
                                    📎 {file}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <InputComments
                    disabled={!canCreateEditTickets()}
                    onCommentAdded={handleCommentAdded}
                    placeholder="Escribe un comentario..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Creado por</Label>
                  {selectedTicket.createdBy ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedTicket.createdBy.photoURL || ''} />
                        <AvatarFallback>
                          {selectedTicket.createdBy.name?.charAt(0)?.toUpperCase() || selectedTicket.createdBy.email?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p>
                        {selectedTicket.createdBy.name || selectedTicket.createdBy.email || '-'}
                      </p>
                    </div>
                  ) : (
                    <p>-</p>
                  )}
                </div>
                <div>
                  <Label className="font-semibold">Fecha de Creación</Label>
                  <p>
                    {selectedTicket.createdAt
                      ? format(new Date(selectedTicket.createdAt), 'PPp', { locale: es })
                      : '-'}
                  </p>
                </div>
              </div>
              {selectedTicket.finishedBy && (
                <div>
                  <Label className="font-semibold">Finalizado por</Label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedTicket.finishedBy.photoURL || ''} />
                      <AvatarFallback>
                        {selectedTicket.finishedBy.name?.charAt(0)?.toUpperCase() || selectedTicket.finishedBy.email?.charAt(0)?.toUpperCase() || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    <p>
                      {selectedTicket.finishedBy.name || selectedTicket.finishedBy.email || '-'}
                    </p>
                  </div>
                </div>
              )}
              {selectedTicket.status && selectedTicket.status !== 'closed' && selectedTicket.status !== 'cancelled' && (
                <div className="flex justify-between gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelTicket}
                  >
                    Cancelar Ticket
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    className="w-1/3"
                    onClick={handleCloseTicket}
                  >
                    Cerrar Ticket
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Eliminar Ticket"
        description={
          <>
            ¿Estás seguro de que deseas eliminar el ticket <strong>"{ticketToDelete?.subject}"</strong>?
            Esta acción no se puede deshacer.
          </>
        }
        confirmButtonText="Eliminar Ticket"
      />
    </div>
  );
}
