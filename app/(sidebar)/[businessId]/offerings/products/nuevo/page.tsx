"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { ProductCreatePanel } from "@/components/catalog/ProductCreatePanel";

export default function OfferingsProductNuevoPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  if (!businessId) return null;

  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para agregar productos.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/${businessId}/offerings/products`}>Volver al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col p-4 md:p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 w-fit shrink-0">
        <Link href={`/${businessId}/offerings/products`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Link>
      </Button>
      <div className="min-h-0 flex-1 max-w-2xl">
        <ProductCreatePanel
          businessId={businessId}
          onProductCreated={(product) =>
            router.push(`/${businessId}/offerings/products/${product._id}`)
          }
        />
      </div>
    </div>
  );
}
