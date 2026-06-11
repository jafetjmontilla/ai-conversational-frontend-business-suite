"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputPhone } from "@/components/InputPhone";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { PrimaryUserInfo } from "@/lib/business/primaryUser";
import type {
  BaseBusinessFormValues,
  CreateBusinessFormValues,
  EditBusinessFormValues,
} from "@/lib/schemas/business";

function asBaseForm(
  form: UseFormReturn<CreateBusinessFormValues> | UseFormReturn<EditBusinessFormValues>
): UseFormReturn<BaseBusinessFormValues> {
  return form as unknown as UseFormReturn<BaseBusinessFormValues>;
}

interface IdentityNameFieldsProps {
  form: UseFormReturn<CreateBusinessFormValues> | UseFormReturn<EditBusinessFormValues>;
}

export function IdentityNameFields({ form }: IdentityNameFieldsProps) {
  const baseForm = asBaseForm(form);

  return (
    <>
      <FormField
        control={baseForm.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre comercial *</FormLabel>
            <FormControl>
              <Input placeholder="Nombre que ven los clientes" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={baseForm.control}
        name="legalName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Razón social *</FormLabel>
            <FormControl>
              <Input placeholder="Nombre legal" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

interface CreateIdentityExtraFieldsProps {
  form: UseFormReturn<CreateBusinessFormValues>;
}

export function CreateIdentityExtraFields({ form }: CreateIdentityExtraFieldsProps) {
  return (
    <div className="mt-2">
      <FormLabel className="text-primary mb-2">
        Usuario principal que recibirá la invitación por correo/WhatsApp.
      </FormLabel>
      <FormField
        control={form.control}
        name="mainUserName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl>
              <Input placeholder="Juan Pérez" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="mainUserEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Correo *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="juan@ejemplo.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="mainUserPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono *</FormLabel>
            <FormControl>
              <InputPhone
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

interface PrimaryUserReadOnlyFieldsProps {
  primaryUser: PrimaryUserInfo | null;
  loading?: boolean;
}

export function PrimaryUserReadOnlyFields({ primaryUser, loading }: PrimaryUserReadOnlyFieldsProps) {
  return (
    <div className="mt-2 rounded-lg border bg-muted/30 p-4 space-y-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-primary">Usuario principal</p>
          {primaryUser?.invitationPending && (
            <Badge
              variant="outline"
              className="border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
            >
              Invitación pendiente
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Datos del administrador principal del negocio (solo lectura).
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando datos del usuario principal...</p>
      ) : !primaryUser ? (
        <p className="text-sm text-muted-foreground">No hay datos del usuario principal.</p>
      ) : (
        <>
          <div className="space-y-1">
            <FormLabel>Nombre</FormLabel>
            <Input readOnly value={primaryUser.name || "—"} className="bg-background" />
          </div>
          <div className="space-y-1">
            <FormLabel>Correo</FormLabel>
            <Input readOnly value={primaryUser.email || "—"} className="bg-background" />
          </div>
          <div className="space-y-1">
            <FormLabel>Teléfono</FormLabel>
            <Input readOnly value={primaryUser.phone || "—"} className="bg-background" />
          </div>
        </>
      )}
    </div>
  );
}

interface EditIdentityExtraFieldsProps {
  form: UseFormReturn<EditBusinessFormValues>;
}

export function EditIdentityExtraFields({ form }: EditIdentityExtraFieldsProps) {
  return (
    <FormField
      control={form.control}
      name="active"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-base">Activo</FormLabel>
            <p className="text-sm text-muted-foreground">
              Desactivar oculta el negocio sin borrarlo.
            </p>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

interface SharedBusinessTabsProps {
  form: UseFormReturn<BaseBusinessFormValues>;
}

export function SharedBusinessTabs({ form }: SharedBusinessTabsProps) {
  return (
    <>
      <TabsContent value="contact" className="space-y-3 pt-3">
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID fiscal</FormLabel>
              <FormControl>
                <Input placeholder="RIF, NIT, RFC, VAT" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slogan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eslogan</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo (URL)</FormLabel>
              <FormControl>
                <Input placeholder="SVG o PNG" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo principal</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+58 412 1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calle</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="address.number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address.sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sector</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="address.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address.stateProvince"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado / Provincia</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="address.postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código postal</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </TabsContent>

      <TabsContent value="regional" className="space-y-3 pt-3">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda</FormLabel>
              <FormControl>
                <Input placeholder="USD, VES, EUR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona horaria</FormLabel>
              <FormControl>
                <Input placeholder="America/Caracas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma</FormLabel>
              <FormControl>
                <Input placeholder="es, en" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de negocio</FormLabel>
              <FormControl>
                <Input placeholder="Retail, Servicios, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TabsContent>

      <TabsContent value="billing" className="space-y-3 pt-3">
        <FormField
          control={form.control}
          name="defaultTaxPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>% impuesto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={0.01}
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxRegime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Régimen contributivo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="digitalSignatureOrStamp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firma / Sello</FormLabel>
              <FormControl>
                <Input placeholder="URL o referencia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invoiceNumbering.prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prefijo factura</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="invoiceNumbering.rangeFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rango desde</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoiceNumbering.rangeTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rango hasta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </TabsContent>
    </>
  );
}

export function sharedTabsForm(
  form: UseFormReturn<CreateBusinessFormValues> | UseFormReturn<EditBusinessFormValues>
) {
  return asBaseForm(form);
}
