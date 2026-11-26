import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const navButton = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "pointer-events-auto h-8 w-8 rounded-sm p-0 text-text-secondary aria-disabled:opacity-40"
)

/** Class names use the react-day-picker v9 keys. Selection state sits on the cell, so it styles the button inside. */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 text-text-primary", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "space-y-3",
        month_caption: "flex h-8 items-center justify-center px-9",
        caption_label: "inline-flex items-center gap-1 text-sm font-semibold",
        dropdowns: "flex items-center gap-2",
        dropdown_root: "relative inline-flex h-8 items-center rounded-sm bg-field px-2 hover:bg-field-hover",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        chevron: "h-4 w-4 fill-current",
        month_grid: "border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-xs font-medium text-text-muted",
        week: "mt-1 flex w-full",
        week_number: "flex h-9 w-9 items-center justify-center text-xs text-text-muted",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-inner transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus",
        selected:
          "[&>button]:bg-signal [&>button]:font-semibold [&>button]:text-on-signal [&>button:hover]:bg-signal-hover",
        range_start: "",
        range_end: "",
        range_middle:
          "[&>button]:!bg-signal-tint [&>button]:!text-signal-text",
        today: "[&:not([data-selected])>button]:bg-surface-2 [&>button]:font-semibold",
        outside: "[&:not([data-selected])>button]:text-text-muted",
        disabled: "[&>button]:pointer-events-none [&>button]:text-text-muted [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
