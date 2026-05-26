import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[6px] border border-rule bg-paper-3 px-[0.875rem] py-[0.625rem] text-ink-2 placeholder:text-ink-4 transition-all duration-150 outline-none focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent-soft disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-paper-2 disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger-soft md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
