import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("fixed p-3 bg-black rounded-md border border-orange-500 shadow-lg ring-1 ring-orange-500 z-[100]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-black text-white border-orange-500 p-0 opacity-50 hover:opacity-100 hover:bg-orange-500 hover:text-white focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-orange-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-orange-500/50 [&:has([aria-selected])]:bg-orange-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-white hover:bg-orange-500 hover:text-white aria-selected:opacity-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-500 focus:text-white focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        day_today: "bg-orange-500/20 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        day_outside:
          "day-outside text-gray-500 opacity-50 aria-selected:bg-orange-500/50 aria-selected:text-white aria-selected:opacity-30",
        day_disabled: "text-gray-500 opacity-50",
        day_range_middle:
          "aria-selected:bg-orange-500/50 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 text-white" />,
        PrevButton: () => <ChevronLeft className="h-4 w-4 text-white" />,
        NextButton: () => <ChevronRight className="h-4 w-4 text-white" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
