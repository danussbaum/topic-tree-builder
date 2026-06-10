import { cn } from "@/lib/utils";
import type { DayPart } from "@/types/assessment";
import { DAY_PART_ORDER, DAY_PART_LABEL } from "@/types/assessment";
import { Sunrise, Utensils, Sun, Sunset, Moon } from "lucide-react";

const DAY_PART_ICONS: Record<DayPart, typeof Sunrise> = {
  morning: Sunrise,
  noon: Utensils,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const ALL_DAY_PARTS = DAY_PART_ORDER.filter((p): p is DayPart => p !== "none");

export interface DayPartEntry {
  dayPart: DayPart;
  scheduledTime?: string;
}

interface DayPartChipSelectorProps {
  value: DayPartEntry[];
  onChange: (value: DayPartEntry[]) => void;
  disabled?: boolean;
}

export function DayPartChipSelector({ value, onChange, disabled }: DayPartChipSelectorProps) {
  const selectedDayParts = new Set(value.map((e) => e.dayPart));

  const toggleDayPart = (dayPart: DayPart) => {
    if (disabled) return;
    if (selectedDayParts.has(dayPart)) {
      if (value.length <= 1) return;
      onChange(value.filter((e) => e.dayPart !== dayPart));
    } else {
      const newEntries = [...value, { dayPart }];
      onChange(ALL_DAY_PARTS.filter((dp) => newEntries.some((e) => e.dayPart === dp))
        .map((dp) => newEntries.find((e) => e.dayPart === dp)!));
    }
  };

  const updateTime = (dayPart: DayPart, time: string) => {
    if (disabled) return;
    onChange(value.map((e) => e.dayPart === dayPart ? { ...e, scheduledTime: time || undefined } : e));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ALL_DAY_PARTS.map((dayPart) => {
          const Icon = DAY_PART_ICONS[dayPart];
          const isSelected = selectedDayParts.has(dayPart);
          return (
            <button
              key={dayPart}
              type="button"
              disabled={disabled || (isSelected && value.length <= 1)}
              onClick={() => toggleDayPart(dayPart)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-secondary/60",
                (disabled || (isSelected && value.length <= 1)) && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {DAY_PART_LABEL[dayPart]}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map(({ dayPart, scheduledTime }) => {
            const Icon = DAY_PART_ICONS[dayPart];
            return (
              <label key={dayPart} className="flex items-center gap-2 text-xs">
                <span className="inline-flex w-32 items-center gap-1 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {DAY_PART_LABEL[dayPart]}
                </span>
                <input
                  type="time"
                  disabled={disabled}
                  value={scheduledTime ?? ""}
                  onChange={(e) => updateTime(dayPart, e.target.value)}
                  className="h-7 w-28 rounded border border-border bg-background px-2 py-0.5 tabular-nums outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-muted-foreground/60">(optional)</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
