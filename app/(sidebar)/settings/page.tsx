'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useTranslation } from "react-i18next";
import { useAllowed } from "@/lib/hooks/useAllowed";
import * as Typography from "@/components/Typography";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import BusinessConfiguration from "@/components/settings/BusinessConfiguration";
import BranchManagement from "@/components/settings/BranchManagement";
import InventoryBilling from "@/components/settings/InventoryBilling";

export default function SettingPage() {
  const { authUser } = useAuth();
  const { getCurrentRole, getCurrentPlan } = useAllowed();
  const { t } = useTranslation(['dashboard', 'common']);
  const { error: businessError } = useBusiness();
  const [cardFocusedId, setCardFocusedId] = useState<string>();

  const authUserDisplay = [
    { title: t('dashboard:name'), value: authUser?.displayName || 'No especificado' },
    { title: t('dashboard:email'), value: authUser?.email || 'No especificado' },
    { title: t('dashboard:emailVerified'), value: authUser?.emailVerified || false },
    { title: t('dashboard:role'), value: getCurrentRole() || 'No especificado' },
    { title: t('dashboard:plan'), value: getCurrentPlan() || 'No especificado' }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Configuración del Sistema</CardTitle>
            <CardDescription>Gestiona la configuración de tu negocio y sucursales</CardDescription>
          </div>
          {businessError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{businessError}</p>
            </div>
          )}
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
                        {item.value ? t('common:yes') : t('common:no')}
                      </Badge>
                      : <Typography.TypographyLarge>{item.value}</Typography.TypographyLarge>}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
          <Separator className="my-4" />
          <BusinessConfiguration
            cardFocusedId={cardFocusedId}
            setCardFocusedId={setCardFocusedId}
          />
          <BranchManagement
            cardFocusedId={cardFocusedId}
            setCardFocusedId={setCardFocusedId}
          />
          <InventoryBilling
            cardFocusedId={cardFocusedId}
            setCardFocusedId={setCardFocusedId}
          />
        </CardContent>
      </Card>
    </div>
  );
}