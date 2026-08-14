import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getDayParts, resolveDayPart, type DayPartDefinition } from "@/lib/day-parts";
import { rollsToNextDay } from "@/lib/day-part-rollover";
import {
  newDayPartEntryId,
  scheduleModeOf,
  sortDayPartEntries,
  type DayPartEntry,
  type ScheduleMode,
} from "@/lib/day-part-entries";
import { Clock, Minus, Plus, Sun, X } from "lucide-react";

const MODE_OPTIONS: Array<{ value: ScheduleMode; label: string; icon: typeof Sun }> = [
  { value: "none", label: "Ohne Zeitangabe", icon: Minus },
  { value: "dayParts", label: "Tageszeiten", icon: Sun },
  { value: "times", label: "Uhrzeiten", icon: Clock },
];

const MODE_LABEL = (mode: ScheduleMode) =>
  MODE_OPTIONS.find((option) => option.value === mode)!.label;

interface DayPartChipSelectorProps {
  value: DayPartEntry[];
  onChange: (value: DayPartEntry[]) => void;
  disabled?: boolean;
  dayParts?: DayPartDefinition[];
}

export function DayPartChipSelector({
  value,
  onChange,
  disabled,
  dayParts = getDayParts(),
}: DayPartChipSelectorProps) {
  const entriesMode = scheduleModeOf(value);
  /**
   * Der Modus ist nicht gespeichert, sondern folgt aus den Einträgen. Solange im
   * gewählten Modus noch nichts erfasst ist, lässt sich das aber nicht ableiten —
   * darum wird er zusätzlich lokal gehalten.
   */
  const [mode, setMode] = useState<ScheduleMode>(entriesMode);
  const [pendingMode, setPendingMode] = useState<ScheduleMode | null>(null);

  useEffect(() => {
    if (entriesMode !== "none") setMode(entriesMode);
  }, [entriesMode]);

  const timeInputRefs = useRef(new Map<number, HTMLInputElement>());
  const [pendingFocus, setPendingFocus] = useState<number | null>(null);

  useEffect(() => {
    if (pendingFocus == null) return;
    timeInputRefs.current.get(pendingFocus)?.focus();
    setPendingFocus(null);
  }, [pendingFocus, value]);

  const applyMode = (next: ScheduleMode) => {
    setMode(next);
    setPendingMode(null);
    if (next === "none") {
      onChange([]);
      return;
    }
    if (next === "times") {
      onChange([{ id: newDayPartEntryId() }]);
      setPendingFocus(0);
      return;
    }
    onChange([]);
  };

  const selectMode = (next: ScheduleMode) => {
    if (disabled || next === mode) return;
    // Ein Moduswechsel verwirft die Einträge des anderen Modus — nur nachfragen,
    // wenn tatsächlich etwas verloren geht.
    if (value.length > 0) setPendingMode(next);
    else applyMode(next);
  };

  const selectedDayPartIds = new Set(
    value.map((entry) => entry.dayPart).filter((id): id is string => !!id),
  );

  const toggleDayPart = (dayPartId: string) => {
    if (disabled) return;
    if (selectedDayPartIds.has(dayPartId)) {
      onChange(value.filter((entry) => entry.dayPart !== dayPartId));
    } else {
      onChange(
        sortDayPartEntries([...value, { id: newDayPartEntryId(), dayPart: dayPartId }], dayParts),
      );
    }
  };

  const times = value.filter((entry) => !entry.dayPart);

  const addTime = () => {
    if (disabled) return;
    onChange([...value, { id: newDayPartEntryId() }]);
    setPendingFocus(times.length);
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = option.value === mode;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => selectMode(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-secondary/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>

      {mode === "dayParts" && (
        <div className="flex flex-wrap gap-2">
          {dayParts.map((dayPart) => {
            const isSelected = selectedDayPartIds.has(dayPart.id);
            return (
              <button
                key={dayPart.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => toggleDayPart(dayPart.id)}
                title={`${dayPart.from} – ${dayPart.to}`}
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
      )}

      {mode === "times" && (
        <div className="space-y-1">
          {times.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-2 text-xs">
              <input
                type="time"
                ref={(node) => {
                  if (node) timeInputRefs.current.set(index, node);
                  else timeInputRefs.current.delete(index);
                }}
                disabled={disabled}
                aria-label={`Uhrzeit ${index + 1}`}
                value={entry.scheduledTime ?? ""}
                onChange={(event) => updateTime(entry.id, event.target.value)}
                className="h-7 w-28 rounded border border-border bg-background px-2 py-0.5 tabular-nums outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
              {entry.scheduledTime && (
                <>
                  <span className="text-muted-foreground">
                    {resolveDayPart(entry.scheduledTime, dayParts)?.title}
                  </span>
                  {rollsToNextDay(entry, dayParts) && (
                    <span className="text-muted-foreground">(+1 Tag)</span>
                  )}
                </>
              )}
              {times.length > 1 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeEntry(entry.id)}
                  aria-label={`Uhrzeit ${index + 1} entfernen`}
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
            onClick={addTime}
            aria-label="Weitere Uhrzeit"
            title="Handlung mehrmals pro Tag durchführen"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            Uhrzeit
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingMode !== null}
        title="Zeitangabe wechseln"
        message={`Beim Wechsel auf "${pendingMode ? MODE_LABEL(pendingMode) : ""}" werden die erfassten Angaben unter "${MODE_LABEL(mode)}" verworfen.`}
        confirmLabel="Wechseln"
        onConfirm={() => pendingMode && applyMode(pendingMode)}
        onCancel={() => setPendingMode(null)}
      />
    </div>
  );
}
