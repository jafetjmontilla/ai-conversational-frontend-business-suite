"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import {
  buildBusinessArgs,
  createBusinessFormSchema,
  emptyCreateBusinessValues,
  type CreateBusinessFormValues,
} from "@/lib/schemas/business";
import { BusinessFormShell } from "@/components/business/BusinessFormShell";
import {
  CreateIdentityExtraFields,
  IdentityNameFields,
  SharedBusinessTabs,
  sharedTabsForm,
} from "@/components/business/BusinessFormFields";

interface CreateBusinessFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBusinessForm({ isOpen, onClose, onSuccess }: CreateBusinessFormProps) {
  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessFormSchema),
    defaultValues: emptyCreateBusinessValues(),
  });

  useEffect(() => {
    if (isOpen) form.reset(emptyCreateBusinessValues());
  }, [isOpen, form]);

  const onSubmit = async (values: CreateBusinessFormValues) => {
    try {
      await fetchApiV1({
        query: queries.createBusiness,
        type: "json",
        variables: {
          args: {
            ...buildBusinessArgs(values),
            mainUserName: values.mainUserName.trim(),
            mainUserEmail: values.mainUserEmail.trim().toLowerCase(),
            mainUserPhone: values.mainUserPhone.trim(),
          },
        },
      });
      toast.success("Negocio creado. Se envió la invitación al usuario principal.");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al crear negocio";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <BusinessFormShell
        isOpen={isOpen}
        onClose={onClose}
        title="Nuevo negocio"
        description="Completa Identidad y el usuario principal que recibirá la invitación. La información de Contacto, Regional y Facturación puede llenarse más tarde."
        isSubmitting={form.formState.isSubmitting}
        submitLabel="Crear negocio"
        submittingLabel="Creando..."
        onSubmit={form.handleSubmit(onSubmit)}
        identityContent={
          <>
            <IdentityNameFields form={form} />
            <CreateIdentityExtraFields form={form} />
          </>
        }
      >
        <SharedBusinessTabs form={sharedTabsForm(form)} />
      </BusinessFormShell>
    </Form>
  );
}
