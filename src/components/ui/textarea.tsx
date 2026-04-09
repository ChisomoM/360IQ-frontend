import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-base ring-offset-background placeholder:text-gray-500 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ch-primary-600 focus-visible:ring-offset-1 focus-visible:border-ch-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 md:text-sm resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
