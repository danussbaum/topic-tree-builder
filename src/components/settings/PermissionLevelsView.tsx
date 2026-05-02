import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [categories, setCategories] = useState<PermissionCategory[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategories[0].id);

  const selectedCategory = useMemo(
    () => categories.find((entry) => entry.id === selectedCategoryId) ?? categories[0],
    [categories, selectedCategoryId],
  );

  const toggleLevel = (levelIndex: number, checked: boolean) => {
    if (!selectedCategory) return;

    setCategories((prev) =>
      prev.map((entry) => {
        if (entry.id !== selectedCategory.id) return entry;

        const nextLevels = [...entry.levels] as [boolean, boolean, boolean];
        nextLevels[levelIndex] = checked;

        return {
          ...entry,
          levels: nextLevels,
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ribbons</span>
          <span className="rounded-full bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-accent-foreground">Berechtigungsstufen</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Kategorien</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Detailansicht</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Kategorie</th>
                <th className="px-4 py-2 text-left font-semibold">Berechtigte Stufen</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(entry.id)}
                      className="text-primary hover:underline"
                    >
                      {entry.name}
                    </button>
                  </td>
                  <td className="px-4 py-2">{levelLabel(entry.levels)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-md border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Detailansicht</h2>
          {selectedCategory && (
            <div className="space-y-4">
              <p className="text-sm">
                Kategorie: <span className="font-medium">{selectedCategory.name}</span>
              </p>

              <div className="space-y-3">
                {[1, 2, 3].map((level) => (
                  <label key={level} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={selectedCategory.levels[level - 1]}
                      onCheckedChange={(checked) => toggleLevel(level - 1, checked === true)}
                    />
                    Stufe {level}
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
