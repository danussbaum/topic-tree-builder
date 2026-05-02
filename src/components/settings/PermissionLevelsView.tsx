import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface PermissionCategory {
  id: string;
  name: string;
  levels: [boolean, boolean, boolean];
}

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [draftLevels, setDraftLevels] = useState<[boolean, boolean, boolean]>([false, false, false]);

  const selectedCategory = useMemo(
    () => categories.find((entry) => entry.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const openPanel = (categoryId: string) => {
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) return;

    setSelectedCategoryId(categoryId);
    setDraftLevels([...category.levels] as [boolean, boolean, boolean]);
  };

  const closePanel = () => {
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
    <div className="space-y-0 rounded-md border border-border bg-[#ededf0]">
      <div className="border-b border-border bg-[#f7f7f8] px-4 py-2">
        <button
          type="button"
          onClick={() => navigate("/settings-page")}
          className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück
        </button>
      </div>

      <section className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f3f3f4]">
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-semibold">Kategorie</th>
              <th className="px-4 py-2 text-left font-semibold">Berechtigte Stufen</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((entry) => (
              <tr key={entry.id} className="border-b border-border/80 bg-white hover:bg-[#e8eef9]">
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openPanel(entry.id)}
                    className="w-full text-left text-foreground"
                  >
                    {entry.name}
                  </button>
                </td>
                <td className="px-4 py-2 text-foreground">{levelLabel(entry.levels)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <aside className="flex h-full w-full max-w-3xl flex-col bg-[#f3f3f5] shadow-2xl">
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

            <div className="flex items-center justify-between bg-[#3f6fb7] px-6 py-3">
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
