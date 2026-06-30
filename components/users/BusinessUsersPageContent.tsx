"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import BusinessMemberFormModal from "@/components/BusinessMemberFormModal";
import UserFormModal from "@/components/UserFormModal";
import { UsersAndInvitationsTable } from "@/components/users/UsersAndInvitationsTable";
import { User } from "@/lib/interfases";
import { UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";

interface BusinessMemberWithUser {
  userId: string;
  business_id: string;
  role: string;
  name?: string | null;
  email?: string | null;
}

/** Convierte miembros + invitaciones a lista unificada tipo User[] para la tabla. */
function normalizeToUserList(
  members: BusinessMemberWithUser[],
  invitations: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    code?: string;
    used?: boolean;
    whatsappSent?: boolean;
    createdAt?: string;
  }>
): User[] {
  const memberRows: User[] = members.map((m) => ({
    _id: m.userId,
    uid: m.userId,
    name: m.name ?? "",
    email: m.email ?? "",
    phone: "",
    role: m.role,
    active: true,
    emailVerified: false,
    photoURL: "",
    updatedAt: "",
    createdAt: "",
  }));
  const invitationRows: User[] = (invitations ?? []).map((inv) => ({
    _id: inv._id,
    name: inv.name,
    email: inv.email,
    phone: inv.phone ?? "",
    role: inv.role,
    active: false,
    emailVerified: false,
    photoURL: "",
    updatedAt: "",
    createdAt: inv.createdAt ?? "",
    code: inv.code,
    used: inv.used,
    whatsappSent: inv.whatsappSent,
  }));
  return [...memberRows, ...invitationRows];
}

