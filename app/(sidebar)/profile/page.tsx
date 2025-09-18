"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { User as UserIcon, Mail, Phone, Image, Shield, Calendar, Edit3, Save, X, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormFieldInputs } from "@/components/FormFieldInputs";
import { FormFieldInput, Role } from "@/lib/interfases";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
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
];

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  accounting: 'Contabilidad',
  callCenter: 'Call Center',
  support: 'Soporte',
  none: 'Sin rol'
};

export default function ProfilePage() {
  const { user, authUser, setAuthUser, logout } = useAuth();
  const { theme, setTheme, isDark } = useThemeContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      photoURL: "",
    },
  });

  // Inicializar formulario con datos del contexto
  useEffect(() => {
    if (authUser) {
      form.reset({
        name: authUser.displayName || "",
        phone: authUser.customClaims?.phone || "",
        photoURL: authUser.photoURL || "",
      });
    }
  }, [authUser, form]);

  const onSubmit = async (values: FormValues) => {
    if (!authUser) return;

    setIsSubmitting(true);
    try {
      const updateResponse = await fetchApiV1({
        query: queries.updateProfile,
        type: "json",
        variables: {
          args: {
            name: values.name,
            phone: values.phone,
            photoURL: values.photoURL || "",
          },
        },
      });
      if (updateResponse) {
        // Actualizar el contexto de autenticación con la respuesta
        setAuthUser({
          ...authUser,
          displayName: updateResponse.name,
          phone: updateResponse.phone as string,
          photoURL: updateResponse.photoURL,
        });
        toast.success("Perfil actualizado exitosamente");
        setIsEditing(false);
      } else {
        toast.error("Error actualizando perfil");
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error("Error al actualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset({
      name: authUser?.displayName || "",
      phone: (authUser as any)?.phone || "",
      photoURL: authUser?.photoURL || "",
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await logout();
      if (response.success) {
        toast.success("Sesión cerrada exitosamente");
        // El redirect se maneja automáticamente en el AuthContext
      } else {
        toast.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header del perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={authUser.photoURL || user?.photoURL || ""} />
                  <AvatarFallback className="text-lg">
                    {authUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{authUser.displayName}</CardTitle>
                  <CardDescription className="text-base">{authUser.email}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {roleLabels[authUser.customClaims?.role as Role] || authUser.customClaims?.role || "Sin rol"}
                    </Badge>
                    <Badge variant="default">
                      Activo
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <>
                  {!isEditing ? (
                    <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Última actualización</p>
                      <p className="text-sm text-muted-foreground">
                        {authUser.customClaims?.assignedAt ? new Date(authUser.customClaims.assignedAt).toLocaleDateString('es-ES', {
                          hour12: true,
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "No disponible"}
                      </p>
                    </div>
                  </div>
                </>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Información del perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              {isEditing
                ? "Modifica tu información personal. Los cambios se guardarán en tu perfil."
                : "Tu información personal y de contacto."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formFields.map((field) => (
                    <FormFieldInputs
                      key={field.name}
                      field={{
                        ...field,
                        disabled: !isEditing
                      }}
                      control={form.control}
                      name={field.name as 'name' | 'phone' | 'photoURL'}
                      isSubmitting={isSubmitting}
                      disabled={!isEditing}
                    />
                  ))}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Cuenta</CardTitle>
            <CardDescription>
              Detalles adicionales de tu cuenta y actividad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email verificado</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.emailVerified ? "Sí" : "No"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Miembro desde</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : "No disponible"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Última inicio de sesión</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('es-ES', {
                      hour12: true,
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "No disponible"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Rol de usuario</p>
                  <p className="text-sm text-muted-foreground">
                    {roleLabels[authUser.customClaims?.role as Role] || authUser.customClaims?.role || "Sin rol"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de cuenta */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              Personaliza tu experiencia y gestiona tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle de tema */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isDark ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Tema oscuro</p>
                  <p className="text-sm text-muted-foreground">
                    {isDark ? "Activar tema claro" : "Activar tema oscuro"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={handleThemeToggle}
                aria-label="Toggle theme"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cerrar sesión</p>
                    <p className="text-sm text-muted-foreground">
                      Salir de tu cuenta actual
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
