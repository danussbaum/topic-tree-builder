import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { DayPart } from "@/types/assessment";
import { DAY_PART_ORDER, DAY_PART_LABEL } from "@/types/assessment";
import { rollsToNextDay } from "@/lib/day-part-rollover";
import {
  newDayPartEntryId,
  sortDayPartEntries,
  type DayPartEntry,
  type DayPartOrNone,
} from "@/lib/day-part-entries";
import { Sunrise, Utensils, Sun, Sunset, Moon, Minus, Plus, X } from "lucide-react";

const DAY_PART_ICONS: Record<DayPart, typeof Sunrise> = {
  morning: Sunrise,
  noon: Utensils,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const ALL_DAY_PARTS = DAY_PART_ORDER.filter((p): p is DayPart => p !== "none");

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
  /**
   * Eine neu angelegte Durchführung bekommt den Fokus, sobald ihr Feld gerendert
   * ist — so lässt sich die Uhrzeit direkt eintippen. Gemerkt wird die Position
   * (Tageszeit + Reihenfolge), nicht die Eintrags-ID: Der Vorlagen-Editor leitet
   * seine IDs aus dem gespeicherten String ab und vergibt sie beim Rendern neu.
   */
  const timeInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const focusKey = (dayPart: DayPartOrNone, index: number) => `${dayPart}#${index}`;

  useEffect(() => {
    if (!pendingFocus) return;
    timeInputRefs.current.get(pendingFocus)?.focus();
    setPendingFocus(null);
  }, [pendingFocus, value]);

  const toggleDayPart = (dayPart: DayPartOrNone) => {
    if (disabled) return;
    if (selectedDayParts.has(dayPart)) {
      onChange(value.filter((e) => e.dayPart !== dayPart));
    } else {
      onChange(sortDayPartEntries([...value, { id: newDayPartEntryId(), dayPart }]));
      if (dayPart !== "none") setPendingFocus(focusKey(dayPart, 0));
    }
  };

  const addTime = (dayPart: DayPartOrNone) => {
    if (disabled) return;
    const index = value.filter((e) => e.dayPart === dayPart).length;
    onChange([...value, { id: newDayPartEntryId(), dayPart }]);
    setPendingFocus(focusKey(dayPart, index));
  };

  const removeEntry = (id: string) => {
    if (disabled) return;
    onChange(value.filter((e) => e.id !== id));
  };

  const updateTime = (id: string, time: string) => {
    if (disabled) return;
    onChange(value.map((e) => (e.id === id ? { ...e, scheduledTime: time || undefined } : e)));
  };

  const timedDayParts = ALL_DAY_PARTS.filter((dp) => selectedDayParts.has(dp));

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

      {timedDayParts.length > 0 && (
        <div className="space-y-2">
          {timedDayParts.map((dayPart) => {
            const Icon = chipIcon(dayPart);
            const entries = value.filter((e) => e.dayPart === dayPart);
            return (
              <div key={dayPart} className="space-y-1">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex w-32 items-center gap-1 text-muted-foreground">
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", index > 0 && "opacity-0")} />
                      {index === 0 ? chipLabel(dayPart) : ""}
                    </span>
                    <input
                      type="time"
                      ref={(node) => {
                        const key = focusKey(dayPart, index);
                        if (node) timeInputRefs.current.set(key, node);
                        else timeInputRefs.current.delete(key);
                      }}
                      disabled={disabled}
                      aria-label={`Uhrzeit ${chipLabel(dayPart)} ${index + 1}`}
                      value={entry.scheduledTime ?? ""}
                      onChange={(e) => updateTime(entry.id, e.target.value)}
                      className="h-7 w-28 rounded border border-border bg-background px-2 py-0.5 tabular-nums outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {rollsToNextDay({ dayPart, scheduledTime: entry.scheduledTime })
                      ? <span className="text-muted-foreground">(+1 Tag)</span>
                      : index === 0 && entries.length === 1
                        ? <span className="text-muted-foreground/60">(optional)</span>
                        : null}
                    {entries.length > 1 && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Uhrzeit ${chipLabel(dayPart)} ${index + 1} entfernen`}
                        title="Diese Durchführung entfernen"
                        className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => addTime(dayPart)}
                  aria-label={`Weitere Uhrzeit ${chipLabel(dayPart)}`}
                  title="Handlung mehrmals in dieser Tageszeit durchführen"
                  className="ml-32 inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Uhrzeit
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
