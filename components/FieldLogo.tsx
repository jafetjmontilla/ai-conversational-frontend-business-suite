import { FormControl, FormField, FormLabel, FormItem, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea";

interface FieldLogoProps {
  value: any;
  form: any;
}

export const FieldLogo = ({ form, value }: FieldLogoProps) => {
  return (
    <FormField
      control={form.control}
      name="logo"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel>{value.label}</FormLabel>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50">
              {field.value ? (
                <img
                  src={field.value}
                  alt="Logo del negocio"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-muted-foreground text-xs text-center">
                  <div className="text-2xl mb-1">🏢</div>
                  <div>Sin logo</div>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <FormControl>
                <Textarea
                  placeholder={value?.placeholder}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Ingresa la URL de tu logotipo o sube una imagen
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}