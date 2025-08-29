import { FieldLogo } from "./FieldLogo";
import { FieldSocialmedias } from "./FieldSocialmedias";
import { TypographyExtraSmall, TypographySmall } from "./Typography";
import { FormControl, FormMessage, FormField, FormLabel, FormItem } from "./ui/form"
import { Input } from "./ui/input"
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from "./ui/select";
import { Textarea } from "./ui/textarea";

export type FieldValue = {
  name: string;
  label: string;
  placeholder: string;
  type: string;
  component: any;
  options?: { label: string, value: string | boolean, icon?: string, color?: string }[];
  icon?: string;
  color?: string;
  info?: string;
  disabled?: boolean;
}

interface FieldProps {
  value: FieldValue;
  form: any;
}

export const Field = ({ value, form }: FieldProps) => {

  return (
    value.type === "socialMedia"
      ? <FieldSocialmedias form={form} value={value} />
      : value.type === "file" ?
        <FieldLogo form={form} value={value} />
        : <FormField
          key={value.name}
          control={form.control}
          name={value.name}
          render={({ field }) => (
            <FormItem className="mb-4 space-y-1 relative">
              <FormLabel className="flex items-center gap-2 relative">
                <span className={value.color}>
                  {value.icon}
                </span>
                {value.label}
              </FormLabel>
              <FormControl>
                {value.component === Select
                  ? <Select
                    value={field.value?.toString()}
                    onValueChange={(selectedValue) => {
                      if (value.type === 'boolean') {
                        field.onChange(selectedValue === 'true');
                      } else {
                        field.onChange(selectedValue);
                      }
                    }}
                    disabled={value.disabled} >
                    <SelectTrigger>
                      <SelectValue placeholder={value.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {value.options?.map((option) => (
                        <SelectItem
                          key={option.value.toString()}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  : value.component === Textarea ?
                    <Textarea
                      placeholder={value.placeholder}
                      rows={4}
                      {...field}
                      value={typeof field.value === 'string' ? field.value : ''}
                      disabled={value.disabled}
                    />
                    : <Input
                      placeholder={value.placeholder}
                      {...field}
                      value={typeof field.value === 'string' ? field.value : ''}
                      disabled={value.disabled} />
                }
              </FormControl>
              <FormMessage className="absolute text-xs pl-3.5 -translate-y-1" />
              {value.info && <TypographyExtraSmall >{value.info}</TypographyExtraSmall>}
            </FormItem>
          )}
        />

  )
}