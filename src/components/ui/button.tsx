import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-signal bg-[image:var(--gradient-button)] text-on-signal hover:brightness-110",
        destructive:
          "bg-surface-1 border border-risk text-risk hover:bg-risk-tint",
        outline:
          "border border-line-strong bg-surface-1 text-text-primary hover:bg-surface-2",
        secondary:
          "border border-line-strong bg-surface-1 text-text-primary hover:bg-surface-2",
        orange:
          "bg-caution-tint text-caution border border-caution hover:bg-caution-tint/70",
        tenantPrimary:
          "bg-primary text-primary-foreground hover:bg-primary/90 [&_svg]:text-primary-foreground",
        tenantSecondary:
          "bg-secondary text-secondary-foreground [&_svg]:text-secondary-foreground",
        ghost: "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        link: "text-signal-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
