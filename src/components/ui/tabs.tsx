"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

/** Mirrors the selected value so the matching trigger can draw the sliding pill. */
const TabsContext = React.createContext<{
  selected?: string
  layoutId: string
} | null>(null)

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ value, defaultValue, onValueChange, ...props }, ref) => {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const selected = value ?? uncontrolled
  const id = React.useId()
  const context = React.useMemo(
    () => ({ selected, layoutId: `tabs-pill-${id}` }),
    [selected, id]
  )

  return (
    <TabsContext.Provider value={context}>
      <TabsPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => {
          setUncontrolled(next)
          onValueChange?.(next)
        }}
        {...props}
      />
    </TabsContext.Provider>
  )
})
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-start gap-0.5 rounded-lg bg-field p-1 text-text-secondary",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, value, asChild, ...props }, ref) => {
  const tabs = React.useContext(TabsContext)
  const reduceMotion = useReducedMotion()
  const isSelected = tabs?.selected === value

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      asChild={asChild}
      className={cn(
        // `isolate` keeps the pill behind the label but above the track.
        "relative isolate inline-flex h-[2.43rem] items-center justify-center gap-2 whitespace-nowrap rounded-inner px-3.5 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:text-text-muted data-[state=active]:font-semibold data-[state=active]:text-text-primary",
        // A slotted child takes no extra nodes, so it gets a static pill instead.
        asChild && "data-[state=active]:bg-surface-1 data-[state=active]:shadow-raised",
        className
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {isSelected && tabs && (
            <motion.span
              aria-hidden="true"
              layoutId={reduceMotion ? undefined : tabs.layoutId}
              layoutDependency={tabs.selected}
              className="pointer-events-none absolute inset-0 -z-10 rounded-inner bg-surface-1 shadow-raised dark:bg-line"
              style={{ borderRadius: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          {children}
        </>
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
