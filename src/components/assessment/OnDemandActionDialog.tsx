import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import type { ActionNode, TopicNode } from "@/types/assessment";
import { collectOnDemandCandidates } from "@/lib/on-demand-action";
import { previousDayDayPart, shiftISODate } from "@/lib/day-part-rollover";
import { getDayParts } from "@/lib/day-parts";
import { cn } from "@/lib/utils";

const formatDate = (isoDate: string) => isoDate.split("-").reverse().join(".");

export interface OnDemandActionSelection {
  topicId: string;
  targetId: string;
  action: ActionNode;
  date: string;
  /** Tageszeit-ID oder "none" — im Uhrzeit-Modus immer "none". */
  dayPart: string | "none";
  scheduledTime?: string;
}

/** Wert im Zeitangabe-Select, der den Uhrzeit-Modus wählt. */
const TIME_MODE_VALUE = "__time";

/**
 * Auswahl von im Plan hinterlegten Nach-Bedarf-Handlungen, die in der Umsetzung für
 * genau einen Tag zum Plan hinzugefügt werden. Es wird nichts neu erfasst — die Werte
 * (Dauer, Leistungsarten, Hilfsmittel) kommen aus dem Plan.
 */
export function OnDemandActionDialog({
  topics,
  date: initialDate,
  fixedDayPart,
  dateLocked = false,
  nightRollover = false,
  clientName,
  onClose,
  onConfirm,
}: {
  topics: TopicNode[];
  date: string;
  fixedDayPart?: string | "none";
  /** Aus dem (+)-Menü einer Tageszeit: Tag und Tageszeit sind durch den Kontext gesetzt. */
  dateLocked?: boolean;
  /**
   * Erfassung im Vortags-Abschnitt: `date` ist der Vortag, und die Uhrzeit muss im
   * Teil nach Mitternacht liegen — nur dann erscheint die Durchführung wieder dort.
   */
  nightRollover?: boolean;
  clientName?: string;
  onClose: () => void;
  onConfirm: (selection: OnDemandActionSelection) => void;
}) {
  const dayParts = getDayParts();
  /** Uhrzeit-Grenze des Vortags-Abschnitts: das "bis" der über-Mitternacht-Tageszeit. */
  const rolloverLimit = previousDayDayPart(dayParts)?.to;

  const [date, setDate] = useState(initialDate);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  // Strikte Trennung: entweder eine Tageszeit oder eine Uhrzeit, nie beides.
  const [dayPart, setDayPart] = useState<string | "none">(
    nightRollover ? "none" : fixedDayPart ?? "none",
  );
  const [useTime, setUseTime] = useState(nightRollover);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsPanelVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    setIsPanelVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isPanelVisible) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (asideRef.current && !asideRef.current.contains(t)) {
        if (t.closest?.("[data-radix-popper-content-wrapper],[data-radix-select-content],[data-radix-popover-content],[data-radix-portal]")) return;
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPanelVisible, handleClose]);

  const candidates = useMemo(() => collectOnDemandCandidates(topics, date), [topics, date]);
  const candidateById = useMemo(
    () => new Map(candidates.map((entry) => [entry.action.id, entry])),
    [candidates],
  );

  // Ein Datumswechsel kann den Gültigkeitszeitraum verlassen — dann fällt die Auswahl weg,
  // sonst entstünde eine Durchführung an einem Tag, an dem die Handlung nicht gilt.
  useEffect(() => {
    setSelectedActionId((prev) => (prev && !candidateById.has(prev) ? null : prev));
  }, [candidateById]);

  const selected = selectedActionId ? candidateById.get(selectedActionId) ?? null : null;

  const selectAction = (actionId: string) => {
    setSelectedActionId(actionId);
    const entry = candidateById.get(actionId);
    if (nightRollover) {
      // Im Vortags-Abschnitt nur übernehmen, was auch dorthin zurückrollt.
      const planned = entry?.action.scheduledTime ?? "";
      setScheduledTime(planned && rolloverLimit && planned < rolloverLimit ? planned : "");
      return;
    }
    if (!fixedDayPart || fixedDayPart === "none") {
      // Ohne Kontext-Tageszeit gibt die Handlung aus dem Plan die Vorbelegung vor.
      const plannedTime = entry?.action.scheduledTime ?? "";
      setUseTime(!!plannedTime);
      setScheduledTime(plannedTime);
      setDayPart(plannedTime ? "none" : entry?.action.dayPart ?? "none");
    }
  };

  // Ohne Uhrzeit im Teil nach Mitternacht landet die Durchführung in der Nacht des
  // gewählten Tages statt im Vortags-Abschnitt des Folgetages. Die Meldung erscheint
  // erst beim Bestätigen — vorher wäre sie ein Fehler, der noch nicht passiert ist.
  const nightTimeMissing =
    nightRollover && (!scheduledTime || !rolloverLimit || scheduledTime >= rolloverLimit);
  const [showNightTimeError, setShowNightTimeError] = useState(false);

  const submit = () => {
    if (!selected || !date) return;
    if (nightTimeMissing) {
      setShowNightTimeError(true);
      return;
    }
    onConfirm({
      topicId: selected.topicId,
      targetId: selected.targetId,
      action: selected.action,
      date,
      dayPart: useTime ? "none" : dayPart,
      scheduledTime: useTime ? scheduledTime || undefined : undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none overflow-hidden">
      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-label="Handlung nach Bedarf erstellen"
        className={cn(
          "pointer-events-auto flex h-dvh w-full max-w-xl flex-col bg-[#F5F5F6] transition-transform duration-300 ease-out",
          isPanelVisible ? "translate-x-0 shadow-2xl" : "translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
          <div>
            <h2 className="text-2xl font-light">Handlung nach Bedarf erstellen</h2>
            {clientName && <p className="text-sm opacity-80 mt-0.5">{clientName}</p>}
          </div>
          <button type="button" onClick={handleClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="on-demand-date">Datum</Label>
              {dateLocked ? (
                <div
                  id="on-demand-date"
                  className="flex h-10 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm tabular-nums"
                >
                  {nightRollover
                    ? `Nacht vom ${formatDate(date)} auf den ${formatDate(shiftISODate(date, 1))}`
                    : formatDate(date)}
                </div>
              ) : (
                <DatePickerInput
                  id="on-demand-date"
                  value={date}
                  onChange={(value) => setDate(value ?? "")}
                  className="bg-background"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Handlung</Label>
            {candidates.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
                Für dieses Datum ist keine Handlung mit der Wiederholung «Nach Bedarf» im Plan
                hinterlegt.
              </p>
            ) : (
              <Select value={selectedActionId ?? undefined} onValueChange={selectAction}>
                {/* Zweizeilig: dieselbe Handlung kann in mehreren Zielen geplant sein — der
                    Pfad Schwerpunkt › Ziel unterscheidet die Einträge. */}
                <SelectTrigger className="h-auto min-h-10 py-1.5 text-left bg-background" aria-label="Handlung">
                  <SelectValue placeholder="Wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((option) => (
                    <SelectItem key={option.action.id} value={option.action.id}>
                      <span className="flex flex-col">
                        {/* Erbt die Textfarbe des Eintrags: auf dem dunkelgrünen Hover
                            bleibt die Zeile damit lesbar. */}
                        <span className="text-xs opacity-70">
                          {option.topicTitle || "Ohne Schwerpunkt"} › {option.targetTitle || "Ohne Ziel"}
                        </span>
                        <span>
                          {option.action.title}
                          {option.action.plannedMinutes != null
                            ? ` (${option.action.plannedMinutes} Min)`
                            : ""}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Zeitangabe</Label>
              <Select
                value={useTime ? TIME_MODE_VALUE : dayPart}
                disabled={nightRollover || (!!fixedDayPart && fixedDayPart !== "none")}
                onValueChange={(value) => {
                  if (value === TIME_MODE_VALUE) {
                    setUseTime(true);
                    setDayPart("none");
                    return;
                  }
                  setUseTime(false);
                  setScheduledTime("");
                  setDayPart(value);
                }}
              >
                <SelectTrigger className="bg-background" aria-label="Zeitangabe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ohne Zeitangabe</SelectItem>
                  {dayParts.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title}
                    </SelectItem>
                  ))}
                  <SelectItem value={TIME_MODE_VALUE}>Uhrzeit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {useTime && (
              <div className="space-y-1.5">
                <Label htmlFor="on-demand-time">Uhrzeit</Label>
                <Input
                  id="on-demand-time"
                  type="time"
                  value={scheduledTime}
                  max={nightRollover ? rolloverLimit : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setScheduledTime(value);
                    if (value && rolloverLimit && value < rolloverLimit) setShowNightTimeError(false);
                  }}
                  className={cn("bg-background", showNightTimeError && "border-destructive")}
                />
                {showNightTimeError && (
                  <p className="text-xs text-destructive">
                    Zwingend zwischen 00:00 und {rolloverLimit} — sonst wird die Handlung nicht dem
                    Vortag zugeordnet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-background px-6 py-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button type="button" onClick={submit} disabled={!selected || !date}>
            Bestätigen
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
