import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[6px] border border-rule bg-paper-3 px-[0.875rem] py-[0.625rem] text-ink-2 placeholder:text-ink-4 transition-all duration-150 outline-none focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent-soft disabled:cursor-not-allowed disabled:bg-paper-2 disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger-soft md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
