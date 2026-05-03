import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SettingsRibbon } from "@/components/settings/SettingsRibbon";

interface PermissionCategory {
  id: string;
  name: string;
  levels: [boolean, boolean, boolean];
}

type SortColumn = "name" | "levels";
type SortDirection = "asc" | "desc";

const initialCategories: PermissionCategory[] = [
  { id: "a", name: "A", levels: [true, false, false] },
  { id: "b", name: "B", levels: [false, true, false] },
  { id: "c", name: "C", levels: [false, false, true] },
];

const levelLabel = (levels: [boolean, boolean, boolean]) => {
  const labels = levels
    .map((enabled, index) => (enabled ? `Stufe ${index + 1}` : null))
    .filter(Boolean);

  return labels.length > 0 ? labels.join(", ") : "Keine";
};

export const PermissionLevelsView = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<PermissionCategory[]>(initialCategories);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftLevels, setDraftLevels] = useState<[boolean, boolean, boolean]>([false, false, false]);

  const selectedCategory = useMemo(
    () => categories.find((entry) => entry.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const sortedCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const leftValue = sortColumn === "name" ? a.name : levelLabel(a.levels);
      const rightValue = sortColumn === "name" ? b.name : levelLabel(b.levels);
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
    setDraftLevels([...category.levels] as [boolean, boolean, boolean]);
    setIsPanelMounted(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const handlePanelAnimationEnd = () => {
    if (isPanelOpen) return;
    setIsPanelMounted(false);
    setSelectedCategoryId(null);
    setDraftLevels([false, false, false]);
  };


  const saveChanges = () => {
    if (!selectedCategory) return;

    setCategories((prev) =>
      prev.map((entry) =>
        entry.id === selectedCategory.id
          ? {
              ...entry,
              levels: draftLevels,
            }
          : entry,
      ),
    );

    closePanel();
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-[#ededf0] p-4">
      <SettingsRibbon
        actions={[{ key: "back", label: "Zurück", icon: ArrowLeft, onClick: () => navigate("/settings") }]}
      />

      <section className="overflow-hidden rounded-md border border-border/80">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
                            <th className="w-1/2 px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>
                  Kategorie
                  <span aria-hidden="true">{getSortArrow("name")}</span>
                </button>
              </th>
              <th className="w-1/2 px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("levels")}>
                  Berechtigte Stufen
                  <span aria-hidden="true">{getSortArrow("levels")}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#f8f8f9]">
            {sortedCategories.map((entry) => (
              <tr
                key={entry.id}
                className="cursor-pointer border-b border-border/80 bg-[#f6f6f7] transition-colors duration-150 even:bg-[#f0f0f2] hover:bg-[#d6e2f4]"
                onClick={() => openPanel(entry.id)}
              >
                <td className="px-4 py-2 text-[13px] text-foreground">{entry.name}</td>
                <td className="px-4 py-2 text-[13px] text-foreground">{levelLabel(entry.levels)}</td>
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

            <div className="flex-1 space-y-4 px-6 py-6">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground">Stufen</h3>
              {[1, 2, 3].map((level) => (
                <label key={level} className="flex items-center gap-3 text-base">
                  <Checkbox
                    checked={draftLevels[level - 1]}
                    onCheckedChange={(checked) => {
                      const next = [...draftLevels] as [boolean, boolean, boolean];
                      next[level - 1] = checked === true;
                      setDraftLevels(next);
                    }}
                  />
                  Stufe {level}
                </label>
              ))}
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
    </div>
  );
};
