import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS,
  loadActionPlanDisciplines,
  saveActionPlanDisciplines,
  type ActionPlanDiscipline,
} from "@/lib/action-plan-disciplines";

export interface ActionPlanDisciplinesHandle {
  openCreate: () => void;
}

export const ActionPlanDisciplinesView =
  forwardRef<ActionPlanDisciplinesHandle>((_props, ref) => {
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
    const [roleQuery, setRoleQuery] = useState("");
    const [isRoleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [activeRoleIndex, setActiveRoleIndex] = useState(0);
    const roleInputRef = useRef<HTMLInputElement | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchQuery, setSearchQuery] = useState("");

    const selectedDiscipline = useMemo(
      () =>
        disciplines.find((entry) => entry.id === selectedDisciplineId) ?? null,
      [disciplines, selectedDisciplineId],
    );

    const selectedAuthorizedRoles = useMemo(
      () =>
        draftAuthorizedRoleIds
          .map((roleId) =>
            ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.find(
              (role) => role.id === roleId,
            ),
          )
          .filter(
            (
              role,
            ): role is (typeof ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS)[number] =>
              Boolean(role),
          ),
      [draftAuthorizedRoleIds],
    );

    const filteredAuthorizedRoles = useMemo(() => {
      const query = roleQuery.trim().toLocaleLowerCase("de");
      return ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.filter(
        (role) =>
          !draftAuthorizedRoleIds.includes(role.id) &&
          (!query || role.label.toLocaleLowerCase("de").includes(query)),
      );
    }, [draftAuthorizedRoleIds, roleQuery]);

    const hasRoleFilterInput =
      roleQuery.trim().length > 0 || filteredAuthorizedRoles.length > 0;

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
      setRoleQuery("");
      setRoleDropdownOpen(false);
      setIsPanelMounted(true);
    };

    const openEditPanel = (disciplineId: string) => {
      const discipline = disciplines.find((entry) => entry.id === disciplineId);
      if (!discipline) return;
      setIsCreating(false);
      setSelectedDisciplineId(disciplineId);
      setDraftTitle(discipline.title);
      setDraftAuthorizedRoleIds(discipline.authorizedRoleIds);
      setRoleQuery("");
      setRoleDropdownOpen(false);
      setIsPanelMounted(true);
    };

    const closePanel = () => setIsPanelOpen(false);

    const handlePanelAnimationEnd = () => {
      if (isPanelOpen) return;
      setIsPanelMounted(false);
      setIsCreating(false);
      setSelectedDisciplineId(null);
      setDraftAuthorizedRoleIds([]);
      setRoleQuery("");
      setRoleDropdownOpen(false);
    };

    const selectAuthorizedRole = (roleId: string) => {
      setDraftAuthorizedRoleIds((prev) =>
        prev.includes(roleId) ? prev : [...prev, roleId],
      );
      setRoleQuery("");
      setActiveRoleIndex(0);
      requestAnimationFrame(() => roleInputRef.current?.focus());
    };

    const removeAuthorizedRole = (roleId: string) => {
      setDraftAuthorizedRoleIds((prev) => prev.filter((id) => id !== roleId));
      setRoleDropdownOpen(true);
      requestAnimationFrame(() => roleInputRef.current?.focus());
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
        <section className="border-y border-border/80 bg-[#f1f1f3] px-4 py-2">
          <div className="flex justify-end">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Disziplinen suchen"
                className="h-9 bg-background pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Suche zurücksetzen"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </section>
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
              className={`pointer-events-auto flex h-full w-full max-w-4xl flex-col bg-[#f3f3f5] shadow-2xl transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
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
                  <div className="min-h-10 rounded-md border border-input bg-background shadow-sm">
                    <div className="flex items-start gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-1">
                          {selectedAuthorizedRoles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="secondary"
                              className="h-6 gap-1 rounded-sm border border-border/60 bg-secondary/40 px-1.5 font-normal text-foreground/90"
                            >
                              {role.label}
                              <button
                                type="button"
                                className="text-xs leading-none text-muted-foreground hover:text-foreground"
                                onClick={() => removeAuthorizedRole(role.id)}
                                aria-label={`${role.label} entfernen`}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <Input
                            ref={roleInputRef}
                            value={roleQuery}
                            onChange={(event) => {
                              setRoleQuery(event.target.value);
                              setRoleDropdownOpen(true);
                              setActiveRoleIndex(0);
                            }}
                            onFocus={() => setRoleDropdownOpen(true)}
                            onKeyDown={(event) => {
                              if (
                                !isRoleDropdownOpen &&
                                (event.key === "ArrowDown" ||
                                  event.key === "ArrowUp")
                              ) {
                                event.preventDefault();
                                setRoleDropdownOpen(true);
                                return;
                              }
                              if (
                                !isRoleDropdownOpen ||
                                !hasRoleFilterInput ||
                                filteredAuthorizedRoles.length === 0
                              )
                                return;
                              if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setActiveRoleIndex(
                                  (prev) =>
                                    (prev + 1) % filteredAuthorizedRoles.length,
                                );
                                return;
                              }
                              if (event.key === "ArrowUp") {
                                event.preventDefault();
                                setActiveRoleIndex(
                                  (prev) =>
                                    (prev -
                                      1 +
                                      filteredAuthorizedRoles.length) %
                                    filteredAuthorizedRoles.length,
                                );
                                return;
                              }
                              if (event.key === "Enter") {
                                event.preventDefault();
                                const activeRole =
                                  filteredAuthorizedRoles[activeRoleIndex];
                                if (activeRole)
                                  selectAuthorizedRole(activeRole.id);
                                return;
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                setRoleDropdownOpen(false);
                              }
                            }}
                            placeholder="Berechtigte Rollen suchen..."
                            className="h-6 min-w-[16rem] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-secondary/70"
                        onClick={() => setRoleDropdownOpen((prev) => !prev)}
                        aria-label="Berechtigte Rollen anzeigen"
                      >
                        <ChevronUp
                          className={cn(
                            "h-4 w-4 transition-transform",
                            !isRoleDropdownOpen && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                    {isRoleDropdownOpen && hasRoleFilterInput && (
                      <div className="max-h-56 overflow-y-auto border-t border-border/70 p-1.5">
                        {filteredAuthorizedRoles.map((role, roleIndex) => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => selectAuthorizedRole(role.id)}
                            onMouseEnter={() => setActiveRoleIndex(roleIndex)}
                            className={cn(
                              "flex w-full items-center rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary/40",
                              activeRoleIndex === roleIndex &&
                                "bg-primary/10 text-primary",
                            )}
                          >
                            <span className="truncate">{role.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="pt-2 text-xs text-muted-foreground">
                    Mehrfachauswahl
                  </span>
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
