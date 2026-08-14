import { useMemo, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionPlanResource } from "@/lib/action-plan-resources";

interface ResourceMultiSelectProps {
  options: ActionPlanResource[];
  value: string[];
  onChange: (resourceIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Mehrfachauswahl von Hilfsmitteln — in den Einstellungen und in der Planung genutzt. */
export const ResourceMultiSelect = ({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Hilfsmittel suchen...",
}: ResourceMultiSelectProps) => {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedResources = useMemo(
    () =>
      value
        .map((resourceId) => options.find((resource) => resource.id === resourceId))
        .filter((resource): resource is ActionPlanResource => Boolean(resource)),
    [options, value],
  );

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de");
    return options.filter(
      (resource) =>
        !value.includes(resource.id) &&
        (!normalizedQuery ||
          resource.name.toLocaleLowerCase("de").includes(normalizedQuery)),
    );
  }, [options, query, value]);

  const selectResource = (resourceId: string) => {
    onChange(value.includes(resourceId) ? value : [...value, resourceId]);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div
      className={cn(
        "min-h-10 rounded-md border border-input bg-background shadow-sm",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {selectedResources.map((resource) => (
              <Badge
                key={resource.id}
                variant="secondary"
                // Die Beschreibung aus dem Katalog als Tooltip: sie erklärt das
                // Hilfsmittel, ohne die Zeile zu verlängern.
                title={resource.description.trim() || undefined}
                className="h-6 gap-1 rounded-sm border border-border/60 bg-secondary/40 px-1.5 font-normal text-foreground/90"
              >
                {resource.name}
                <button
                  type="button"
                  className="text-xs leading-none text-muted-foreground hover:text-foreground"
                  onClick={() => onChange(value.filter((id) => id !== resource.id))}
                  aria-label={`${resource.name} entfernen`}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Input
              ref={inputRef}
              value={query}
              disabled={disabled}
              onChange={(event) => {
                setQuery(event.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDropdownOpen(false);
                  return;
                }
                if (event.key === "Enter" && filteredResources[0]) {
                  event.preventDefault();
                  selectResource(filteredResources[0].id);
                }
              }}
              placeholder={placeholder}
              className="h-6 min-w-[16rem] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-secondary/70"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Hilfsmittel anzeigen"
        >
          <ChevronUp
            className={cn("h-4 w-4 transition-transform", !isDropdownOpen && "rotate-180")}
          />
        </button>
      </div>
      {isDropdownOpen && filteredResources.length > 0 && (
        <div className="max-h-56 overflow-y-auto border-t border-border/70 p-1.5">
          {filteredResources.map((resource) => {
            const description = resource.description.trim();
            return (
              <button
                key={resource.id}
                type="button"
                onClick={() => selectResource(resource.id)}
                // Der zugängliche Name bleibt der Hilfsmittel-Name, damit die Auswahl
                // eindeutig ansprechbar ist — die Beschreibung ist nur Erläuterung.
                aria-label={resource.name}
                className="flex w-full flex-col items-start rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary/40"
              >
                <span className="w-full truncate">{resource.name}</span>
                {description && (
                  <span className="w-full truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
