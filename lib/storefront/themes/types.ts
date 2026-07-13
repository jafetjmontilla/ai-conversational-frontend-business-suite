import type { ComponentType } from "react";
import type { StorefrontCatalogItem, StorefrontCartLine } from "../types";

export type StorefrontCatalogPageProps = {
  businessSlug: string;
  businessName?: string;
  items: StorefrontCatalogItem[];
  enabled: boolean;
  cart: StorefrontCartLine[];
  onAddToCart: (sku: string) => void;
  onCartChange: (lines: StorefrontCartLine[]) => void;
};

export type StorefrontCartPageProps = {
  businessSlug: string;
  businessName?: string;
  cart: StorefrontCartLine[];
  items: StorefrontCatalogItem[];
  onCartChange: (lines: StorefrontCartLine[]) => void;
};

export type StorefrontCheckoutPageProps = {
  businessSlug: string;
  businessName?: string;
  cart: StorefrontCartLine[];
  items: StorefrontCatalogItem[];
};

export type StorefrontOrderPageProps = {
  businessSlug: string;
  businessName?: string;
  orderId: string;
  paid: boolean;
};

export type StorefrontThemeDefinition = {
  id: string;
  name: string;
  description: string;
  CatalogPage: ComponentType<StorefrontCatalogPageProps>;
  CartPage: ComponentType<StorefrontCartPageProps>;
  CheckoutPage: ComponentType<StorefrontCheckoutPageProps>;
  OrderPage: ComponentType<StorefrontOrderPageProps>;
};
