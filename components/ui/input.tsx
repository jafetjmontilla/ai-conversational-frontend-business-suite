import * as React from "react"

import { cn } from "@/lib/utils"
import { useFormField } from "./form"
import { Button } from "./button"
import { EyeIcon, EyeOffIcon } from "lucide-react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const FormInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const { error, formItemId } = useFormField()
    const [showPassword, setShowPassword] = React.useState(false)

    const asd = <Input
      type={showPassword ? 'text' : type}
      maxLength={type === 'password' ? 16 : undefined}
      className={cn(
        `flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 ${error ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring"} disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,
        className
      )}
      ref={ref}
      {...props}
    />

    if (type === 'password') {
      return (
        <div className="relative">
          {asd}
          <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
          </button>
        </div>
      )
    }

    return (
      asd
    )
  }
)
FormInput.displayName = "FormInput"

export { Input, FormInput }
