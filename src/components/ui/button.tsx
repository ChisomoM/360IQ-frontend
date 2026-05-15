import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ch-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ch-primary-600 text-white shadow-md hover:shadow-lg active:shadow-sm active:translate-y-0.5 hover:bg-ch-primary-700 disabled:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg active:shadow-sm active:translate-y-0.5",
        outline:
          "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-xs hover:shadow-sm",
        secondary:
          "bg-ch-secondary-600 text-white shadow-sm hover:shadow-md active:shadow-xs hover:bg-ch-secondary-700",
        orange:
          "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg active:shadow-sm active:translate-y-0.5",
        tenantPrimary:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg active:shadow-sm active:translate-y-0.5 hover:bg-primary/90 [&_svg]:text-primary-foreground",
        tenantSecondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md active:shadow-xs [&_svg]:text-secondary-foreground",
        ghost: "hover:bg-ch-primary-50 hover:text-ch-primary-900 transition-colors",
        link: "text-ch-primary-600 underline-offset-4 hover:underline transition-colors",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 px-3 py-1.5 text-xs rounded-lg",
        lg: "h-12 px-8 py-3 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-lg",
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