export function BusinessUsersPageContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.businessId as string;
  const { meData } = useAuth();
  const { businessRole } = useBusinessRole(slug);
  const { canManageBusinessUsers } = useBusinessPermissions(businessRole);
  const [business_id, setBusinessId] = useState<string | null>(null);
  const [members, setMembers] = useState<BusinessMemberWithUser[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isAddByEmailModalOpen, setIsAddByEmailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
    if (!business_id) return;
    try {
      const [membersList, invitationsList] = await Promise.all([
        fetchApiV1({
          query: queries.getBusinessMembers,
          type: "json",
          variables: { id: business_id },
        }),
        fetchApiV1({
          query: queries.getBusinessInvitations,
          type: "json",
          variables: { id: business_id },
        }),
      ]);
      setMembers(Array.isArray(membersList) ? membersList : []);
      setInvitations(Array.isArray(invitationsList) ? invitationsList : []);
    } catch {
      toast.error("Error al actualizar la lista");
    }
  };

  useEffect(() => {
    if (!slug) return;
    const isMyBusiness =
      meData?.business && (meData.business.businessId === slug || meData.business._id === slug);
    if (isMyBusiness && meData?.business) {
      setBusinessId(meData.business._id);
      let cancelled = false;
      (async () => {
        try {
          const [membersList, invitationsList] = await Promise.all([
            fetchApiV1({
              query: queries.getBusinessMembers,
              type: "json",
              variables: { id: meData.business!._id },
            }),
            fetchApiV1({
              query: queries.getBusinessInvitations,
              type: "json",
              variables: { id: meData.business!._id },
            }),
          ]);
          if (!cancelled) {
            setMembers(Array.isArray(membersList) ? membersList : []);
            setInvitations(Array.isArray(invitationsList) ? invitationsList : []);
          }
        } catch {
          if (!cancelled) {
            toast.error("Error al cargar usuarios del negocio");
            router.push("/businesses");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    (async () => {
      try {
        let business = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: slug },
        })) as { _id: string } | null;
        if (!business && slug) {
          business = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId: slug },
          })) as { _id: string } | null;
        }
        if (cancelled) return;
        if (!business) {
          toast.error("Negocio no encontrado");
          router.push("/businesses");
          return;
        }
        setBusinessId(business._id);
        const [membersList, invitationsList] = await Promise.all([
          fetchApiV1({
            query: queries.getBusinessMembers,
            type: "json",
            variables: { id: business._id },
          }),
          fetchApiV1({
            query: queries.getBusinessInvitations,
            type: "json",
            variables: { id: business._id },
          }),
        ]);
        if (!cancelled) {
          setMembers(Array.isArray(membersList) ? membersList : []);
          setInvitations(Array.isArray(invitationsList) ? invitationsList : []);
        }
      } catch {
        if (!cancelled) {
          toast.error("Error al cargar usuarios del negocio");
          router.push("/businesses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, meData?.business, router]);

  const handleEditUser = (user: User) => {
    if (!user.uid) {
      setSelectedUser(user);
      setIsInvitationModalOpen(true);
    }
  };

  const handleNewInvitation = () => {
    setSelectedUser(null);
    setIsInvitationModalOpen(true);
  };

  const handleInvitationModalClose = () => {
    setIsInvitationModalOpen(false);
    setSelectedUser(null);
  };

  const handleCopyInvitationLink = async (codeOrToken: string) => {
    try {
      const link = `${window.location.origin}/register-invitation?token=${codeOrToken}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        toast.success("Link de invitación copiado al portapapeles");
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.left = "-999999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Link de invitación copiado al portapapeles");
    } catch {
      toast.error("Error al copiar el link");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const res = await fetchApiV1({
        query: queries.sendUserInvitation,
        type: "json",
        variables: { args: { invitationId } },
      });
      if (res?.success) {
        toast.success("Invitación reenviada por WhatsApp");
        fetchData();
      } else {
        toast.error(res?.message || "Error al reenviar invitación");
      }
    } catch {
      toast.error("Error al reenviar invitación");
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta invitación?")) return;
    try {
      const res = await fetchApiV1({
        query: queries.deleteUserInvitation,
        type: "json",
        variables: { invitationId },
      });
      if (res?.success) {
        toast.success("Invitación eliminada correctamente");
        fetchData();
      } else {
        toast.error(res?.message || "Error al eliminar invitación");
      }
    } catch {
      toast.error("Error al eliminar invitación");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!business_id) return;
    if (!confirm("¿Quitar a este usuario del negocio?")) return;
    try {
      await fetchApiV1({
        query: queries.removeBusinessMember,
        type: "json",
        variables: { userId, id: business_id },
      });
      toast.success("Usuario quitado del negocio");
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || "Error al quitar usuario");
    }
  };

  const items = useMemo(
    () => normalizeToUserList(members, (invitations ?? []).filter((inv) => !inv.used)),
    [members, invitations]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
    );
  }, [items, query]);

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
            <p className="text-muted-foreground">
              No tienes permiso para gestionar usuarios de este negocio.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/${slug}`)}>
              Volver al negocio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full h-full">
      <Card id="card-left" className="w-full h-full border-none overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Usuarios e Invitaciones
          </CardTitle>
          <CardDescription>
            Miembros del negocio e invitaciones pendientes. Invita por WhatsApp o agrega por email a usuarios ya registrados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <UsersAndInvitationsTable
            items={filtered}
            query={query}
            onQueryChange={setQuery}
            onEdit={handleEditUser}
            onCopyLink={handleCopyInvitationLink}
            onResendInvitation={handleResendInvitation}
            onDeleteInvitation={handleDeleteInvitation}
            scope="business"
            onRemoveMember={handleRemoveMember}
            searchPlaceholder="Buscar por nombre, email o teléfono"
            actionButton={
              <div className="flex gap-2">
                <Button onClick={handleNewInvitation}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo usuario
                </Button>
                <Button variant="outline" onClick={() => setIsAddByEmailModalOpen(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Agregar por email
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
      {isInvitationModalOpen && business_id && (
        <UserFormModal
          isOpen={isInvitationModalOpen}
          onClose={handleInvitationModalClose}
          user={selectedUser}
          onSuccess={fetchData}
          scope="business"
          businessId={business_id}
        />
      )}
      {isAddByEmailModalOpen && business_id && (
        <BusinessMemberFormModal
          isOpen={isAddByEmailModalOpen}
          onClose={() => setIsAddByEmailModalOpen(false)}
          business_id={business_id}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
