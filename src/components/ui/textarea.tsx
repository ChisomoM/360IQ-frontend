import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-transparent bg-field px-3 py-2 text-base text-text-primary placeholder:text-text-muted transition-colors duration-150 ease-spring hover:bg-field-hover focus-visible:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus aria-[invalid=true]:ring-[1.5px] aria-[invalid=true]:ring-inset aria-[invalid=true]:ring-risk aria-[invalid=true]:focus-visible:ring-2 aria-[invalid=true]:focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-muted md:text-sm resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
