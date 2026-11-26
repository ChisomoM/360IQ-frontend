import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Filled and borderless. The transparent border only gives caller error colours somewhere to show.
          "flex h-10 w-full rounded-md border border-transparent bg-field px-3 py-2 text-base text-text-primary file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-muted transition-colors duration-150 ease-spring hover:bg-field-hover focus-visible:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus aria-[invalid=true]:ring-[1.5px] aria-[invalid=true]:ring-inset aria-[invalid=true]:ring-risk aria-[invalid=true]:focus-visible:ring-2 aria-[invalid=true]:focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-muted md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
