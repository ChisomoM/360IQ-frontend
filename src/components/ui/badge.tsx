import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-ch-primary-600 text-white hover:bg-ch-primary-700 shadow-xs",
        secondary:
          "border-transparent bg-ch-secondary-600 text-white hover:bg-ch-secondary-700 shadow-xs",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700 shadow-xs",
        outline: "border-gray-300 text-gray-700 hover:bg-gray-50",
        subtle: "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
        ghost: "border-transparent text-ch-primary-600 hover:bg-gray-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
