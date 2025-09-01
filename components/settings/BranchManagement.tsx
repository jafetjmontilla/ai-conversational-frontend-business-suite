'use client';

import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useBusiness } from "@/contexts/BusinessContext";

import { useAllowed } from "@/lib/hooks/useAllowed";
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Clock, Scissors, Calendar, AlertTriangle } from "lucide-react";
import { BranchInput, Branch, Professional, ProfessionalInput } from "@/lib/interfases";
import { fetchApiV1, queries } from "@/lib/Fetching";

import * as Typography from "@/components/Typography";

// Esquema de validación para sucursal
const branchSchema = z.object({
  name: z.string().min(1, 'El nombre de la sucursal es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  country: z.string().min(1, 'El país es requerido'),
  locality: z.string().min(1, 'La localidad es requerida'),
  manager: z.string().min(1, 'El nombre del encargado es requerido'),
  phoneNumber: z.string().optional()
});

type BranchFormData = z.infer<typeof branchSchema>;

// Esquema de validación para profesional
const professionalSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phoneNumber: z.string().optional(),
  photo: z.string().optional(),
  specialties: z.array(z.object({
    name: z.string().min(1, 'El nombre de la especialidad es requerido'),
    description: z.string().optional(),
    isActive: z.boolean()
  })).optional(),
  availableSchedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
    isActive: z.boolean()
  })).optional()
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface BranchManagementProps {
  cardFocusedId?: string;
  setCardFocusedId: (id: string) => void;
}

