"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePicker({
  date,
  setDate,
  placeholder = "dd/mm/aaaa",
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState<string>("");

  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
    if (!isNaN(parsedDate.getTime())) {
      setDate(parsedDate);
    } else {
      // If parsing fails, revert to the original date or clear it
      setDate(date);
      setInputValue(date ? format(date, "dd/MM/yyyy") : "");
    }
  };
  
  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setInputValue(format(selectedDate, "dd/MM/yyyy"));
    }
  }

  return (
    <div className="relative w-[280px]">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="pr-10" // Add padding to the right for the icon
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"ghost"}
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            aria-label="Abrir calendário"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}