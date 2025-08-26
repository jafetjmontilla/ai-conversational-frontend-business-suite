"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleWithBorder } from "@/components/Toggle";
import { useMemo, useState } from "react";

export default function UsersPage() {
  const [role, setRole] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const users = useMemo(
    () => [
      { login: "4everplug", email: "ffelce@4everplug.com", name: "4NET", role: "admin/editor", lastActive: "2 minutes", origin: "Main Org." },
      { login: "ismaelg", email: "ismaeljosegonzalezavila@gmail.com", name: "Ismael Gonzalez", role: "admin/editor", lastActive: "2 days", origin: "Main Org." },
      { login: "jafettj", email: "febmerlib@gmail.com", name: "Jafet Montilla", role: "admin/editor", lastActive: "3 months", origin: "Main Org." },
      { login: "soporteit", email: "soporte.fournet@gmail.com", name: "Soporte IT", role: "viewer", lastActive: "27 days", origin: "Main Org." },
    ],
    []
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const byRole = role ? u.role.toLowerCase().includes(role) : true;
      const byActive = active ? u.lastActive.toLowerCase().includes(active) : true;
      return byRole && byActive;
    });
  }, [users, role, active]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage users in Grafana</CardDescription>
            </div>
            <Button>New user</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">All users</TabsTrigger>
                <TabsTrigger value="org">Organization users</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
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
              </div>
            </div>

            <TabsContent value="all" className="mt-4">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Login</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Belongs to</TableHead>
                      <TableHead>Licensed role</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead>Origin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.login}>
                        <TableCell>{u.login}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>Main Org.</TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell>{u.lastActive}</TableCell>
                        <TableCell>{u.origin}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="org" className="mt-4">
              <div className="text-sm text-muted-foreground">Organization users coming soon…</div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline">Export</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
