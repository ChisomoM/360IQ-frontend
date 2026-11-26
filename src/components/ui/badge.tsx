import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 h-[22px] whitespace-nowrap rounded-pill border px-2.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-signal-tint text-signal-text",
        signal: "border-transparent bg-signal-tint text-signal-text",
        secondary: "border-transparent bg-positive-tint text-positive",
        positive: "border-transparent bg-positive-tint text-positive",
        destructive: "border-transparent bg-risk-tint text-risk",
        risk: "border-transparent bg-risk-tint text-risk",
        caution: "border-transparent bg-caution-tint text-caution",
        neutral: "border-transparent bg-surface-2 text-text-secondary",
        outline: "border-line-strong text-text-secondary",
        subtle: "border-transparent bg-surface-2 text-text-secondary",
        ghost: "border-transparent text-signal-text hover:bg-surface-2",
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
