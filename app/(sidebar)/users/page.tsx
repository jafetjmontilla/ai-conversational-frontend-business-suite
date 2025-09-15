"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleWithBorder } from "@/components/Toggle";
import { InputSearch } from "@/components/InputSearch";
import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { TypographyH2, TypographyH3 } from "@/components/Typography";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { User } from "@/lib/interfases";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


export default function UsersPage() {
  const [role, setRole] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    fetchApiV1({
      query: queries.getUsers,
      type: "json"
    }).then((res: User[]) => {
      setUsers(res)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users?.filter((u) => {
      const byRole = role ? u.role.toLowerCase().includes(role) : true;
      const byActive = active ? u.active.toString().includes(active) : true;
      const byQuery = q
        ? u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
        : true;
      return byRole && byActive && byQuery;
    });
  }, [users, role, active, query]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Gestionar usuarios</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <InputSearch
                  placeholder="Buscar usuario por login, email o nombre"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button>Nuevo usuario</Button>
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
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Email verificado</TableHead>
                  <TableHead>Actualizado el</TableHead>
                  <TableHead>Creado el</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.photoURL as string ?? ""} />
                        <AvatarFallback>
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar></TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>{u.active ? "activo" : "inactivo"}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.emailVerified ? "verificado" : "no verificado"}</TableCell>
                    <TableCell>{u.updatedAt}</TableCell>
                    <TableCell>{u.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
