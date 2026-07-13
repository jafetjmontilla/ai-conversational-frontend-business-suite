import { DefaultCatalogPage } from "./CatalogPage";
import { DefaultCartPage } from "./CartPage";
import { DefaultCheckoutPage } from "./CheckoutPage";
import { DefaultOrderPage } from "./OrderPage";
import type { StorefrontThemeDefinition } from "../types";

export const defaultStorefrontTheme: StorefrontThemeDefinition = {
  id: "default",
  name: "Clásico",
  description: "Grid con filtros, vista rápida y carrito lateral.",
  CatalogPage: DefaultCatalogPage,
  CartPage: DefaultCartPage,
  CheckoutPage: DefaultCheckoutPage,
  OrderPage: DefaultOrderPage,
};
