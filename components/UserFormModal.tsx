"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormFieldInput, OptionSelect, Role, User } from "@/lib/interfases";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { User as UserIcon, Mail, Phone, Image, Shield, Link } from "lucide-react";
import { FormFieldInputs } from "./FormFieldInputs";

const roleOptions: OptionSelect[] = [
  {
    value: 'callCenter' as Role,
    title: 'Cliente',
    description: '',
    icon: '👤',
    features: []
  },
  {
    value: 'accounting' as Role,
    title: 'Contabilidad',
    description: '',
    icon: '💇🏻',
    features: []
  },
  {
    value: 'admin' as Role,
    title: 'Administrador',
    description: '',
    icon: '⚙️',
    features: []
  },
  {
    value: 'support' as Role,
    title: 'Soporte',
    description: '',
    icon: '💬',
    features: []
  },
].sort((a, b) => a.title.localeCompare(b.title));

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  role: z.enum(["admin", "editor", "viewer"], {
    message: "El rol es requerido",
  }),
  active: z.boolean(),
  photoURL: z.string().url("URL de foto inválida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;


const formFields: FormFieldInput[] = [
  {
    name: 'name',
    label: 'Nombre',
    placeholder: 'Nombre del usuario',
    icon: UserIcon,
    type: 'text',
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    placeholder: 'usuario@ejemplo.com',
    icon: Mail,
    type: 'text',
    required: true,
  },
  {
    name: 'phone',
    label: 'Teléfono',
    placeholder: '+584124567890',
    icon: Phone,
    type: 'text',
    required: true,
  },
  {
    name: 'photoURL',
    label: 'URL de Foto',
    placeholder: 'https://ejemplo.com/foto.jpg',
    icon: Image,
    type: 'text',
    required: false,
  },
  {
    name: 'role',
    label: 'Rol',
    placeholder: 'Selecciona un rol',
    icon: <Shield className="h-4 w-4" />,
    type: 'select',
    options: roleOptions,
    required: true,
  },
  {
    name: 'active',
    label: 'Usuario activo',
    placeholder: 'Selecciona un rol',
    type: 'switch',
    required: true,
  },
];

export default function UserFormModal({ isOpen, onClose, user, onSuccess }: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!user;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: (user?.role as "admin" | "editor" | "viewer") || "viewer",
      active: user?.active ?? true,
      photoURL: user?.photoURL || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        // TODO: Implementar mutación de actualización cuando esté disponible
        toast.error("La funcionalidad de edición estará disponible próximamente");
      } else {
        await fetchApiV1({
          query: queries.createUser,
          type: "json",
          variables: {
            args: {
              name: values.name,
              email: values.email,
              phone: values.phone,
              role: values.role,
              active: values.active,
              photoURL: values.photoURL || null,
            },
          },
        });
        toast.success("Usuario creado exitosamente");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      toast.error("Error al guardar el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del usuario seleccionado."
              : "Completa la información para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formFields.map((field) => (
              <FormFieldInputs
                key={field.name}
                field={field}
                control={form.control}
                name={field.name as 'name' | 'email' | 'phone' | 'photoURL' | 'role' | 'active'}
                isSubmitting={form.formState.isSubmitting}
              />
            ))}
            <DialogFooter>
              {isEditing && <div className="flex-1">
                <Button type="button" variant="link" onClick={onClose}>
                  <Link className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Enviar Invitación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
