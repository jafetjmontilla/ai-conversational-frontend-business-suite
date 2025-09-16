"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { User } from "@/lib/interfases";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserFormModal from "@/components/UserFormModal";
import { Copy, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";


export default function UsersPage() {
  const [role, setRole] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { open } = useSidebar()


  const fetchUsers = async () => {
    try {
      const res: User[] = await fetchApiV1({
        query: queries.getUsers,
        type: "json"
      });
      setUsers(res);
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
    fetchUsers(); // Recargar la lista de usuarios
  };

  // Función para copiar el link de invitación
  const handleCopyInvitationLink = async (token: string) => {

    try {
      const invitationLink = `${window.location.origin}/register-invitation?token=${token}`;
      // Verificar si el navegador soporta la API de Clipboard
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(invitationLink);
          console.log(100032, "Link de invitación copiado al portapapeles");
          toast.success("Link de invitación copiado al portapapeles");
          return;
        } catch (clipboardError) {
          console.log(100033, "Error con clipboard API:", clipboardError);
          // Fallback al método tradicional
        }
      }

      // Fallback: método tradicional para contextos no seguros o navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = invitationLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          console.log(100034, "Link copiado usando fallback");
          toast.success("Link de invitación copiado al portapapeles");
        } else {
          throw new Error('Fallback copy failed');
        }
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        console.log(100035, "Error con fallback:", fallbackError);
        toast.error("Error al copiar el link. Por favor, cópialo manualmente: " + invitationLink);
      }

    } catch (error) {
      console.log(100036, "Error general:", error);
      toast.error("Error al copiar el link");
    }
  };

  // Función para reenviar invitación por WhatsApp
  const handleResendInvitation = async (invitationId: string) => {
    try {
      // Aquí necesitarías obtener el sessionId del contexto o estado
      const sessionId = "default-session"; // Esto debería venir del contexto
      const response = await fetchApiV1({
        query: queries.sendUserInvitation,
        type: "json",
        variables: {
          args: {
            invitationId,
            sessionId
          }
        }
      });
      if (response.success) {
        toast.success("Invitación reenviada por WhatsApp");
        fetchUsers(); // Recargar la lista
      } else {
        toast.error(response.message || "Error al reenviar invitación");
      }
    } catch (error) {
      toast.error("Error al reenviar invitación");
    }
  };

  // Función para eliminar invitación
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta invitación?")) {
      return;
    }
    try {
      const response = await fetchApiV1({
        query: queries.deleteUserInvitation,
        type: "json",
        variables: {
          invitationId
        }
      });
      if (response.success) {
        toast.success("Invitación eliminada correctamente");
        fetchUsers(); // Recargar la lista
      } else {
        toast.error(response.message || "Error al eliminar invitación");
      }
    } catch (error) {
      toast.error("Error al eliminar invitación");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users?.filter((u) => {
      const byRole = role ? u.role.toLowerCase().includes(role) : true;
      const byActive = active ? u.active.toString().includes(active) : true;
      const byQuery = q
        ? u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
        : true;
      return byRole && byActive && byQuery;
    });
  }, [users, role, active, query]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle>Usuarios e Invitaciones</CardTitle>
            <CardDescription>Gestionar usuarios e invitaciones pendientes</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <InputSearch
                  placeholder="Buscar usuario o invitación por nombre, email o teléfono"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleNewUser}>Nuevo usuario</Button>
            </div>
            {/* <div className="flex items-center gap-2">
                <ToggleWithBorder
                  type="single"
                  items={[
                    { value: "admin", label: "Admin" },
                    { value: "editor", label: "Editor" },
                    { value: "viewer", label: "Viewer" },
                  ]}
                  size="sm"
                />
                <ToggleWithBorder
                  type="single"
                  items={[
                    { value: "minutes", label: "Active now" },
                    { value: "days", label: "Active days" },
                    { value: "months", label: "Active months" },
                  ]}
                  size="sm"
                />
              </div> */}
          </div>
          <Separator className="my-4" />
          <div id="scrolls-container" className={`${open ? 'w-[calc(100vw-370px)] h-[calc(100vh-245px)]' : 'w-[calc(100vw-195px)] h-[calc(100vh-245px)]'} overflow-auto`}>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky left-0 bg-card z-10 w-16" />
                    <TableHead className="sticky left-14 bg-card z-10 min-w-[200px]">Nombre</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[150px]">Teléfono</TableHead>
                    <TableHead className="min-w-[100px]">Activo</TableHead>
                    <TableHead className="min-w-[100px]">Rol</TableHead>
                    <TableHead className="min-w-[150px]">Email verificado</TableHead>
                    <TableHead className="min-w-[150px]">Actualizado el</TableHead>
                    <TableHead className="min-w-[150px]">Creado el</TableHead>
                    <TableHead className="min-w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((u) => {
                    const isInvitation = !u.uid; // Las invitaciones no tienen uid
                    return (
                      <TableRow
                        key={u._id}
                        className={`cursor-pointer hover:!bg-transparent`}
                        onClick={!isInvitation ? () => handleEditUser(u) : undefined}
                      >
                        <TableCell className={`sticky left-0 z-10 w-16 bg-card`}>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.photoURL as string ?? ""} />
                            <AvatarFallback>
                              {u.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className={`sticky left-14 z-10 min-w-[200px] bg-card`}>
                          {u.name}
                          {isInvitation && (
                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                              Invitación
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[200px]">{u.email}</TableCell>
                        <TableCell className="min-w-[150px]">{u.phone}</TableCell>
                        <TableCell className="min-w-[100px]">
                          {isInvitation ? (
                            u.used ? "usada" : "pendiente"
                          ) : (
                            u.active ? "activo" : "inactivo"
                          )}
                        </TableCell>
                        <TableCell className="min-w-[100px]">{u.role}</TableCell>
                        <TableCell className="min-w-[150px]">
                          {isInvitation ? (
                            u.whatsappSent ? "enviado" : "no enviado"
                          ) : (
                            u.emailVerified ? "verificado" : "no verificado"
                          )}
                        </TableCell>
                        <TableCell className="min-w-[150px]">{u.updatedAt}</TableCell>
                        <TableCell className="min-w-[150px]">{u.createdAt}</TableCell>
                        <TableCell className="min-w-[200px]">
                          {isInvitation && u.token && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyInvitationLink(u.token!);
                                }}
                                tooltip="Copiar link de invitación"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResendInvitation(u._id);
                                }}
                                tooltip="Reenviar por WhatsApp"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteInvitation(u._id);
                                }}
                                tooltip="Eliminar invitación"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />
    </div>
  );
}
