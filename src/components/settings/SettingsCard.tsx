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
      <header className="flex items-center gap-2 px-3 py-2 bg-topbar-active/85 text-topbar-active-foreground">
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
              className="text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
