"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { ProfilePageContent } from "@/components/profile/ProfilePageContent";

export default function BusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { authUser, loading: authLoading } = useAuth();
  const { businessRole, loading: roleLoading } = useBusinessRole(businessId ?? null);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/login");
    }
  }, [authLoading, authUser, router]);

  if (!businessId) return null;

  if (authLoading || !authUser || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver el perfil en este contexto de negocio.</p>
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
