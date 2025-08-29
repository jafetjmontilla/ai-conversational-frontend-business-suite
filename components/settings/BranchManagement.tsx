'use client';

import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusiness } from "@/contexts/BusinessContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Clock, Scissors, Calendar } from "lucide-react";
import { BranchInput } from "@/lib/interfases";
import { useForm } from 'react-hook-form';

interface BranchManagementProps {
  cardFocusedId?: string;
  setCardFocusedId: (id: string) => void;
}

export default function BranchManagement({ cardFocusedId, setCardFocusedId }: BranchManagementProps) {
  const { t } = useTranslation(['dashboard', 'common']);
  const { currentBusiness, loading: businessLoading, addBranch, removeBranch } = useBusiness();
  const [branches, setBranches] = useState(currentBusiness?.activeBranches);
  const form = useForm(); // Para obtener valores del formulario principal si es necesario

  // Actualizar sucursales cuando cambie el negocio actual
  useEffect(() => {
    if (currentBusiness?.activeBranches) {
      setBranches(currentBusiness.activeBranches);
    }
  }, [currentBusiness]);

  // Función para agregar sucursal
  const handleAddBranch = async () => {
    if (!currentBusiness) return;

    const newBranch: BranchInput = {
      name: "Nueva Sucursal",
      address: "",
      country: currentBusiness.country || "",
      locality: "",
      manager: "",
      phoneNumber: ""
    };

    try {
      await addBranch(currentBusiness._id, newBranch);
      toast.success('Sucursal agregada correctamente');
    } catch (error) {
      console.error('Error adding branch:', error);
      toast.error('Error al agregar la sucursal');
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
            <CardDescription>Administra tus sucursales y su configuración</CardDescription>
          </div>
          <Button
            onClick={handleAddBranch}
            disabled={businessLoading || !currentBusiness}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Sucursal
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches?.map((branch, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
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
                      <span className="text-muted-foreground">Encargado:</span>
                      <span className="font-medium">{branch.manager}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
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
          </TabsContent>

          <TabsContent value="professionals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Profesionales</CardTitle>
                <CardDescription>Agrega, edita y elimina empleados de tus sucursales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una sucursal para gestionar sus profesionales</p>
                </div>
              </CardContent>
            </Card>
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
