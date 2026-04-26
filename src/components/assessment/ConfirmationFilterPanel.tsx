import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type ConfirmationPeriod = "day" | "week" | "month";

export interface ConfirmationFilters {
  selectedDate: string;
  confirmationPeriod: ConfirmationPeriod;
  showConfirmed: boolean;
}

interface ConfirmationFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilters: ConfirmationFilters;
  onApply: (filters: ConfirmationFilters) => void;
}

const dateToISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStartDate = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

const getWeekValue = (selectedDate: string) => {
  const date = new Date(`${selectedDate}T00:00:00`);
  const start = getWeekStartDate(date);
  const thursday = new Date(start);
  thursday.setDate(start.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstThursdayWeekStart = getWeekStartDate(firstThursday);
  const diffInDays = Math.round(
    (thursday.getTime() - firstThursdayWeekStart.getTime()) / 86400000,
  );
  const week = Math.floor(diffInDays / 7) + 1;
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

const weekValueToDate = (weekValue: string) => {
  const [yearPart, weekPart] = weekValue.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (!year || !week) return dateToISO(new Date());

  const jan4 = new Date(year, 0, 4);
  const weekStart = getWeekStartDate(jan4);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  return dateToISO(weekStart);
};

export const ConfirmationFilterPanel = ({
  open,
  onOpenChange,
  initialFilters,
  onApply,
}: ConfirmationFilterPanelProps) => {
  const [draft, setDraft] = useState<ConfirmationFilters>(initialFilters);

  useEffect(() => {
    if (!open) return;
    setDraft(initialFilters);
  }, [open, initialFilters]);

  const handleCancel = () => {
    setDraft(initialFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft(initialFilters);
  };

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Filter</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="confirmation-period">Zeitraum</Label>
            <select
              id="confirmation-period"
              value={draft.confirmationPeriod}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  confirmationPeriod: e.target.value as ConfirmationPeriod,
                }))
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="day">Tag</option>
              <option value="week">Woche</option>
              <option value="month">Monat</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-date">Datum</Label>
            {draft.confirmationPeriod === "day" && (
              <input
                id="confirmation-date"
                type="date"
                value={draft.selectedDate}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedDate: e.target.value,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            )}
            {draft.confirmationPeriod === "week" && (
              <input
                id="confirmation-date"
                type="week"
                value={getWeekValue(draft.selectedDate)}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedDate: weekValueToDate(e.target.value),
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            )}
            {draft.confirmationPeriod === "month" && (
              <input
                id="confirmation-date"
                type="month"
                value={draft.selectedDate.slice(0, 7)}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedDate: `${e.target.value}-01`,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={draft.showConfirmed}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, showConfirmed: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Bestätigte anzeigen
          </label>
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Zurücksetzen
          </Button>
          <Button onClick={handleApply}>Anwenden</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
