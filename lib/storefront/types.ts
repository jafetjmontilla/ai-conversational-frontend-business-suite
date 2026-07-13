export type StorefrontThemeId = "default";

export type StorefrontCatalogItem = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  type: string;
  description?: string | null;
  itemKind?: string | null;
};

export type StorefrontCartLine = {
  sku: string;
  quantity: number;
};

export type StorefrontCatalogResponse = {
  businessId: string;
  businessName?: string;
  webCheckoutEnabled: boolean;
  storefrontTheme?: StorefrontThemeId | string;
  items: StorefrontCatalogItem[];
};

export type StorefrontCheckoutPayload = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  fulfillmentMethod: string;
  items: StorefrontCartLine[];
  shippingAddress: { street: string; city: string; phone: string };
};

export type StorefrontCheckoutResponse = {
  orderId: string;
  invoiceId?: string;
  checkoutUrl?: string | null;
  message?: string;
};
