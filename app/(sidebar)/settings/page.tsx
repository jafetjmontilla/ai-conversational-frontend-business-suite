'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useAllowed } from "@/lib/hooks/useAllowed";
import * as Typography from "@/components/Typography";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import WhatsAppConnection from "@/components/settings/WhatsAppConnection";

export default function SettingPage() {
  const { authUser } = useAuth();
  const { getCurrentRole } = useAllowed();
  const [cardFocusedId, setCardFocusedId] = useState<string>();
  const authUserDisplay = [
    { title: 'Nombre', value: authUser?.displayName || 'No especificado' },
    { title: 'Email', value: authUser?.email || 'No especificado' },
    { title: 'Email verificado', value: authUser?.emailVerified || false },
    { title: 'Rol', value: getCurrentRole() || 'No especificado' }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Configuración del Sistema</CardTitle>
            <CardDescription>Gestiona la configuración de tu negocio y sucursales</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
            <CardHeader>
              <CardTitle>Usuario</CardTitle>
              <CardDescription>Información básica del usuario y del plan</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1vw] px-[1vw] py-2">
              {authUserDisplay.map((item) => (
                <Card key={item.title} className="flex-1">
                  <CardContent className="flex flex-row items-center gap-2 py-0.5 md:py-2">
                    <Typography.TypographySmall className="capitalize">{item.title}</Typography.TypographySmall>
                    {typeof item.value === 'boolean'
                      ? <Badge variant={item.value ? "default" : "secondary"} className="mt-1">
                        {item.value ? 'Sí' : 'No'}
                      </Badge>
                      : <Typography.TypographyLarge>{item.value}</Typography.TypographyLarge>}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
          <Separator className="my-4" />
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <Typography.TypographyH4>¡Bienvenido a 4net!</Typography.TypographyH4>
                <Typography.TypographyP className="text-muted-foreground mt-2">
                  Para comenzar, crea tu primer negocio completando el formulario anterior.
                  Una vez creado, podrás gestionar sucursales, servicios y mucho más.
                </Typography.TypographyP>
              </div>
            </CardContent>
          </Card>
          <WhatsAppConnection
            cardFocusedId={cardFocusedId}
            setCardFocusedId={setCardFocusedId}
          />

        </CardContent>
      </Card>
    </div>
  );
}