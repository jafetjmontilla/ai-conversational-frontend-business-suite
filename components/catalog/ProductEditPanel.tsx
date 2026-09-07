"use client";

export {
  ProductFormPanel,
  type ProductFormPanelProps as ProductEditPanelProps,
} from "@/components/catalog/ProductFormPanel";

import { ProductFormPanel, type ProductFormPanelProps } from "@/components/catalog/ProductFormPanel";

type ProductEditPanelProps = Omit<ProductFormPanelProps, "productId" | "onProductCreated"> & {
  productId: string;
};

export function ProductEditPanel({
  productId,
  ...props
}: ProductEditPanelProps) {
  return <ProductFormPanel {...props} productId={productId} />;
}
