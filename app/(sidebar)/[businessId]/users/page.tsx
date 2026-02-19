"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import BusinessMemberFormModal from "@/components/BusinessMemberFormModal";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { businessRoles, type BusinessRole } from "@/lib/interfases";

interface BusinessMemberWithUser {
  userId: string;
  business_id: string;
  role: string;
  name?: string | null;
  email?: string | null;
}

const roleLabels: Record<BusinessRole, string> = {
  business_admin: "Administrador",
  business_editor: "Editor",
  business_viewer: "Solo lectura",
};

export default function BusinessUsersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.businessId as string;
  const { businessRole } = useBusinessRole(slug);
  const { canManageBusinessUsers } = useBusinessPermissions(businessRole);
  const [business_id, setBusinessId] = useState<string | null>(null);
  const [members, setMembers] = useState<BusinessMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        let business = await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: slug },
        }) as { _id: string } | null;
        if (!business && slug) {
          business = await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId: slug },
          }) as { _id: string } | null;
        }
        if (cancelled) return;
        if (!business) {
          toast.error("Negocio no encontrado");
          router.push("/businesses");
          return;
        }
        setBusinessId(business._id);
        const list = await fetchApiV1({
          query: queries.getBusinessMembers,
          type: "json",
          variables: { id: business._id },
        });
        if (cancelled) return;
        setMembers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          toast.error("Error al cargar usuarios del negocio");
          router.push("/businesses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, router]);

  const fetchMembers = async () => {
    if (!business_id) return;
    try {
      const list = await fetchApiV1({
        query: queries.getBusinessMembers,
        type: "json",
        variables: { id: business_id },
      });
      setMembers(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Error al actualizar la lista");
    }
  };

  const handleRemove = async (userId: string) => {
    if (!business_id) return;
    if (!confirm("¿Quitar a este usuario del negocio?")) return;
    try {
      await fetchApiV1({
        query: queries.removeBusinessMember,
        type: "json",
        variables: { userId, id: business_id },
      });
      toast.success("Usuario quitado del negocio");
      fetchMembers();
    } catch (e: any) {
      toast.error(e?.message || "Error al quitar usuario");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canManageBusinessUsers()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para gestionar usuarios de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/${slug}`)}>
              Volver al negocio
            </Button>
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
              <CardTitle>Usuarios del negocio</CardTitle>
              <CardDescription>Miembros con acceso a este negocio. Agrega usuarios por email (deben estar registrados en el sistema).</CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay usuarios. Agrega uno con el botón superior.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow key={m.userId}>
                      <TableCell className="font-medium">{m.name || "—"}</TableCell>
                      <TableCell>{m.email || "—"}</TableCell>
                      <TableCell>{roleLabels[m.role as BusinessRole] ?? m.role}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(m.userId)}
                          className="text-destructive hover:text-destructive"
                          title="Quitar del negocio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {isModalOpen && business_id && (
        <BusinessMemberFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          business_id={business_id}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  );
}
