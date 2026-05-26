import { useMemo, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DisciplineOption {
  id: string;
  title: string;
}

interface DisciplineMultiSelectProps {
  options: DisciplineOption[];
  value: string[];
  onChange: (disciplineIds: string[]) => void;
}

export const DisciplineMultiSelect = ({
  options,
  value,
  onChange,
}: DisciplineMultiSelectProps) => {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedDisciplines = useMemo(
    () =>
      value
        .map((disciplineId) =>
          options.find((discipline) => discipline.id === disciplineId),
        )
        .filter((discipline): discipline is DisciplineOption => Boolean(discipline)),
    [options, value],
  );

  const filteredDisciplines = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de");
    return options.filter(
      (discipline) =>
        !value.includes(discipline.id) &&
        (!normalizedQuery ||
          discipline.title.toLocaleLowerCase("de").includes(normalizedQuery)),
    );
  }, [options, query, value]);

  const hasFilterInput = query.trim().length > 0 || filteredDisciplines.length > 0;

  const selectDiscipline = (disciplineId: string) => {
    onChange(value.includes(disciplineId) ? value : [...value, disciplineId]);
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeDiscipline = (disciplineId: string) => {
    onChange(value.filter((id) => id !== disciplineId));
    setDropdownOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="min-h-10 rounded-md border border-input bg-background shadow-sm">
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {selectedDisciplines.map((discipline) => (
              <Badge
                key={discipline.id}
                variant="secondary"
                className="h-6 gap-1 rounded-sm border border-border/60 bg-secondary/40 px-1.5 font-normal text-foreground/90"
              >
                {discipline.title}
                <button
                  type="button"
                  className="text-xs leading-none text-muted-foreground hover:text-foreground"
                  onClick={() => removeDiscipline(discipline.id)}
                  aria-label={`${discipline.title} entfernen`}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setDropdownOpen(true);
                setActiveIndex(0);
              }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(event) => {
                if (
                  !isDropdownOpen &&
                  (event.key === "ArrowDown" || event.key === "ArrowUp")
                ) {
                  event.preventDefault();
                  setDropdownOpen(true);
                  return;
                }
                if (
                  !isDropdownOpen ||
                  !hasFilterInput ||
                  filteredDisciplines.length === 0
                )
                  return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((prev) => (prev + 1) % filteredDisciplines.length);
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex(
                    (prev) =>
                      (prev - 1 + filteredDisciplines.length) %
                      filteredDisciplines.length,
                  );
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  const activeDiscipline = filteredDisciplines[activeIndex];
                  if (activeDiscipline) selectDiscipline(activeDiscipline.id);
                  return;
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDropdownOpen(false);
                }
              }}
              placeholder="Disziplinen suchen..."
              className="h-6 min-w-[16rem] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-secondary/70"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Disziplinen anzeigen"
        >
          <ChevronUp
            className={cn(
              "h-4 w-4 transition-transform",
              !isDropdownOpen && "rotate-180",
            )}
          />
        </button>
      </div>
      {isDropdownOpen && hasFilterInput && (
        <div className="max-h-56 overflow-y-auto border-t border-border/70 p-1.5">
          {filteredDisciplines.map((discipline, disciplineIndex) => (
            <button
              key={discipline.id}
              type="button"
              onClick={() => selectDiscipline(discipline.id)}
              onMouseEnter={() => setActiveIndex(disciplineIndex)}
              className={cn(
                "flex w-full items-center rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary/40",
                activeIndex === disciplineIndex && "bg-primary/10 text-primary",
              )}
            >
              <span className="truncate">{discipline.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
