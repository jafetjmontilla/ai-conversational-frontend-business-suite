"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeContactListResult, PaeContactRow } from "@/lib/interfases";
import { toast } from "sonner";
import { Contact, RefreshCw, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const RELATIONSHIP_LABELS: Record<string, string> = {
  customer: "Cliente",
  supplier: "Proveedor",
  partner: "Socio",
  internal: "Interno",
  personal: "Personal",
  unknown: "Desconocido",
};

export function PaeContactsContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [contacts, setContacts] = useState<PaeContactRow[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedUserFilter, setDebouncedUserFilter] = useState("");
  const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PaeContactRow | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserFilter(userFilter.trim()), 400);
    return () => clearTimeout(t);
  }, [userFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedNameFilter(nameFilter.trim()), 400);
    return () => clearTimeout(t);
  }, [nameFilter]);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const res = (await fetchApiV1({
        query: queries.listPaeContacts,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          skip: 0,
          limit: PAGE_SIZE,
          userIdContains: debouncedUserFilter || undefined,
          nameContains: debouncedNameFilter || undefined,
        },
      })) as PaeContactListResult | undefined;
      setContacts(res?.items ?? []);
      setContactsTotal(res?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar contactos PAE");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, debouncedUserFilter, debouncedNameFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectContact = (row: PaeContactRow) => {
    setSelected(row);
    setMobileDetailOpen(true);
  };

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const primaryPhone = (row: PaeContactRow) =>
    row.phones?.find((p) => p.isPrimary)?.value ?? row.phones?.[0]?.value ?? "—";

  const primaryEmail = (row: PaeContactRow) =>
    row.emails?.find((e) => e.isPrimary)?.value ?? row.emails?.[0]?.value ?? "—";

  const renderDetailCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>Detalle del contacto</CardTitle>
            <CardDescription>
              Libreta PAE por usuario (búsqueda semántica en conversación).
            </CardDescription>
          </div>
          {options?.onClose ? (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={options.onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4 text-sm">
        {selected ? (
          <>
            <div className="grid gap-2">
              <p><span className="text-muted-foreground">Nombre:</span> {selected.displayName}</p>
              {selected.aliases?.length ? (
                <p><span className="text-muted-foreground">Alias:</span> {selected.aliases.join(", ")}</p>
              ) : null}
              <p><span className="text-muted-foreground">Usuario PAE:</span> <span className="font-mono text-xs">{selected.userId}</span></p>
              <p><span className="text-muted-foreground">Rol:</span> {selected.role || "—"}</p>
              <p><span className="text-muted-foreground">Relación:</span> {RELATIONSHIP_LABELS[selected.relationship ?? "unknown"] ?? selected.relationship}</p>
              {selected.organization ? (
                <p><span className="text-muted-foreground">Organización:</span> {selected.organization}</p>
              ) : null}
              <p><span className="text-muted-foreground">Teléfono:</span> {primaryPhone(selected)}</p>
              <p><span className="text-muted-foreground">Email:</span> {primaryEmail(selected)}</p>
              <p><span className="text-muted-foreground">Perfil outbound:</span> {selected.preferredOutboundProfile ?? "—"}</p>
              {selected.doNotContact ? <Badge variant="destructive">No contactar</Badge> : null}
              <p><span className="text-muted-foreground">Actualizado:</span> {new Date(selected.updatedAt).toLocaleString("es")}</p>
            </div>
            {selected.notes ? (
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Notas</p>
                <p className="whitespace-pre-wrap rounded-md border p-3 bg-muted/30">{selected.notes}</p>
              </div>
            ) : null}
            {selected.tags?.length ? (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">Selecciona un contacto de la tabla.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
      <Card className="flex min-h-0 flex-1 flex-col border-none lg:max-w-[58%]">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-10">
            <div className="flex items-center gap-2">
              <Contact className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Contactos PAE</CardTitle>
                <CardDescription>
                  {contactsTotal} contacto{contactsTotal !== 1 ? "s" : ""} en libreta
                </CardDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-filter">Filtrar por usuario</Label>
              <Input
                id="user-filter"
                placeholder="UID parcial…"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name-filter">Filtrar por nombre</Label>
              <Input
                id="name-filter"
                placeholder="Nombre, alias u organización…"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                <TableHead className="hidden sm:table-cell">Relación</TableHead>
                <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {loading ? "Cargando…" : "Sin contactos"}
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn("cursor-pointer", selected?.id === row.id && "bg-muted/50")}
                    onClick={() => selectContact(row)}
                  >
                    <TableCell className="font-medium">{row.displayName}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{row.userId}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {RELATIONSHIP_LABELS[row.relationship ?? "unknown"] ?? row.relationship}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">{primaryPhone(row)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="hidden lg:block lg:w-[42%]">{renderDetailCard()}</div>

      <AnimatePresence>
        {mobileDetailOpen && selected ? (
          <motion.div
            className="fixed inset-0 z-50 bg-background lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={mobilePanelTransition}
          >
            {renderDetailCard({
              className: "h-full rounded-none",
              onClose: () => setMobileDetailOpen(false),
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
