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
    return users.filter((u) => {
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
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage users</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">All users</TabsTrigger>
                <TabsTrigger value="org">Organization users</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <InputSearch
                    placeholder="Search user by login, email, or name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button>New user</Button>
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
            <TabsContent value="all" className="mt-4">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead />
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email verified</TableHead>
                      <TableHead>Updated at</TableHead>
                      <TableHead>Created at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
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
                        <TableCell>{u.plan}</TableCell>
                        <TableCell>{u.active ? "active" : "inactive"}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>{u.emailVerified ? "verified" : "unverified"}</TableCell>
                        <TableCell>{u.updatedAt}</TableCell>
                        <TableCell>{u.createdAt}</TableCell>
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
      </Card>
    </div>
  );
}
