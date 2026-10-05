"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, UserCog, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { InfoNotice } from "@/components/ui/info-notice";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useCseProfiles } from "@/lib/hooks/useCseProfiles";
import {
  cseProfileFormSchema,
  cseProfileToFormValues,
  type CseProfileFormValues,
} from "@/lib/schemas/cseProfile";
import type { CseProfile, CseProfilesPayload } from "@/lib/interfases";
import { cn } from "@/lib/utils";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ChipToggleList({
  options,
  value,
  onChange,
  disabled,
  emptyText,
}: {
  options: Array<{ id: string; label: string; hint?: string | null }>;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  emptyText: string;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.hint ?? undefined}
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(toggleValue(value, opt.id))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ProfileStatusBadges({ profile }: { profile: CseProfile }) {
  return (
    <div className="flex flex-wrap gap-1">
      {profile.externalRef ? (
        <Badge variant="secondary" className="font-normal">
          {profile.externalRef.source}
        </Badge>
      ) : (
        <Badge variant="outline" className="font-normal">
          Local
        </Badge>
      )}
      {!profile.active ? (
        <Badge variant="destructive" className="font-normal">
          Inactivo
        </Badge>
      ) : profile.ready ? (
        <Badge className="border-transparent bg-emerald-600 font-normal text-primary-foreground hover:bg-emerald-600">
          Listo
        </Badge>
      ) : (
        <Badge className="border-transparent bg-amber-500 font-normal text-amber-950 hover:bg-amber-500">
          Sin tools ni conocimiento
        </Badge>
      )}
    </div>
  );
}

function CseProfileEditor({
  profile,
  options,
  canEdit,
  saving,
  onSave,
  onDelete,
}: {
  profile: CseProfile;
  options: CseProfilesPayload;
  canEdit: boolean;
  saving: boolean;
  onSave: (values: CseProfileFormValues) => Promise<void>;
  onDelete: () => void;
}) {
  const form = useForm<CseProfileFormValues>({
    resolver: zodResolver(cseProfileFormSchema),
    defaultValues: cseProfileToFormValues(profile),
  });

  useEffect(() => {
    form.reset(cseProfileToFormValues(profile));
  }, [profile, form]);

  const isExternal = !!profile.externalRef;
  const escalationEnabled = form.watch("escalationEnabled");
  const toolOptions = options.availableTools.map((t) => ({ id: t.name, label: t.name, hint: t.description }));
  const sourceOptions = options.availableKnowledgeSources.map((s) => ({
    id: s.sourceId,
    label: s.name,
    hint: s.roles.length ? `Roles: ${s.roles.join(", ")}` : null,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {isExternal ? (
          <InfoNotice>
            El nombre y el estado los gestiona <strong>{profile.externalRef?.source}</strong> (usuario virtual{" "}
            <span className="font-mono text-xs">{profile.externalRef?.id}</span>). Aquí se definen sus tools,
            conocimiento e instrucciones.
          </InfoNotice>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!canEdit || isExternal} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0 pb-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canEdit || isExternal}
                  />
                </FormControl>
                <FormLabel className="font-normal">Activo</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Herramientas</FormLabel>
              <FormDescription>Solo estas herramientas estarán disponibles para el perfil.</FormDescription>
              <ChipToggleList
                options={toolOptions}
                value={field.value}
                onChange={field.onChange}
                disabled={!canEdit}
                emptyText="El negocio no tiene herramientas configuradas."
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="knowledgeSourceIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuentes de conocimiento</FormLabel>
              <FormDescription>
                El perfil solo consulta estas fuentes (además del filtro por rol de cada fuente).
              </FormDescription>
              <ChipToggleList
                options={sourceOptions}
                value={field.value}
                onChange={field.onChange}
                disabled={!canEdit}
                emptyText="El negocio no tiene fuentes de conocimiento."
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instrucciones del perfil</FormLabel>
              <FormDescription>Se añaden a las instrucciones generales del negocio.</FormDescription>
              <FormControl>
                <Textarea {...field} rows={6} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 rounded-md border p-4">
          <FormField
            control={form.control}
            name="escalationEnabled"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <FormLabel>Puede pedir una persona</FormLabel>
                  <FormDescription>
                    El agente puede marcar la conversación para que la continúe una persona. El sistema que
                    integra el canal decide qué hacer con esa señal.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canEdit} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="escalationOnNoData"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <FormLabel>Pedir una persona cuando no haya datos</FormLabel>
                  <FormDescription>También envía la señal si el agente no encuentra información.</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canEdit || !escalationEnabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {canEdit ? (
          <div className="flex items-center justify-between gap-2">
            {!isExternal ? (
              <Button type="button" variant="ghost" className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={saving || !form.formState.isDirty}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}

export function AiProfilesPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = canEditCurrentBusiness();
  const { data, loading, updateProfile, createProfile, deleteProfile, isSaving, isCreating, isDeleting } =
    useCseProfiles(businessId);

  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CseProfile | null>(null);
  const selectedId = searchParams?.get("profileId") ?? data.profiles[0]?.profileId ?? null;
  const selected = useMemo(
    () => data.profiles.find((p) => p.profileId === selectedId) ?? null,
    [data.profiles, selectedId]
  );

  const selectProfile = (profileId: string) => {
    router.replace(`/${businessId}/ai/profiles?profileId=${encodeURIComponent(profileId)}`, { scroll: false });
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const profile = await createProfile(name).catch(() => null);
    if (profile) {
      setNewName("");
      selectProfile(profile.profileId);
    }
  };

  const handleSave = async (values: CseProfileFormValues) => {
    if (!selected) return;
    await updateProfile({
      profileId: selected.profileId,
      input: {
        customInstructions: values.customInstructions.trim() || null,
        tools: values.tools,
        knowledgeSourceIds: values.knowledgeSourceIds,
        escalation: { enabled: values.escalationEnabled, onNoData: values.escalationOnNoData },
        ...(selected.externalRef ? {} : { name: values.name, active: values.active }),
      },
    }).catch(() => null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const ok = await deleteProfile(pendingDelete.profileId).catch(() => null);
    if (ok) {
      setPendingDelete(null);
      router.replace(`/${businessId}/ai/profiles`, { scroll: false });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Perfiles del agente"
        description="Cada perfil limita qué herramientas y conocimiento usa el agente de atención. Un canal puede tener un perfil por defecto y un sistema integrado (como call-ai) puede elegir el perfil en cada mensaje."
      />

      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[320px_1fr]">
        <Card className="flex min-h-0 flex-col">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4 w-4" />
              Perfiles
            </CardTitle>
            {canEdit ? (
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleCreate();
                    }
                  }}
                  placeholder="Nuevo perfil local"
                  className="h-8 text-sm"
                  disabled={isCreating}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  disabled={isCreating || !newName.trim()}
                  onClick={() => void handleCreate()}
                  aria-label="Crear perfil"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {data.profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay perfiles. Créalos aquí o desde un sistema integrado (usuarios virtuales de call-ai).
              </p>
            ) : (
              <ul className="space-y-2">
                {data.profiles.map((p) => (
                  <li key={p.profileId}>
                    <button
                      type="button"
                      onClick={() => selectProfile(p.profileId)}
                      className={cn(
                        "w-full space-y-1 rounded-md border p-3 text-left transition-colors hover:bg-muted",
                        p.profileId === selected?.profileId && "border-primary bg-muted"
                      )}
                    >
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <ProfileStatusBadges profile={p} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-y-auto">
          {selected ? (
            <>
              <CardHeader>
                <CardTitle className="text-base">{selected.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 font-mono text-xs">
                  <Link2 className="h-3 w-3" />
                  {selected.profileId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CseProfileEditor
                  profile={selected}
                  options={data}
                  canEdit={canEdit}
                  saving={isSaving}
                  onSave={handleSave}
                  onDelete={() => setPendingDelete(selected)}
                />
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Selecciona un perfil para editarlo.</p>
            </CardContent>
          )}
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
        title="Eliminar perfil"
        description={
          pendingDelete ? (
            <span>
              ¿Eliminar el perfil <strong>{pendingDelete.name}</strong>? Los canales que lo usen deben cambiar de
              perfil antes.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => void handleConfirmDelete()}
        loading={isDeleting}
        confirmButtonText="Eliminar perfil"
      />
    </div>
  );
}
