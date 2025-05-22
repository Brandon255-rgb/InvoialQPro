import * as React from "react"

interface SimpleDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  minYear?: number
  maxYear?: number
  className?: string
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
  value,
  onChange,
  minYear = 2000,
  maxYear = new Date().getFullYear(),
  className
}) => {
  const [year, setYear] = React.useState(value.getFullYear())
  const [month, setMonth] = React.useState(value.getMonth())
  const [day, setDay] = React.useState(value.getDate())

  React.useEffect(() => {
    setYear(value.getFullYear())
    setMonth(value.getMonth())
    setDay(value.getDate())
  }, [value])

  React.useEffect(() => {
    // Clamp day if month/year changes
    const maxDay = daysInMonth(year, month)
    if (day > maxDay) {
      setDay(maxDay)
      onChange(new Date(year, month, maxDay))
    }
  }, [year, month])

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value)
    setYear(newYear)
    const maxDay = daysInMonth(newYear, month)
    const newDay = Math.min(day, maxDay)
    setDay(newDay)
    onChange(new Date(newYear, month, newDay))
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value)
    setMonth(newMonth)
    const maxDay = daysInMonth(year, newMonth)
    const newDay = Math.min(day, maxDay)
    setDay(newDay)
    onChange(new Date(year, newMonth, newDay))
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(e.target.value)
    setDay(newDay)
    onChange(new Date(year, month, newDay))
  }

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <select
        value={year}
        onChange={handleYearChange}
        className="bg-black text-white border border-orange-500 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={handleMonthChange}
        className="bg-black text-white border border-orange-500 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500"
      >
        {months.map((m, idx) => (
          <option key={m} value={idx}>{m}</option>
        ))}
      </select>
      <select
        value={day}
        onChange={handleDayChange}
        className="bg-black text-white border border-orange-500 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500"
      >
        {days.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  )
} 