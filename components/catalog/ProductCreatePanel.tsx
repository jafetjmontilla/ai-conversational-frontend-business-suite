"use client";

export { ProductFormPanel, type ProductFormPanelProps as ProductCreatePanelProps } from "@/components/catalog/ProductFormPanel";

import { ProductFormPanel, type ProductFormPanelProps } from "@/components/catalog/ProductFormPanel";

type ProductCreatePanelProps = Omit<ProductFormPanelProps, "productId" | "onProductUpdated" | "onProductDeleted">;

export function ProductCreatePanel(props: ProductCreatePanelProps) {
  return <ProductFormPanel {...props} productId={null} />;
}
