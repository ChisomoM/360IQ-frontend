import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Flat teal with the hover shimmer. No gradient fill, no glow. */
const primary = "btn-shimmer bg-signal text-on-signal hover:bg-signal-hover"
const secondary =
  "border border-line-strong bg-surface-1 text-text-primary hover:bg-surface-2"
const danger = "border border-risk bg-surface-1 text-risk hover:bg-risk-tint"

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-150 ease-spring active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:bg-surface-2 disabled:text-text-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: primary,
        primary,
        secondary,
        outline: secondary,
        soft: "bg-field text-text-primary hover:bg-field-hover",
        ghost: "bg-transparent text-text-primary hover:bg-surface-2",
        danger,
        destructive: danger,
        orange:
          "border border-caution bg-caution-tint text-caution hover:bg-surface-1",
        tenantPrimary:
          "btn-shimmer bg-primary text-primary-foreground hover:bg-primary-hover [&_svg]:text-primary-foreground disabled:[&_svg]:text-text-muted",
        tenantSecondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover [&_svg]:text-secondary-foreground disabled:[&_svg]:text-text-muted",
        link: "overflow-visible text-signal-text underline-offset-4 hover:underline disabled:bg-transparent",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-[15px]",
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
