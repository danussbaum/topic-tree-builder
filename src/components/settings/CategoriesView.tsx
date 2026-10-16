import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadActionPlanCategories,
  saveActionPlanCategories,
  sortActionPlanCategories,
  type ActionPlanCategory,
} from "@/lib/action-plan-categories";

// Bewusst rudimentaer: in socialweb sind Kategorien anders umgesetzt, das ist
// nicht Teil des Prototyps.
export const CategoriesView = () => {
  const [categories, setCategories] = useState<ActionPlanCategory[]>(() =>
    loadActionPlanCategories(),
  );
  const [draftCode, setDraftCode] = useState("");
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    saveActionPlanCategories(categories);
  }, [categories]);

  const addCategory = () => {
    const name = draftName.trim();
    if (!name) return;
    setCategories((prev) => [
      ...prev,
      { id: `category-${Date.now()}`, code: draftCode.trim(), name },
    ]);
    setDraftCode("");
    setDraftName("");
  };

  return (
    <section className="overflow-hidden border-y border-border/80 bg-background">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-[#f1f1f3]">
          <tr className="border-b border-border/80">
            <th className="w-32 px-4 py-2 text-left text-xs font-semibold text-foreground">
              Code
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
              Bezeichnung
            </th>
            <th className="w-28 px-4 py-2" />
          </tr>
        </thead>
        <tbody className="bg-background">
          <tr className="border-b border-border/80">
            <td className="px-4 py-2">
              <Input
                value={draftCode}
                onChange={(event) => setDraftCode(event.target.value)}
                placeholder="Code"
                aria-label="Code der neuen Kategorie"
              />
            </td>
            <td className="px-4 py-2">
              <Input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addCategory();
                }}
                placeholder="Neue Kategorie"
                aria-label="Bezeichnung der neuen Kategorie"
              />
            </td>
            <td className="px-4 py-2 text-right">
              <Button type="button" size="sm" onClick={addCategory} disabled={!draftName.trim()}>
                Erstellen
              </Button>
            </td>
          </tr>
          {sortActionPlanCategories(categories).map((category) => (
            <tr key={category.id} className="border-b border-border/80 even:bg-[#f7f7f9]">
              <td className="px-4 py-2 text-[13px] text-muted-foreground">{category.code}</td>
              <td className="px-4 py-2 text-[13px] text-foreground">{category.name}</td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    setCategories((prev) => prev.filter((entry) => entry.id !== category.id))
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={`${category.name} löschen`}
                >
                  <Trash2 className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
