import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"

interface WheelDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
  minYear?: number
  maxYear?: number
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

export function WheelDatePicker({
  value,
  onChange,
  className,
  minYear = 2000,
  maxYear = new Date().getFullYear() + 10
}: WheelDatePickerProps) {
  const [selectedMonth, setSelectedMonth] = React.useState(value.getMonth())
  const [selectedDay, setSelectedDay] = React.useState(value.getDate())
  const [selectedYear, setSelectedYear] = React.useState(value.getFullYear())

  // Sync local state to value prop
  React.useEffect(() => {
    setSelectedMonth(value.getMonth());
    setSelectedDay(value.getDate());
    setSelectedYear(value.getFullYear());
  }, [value])

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  )

  const days = Array.from(
    { length: daysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  )

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
    const newDate = new Date(selectedYear, month, Math.min(selectedDay, daysInMonth(selectedYear, month)))
    onChange(newDate)
  }

  const handleDayChange = (day: number) => {
    setSelectedDay(day)
    const newDate = new Date(selectedYear, selectedMonth, day)
    onChange(newDate)
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    const newDate = new Date(year, selectedMonth, Math.min(selectedDay, daysInMonth(year, selectedMonth)))
    onChange(newDate)
  }

  const handleUpClick = (type: 'month' | 'day' | 'year') => {
    switch (type) {
      case 'month':
        if (selectedMonth > 0) {
          handleMonthChange(selectedMonth - 1)
        }
        break
      case 'day':
        if (selectedDay > 1) {
          handleDayChange(selectedDay - 1)
        }
        break
      case 'year':
        const yearIndex = years.indexOf(selectedYear)
        if (yearIndex > 0) {
          handleYearChange(years[yearIndex - 1])
        }
        break
    }
  }

  const handleDownClick = (type: 'month' | 'day' | 'year') => {
    switch (type) {
      case 'month':
        if (selectedMonth < 11) {
          handleMonthChange(selectedMonth + 1)
        }
        break
      case 'day':
        if (selectedDay < daysInMonth(selectedYear, selectedMonth)) {
          handleDayChange(selectedDay + 1)
        }
        break
      case 'year':
        const yearIndex = years.indexOf(selectedYear)
        if (yearIndex < years.length - 1) {
          handleYearChange(years[yearIndex + 1])
        }
        break
    }
  }

  const Wheel = ({ items, value, onChange, onUpClick, onDownClick, className }: { 
    items: (string | number)[], 
    value: number, 
    onChange: (value: number) => void,
    onUpClick: () => void,
    onDownClick: () => void,
    className?: string 
  }) => {
    const itemHeight = 40
    const visibleItems = 3
    const wheelHeight = itemHeight * visibleItems

    return (
      <div 
        className={cn(
          "relative h-[120px] w-24 overflow-hidden bg-black border border-orange-500 rounded-lg",
          className
        )}
      >
        <button
          onClick={onUpClick}
          className="absolute top-0 left-0 right-0 h-[40px] flex items-center justify-center bg-black hover:bg-orange-500/20 z-10"
        >
          <ChevronUp className="h-4 w-4 text-orange-500" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[40px] w-full bg-orange-500/20 pointer-events-none" />
        </div>
        <div
          className="absolute inset-0 overflow-y-auto scrollbar-hide"
          style={{
            scrollSnapType: "y mandatory",
            scrollPaddingTop: itemHeight,
          }}
        >
          {items.map((item, index) => (
            <button
              key={item}
              className={cn(
                "w-full h-[40px] flex items-center justify-center text-white transition-colors",
                "hover:bg-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500",
                "scroll-snap-center",
                value === index && "text-orange-500 font-medium"
              )}
              onClick={() => onChange(index)}
              style={{ scrollSnapAlign: "center" }}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          onClick={onDownClick}
          className="absolute bottom-0 left-0 right-0 h-[40px] flex items-center justify-center bg-black hover:bg-orange-500/20 z-10"
        >
          <ChevronDown className="h-4 w-4 text-orange-500" />
        </button>
        <div className="absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </div>
    )
  }

  return (
    <div className={cn("flex gap-2 p-4 bg-black rounded-lg border border-orange-500", className)}>
      <div className="flex flex-col items-center">
        <Wheel
          items={months}
          value={selectedMonth}
          onChange={handleMonthChange}
          onUpClick={() => handleUpClick('month')}
          onDownClick={() => handleDownClick('month')}
        />
        <span className="text-xs text-orange-500 mt-1">Month</span>
      </div>

      <div className="flex flex-col items-center">
        <Wheel
          items={days}
          value={selectedDay - 1}
          onChange={(index) => handleDayChange(index + 1)}
          onUpClick={() => handleUpClick('day')}
          onDownClick={() => handleDownClick('day')}
        />
        <span className="text-xs text-orange-500 mt-1">Day</span>
      </div>

      <div className="flex flex-col items-center">
        <Wheel
          items={years}
          value={years.indexOf(selectedYear)}
          onChange={(index) => handleYearChange(years[index])}
          onUpClick={() => handleUpClick('year')}
          onDownClick={() => handleDownClick('year')}
        />
        <span className="text-xs text-orange-500 mt-1">Year</span>
      </div>
    </div>
  )
} 