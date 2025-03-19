"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    (<DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex justify-center",
        head_cell: cn(
          "text-muted-foreground rounded-md w-11 font-normal text-[0.8rem]",
          "flex items-center justify-center p-1"
        ),
        row: cn(
          "flex w-full mt-2 justify-center",
          "items-center"
        ),
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
          "flex items-center justify-center h-full w-11"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-11 p-0 font-medium aria-selected:opacity-100 text-base",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "transition-colors duration-200",
          "text-gray-900 dark:text-gray-100",
          "flex items-center justify-center"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected: cn(
          "bg-blue-600 text-white",
          "hover:bg-blue-700 hover:text-white",
          "focus:bg-blue-600 focus:text-white",
          "dark:bg-blue-700 dark:hover:bg-blue-600",
          "shadow-sm"
        ),
        day_today: cn(
          "bg-blue-50 dark:bg-blue-900/20",
          "text-blue-700 dark:text-blue-300",
          "border border-blue-300 dark:border-blue-700",
          "font-semibold"
        ),
        day_outside: cn(
          "text-gray-400 dark:text-gray-500",
          "aria-selected:text-gray-400 dark:aria-selected:text-gray-500"
        ),
        day_disabled: cn(
          "text-gray-300 dark:text-gray-600",
          "opacity-50"
        ),
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props} />)
  );
}

export { Calendar }