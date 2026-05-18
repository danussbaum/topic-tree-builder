import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS,
} from "@/lib/action-plan-disciplines";
import {
  getAuthorizedRoleLabels,
  loadActionPlanCategoryPermissions,
  saveActionPlanCategoryPermissions,
  type ActionPlanCategoryPermission,
} from "@/lib/action-plan-categories";

type SortColumn = "name" | "roles";
type SortDirection = "asc" | "desc";

const roleLabel = (authorizedRoleIds: string[]) => {
  const labels = getAuthorizedRoleLabels(authorizedRoleIds);
  return labels.length > 0 ? labels.join(", ") : "Keine";
};

export const PermissionLevelsView = () => {
  const [categories, setCategories] = useState<ActionPlanCategoryPermission[]>(() =>
    loadActionPlanCategoryPermissions(),
  );
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftAuthorizedRoleIds, setDraftAuthorizedRoleIds] = useState<string[]>([]);

  const selectedCategory = useMemo(
    () => categories.find((entry) => entry.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const sortedCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const leftValue = sortColumn === "name" ? a.name : roleLabel(a.authorizedRoleIds);
      const rightValue = sortColumn === "name" ? b.name : roleLabel(b.authorizedRoleIds);
      return leftValue.localeCompare(rightValue, "de", { sensitivity: "base" });
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [categories, sortColumn, sortDirection]);

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection("asc");
  };

  const getSortArrow = (column: SortColumn) => {
    if (sortColumn !== column) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  useEffect(() => {
    saveActionPlanCategoryPermissions(categories);
  }, [categories]);

  useEffect(() => {
    if (!isPanelMounted) return;

    const animationFrame = requestAnimationFrame(() => {
      setIsPanelOpen(true);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isPanelMounted]);

  const openPanel = (categoryId: string) => {
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) return;

    setSelectedCategoryId(categoryId);
    setDraftAuthorizedRoleIds(category.authorizedRoleIds);
    setIsPanelMounted(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const handlePanelAnimationEnd = () => {
    if (isPanelOpen) return;
    setIsPanelMounted(false);
    setSelectedCategoryId(null);
    setDraftAuthorizedRoleIds([]);
  };

  const toggleAuthorizedRole = (roleId: string) => {
    setDraftAuthorizedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const saveChanges = () => {
    if (!selectedCategory) return;

    setCategories((prev) =>
      prev.map((entry) =>
        entry.id === selectedCategory.id
          ? {
              ...entry,
              authorizedRoleIds: draftAuthorizedRoleIds,
            }
          : entry,
      ),
    );

    closePanel();
  };

  return (
    <>
      <section className="overflow-hidden border-y border-border/80 bg-background">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
              <th className="w-1/3 px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>
                  Kategorie
                  <span aria-hidden="true">{getSortArrow("name")}</span>
                </button>
              </th>
              <th className="w-2/3 px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("roles")}>
                  Berechtigte Rollen
                  <span aria-hidden="true">{getSortArrow("roles")}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-background">
            {sortedCategories.map((entry) => (
              <tr
                key={entry.id}
                className="cursor-pointer border-b border-border/80 transition-colors duration-150 even:bg-[#f7f7f9] hover:bg-[#d6e2f4]"
                onClick={() => openPanel(entry.id)}
              >
                <td className="px-4 py-2 text-[13px] text-foreground">{entry.name}</td>
                <td className="px-4 py-2 text-[13px] text-foreground">{roleLabel(entry.authorizedRoleIds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedCategory && isPanelMounted && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
            isPanelOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <aside
            className={`pointer-events-auto flex h-full w-full max-w-3xl flex-col bg-[#f3f3f5] shadow-2xl transition-transform duration-300 ease-out ${
              isPanelOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onTransitionEnd={handlePanelAnimationEnd}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-3xl font-light text-foreground">{selectedCategory.name}</h2>
              <button type="button" onClick={closePanel} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground">Berechtigte Rollen</h3>
              <div className="space-y-3 rounded-md border border-border bg-background p-4">
                {ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.map((role) => (
                  <label key={role.id} className="flex items-start gap-3 text-base">
                    <Checkbox
                      checked={draftAuthorizedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleAuthorizedRole(role.id)}
                    />
                    <span className="leading-5">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <Button type="button" variant="ghost" onClick={closePanel} className="text-white hover:bg-white/10 hover:text-white">
                Abbrechen
              </Button>
              <Button type="button" variant="ghost" onClick={saveChanges} className="text-white hover:bg-white/10 hover:text-white">
                Speichern
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
