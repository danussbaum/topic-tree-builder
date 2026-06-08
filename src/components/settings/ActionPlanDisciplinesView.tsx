import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthorizedRolesMultiSelect } from "@/components/settings/AuthorizedRolesMultiSelect";
import {
  loadActionPlanDisciplines,
  saveActionPlanDisciplines,
  type ActionPlanDiscipline,
} from "@/lib/action-plan-disciplines";

export interface ActionPlanDisciplinesHandle {
  openCreate: () => void;
}

interface ActionPlanDisciplinesViewProps {
  searchQuery: string;
}

export const ActionPlanDisciplinesView = forwardRef<
  ActionPlanDisciplinesHandle,
  ActionPlanDisciplinesViewProps
>(({ searchQuery }, ref) => {
  const [disciplines, setDisciplines] = useState<ActionPlanDiscipline[]>(() =>
    loadActionPlanDisciplines(),
  );
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAuthorizedRoleIds, setDraftAuthorizedRoleIds] = useState<
    string[]
  >([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const selectedDiscipline = useMemo(
    () =>
      disciplines.find((entry) => entry.id === selectedDisciplineId) ?? null,
    [disciplines, selectedDisciplineId],
  );

  const visibleDisciplines = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("de");
    const filtered = disciplines.filter((entry) =>
      entry.title.toLocaleLowerCase("de").includes(query),
    );
    const sorted = [...filtered].sort((a, b) =>
      a.title.localeCompare(b.title, "de", { sensitivity: "base" }),
    );
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [disciplines, searchQuery, sortDirection]);

  useEffect(() => {
    if (!isPanelMounted) return;
    const frame = requestAnimationFrame(() => setIsPanelOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelMounted]);

  const openCreatePanel = () => {
    setIsCreating(true);
    setSelectedDisciplineId(null);
    setDraftTitle("Neue Disziplin");
    setDraftAuthorizedRoleIds([]);
    setIsPanelMounted(true);
  };

  const openEditPanel = (disciplineId: string) => {
    const discipline = disciplines.find((entry) => entry.id === disciplineId);
    if (!discipline) return;
    setIsCreating(false);
    setSelectedDisciplineId(disciplineId);
    setDraftTitle(discipline.title);
    setDraftAuthorizedRoleIds(discipline.authorizedRoleIds);
    setIsPanelMounted(true);
  };

  const closePanel = () => setIsPanelOpen(false);

  const handlePanelAnimationEnd = () => {
    if (isPanelOpen) return;
    setIsPanelMounted(false);
    setIsCreating(false);
    setSelectedDisciplineId(null);
    setDraftAuthorizedRoleIds([]);
  };

  const saveDiscipline = () => {
    const title = draftTitle.trim() || "Neue Disziplin";
    if (isCreating) {
      setDisciplines((prev) => [
        ...prev,
        {
          id: `discipline-${Date.now()}`,
          title,
          authorizedRoleIds: draftAuthorizedRoleIds,
        },
      ]);
      closePanel();
      return;
    }
    if (!selectedDiscipline) return;
    setDisciplines((prev) =>
      prev.map((entry) =>
        entry.id === selectedDiscipline.id
          ? { ...entry, title, authorizedRoleIds: draftAuthorizedRoleIds }
          : entry,
      ),
    );
    closePanel();
  };

  const deleteSelectedDiscipline = () => {
    if (!selectedDisciplineId) return;
    setDisciplines((prev) =>
      prev.filter((entry) => entry.id !== selectedDisciplineId),
    );
    closePanel();
  };

  useEffect(() => {
    saveActionPlanDisciplines(disciplines);
  }, [disciplines]);

  useImperativeHandle(ref, () => ({ openCreate: openCreatePanel }));

  return (
    <>
      <section className="overflow-hidden border-y border-border/80 bg-background">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() =>
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    )
                  }
                >
                  Titel
                  <span aria-hidden="true">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-background">
            {visibleDisciplines.map((entry) => (
              <tr
                key={entry.id}
                className="cursor-pointer border-b border-border/80 even:bg-[#f7f7f9] hover:bg-[#d6e2f4]"
                onClick={() => openEditPanel(entry.id)}
              >
                <td className="px-4 py-2 text-[13px] text-foreground">
                  {entry.title}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isPanelMounted && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isPanelOpen ? "opacity-100" : "opacity-0"}`}
        >
          <aside
            className={`pointer-events-auto flex h-full w-full max-w-4xl flex-col bg-[#F5F5F6] shadow-2xl transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
            onTransitionEnd={handlePanelAnimationEnd}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-3xl font-light text-foreground">
                {isCreating ? "Neue Disziplin" : draftTitle}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-[200px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
                <label className="pt-2 text-sm text-foreground">Titel</label>
                <Input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
                <span className="pt-2 text-xs text-muted-foreground">
                  immer editierbar
                </span>

                <label className="pt-2 text-sm text-foreground">
                  Berechtigte Rollen
                </label>
                <AuthorizedRolesMultiSelect
                  value={draftAuthorizedRoleIds}
                  onChange={setDraftAuthorizedRoleIds}
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closePanel}
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Abbrechen
                </Button>
                {!isCreating && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={deleteSelectedDiscipline}
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    Löschen
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={saveDiscipline}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                Speichern
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
});
ActionPlanDisciplinesView.displayName = "ActionPlanDisciplinesView";
