"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { Business } from "@/lib/interfases";

const formSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean(),
  mainUserName: z.string().optional(),
  mainUserEmail: z.string().optional(),
  mainUserPhone: z.string().optional(),
}).superRefine((data, ctx) => {
  const isCreate = !data.slug;
  if (!isCreate) return;
  if (!(data.mainUserName ?? "").trim()) {
    ctx.addIssue({ path: ["mainUserName"], message: "Nombre del usuario requerido", code: z.ZodIssueCode.custom });
  }
  if (!(data.mainUserEmail ?? "").trim()) {
    ctx.addIssue({ path: ["mainUserEmail"], message: "Correo requerido", code: z.ZodIssueCode.custom });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.mainUserEmail ?? "").trim())) {
    ctx.addIssue({ path: ["mainUserEmail"], message: "Correo inválido", code: z.ZodIssueCode.custom });
  }
  if (!(data.mainUserPhone ?? "").trim()) {
    ctx.addIssue({ path: ["mainUserPhone"], message: "Teléfono requerido", code: z.ZodIssueCode.custom });
  } else if ((data.mainUserPhone ?? "").trim().length < 6) {
    ctx.addIssue({ path: ["mainUserPhone"], message: "Mínimo 6 caracteres", code: z.ZodIssueCode.custom });
  }
});

type FormValues = z.infer<typeof formSchema>;

interface BusinessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  business?: Business | null;
  onSuccess: () => void;
}

export default function BusinessFormModal({ isOpen, onClose, business, onSuccess }: BusinessFormModalProps) {
  const isEditing = !!business;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", slug: "", description: "", active: true,
      mainUserName: "", mainUserEmail: "", mainUserPhone: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: business?.name ?? "",
        slug: business?.slug ?? "",
        description: business?.description ?? "",
        active: business?.active ?? true,
        mainUserName: "", mainUserEmail: "", mainUserPhone: "",
      });
    }
  }, [isOpen, business, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && business?._id) {
        await fetchApiV1({ query: queries.updateBusiness, type: "json", variables: { id: business._id, args: { name: values.name, slug: values.slug, description: values.description || undefined, active: values.active } } });
        toast.success("Negocio actualizado");
      } else {
        const mainUserName = values.mainUserName?.trim() ?? "";
        const mainUserEmail = values.mainUserEmail?.trim() ?? "";
        const mainUserPhone = values.mainUserPhone?.trim() ?? "";
        if (!mainUserName || !mainUserEmail || !mainUserPhone) {
          toast.error("Nombre, correo y teléfono del usuario principal son obligatorios.");
          return;
        }
        await fetchApiV1({
          query: queries.createBusiness,
          type: "json",
          variables: {
            args: {
              name: values.name,
              description: values.description || undefined,
              mainUserName,
              mainUserEmail,
              mainUserPhone,
            },
          },
        });
        toast.success("Negocio creado. Se envió la invitación al usuario principal.");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || (isEditing ? "Error al actualizar" : "Error al crear"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar negocio" : "Nuevo negocio"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos. El identificador (slug) es la parte de la URL." : "El identificador se genera automáticamente. Indica los datos del usuario principal para enviarle la invitación."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre del negocio</FormLabel><FormControl><Input placeholder="Mi Negocio" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {isEditing && (
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem><FormLabel>Identificador (slug)</FormLabel><FormControl><Input placeholder="123456789012" {...field} disabled /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descripción (opcional)</FormLabel><FormControl><Textarea placeholder="Descripción" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {!isEditing && (
              <>
                <div className="text-sm font-medium text-muted-foreground border-t pt-3 mt-2">Usuario principal (recibirá la invitación)</div>
                <FormField control={form.control} name="mainUserName" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mainUserEmail" render={({ field }) => (
                  <FormItem><FormLabel>Correo</FormLabel><FormControl><Input type="email" placeholder="juan@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mainUserPhone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+58 412 1234567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </>
            )}
            {isEditing && (
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div><FormLabel className="text-base">Activo</FormLabel><p className="text-sm text-muted-foreground">Desactiva sin borrar.</p></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
