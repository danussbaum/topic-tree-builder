import { CalendarIcon } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const parseISODate = (value?: string) => {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return undefined;
  return parsed;
};

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Datum wählen",
  className,
  disabled,
  id,
}: DatePickerInputProps) {
  const selectedDate = parseISODate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between border-input bg-background px-3 text-left text-sm font-normal",
            "hover:bg-accent/30",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <input
            type="text"
            readOnly
            tabIndex={-1}
            value={selectedDate ? format(selectedDate, "dd.MM.yyyy", { locale: de }) : ""}
            placeholder={placeholder}
            className="pointer-events-none w-full bg-transparent p-0 outline-none"
            aria-hidden="true"
          />
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
          }}
          initialFocus
          locale={de}
        />
      </PopoverContent>
    </Popover>
  );
}
