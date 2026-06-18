import { cn } from "@/lib/utils";
import type { DayPart } from "@/types/assessment";
import { DAY_PART_ORDER, DAY_PART_LABEL } from "@/types/assessment";
import { Sunrise, Utensils, Sun, Sunset, Moon, Minus } from "lucide-react";

const DAY_PART_ICONS: Record<DayPart, typeof Sunrise> = {
  morning: Sunrise,
  noon: Utensils,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const ALL_DAY_PARTS = DAY_PART_ORDER.filter((p): p is DayPart => p !== "none");

export type DayPartOrNone = DayPart | "none";

export interface DayPartEntry {
  dayPart: DayPartOrNone;
  scheduledTime?: string;
}

const ALL_CHIPS: DayPartOrNone[] = ["none", ...ALL_DAY_PARTS];

function chipLabel(dayPart: DayPartOrNone): string {
  return dayPart === "none" ? "ohne" : DAY_PART_LABEL[dayPart];
}

function chipIcon(dayPart: DayPartOrNone) {
  return dayPart === "none" ? Minus : DAY_PART_ICONS[dayPart];
}

interface DayPartChipSelectorProps {
  value: DayPartEntry[];
  onChange: (value: DayPartEntry[]) => void;
  disabled?: boolean;
}

export function DayPartChipSelector({ value, onChange, disabled }: DayPartChipSelectorProps) {
  const selectedDayParts = new Set(value.map((e) => e.dayPart));

  const toggleDayPart = (dayPart: DayPartOrNone) => {
    if (disabled) return;
    if (selectedDayParts.has(dayPart)) {
      onChange(value.filter((e) => e.dayPart !== dayPart));
    } else {
      const newEntries = [...value, { dayPart }];
      // Maintain canonical order
      onChange(ALL_CHIPS.filter((dp) => newEntries.some((e) => e.dayPart === dp))
        .map((dp) => newEntries.find((e) => e.dayPart === dp)!));
    }
  };

  const updateTime = (dayPart: DayPartOrNone, time: string) => {
    if (disabled) return;
    onChange(value.map((e) => e.dayPart === dayPart ? { ...e, scheduledTime: time || undefined } : e));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ALL_CHIPS.map((dayPart) => {
          const Icon = chipIcon(dayPart);
          const isSelected = selectedDayParts.has(dayPart);
          return (
            <button
              key={dayPart}
              type="button"
              disabled={disabled}
              onClick={() => toggleDayPart(dayPart)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-secondary/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {chipLabel(dayPart)}
            </button>
          );
        })}
      </div>

      {value.filter((e) => e.dayPart !== "none").length > 0 && (
        <div className="space-y-1.5">
          {value.filter((e) => e.dayPart !== "none").map(({ dayPart, scheduledTime }) => {
            const Icon = chipIcon(dayPart);
            return (
              <label key={dayPart} className="flex items-center gap-2 text-xs">
                <span className="inline-flex w-32 items-center gap-1 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {chipLabel(dayPart)}
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
