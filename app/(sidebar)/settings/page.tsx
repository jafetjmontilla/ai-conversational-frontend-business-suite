'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useAllowed } from "@/lib/hooks/useAllowed";
import * as Typography from "@/components/Typography";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

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
            <CardDescription>Gestiona la configuración del sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        </CardContent>
      </Card>
    </div>
  );
}