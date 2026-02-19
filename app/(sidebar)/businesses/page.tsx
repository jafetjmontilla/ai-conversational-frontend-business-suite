"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { Business } from "@/lib/interfases";
import BusinessFormModal from "@/components/BusinessFormModal";
import { useBusinessPermissions } from "@/lib/hooks/useAllowed";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const { canViewBusinesses, canCreateBusinesses, canEditBusinesses, canDeleteBusinesses } = useBusinessPermissions();
  const router = useRouter();

  const fetchBusinesses = async () => {
    try {
      const list = await fetchApiV1({ query: queries.listBusinesses, type: "json" });
      setBusinesses(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Error cargando negocios:", e);
      toast.error("Error al cargar la lista de negocios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewBusinesses()) fetchBusinesses();
    else setLoading(false);
  }, []);

  const handleAdd = () => {
    setSelectedBusiness(null);
    setIsModalOpen(true);
  };

  const handleEdit = (b: Business) => {
    setSelectedBusiness(b);
    setIsModalOpen(true);
  };

  const handleDelete = async (b: Business) => {
    if (!canDeleteBusinesses()) return;
    if (!confirm(`¿Eliminar el negocio "${b.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetchApiV1({
        query: queries.deleteBusiness,
        type: "json",
        variables: { id: b._id },
      });
      toast.success("Negocio eliminado");
      fetchBusinesses();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar negocio");
    }
  };

  const handleOpenBusiness = (slug: string) => {
    router.push(`/${slug}`);
  };

  if (!canViewBusinesses()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver la lista de negocios.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Negocios</CardTitle>
              <CardDescription>Gestiona los negocios del sistema. Cada negocio tiene su propia URL y usuarios.</CardDescription>
            </div>
            {canCreateBusinesses() && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar negocio
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Identificador (slug)</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay negocios. {canCreateBusinesses() && "Haz clic en Agregar negocio para crear uno."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    businesses.map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{b.slug}</code>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {b.description || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              b.active
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }
                          >
                            {b.active ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenBusiness(b.slug)}
                              title="Abrir negocio"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {canEditBusinesses() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(b)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteBusinesses() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(b)}
                                className="text-destructive hover:text-destructive"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {isModalOpen && (
        <BusinessFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBusiness(null);
          }}
          business={selectedBusiness}
          onSuccess={fetchBusinesses}
        />
      )}
    </div>
  );
}
