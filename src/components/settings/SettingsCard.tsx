import { cn } from "@/lib/utils";
import type { SettingsCategory } from "./settingsData";

interface SettingsCardProps {
  category: SettingsCategory;
  onLinkClick?: (categoryId: string, label: string) => void;
}

/**
 * Single settings category card with a colored header and a list of links.
 */
export const SettingsCard = ({ category, onLinkClick }: SettingsCardProps) => {
  const Icon = category.icon;
  return (
    <section
      className="rounded-md border border-border bg-card overflow-hidden shadow-sm"
      aria-labelledby={`settings-card-${category.id}`}
    >
      <header className="flex items-center gap-2 px-3 py-2 text-white" style={{ backgroundColor: "#5D9580" }}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <h2
          id={`settings-card-${category.id}`}
          className="text-sm font-medium truncate"
        >
          {category.title}
        </h2>
      </header>
      <ul className="px-3 py-2 space-y-1">
        {category.links.map((link) => (
          <li key={link.label}>
            <button
              type="button"
              onClick={() => onLinkClick?.(category.id, link.label)}
              className={cn(
                "text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                // Prototyp: tatsächlich klickbare Links sind eingekreist
                link.implemented &&
                  "inline-block rounded-full border-2 border-[#E11D48] px-2 py-0.5 font-medium no-underline hover:no-underline",
              )}
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
