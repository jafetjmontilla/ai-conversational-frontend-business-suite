"use client";

import { Control, FieldPath, } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormFieldInput } from "@/lib/interfases";

interface FormFieldInputsProps {
  field: FormFieldInput;
  control: Control<any>;
  name: FieldPath<any>;
  isSubmitting?: boolean;
}


export const FormFieldInputs = ({ field, control, name, isSubmitting = false }: FormFieldInputsProps) => {

  if (field.type === "text") {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field: formField }) => (
          <FormItem className="space-y-0 relative">
            <FormLabel>{`${field.label}${field.required ? "" : " (Opcional)"}`}</FormLabel>
            <FormControl>
              <div className="relative">
                {field.icon &&
                  <div >
                    {!field.icon?.type ? (
                      <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    ) : (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4">
                        {field.icon}
                      </div>
                    )}
                  </div>
                }
                <FormInput
                  {...formField}
                  placeholder={field.placeholder}
                  className={field.icon ? "pl-10" : ""}
                  disabled={isSubmitting}
                />
              </div>
            </FormControl>
            <FormMessage className="absolute text-xs" />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === "select") {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field: formField }) => {
          return (
            <FormItem className="space-y-0 relative">
              <FormLabel>{`${field.label}${field.required ? "" : " (Opcional)"}`}</FormLabel>
              <FormControl>
                <div className="relative">
                  {field.icon &&
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4">
                      {!field.icon?.type ? (
                        <field.icon className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4">
                          {field.icon}
                        </div>
                      )}
                    </div>
                  }
                  <Select
                    value={formField.value}
                    onValueChange={formField.onChange}
                  >
                    <SelectTrigger isWithIcon={field.icon ? true : false} >
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={String(option.value)} value={String(option.value)} >
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <FormMessage className="absolute text-xs" />
            </FormItem>
          )
        }}
      />
    );
  }

  if (field.type === "switch") {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field: formField }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Switch
                checked={formField.value}
                onCheckedChange={formField.onChange}
              />
            </FormControl>
            <FormLabel className="!mt-0">{field.label}</FormLabel>
          </FormItem>
        )}
      />
    );
  }

  return null;
};