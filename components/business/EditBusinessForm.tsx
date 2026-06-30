"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business } from "@/lib/interfases";
import { toast } from "sonner";
import {
  buildBusinessArgs,
  businessToFormValues,
  editBusinessFormSchema,
  type EditBusinessFormValues,
} from "@/lib/schemas/business";
import {
  resolvePrimaryUser,
  type BusinessInvitationRow,
  type BusinessMemberRow,
  type PrimaryUserInfo,
} from "@/lib/business/primaryUser";
import { BusinessFormShell } from "@/components/business/BusinessFormShell";
import {
  EditIdentityExtraFields,
  IdentityNameFields,
  PrimaryUserReadOnlyFields,
  SharedBusinessTabs,
  sharedTabsForm,
} from "@/components/business/BusinessFormFields";

interface EditBusinessFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  business: Business;
}

export function EditBusinessForm({ isOpen, onClose, onSuccess, business }: EditBusinessFormProps) {
  const form = useForm<EditBusinessFormValues>({
    resolver: zodResolver(editBusinessFormSchema),
    defaultValues: businessToFormValues(business),
  });
  const [primaryUser, setPrimaryUser] = useState<PrimaryUserInfo | null>(null);
  const [loadingPrimaryUser, setLoadingPrimaryUser] = useState(false);

  useEffect(() => {
    if (isOpen) form.reset(businessToFormValues(business));
  }, [isOpen, business, form]);

  useEffect(() => {
    if (!isOpen || !business._id) {
      setPrimaryUser(null);
      return;
    }

    let cancelled = false;
    setLoadingPrimaryUser(true);

    (async () => {
      try {
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

        if (cancelled) return;

        setPrimaryUser(
          resolvePrimaryUser(
            (Array.isArray(membersList) ? membersList : []) as BusinessMemberRow[],
            (Array.isArray(invitationsList) ? invitationsList : []) as BusinessInvitationRow[]
          )
        );
      } catch {
        if (!cancelled) setPrimaryUser(null);
      } finally {
        if (!cancelled) setLoadingPrimaryUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, business._id]);

  const onSubmit = async (values: EditBusinessFormValues) => {
    try {
      await fetchApiV1({
        query: queries.updateBusiness,
        type: "json",
        variables: {
          id: business._id,
          args: {
            ...buildBusinessArgs(values),
            active: values.active,
          },
        },
      });
      toast.success("Cambios guardados");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al guardar negocio";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <BusinessFormShell
        isOpen={isOpen}
        onClose={onClose}
        title="Editar negocio"
        description={
          <>
            {business.name} —{" "}
            <code className="rounded bg-muted px-1 text-sm">{business.businessId}</code>
          </>
        }
        isSubmitting={form.formState.isSubmitting}
        submitLabel="Guardar cambios"
        submittingLabel="Guardando..."
        onSubmit={form.handleSubmit(onSubmit)}
        identityContent={
          <>
            <IdentityNameFields form={form} />
            <PrimaryUserReadOnlyFields primaryUser={primaryUser} loading={loadingPrimaryUser} />
            <EditIdentityExtraFields form={form} />
          </>
        }
      >
        <SharedBusinessTabs form={sharedTabsForm(form)} />
      </BusinessFormShell>
    </Form>
  );
}
