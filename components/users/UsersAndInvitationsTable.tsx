"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { Separator } from "@/components/ui/separator";
import { User } from "@/lib/interfases";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Send, Trash2, UserMinus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

export type UsersTableScope = "system" | "business";

export interface UsersAndInvitationsTableProps {
  items: User[];
  query: string;
  onQueryChange: (value: string) => void;
  onEdit: (user: User) => void;
  onCopyLink: (codeOrToken: string) => void;
  onResendInvitation: (invitationId: string) => void;
  onDeleteInvitation: (invitationId: string) => void;
  scope: UsersTableScope;
  onRemoveMember?: (userId: string) => void;
  /** Contenido del botón de acción (ej. "Nuevo usuario") que se muestra junto a la búsqueda. */
  actionButton?: React.ReactNode;
  searchPlaceholder?: string;
}

export function UsersAndInvitationsTable({
  items,
  query,
  onQueryChange,
  onEdit,
  onCopyLink,
  onResendInvitation,
  onDeleteInvitation,
  scope,
  onRemoveMember,
  actionButton,
  searchPlaceholder = "Buscar usuario o invitación por nombre, email o teléfono",
}: UsersAndInvitationsTableProps) {
  const { open } = useSidebar();
  const scrollClass = open
    ? "md:w-[calc(100vw-370px)] h-[calc(100vh-245px)]"
    : "md:w-[calc(100vw-195px)] h-[calc(100vh-245px)]";

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1">
            <InputSearch
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full"
            />
          </div>
          {actionButton}
        </div>
      </div>
      <Separator className="my-4" />
      <div id="scrolls-container" className={`${scrollClass} overflow-auto`}>
        <div className="overflow-x-auto">
          <Table className="md:min-w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="md:sticky md:left-0 bg-card z-10 w-16" />
                <TableHead className="md:sticky md:left-14 bg-card z-10 min-w-[200px]">Nombre</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[150px]">Teléfono</TableHead>
                <TableHead className="min-w-[100px]">Estado</TableHead>
                <TableHead className="min-w-[100px]">Rol</TableHead>
                {scope === "system" && (
                  <>
                    <TableHead className="min-w-[150px]">Email verificado</TableHead>
                    <TableHead className="min-w-[150px]">Actualizado el</TableHead>
                    <TableHead className="min-w-[150px]">Creado el</TableHead>
                  </>
                )}
                <TableHead className="min-w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((u) => {
                const isInvitation = !u.uid;
                return (
                  <TableRow
                    key={u._id}
                    className="cursor-pointer hover:!bg-transparent"
                    onClick={() => onEdit(u)}
                  >
                    <TableCell className="md:sticky md:left-0 md:z-10 md:bg-card w-16">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={(u.photoURL as string) ?? ""} />
                        <AvatarFallback>{u.name?.charAt(0) ?? "?"}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="md:sticky md:left-14 md:z-10 md:bg-card min-w-[200px]">
                      {u.name}
                      {isInvitation && (
                        <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full">
                          Invitación
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[200px]">{u.email}</TableCell>
                    <TableCell className="min-w-[150px]">{u.phone ?? "—"}</TableCell>
                    <TableCell className="min-w-[100px]">
                      {isInvitation
                        ? u.used
                          ? "usada"
                          : "pendiente"
                        : u.active
                          ? "activo"
                          : "inactivo"}
                    </TableCell>
                    <TableCell className="min-w-[100px]">{u.role}</TableCell>
                    {scope === "system" && (
                      <>
                        <TableCell className="min-w-[150px]">
                          {isInvitation
                            ? u.whatsappSent
                              ? "enviado"
                              : "no enviado"
                            : u.emailVerified
                              ? "verificado"
                              : "no verificado"}
                        </TableCell>
                        <TableCell className="min-w-[150px]">{u.updatedAt ?? "—"}</TableCell>
                        <TableCell className="min-w-[150px]">{u.createdAt ?? "—"}</TableCell>
                      </>
                    )}
                    <TableCell className="min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                      {isInvitation && (u.code || u.token) && (
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCopyLink(u.code || u.token!)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copiar link de invitación</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onResendInvitation(u._id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reenviar por WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeleteInvitation(u._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar invitación</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      {scope === "business" && !isInvitation && onRemoveMember && u.uid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRemoveMember(u.uid!)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quitar del negocio</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
