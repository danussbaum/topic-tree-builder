import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyDayPartRenamesToTemplates,
  getAllDayPartUsage,
  invalidateDayPartsCache,
  loadDayParts,
  newDayPartId,
  saveDayParts,
  spansMidnight,
  validateDayParts,
  type DayPartDefinition,
  type DayPartUsage,
} from "@/lib/day-parts";

export interface ActionPlanDayPartsHandle {
  openCreate: () => void;
}

interface ActionPlanDayPartsViewProps {
  searchQuery: string;
}

const usageLabel = (usage?: DayPartUsage): string | null => {
  if (!usage) return null;
  const parts: string[] = [];
  if (usage.templateNames.length > 0) {
    parts.push(`Handlungsarten: ${usage.templateNames.join(", ")}`);
  }
  if (usage.actionTitles.length > 0) {
    parts.push(`Handlungen: ${usage.actionTitles.join(", ")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
};

/**
 * Tageszeiten als Stammdaten. Anders als die übrigen Stammdaten-Ansichten wird hier
 * die ganze Liste als Entwurf bearbeitet und in einer Transaktion gespeichert: Die
 * Konfiguration muss den Tag überlappungsfrei und lückenlos abdecken, was sich beim
 * Anlegen, Ändern und Löschen nur gemeinsam prüfen lässt.
 */
export const ActionPlanDayPartsView = forwardRef<
  ActionPlanDayPartsHandle,
  ActionPlanDayPartsViewProps
>(({ searchQuery }, ref) => {
  const [saved, setSaved] = useState<DayPartDefinition[]>(() => loadDayParts());
  const [draft, setDraft] = useState<DayPartDefinition[]>(() => loadDayParts());
  const [showErrors, setShowErrors] = useState(false);
  const [savedHint, setSavedHint] = useState(false);

  // Der Löschschutz wird vorgezogen angezeigt, damit gar nicht erst ein Entwurf
  // entsteht, der beim Speichern scheitert. Nach dem Speichern neu erhoben, weil
  // umbenannte Tageszeiten die Vorlagen-Zuordnung über den Titel verändern.
  const [usage, setUsage] = useState(() => getAllDayPartUsage());

  const errors = useMemo(() => validateDayParts(draft), [draft]);
  const errorFor = (id: string, field: "title" | "from" | "to") =>
    errors.find((error) => error.dayPartId === id && error.field === field);
  const listErrors = errors.filter((error) => !error.dayPartId);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("de");
    if (!query) return draft;
    return draft.filter((entry) => entry.title.toLocaleLowerCase("de").includes(query));
  }, [draft, searchQuery]);

  const update = (id: string, patch: Partial<DayPartDefinition>) => {
    setSavedHint(false);
    setDraft((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const addDayPart = () => {
    setSavedHint(false);
    // Die neue Tageszeit schliesst an die letzte an — so bleibt die Kette meist gültig
    // und es muss nur noch das Ende angepasst werden.
    const last = draft[draft.length - 1];
    setDraft((prev) => [
      ...prev,
      { id: newDayPartId(), title: "", from: last?.to ?? "00:00", to: last?.to ?? "00:00" },
    ]);
  };

  const removeDayPart = (id: string) => {
    setSavedHint(false);
    setDraft((prev) => prev.filter((entry) => entry.id !== id));
  };

  const save = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    // Absicherung: die Verwendung kann sich in einem anderen Tab geändert haben.
    const removed = saved.filter((entry) => !draft.some((item) => item.id === entry.id));
    const blocked = removed.filter((entry) => usageLabel(usage.get(entry.id)));
    if (blocked.length > 0) {
      setShowErrors(true);
      return;
    }
    // Vorlagen referenzieren die Tageszeit über den Titel — Umbenennungen ziehen sie mit.
    const renames = draft
      .map((entry) => {
        const before = saved.find((item) => item.id === entry.id);
        return before && before.title !== entry.title
          ? { from: before.title, to: entry.title }
          : null;
      })
      .filter((rename): rename is { from: string; to: string } => rename !== null);
    applyDayPartRenamesToTemplates(renames);

    saveDayParts(draft);
    invalidateDayPartsCache();
    const stored = loadDayParts();
    setSaved(stored);
    setDraft(stored);
    setUsage(getAllDayPartUsage());
    setShowErrors(false);
    setSavedHint(true);
  };

  const discard = () => {
    setDraft(saved);
    setShowErrors(false);
    setSavedHint(false);
  };

  useImperativeHandle(ref, () => ({ openCreate: addDayPart }));

  return (
    <>
      <section className="overflow-hidden border-y border-border/80 bg-background">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Titel</th>
              <th className="w-32 px-4 py-2 text-left text-xs font-semibold text-foreground">Von</th>
              <th className="w-32 px-4 py-2 text-left text-xs font-semibold text-foreground">Bis</th>
              <th className="w-64 px-4 py-2 text-left text-xs font-semibold text-foreground">
                Verwendung
              </th>
              <th className="w-16 px-4 py-2" />
            </tr>
          </thead>
          <tbody className="bg-background">
            {visible.map((entry) => {
              const used = usageLabel(usage.get(entry.id));
              return (
                <tr key={entry.id} className="border-b border-border/80 even:bg-[#f7f7f9]">
                  <td className="px-4 py-2">
                    <Input
                      aria-label={`Titel ${entry.title || "neue Tageszeit"}`}
                      value={entry.title}
                      onChange={(event) => update(entry.id, { title: event.target.value })}
                      className={cn(
                        "h-8",
                        showErrors && errorFor(entry.id, "title") && "border-destructive",
                      )}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="time"
                      aria-label={`Von ${entry.title || "neue Tageszeit"}`}
                      value={entry.from}
                      onChange={(event) => update(entry.id, { from: event.target.value })}
                      className={cn(
                        "h-8 tabular-nums",
                        showErrors && errorFor(entry.id, "from") && "border-destructive",
                      )}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="time"
                      aria-label={`Bis ${entry.title || "neue Tageszeit"}`}
                      value={entry.to}
                      onChange={(event) => update(entry.id, { to: event.target.value })}
                      className={cn(
                        "h-8 tabular-nums",
                        showErrors && errorFor(entry.id, "to") && "border-destructive",
                      )}
                    />
                    {spansMidnight(entry) && (
                      <span className="text-[11px] text-muted-foreground">über Mitternacht</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-muted-foreground">
                    {used ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      disabled={!!used}
                      onClick={() => removeDayPart(entry.id)}
                      aria-label={`Tageszeit ${entry.title || "ohne Titel"} löschen`}
                      title={
                        used
                          ? `In Verwendung — ${used}`
                          : "Tageszeit löschen (die Lücke muss vor dem Speichern geschlossen werden)"
                      }
                      className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="space-y-2 px-4 py-3">
        <Button type="button" variant="outline" size="sm" onClick={addDayPart}>
          Tageszeit hinzufügen
        </Button>

        {showErrors && errors.length > 0 && (
          <ul className="space-y-1 text-xs text-destructive">
            {[...listErrors, ...errors.filter((error) => error.dayPartId)].map((error, index) => (
              <li key={`${error.dayPartId ?? "list"}-${index}`}>{error.message}</li>
            ))}
          </ul>
        )}
        {!showErrors && errors.length > 0 && isDirty && (
          <p className="text-xs text-muted-foreground">
            Die Tageszeiten müssen den Tag lückenlos und ohne Überlappung abdecken.
          </p>
        )}
        {savedHint && <p className="text-xs text-muted-foreground">Gespeichert.</p>}

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={save} disabled={!isDirty}>
            Speichern
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={discard} disabled={!isDirty}>
            Verwerfen
          </Button>
        </div>
      </div>
    </>
  );
});

ActionPlanDayPartsView.displayName = "ActionPlanDayPartsView";
