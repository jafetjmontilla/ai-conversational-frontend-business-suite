"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { User } from "@/lib/interfases";
import UserFormModal from "@/components/UserFormModal";
import { toast } from "sonner";
import { UsersAndInvitationsTable } from "@/components/users/UsersAndInvitationsTable";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const res: User[] = await fetchApiV1({
        query: queries.getUsers,
        type: "json",
      });
      setUsers(res ?? []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserSuccess = () => {
    fetchUsers();
  };

  const handleCopyInvitationLink = async (codeOrToken: string) => {
    try {
      const invitationLink = `${window.location.origin}/register-invitation?token=${codeOrToken}`;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(invitationLink);
          toast.success("Link de invitación copiado al portapapeles");
          return;
        } catch {
          // Fallback
        }
      }
      const textArea = document.createElement("textarea");
      textArea.value = invitationLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          toast.success("Link de invitación copiado al portapapeles");
        } else {
          throw new Error("Fallback copy failed");
        }
      } catch {
        document.body.removeChild(textArea);
        toast.error("Error al copiar el link. Por favor, cópialo manualmente: " + invitationLink);
      }
    } catch {
      toast.error("Error al copiar el link");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetchApiV1({
        query: queries.sendUserInvitation,
        type: "json",
        variables: { args: { invitationId } },
      });
      if (response?.success) {
        toast.success("Invitación reenviada por WhatsApp");
        fetchUsers();
      } else {
        toast.error(response?.message || "Error al reenviar invitación");
      }
    } catch {
      toast.error("Error al reenviar invitación");
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta invitación?")) return;
    try {
      const response = await fetchApiV1({
        query: queries.deleteUserInvitation,
        type: "json",
        variables: { invitationId },
      });
      if (response?.success) {
        toast.success("Invitación eliminada correctamente");
        fetchUsers();
      } else {
        toast.error(response?.message || "Error al eliminar invitación");
      }
    } catch {
      toast.error("Error al eliminar invitación");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
    );
  }, [users, query]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle>Usuarios e Invitaciones</CardTitle>
            <CardDescription>Gestionar usuarios e invitaciones pendientes</CardDescription>
          </div>
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
            scope="system"
            actionButton={
              <Button onClick={handleNewUser}>Nuevo usuario</Button>
            }
          />
        </CardContent>
      </Card>
      {isModalOpen && (
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          user={selectedUser}
          onSuccess={handleUserSuccess}
          scope="system"
        />
      )}
    </div>
  );
}
