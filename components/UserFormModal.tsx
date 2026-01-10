"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormFieldInput, OptionSelect, Role, roles, User } from "@/lib/interfases";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { sendWhatsAppMessage, getWhatsAppSessions } from "@/lib/whatsappApi";
import { toast } from "sonner";
import { User as UserIcon, Mail, Phone, Image, Shield } from "lucide-react";
import { FormFieldInputs } from "./FormFieldInputs";

const roleOptions: OptionSelect[] = [
  {
    value: 'accounting' as Role,
    title: 'Contabilidad',
    description: '',
    icon: '👤',
    features: []
  },
  {
    value: 'callCenter' as Role,
    title: 'Call Center',
    description: '',
    icon: '👤',
    features: []
  },
  {
    value: 'technicalSupport' as Role,
    title: 'Soporte Técnico',
    description: '',
    icon: '👤',
    features: []
  },
  {
    value: 'logicalSupport' as Role,
    title: 'Soporte Lógico',
    description: '',
    icon: '👤',
    features: []
  },
  {
    value: 'sales' as Role,
    title: 'Ventas',
    description: '',
    icon: '👤',
    features: []
  },
  {
    value: 'admin' as Role,
    title: 'Administrador',
    description: '',
    icon: '⚙️',
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
  role: z.enum(roles, {
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
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const isInvitation = !user?.uid;
  const isEditing = !!user;


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: (user?.role as "admin" | "accounting" | "callCenter" | "technicalSupport" | "logicalSupport" | "sales"),
      active: user?.active ?? true,
      photoURL: user?.photoURL || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        if (isInvitation) {
          // Actualizar invitación
          const updateInvitationResponse = await fetchApiV1({
            query: queries.updateUserInvitation,
            type: "json",
            variables: {
              invitationId: user?._id,
              args: {
                name: values.name,
                email: values.email,
                phone: values.phone,
                role: values.role,
              },
            },
          });

          if (updateInvitationResponse.success) {
            toast.success("Invitación actualizada exitosamente");
            onSuccess();
            onClose();
          } else {
            toast.error(updateInvitationResponse.message || "Error actualizando invitación");
          }
          return;
        }
        // Actualizar usuario existente
        const updateResponse = await fetchApiV1({
          query: queries.updateUser,
          type: "json",
          variables: {
            id: user?._id,
            args: {
              name: values.name,
              email: values.email,
              phone: values.phone,
              role: values.role,
              photoURL: values.photoURL || "",
              emailVerified: user?.emailVerified,
            },
          },
        });

        if (updateResponse) {
          toast.success("Usuario actualizado exitosamente");
          onSuccess();
          onClose();
        } else {
          toast.error("Error actualizando usuario");
        }
      } else {
        // Crear invitación de usuario
        const invitationResponse = await fetchApiV1({
          query: queries.createUserInvitation,
          type: "json",
          variables: {
            args: {
              name: values.name,
              email: values.email,
              phone: values.phone,
              role: values.role,
            },
          },
        });

        if (invitationResponse.success) {
          // Enviar por WhatsApp
          await sendInvitationByWhatsApp(invitationResponse.data);
          toast.success("Invitación enviada por WhatsApp exitosamente");
          onSuccess();
          onClose();
        } else {
          toast.error(invitationResponse.message || "Error creando invitación");
        }
      }
    } catch (error) {
      console.error("Error al procesar usuario:", error);
      toast.error(isEditing ? "Error al actualizar usuario" : "Error al crear la invitación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendInvitationByWhatsApp = async (invitationData: any) => {
    setIsSendingWhatsApp(true);
    try {
      invitationData.phone = `${invitationData.phone.replace('+', '')}@s.whatsapp.net`;
      // Obtener sesiones activas de WhatsApp
      const sessions = await getWhatsAppSessions();
      const activeSession = sessions.find((session: any) => session.isConnected);

      if (!activeSession) {
        toast.error("No hay sesiones de WhatsApp activas. Por favor, conecta WhatsApp primero.");
        return;
      }

      // Generar enlace de registro
      const registrationLink = `${window.location.origin}/register-invitation?token=${invitationData.token}`;

      // Crear mensaje personalizado
      const message = `¡Hola ${invitationData.name}!

Has sido invitado a unirte a nuestra plataforma.

Para completar tu registro, haz clic en el siguiente enlace:
${registrationLink}

Este enlace expira en 7 días.

¡Bienvenido!`;

      // Enviar mensaje por WhatsApp
      const whatsappResponse = await sendWhatsAppMessage(
        activeSession.id,
        invitationData.phone,
        message
      );

      if (whatsappResponse.success) {
        // Actualizar estado de envío en la invitación
        await fetchApiV1({
          query: queries.sendUserInvitation,
          type: "json",
          variables: {
            args: {
              invitationId: invitationData._id,
              sessionId: activeSession.id,
            },
          },
        });
      } else {
        toast.error("Error enviando mensaje por WhatsApp");
      }
    } catch (error) {
      console.error("Error enviando por WhatsApp:", error);
      toast.error("Error enviando invitación por WhatsApp");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Invitar Usuario por WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del usuario seleccionado."
              : "Completa la información para enviar una invitación por WhatsApp."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            {formFields
              .filter((field) => {
                // En modo edición, no mostrar el campo 'active' ya que no se puede modificar
                if (isEditing && field.name === 'active') {
                  return false;
                }
                return true;
              })
              .map((field) => {
                if (field.name === 'email') {
                  field.disabled = isInvitation ? false : isEditing;
                }
                if (field.name === 'photoURL' && isInvitation) {
                  return null;
                }
                return (
                  <FormFieldInputs
                    key={field.name}
                    field={field}
                    control={form.control}
                    name={field.name as 'name' | 'email' | 'phone' | 'photoURL' | 'role' | 'active'}
                    isSubmitting={form.formState.isSubmitting}
                    disabled={field.disabled}
                  />
                )
              })}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isSendingWhatsApp}>
                {isSubmitting ? (isEditing ? "Actualizando usuario..." : "Creando invitación...") :
                  isSendingWhatsApp
                    ? "Enviando por WhatsApp..."
                    : isEditing
                      ? isInvitation
                        ? "Actualizar Invitación"
                        : "Actualizar Usuario"
                      : "Enviar por WhatsApp"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
