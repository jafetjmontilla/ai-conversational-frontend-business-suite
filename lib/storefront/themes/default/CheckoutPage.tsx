"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { createStorefrontCheckout } from "@/lib/storefront/api";
import { cartItemCount, clearCart } from "@/lib/storefront/cart-storage";
import { productImageUrl } from "@/lib/storefront/catalog-utils";
import { formatMoney } from "@/lib/storefront/format";
import { storefrontPaths } from "@/lib/storefront/paths";
import { cn } from "@/lib/utils";
import type { StorefrontCheckoutPageProps } from "../types";

const ease = [0.32, 0.72, 0, 1] as const;

export function DefaultCheckoutPage({
  businessSlug,
  businessName,
  cart,
  items,
}: StorefrontCheckoutPageProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const paths = storefrontPaths(businessSlug);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("delivery");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bySku = useMemo(() => new Map(items.map((item) => [item.sku, item])), [items]);
  const lines = cart.map((line) => {
    const item = bySku.get(line.sku);
    return {
      ...line,
      name: item?.name ?? line.sku,
      price: item?.price ?? 0,
      image: productImageUrl(item?.name ?? line.sku),
    };
  });
  const count = cartItemCount(cart);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!clientName.trim()) next.clientName = "Indica tu nombre";
    if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      next.clientEmail = "Email no válido";
    }
    if (fulfillmentMethod === "delivery") {
      if (!street.trim()) next.street = "Indica la dirección";
      if (!city.trim()) next.city = "Indica la ciudad";
    }
    if (cart.length === 0) next.cart = "El carrito está vacío";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCheckout = async () => {
    if (!validate()) {
      toast.error("Revisa los datos del formulario");
      return;
    }
    setLoading(true);
    try {
      const data = await createStorefrontCheckout(businessSlug, {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        fulfillmentMethod,
        items: cart.map((line) => ({ sku: line.sku, quantity: line.quantity })),
        shippingAddress: {
          street: street.trim(),
          city: city.trim(),
          phone: clientPhone.trim(),
        },
      });

      clearCart(businessSlug);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`${paths.order(data.orderId)}?paid=0`);
      }
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message || "No se pudo crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <StorefrontShell
        businessSlug={businessSlug}
        businessName={businessName}
        cartCount={0}
        active="checkout"
      >
        <div className="mx-auto max-w-md space-y-4 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Nada que pagar</h1>
          <p className="text-muted-foreground">Agrega productos al carrito antes de continuar.</p>
          <Button asChild className="rounded-xl">
            <Link href={paths.base}>Volver al catálogo</Link>
          </Button>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell
      businessSlug={businessSlug}
      businessName={businessName}
      cartCount={count}
      active="checkout"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mb-8 flex items-center gap-3"
      >
        <Button asChild variant="outline" size="icon" className="rounded-xl">
          <Link href={paths.cart} aria-label="Volver al carrito">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>
          <p className="text-xs text-muted-foreground">
            Completa tus datos para procesar el pedido.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <form
          className="space-y-6 lg:col-span-7"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCheckout();
          }}
        >
          <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                1
              </div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Truck className="size-[18px]" aria-hidden />
                Información de entrega
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Nombre completo
                </Label>
                <Input
                  autoComplete="name"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  className="h-11 rounded-xl"
                  aria-invalid={Boolean(errors.clientName)}
                />
                {errors.clientName && (
                  <p className="text-xs text-destructive">{errors.clientName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  className="h-11 rounded-xl"
                  aria-invalid={Boolean(errors.clientEmail)}
                />
                {errors.clientEmail && (
                  <p className="text-xs text-destructive">{errors.clientEmail}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Teléfono</Label>
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={clientPhone}
                  onChange={(event) => setClientPhone(event.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-3 pt-2 sm:col-span-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Método de entrega
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { value: "delivery", label: "Delivery", hint: "Llevamos el pedido a tu dirección" },
                    { value: "pickup", label: "Retiro en tienda", hint: "Recógelo en el local" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFulfillmentMethod(option.value)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-colors",
                        fulfillmentMethod === option.value
                          ? "border-foreground bg-muted/50"
                          : "border-border/70 hover:border-foreground/30"
                      )}
                    >
                      <span className="flex items-center justify-between font-semibold">
                        {option.label}
                        {fulfillmentMethod === option.value && (
                          <Check className="size-4" aria-hidden />
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {fulfillmentMethod === "delivery" && (
                <>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Dirección
                    </Label>
                    <Input
                      autoComplete="street-address"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      className="h-11 rounded-xl"
                      aria-invalid={Boolean(errors.street)}
                    />
                    {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Ciudad
                    </Label>
                    <Input
                      autoComplete="address-level2"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="h-11 rounded-xl"
                      aria-invalid={Boolean(errors.city)}
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                </>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl active:scale-[0.98]"
            disabled={loading}
          >
            <Check className="size-5" aria-hidden />
            {loading ? "Procesando…" : `Confirmar y pagar ${formatMoney(subtotal)}`}
          </Button>
        </form>

        <aside className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-5 lg:sticky lg:top-28">
          <h2 className="border-b border-border/50 pb-3 text-lg font-semibold">Resumen de compra</h2>
          <ul className="max-h-60 space-y-3 overflow-y-auto divide-y divide-border/50 pr-1">
            {lines.map((line) => (
              <li key={line.sku} className="flex gap-3 pt-3 first:pt-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={line.image}
                  alt=""
                  className="size-12 rounded-lg object-cover bg-muted"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{line.name}</p>
                  <p className="text-[11px] text-muted-foreground">Cantidad: {line.quantity}</p>
                </div>
                <p className="text-xs font-semibold tabular-nums">
                  {formatMoney(line.price * line.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="space-y-2.5 border-t border-border/50 pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-3 text-base font-bold">
              <span>Total estimado</span>
              <span className="text-xl tabular-nums">{formatMoney(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </StorefrontShell>
  );
}
