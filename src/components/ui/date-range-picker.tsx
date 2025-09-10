import * as React from "react"
import { addDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  fullWidth?: boolean
}

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = "Sélectionner une période",
  className,
  buttonClassName,
  fullWidth = false
}: DateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)

  React.useEffect(() => {
    setInternalDate(date)
  }, [date])

  const handleDateChange = (newDate: DateRange | undefined) => {
    setInternalDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              fullWidth ? "w-full" : "w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]",
              !internalDate && "text-muted-foreground",
              buttonClassName
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "dd MMM y", { locale: fr })} -{" "}
                  {format(internalDate.to, "dd MMM y", { locale: fr })}
                </>
              ) : (
                format(internalDate.from, "dd MMM y", { locale: fr })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
          <div className="p-3 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const weekAgo = addDays(today, -7)
                  handleDateChange({ from: weekAgo, to: today })
                }}
              >
                7 derniers jours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const monthAgo = addDays(today, -30)
                  handleDateChange({ from: monthAgo, to: today })
                }}
              >
                30 derniers jours
              </Button>
            </div>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleDateChange(undefined)}
              >
                Effacer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}