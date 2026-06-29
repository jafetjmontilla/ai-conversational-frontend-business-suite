"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { ProductEditPanel } from "@/components/catalog/ProductEditPanel";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const productId = params?.productId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  if (!businessId || !productId) return null;

  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para editar este producto.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/${businessId}/offerings/products`}>Volver al inventario</Link>
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
          Volver al inventario
        </Link>
      </Button>
      <div className="min-h-0 flex-1">
        <ProductEditPanel
          businessId={businessId}
          productId={productId}
          canEdit
          onProductDeleted={() => router.push(`/${businessId}/offerings/products`)}
        />
      </div>
    </div>
  );
}
