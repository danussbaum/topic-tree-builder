import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getDayParts, type DayPartDefinition } from "@/lib/day-parts";
import {
  newDayPartEntryId,
  sortDayPartEntries,
  type DayPartEntry,
} from "@/lib/day-part-entries";
import { Plus, X } from "lucide-react";

interface DayPartChipSelectorProps {
  value: DayPartEntry[];
  onChange: (value: DayPartEntry[]) => void;
  disabled?: boolean;
  dayParts?: DayPartDefinition[];
}

/**
 * Tageszeiten als Chips; ohne gewählte Tageszeit gilt "Ohne Zeitangabe". Pro
 * gewählter Tageszeit lassen sich optional eine oder mehrere Uhrzeiten erfassen —
 * jede Uhrzeit ist eine eigene Durchführung. Die Uhrzeit wird nicht gegen die
 * Tageszeit geprüft.
 */
export function DayPartChipSelector({
  value,
  onChange,
  disabled,
  dayParts = getDayParts(),
}: DayPartChipSelectorProps) {
  const timeInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFocus == null) return;
    timeInputRefs.current.get(pendingFocus)?.focus();
    setPendingFocus(null);
  }, [pendingFocus, value]);

  const entriesOf = (dayPartId: string) => value.filter((entry) => entry.dayPart === dayPartId);

  /**
   * Eine bestehende Durchführung ohne Zeitangabe wird beim Wählen der ersten
   * Tageszeit übernommen statt daneben stehen zu bleiben — und umgekehrt beim
   * Abwählen der letzten Tageszeit wieder zur Durchführung ohne Zeitangabe. Die
   * Eintrags-ID bleibt dabei erhalten und mit ihr die Bestätigungshistorie.
   */
  const toggleDayPart = (dayPartId: string) => {
    if (disabled) return;
    if (entriesOf(dayPartId).length > 0) {
      const remaining = value.filter((entry) => entry.dayPart !== dayPartId);
      const removed = value.find((entry) => entry.dayPart === dayPartId)!;
      onChange(remaining.length === 0 ? [{ id: removed.id }] : remaining);
      return;
    }
    const withoutDayPart = value.find((entry) => !entry.dayPart);
    if (withoutDayPart) {
      onChange(
        sortDayPartEntries(
          value.map((entry) => (entry === withoutDayPart ? { id: entry.id, dayPart: dayPartId } : entry)),
        ),
      );
      return;
    }
    onChange(sortDayPartEntries([...value, { id: newDayPartEntryId(), dayPart: dayPartId }]));
  };

  const addTime = (dayPartId: string) => {
    if (disabled) return;
    const id = newDayPartEntryId();
    onChange([...value, { id, dayPart: dayPartId }]);
    setPendingFocus(id);
  };

  const removeEntry = (id: string) => {
    if (disabled) return;
    onChange(value.filter((entry) => entry.id !== id));
  };

  const updateTime = (id: string, time: string) => {
    if (disabled) return;
    onChange(
      value.map((entry) =>
        entry.id === id ? { ...entry, scheduledTime: time || undefined } : entry,
      ),
    );
  };

  const selected = dayParts.filter((dayPart) => entriesOf(dayPart.id).length > 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {dayParts.map((dayPart) => {
          const isSelected = entriesOf(dayPart.id).length > 0;
          return (
            <button
              key={dayPart.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => toggleDayPart(dayPart.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-secondary/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {dayPart.title}
            </button>
          );
        })}
      </div>

      {selected.length === 0 ? (
        <p className="text-xs text-muted-foreground">Ohne Zeitangabe</p>
      ) : (
        <div className="space-y-1">
          {selected.map((dayPart) => {
            const entries = entriesOf(dayPart.id);
            return (
              <div key={dayPart.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground">{dayPart.title}</span>
                {entries.map((entry, index) => (
                  <span key={entry.id} className="inline-flex items-center gap-1">
                    <input
                      type="time"
                      ref={(node) => {
                        if (node) timeInputRefs.current.set(entry.id, node);
                        else timeInputRefs.current.delete(entry.id);
                      }}
                      disabled={disabled}
                      aria-label={`Uhrzeit ${dayPart.title} ${index + 1}`}
                      value={entry.scheduledTime ?? ""}
                      onChange={(event) => updateTime(entry.id, event.target.value)}
                      className="h-7 w-28 rounded border border-border bg-background px-2 py-0.5 tabular-nums outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {entries.length > 1 && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Uhrzeit ${dayPart.title} ${index + 1} entfernen`}
                        title="Diese Durchführung entfernen"
                        className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                ))}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => addTime(dayPart.id)}
                  aria-label={`Weitere Uhrzeit ${dayPart.title}`}
                  title="Handlung mehrmals in dieser Tageszeit durchführen"
                  className="inline-flex items-center gap-1 text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
