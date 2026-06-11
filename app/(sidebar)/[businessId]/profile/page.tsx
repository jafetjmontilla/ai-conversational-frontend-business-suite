"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { ProfilePageContent } from "@/components/profile/ProfilePageContent";

export default function BusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole, loading: roleLoading } = useBusinessRole(businessId ?? null);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  if (!businessId || roleLoading) return null;

  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No tienes permiso para ver el perfil en este contexto de negocio.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ProfilePageContent />;
}