export default function BranchManagement({ cardFocusedId, setCardFocusedId }: BranchManagementProps) {

  const { getCurrentPlan } = useAllowed();
  const { currentBusiness, loading: businessLoading, addBranch, updateBranch, removeBranch } = useBusiness();
  const [branches, setBranches] = useState(currentBusiness?.activeBranches);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<{ branch: Branch; index: number } | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado para profesionales
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number | null>(null);
  const [isProfessionalDialogOpen, setIsProfessionalDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);

  // Configuración del formulario
  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      country: currentBusiness?.country || 'Venezuela',
      locality: '',
      manager: '',
      phoneNumber: ''
    }
  });

  // Configuración del formulario para profesionales
  const professionalForm = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      photo: ''
    }
  });

  // Actualizar sucursales cuando cambie el negocio actual
  useEffect(() => {
    if (currentBusiness?.activeBranches) {
      setBranches(currentBusiness.activeBranches);
    }
  }, [currentBusiness]);

  // Función para obtener límites de sucursales según el plan
  const getBranchLimits = () => {
    const plan = getCurrentPlan();
    if (!currentBusiness?.isChain) return 1; // Solo una sucursal si no es cadena

    switch (plan) {
      case 'free': return 1;
      case 'premium': return 3;
      case 'pro': return 5;
      default: return 1;
    }
  };

  // Función para obtener límites de profesionales según el plan
  const getProfessionalLimits = () => {
    const plan = getCurrentPlan();
    switch (plan) {
      case 'free': return 1;
      case 'premium': return 3;
      case 'pro': return 8;
      default: return 1;
    }
  };

  // Función para verificar si se puede agregar un nuevo profesional
  const canAddProfessional = (branchIndex: number) => {
    if (!currentBusiness) return false;
    const currentProfessionalCount = professionals.filter(p => p.branchIndex === branchIndex).length;
    const limit = getProfessionalLimits();
    return currentProfessionalCount < limit;
  };

  // Función para obtener mensaje de límite de profesionales
  const getProfessionalLimitMessage = (branchIndex: number) => {
    const plan = getCurrentPlan();
    const limit = getProfessionalLimits();
    const current = professionals.filter(p => p.branchIndex === branchIndex).length;

    if (plan === 'free') {
      return `Con el plan gratuito puedes tener máximo 1 profesional por sucursal. Actualiza a Premium para tener hasta 3 profesionales.`;
    } else if (plan === 'premium') {
      return `Con el plan Premium puedes tener máximo 3 profesionales por sucursal (${current}/3). Actualiza a Pro para tener hasta 8 profesionales.`;
    } else if (plan === 'pro') {
      return `Con el plan Pro puedes tener máximo 8 profesionales por sucursal (${current}/8).`;
    }

    return `Tienes ${current} de ${limit} profesionales disponibles en esta sucursal.`;
  };

  // Función para verificar si se puede agregar una nueva sucursal
  const canAddBranch = () => {
    if (!currentBusiness) return false;
    const currentBranchCount = branches?.length || 0;
    const limit = getBranchLimits();
    return currentBranchCount < limit;
  };

  // Función para obtener mensaje de límite
  const getLimitMessage = () => {
    const plan = getCurrentPlan();
    const limit = getBranchLimits();
    const current = branches?.length || 0;

    if (!currentBusiness?.isChain) {
      return `Tu negocio está configurado como sucursal única. Para agregar más sucursales, habilita "Múltiples sucursales" en la configuración del negocio.`;
    }

    if (plan === 'free') {
      return `Con el plan gratuito puedes tener máximo 1 sucursal. Actualiza a Premium para tener hasta 3 sucursales.`;
    } else if (plan === 'premium') {
      return `Con el plan Premium puedes tener máximo 3 sucursales (${current}/3). Actualiza a Pro para tener hasta 5 sucursales.`;
    } else if (plan === 'pro') {
      return `Con el plan Pro puedes tener máximo 5 sucursales (${current}/5).`;
    }

    return `Tienes ${current} de ${limit} sucursales disponibles.`;
  };

  // Función para abrir el diálogo de nueva sucursal
  const handleOpenNewBranchDialog = () => {
    if (!canAddBranch()) {
      toast.error(getLimitMessage());
      return;
    }

    setEditingBranch(null);
    form.reset({
      name: '',
      address: '',
      country: currentBusiness?.country || 'Venezuela',
      locality: '',
      manager: '',
      phoneNumber: ''
    });
    setIsDialogOpen(true);
  };

  // Función para abrir el diálogo de edición
  const handleEditBranch = (branch: Branch, index: number) => {
    setEditingBranch({ branch, index });
    form.reset({
      name: branch.name,
      address: branch.address,
      country: branch.country,
      locality: branch.locality,
      manager: branch.manager,
      phoneNumber: branch.phoneNumber || ''
    });
    setIsDialogOpen(true);
  };

  // Función para guardar sucursal (crear o actualizar)
  const onSubmit = async (data: BranchFormData) => {
    if (!currentBusiness) return;

    setSaving(true);
    try {
      const branchData: BranchInput = {
        name: data.name,
        address: data.address,
        country: data.country,
        locality: data.locality,
        manager: data.manager,
        phoneNumber: data.phoneNumber
      };

      if (editingBranch) {
        // Actualizar sucursal existente
        await updateBranch(currentBusiness._id, editingBranch.index, branchData);
        toast.success('Sucursal actualizada correctamente');
      } else {
        // Crear nueva sucursal
        await addBranch(currentBusiness._id, branchData);
        toast.success('Sucursal creada correctamente');
      }

      setIsDialogOpen(false);
      setEditingBranch(null);
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error(editingBranch ? 'Error al actualizar la sucursal' : 'Error al crear la sucursal');
    } finally {
      setSaving(false);
    }
  };

  // Función para eliminar sucursal
  const handleDeleteBranch = async (branchIndex: number) => {
    if (!currentBusiness) return;

    try {
      await removeBranch(currentBusiness._id, branchIndex);
      toast.success('Sucursal eliminada correctamente');
    } catch (error) {
      console.error('Error removing branch:', error);
      toast.error('Error al eliminar la sucursal');
    }
  };

  // Función para cargar profesionales por sucursal
  const loadProfessionals = async (branchIndex: number) => {
    if (!currentBusiness) return;

    setLoadingProfessionals(true);
    try {
      const result = await fetchApiV1({
        query: queries.getProfessionalsByBranch,
        variables: { businessId: currentBusiness._id, branchIndex }
      });

      if (result) {
        setProfessionals(result);
      }
    } catch (error) {
      console.error('Error loading professionals:', error);
      toast.error('Error al cargar los profesionales');
    } finally {
      setLoadingProfessionals(false);
    }
  };

  // Función para abrir el diálogo de nuevo profesional
  const handleOpenNewProfessionalDialog = (branchIndex: number) => {
    if (!canAddProfessional(branchIndex)) {
      toast.error(getProfessionalLimitMessage(branchIndex));
      return;
    }

    setSelectedBranchIndex(branchIndex);
    setEditingProfessional(null);
    professionalForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      photo: ''
    });
    setIsProfessionalDialogOpen(true);
  };

  // Función para abrir el diálogo de edición de profesional
  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setSelectedBranchIndex(professional.branchIndex);
    professionalForm.reset({
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.email,
      phoneNumber: professional.phoneNumber || '',
      photo: professional.photo || ''
    });
    setIsProfessionalDialogOpen(true);
  };

  // Función para guardar profesional (crear o actualizar)
  const onSubmitProfessional = async (data: ProfessionalFormData) => {
    if (!currentBusiness || selectedBranchIndex === null) return;

    setSaving(true);
    try {
      const professionalData: ProfessionalInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        photo: data.photo
      };

      if (editingProfessional) {
        // Actualizar profesional existente
        await fetchApiV1({
          query: queries.updateProfessional,
          variables: { id: editingProfessional._id, args: professionalData }
        });
        toast.success('Profesional actualizado correctamente');
      } else {
        // Crear nuevo profesional
        await fetchApiV1({
          query: queries.createProfessional,
          variables: {
            businessId: currentBusiness._id,
            branchIndex: selectedBranchIndex,
            args: professionalData
          }
        });
        toast.success('Profesional creado correctamente');
      }

      setIsProfessionalDialogOpen(false);
      setEditingProfessional(null);
      // Recargar profesionales para la sucursal
      await loadProfessionals(selectedBranchIndex);
    } catch (error) {
      console.error('Error saving professional:', error);
      toast.error(editingProfessional ? 'Error al actualizar el profesional' : 'Error al crear el profesional');
    } finally {
      setSaving(false);
    }
  };

  // Función para eliminar profesional
  const handleDeleteProfessional = async (professional: Professional) => {
    try {
      await fetchApiV1({
        query: queries.deleteProfessional,
        variables: { id: professional._id }
      });
      toast.success('Profesional eliminado correctamente');
      // Recargar profesionales para la sucursal
      await loadProfessionals(professional.branchIndex);
    } catch (error) {
      console.error('Error deleting professional:', error);
      toast.error('Error al eliminar el profesional');
    }
  };

  return (
    <Card
      id="branches-card"
      onClick={(e) => {
        e.stopPropagation();
        setCardFocusedId(e.currentTarget.id)
      }}
      className={`${cardFocusedId === "branches-card" ? "border-accent" : ""}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Sucursales</CardTitle>
            <CardDescription>
              Administra tus sucursales y su configuración.
              <div className="mt-2 text-sm">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${canAddBranch()
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                  }`}>
                  {getLimitMessage()}
                </span>
              </div>
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleOpenNewBranchDialog}
                disabled={businessLoading || !currentBusiness || !canAddBranch()}
                className="flex items-center gap-2"
                variant={canAddBranch() ? "default" : "secondary"}
              >
                {!canAddBranch() && <AlertTriangle className="h-4 w-4" />}
                <Plus className="h-4 w-4" />
                Nueva Sucursal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                </DialogTitle>
                <DialogDescription>
                  {editingBranch
                    ? 'Modifica la información de la sucursal.'
                    : 'Completa la información para crear una nueva sucursal.'
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la sucursal</FormLabel>
                        <FormControl>
                          <Input placeholder="Sucursal Centro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Av. Principal #123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Chile, Argentina, México" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad/Localidad</FormLabel>
                          <FormControl>
                            <Input placeholder="Caracas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encargado</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+58 414 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving
                        ? (editingBranch ? 'Actualizando...' : 'Creando...')
                        : (editingBranch ? 'Actualizar' : 'Crear')
                      }
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="professionals">Profesionales</TabsTrigger>
            <TabsTrigger value="schedules">Horarios</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {!branches || branches.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Typography.TypographyH4>No hay sucursales</Typography.TypographyH4>
                    <Typography.TypographyP className="text-muted-foreground mt-2">
                      {canAddBranch()
                        ? "Crea tu primera sucursal para comenzar a gestionar tu negocio."
                        : getLimitMessage()
                      }
                    </Typography.TypographyP>
                    {canAddBranch() && (
                      <Button
                        onClick={handleOpenNewBranchDialog}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primera Sucursal
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((branch, index) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBranch(branch, index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBranch(index)}
                            disabled={businessLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{branch.address}, {branch.locality}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">País:</span>
                        <span className="font-medium">{branch.country}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Encargado:</span>
                        <span className="font-medium">{branch.manager}</span>
                      </div>
                      {branch.phoneNumber && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Teléfono:</span>
                          <span className="font-medium">{branch.phoneNumber}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center mt-4">
                        <div className="flex flex-col items-center gap-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-muted-foreground">Profesionales</span>
                          <span className="font-semibold">-</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Scissors className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-muted-foreground">Servicios</span>
                          <span className="font-semibold">-</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="text-xs text-muted-foreground">Clientes</span>
                          <span className="font-semibold">-</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="professionals" className="space-y-4">
            {!branches || branches.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Typography.TypographyH4>No hay sucursales</Typography.TypographyH4>
                    <Typography.TypographyP className="text-muted-foreground mt-2">
                      Necesitas crear al menos una sucursal antes de agregar profesionales.
                    </Typography.TypographyP>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {branches.map((branch, branchIndex) => (
                  <Card key={branchIndex}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{branch.name}</CardTitle>
                          <CardDescription>
                            {branch.address}, {branch.locality}
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${canAddProfessional(branchIndex)
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                                }`}>
                                {getProfessionalLimitMessage(branchIndex)}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => loadProfessionals(branchIndex)}
                            variant="outline"
                            size="sm"
                            disabled={loadingProfessionals}
                          >
                            {loadingProfessionals ? "Cargando..." : "Cargar"}
                          </Button>
                          <Button
                            onClick={() => handleOpenNewProfessionalDialog(branchIndex)}
                            disabled={businessLoading || !canAddProfessional(branchIndex)}
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar Profesional
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {professionals.filter(p => p.branchIndex === branchIndex).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No hay profesionales en esta sucursal</p>
                          {canAddProfessional(branchIndex) && (
                            <Button
                              onClick={() => handleOpenNewProfessionalDialog(branchIndex)}
                              className="mt-4"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Primer Profesional
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {professionals
                            .filter(p => p.branchIndex === branchIndex)
                            .map((professional) => (
                              <Card key={professional._id} className="relative">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {professional.photo ? (
                                        <img
                                          src={professional.photo}
                                          alt={professional.fullName}
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                          <Users className="h-5 w-5 text-gray-500" />
                                        </div>
                                      )}
                                      <div>
                                        <CardTitle className="text-base">{professional.fullName}</CardTitle>
                                        <CardDescription className="text-sm">{professional.email}</CardDescription>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditProfessional(professional)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteProfessional(professional)}
                                        disabled={businessLoading}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {professional.phoneNumber && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Teléfono:</span>
                                      <span className="font-medium">{professional.phoneNumber}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Especialidades:</span>
                                    <span className="font-medium">
                                      {professional.activeSpecialties.length || 'Sin especialidades'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Horarios:</span>
                                    <span className="font-medium">
                                      {professional.activeSchedules.length || 'Sin horarios'}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Diálogo para crear/editar profesional */}
            <Dialog open={isProfessionalDialogOpen} onOpenChange={setIsProfessionalDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfessional ? 'Editar Profesional' : 'Nuevo Profesional'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProfessional
                      ? 'Modifica la información del profesional.'
                      : 'Completa la información para crear un nuevo profesional.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...professionalForm}>
                  <form onSubmit={professionalForm.handleSubmit(onSubmitProfessional)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={professionalForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={professionalForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={professionalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={professionalForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+58 414 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={professionalForm.control}
                      name="photo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Foto (URL opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://ejemplo.com/foto.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsProfessionalDialogOpen(false)}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving
                          ? (editingProfessional ? 'Actualizando...' : 'Creando...')
                          : (editingProfessional ? 'Actualizar' : 'Crear')
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Horarios</CardTitle>
                <CardDescription>Define horarios de trabajo y turnos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configura horarios de sucursales y profesionales</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Servicios</CardTitle>
                <CardDescription>Lista de servicios con precios y duración</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configura los servicios ofrecidos en cada sucursal</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clientes y Citas</CardTitle>
                <CardDescription>Historial de clientes y gestión de citas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gestiona clientes y agenda de citas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
