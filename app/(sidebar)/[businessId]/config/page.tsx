"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function LegacyConfigRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) {
      router.replace(`/${businessId}/ai/behavior`);
    }
  }, [businessId, router]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Esta URL ha cambiado. La configuración del asistente ahora está en{" "}
            <Link href={`/${businessId}/ai/behavior`} className="underline text-primary">
              Comportamiento
            </Link>
            ,{" "}
            <Link href={`/${businessId}/ai/tools`} className="underline text-primary">
              Herramientas
            </Link>{" "}
            y las secciones de administración en{" "}
            <Link href={`/${businessId}/knowledge/fuentes`} className="underline text-primary">
              Conocimiento
            </Link>{" "}
            y{" "}
            <Link href={`/${businessId}/ai/memory`} className="underline text-primary">
              Memoria y PAE
            </Link>
            .
          </p>
          <p className="text-muted-foreground text-sm">Redirigiendo…</p>
        </CardContent>
      </Card>
    </div>
  );
}
