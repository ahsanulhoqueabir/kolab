"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/core/ui/button";
import { Calendar } from "@/components/core/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/core/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  yearRange?: { from: number; to: number };
  /** When true, only today and future dates are selectable (past dates are blocked). */
  disablePastDates?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  id,
  yearRange = { from: 1900, to: new Date().getFullYear() + 10 },
  disablePastDates = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    date || new Date(),
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setIsOpen(false);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(displayMonth);
    newMonth.setFullYear(parseInt(year));
    setDisplayMonth(newMonth);
  };

  const handleMonthChange = (month: string) => {
    const newMonth = new Date(displayMonth);
    newMonth.setMonth(parseInt(month));
    setDisplayMonth(newMonth);
  };

  const years = React.useMemo(() => {
    const yearArray = [];
    for (let year = yearRange.to; year >= yearRange.from; year--) {
      yearArray.push(year);
    }
    return yearArray;
  }, [yearRange]);

  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex gap-2">
            <Select
              value={displayMonth.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={displayMonth.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          disabled={(date: Date) => {
            if (disablePastDates) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }
            return (
              date > new Date() || date < new Date(`${yearRange.from}-01-01`)
            );
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
