"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { businessRoles, type BusinessRole } from "@/lib/interfases";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(businessRoles),
});

type FormValues = z.infer<typeof formSchema>;

const roleLabels: Record<BusinessRole, string> = {
  business_admin: "Administrador del negocio",
  business_editor: "Editor",
  business_viewer: "Solo lectura",
};

interface BusinessMemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** _id del documento Business (business_id). */
  business_id: string;
  onSuccess: () => void;
}

export default function BusinessMemberFormModal({
  isOpen,
  onClose,
  business_id,
  onSuccess,
}: BusinessMemberFormModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", role: "business_viewer" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await fetchApiV1({
        query: queries.setBusinessMember,
        type: "json",
        variables: {
          args: {
            email: values.email.trim().toLowerCase(),
            business_id,
            role: values.role,
          },
        },
      });
      toast.success("Usuario agregado al negocio");
      form.reset({ email: "", role: "business_viewer" });
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Error al agregar usuario");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Agregar usuario al negocio</DialogTitle>
          <DialogDescription>
            El usuario debe estar registrado en el sistema. Indica su email y el rol en este negocio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en el negocio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Agregando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
