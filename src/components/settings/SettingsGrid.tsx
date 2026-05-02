import { SettingsCard } from "./SettingsCard";
import { getSettingsColumns } from "./settingsData";

interface SettingsGridProps {
  onLinkClick?: (categoryId: string, label: string) => void;
}

/**
 * Three-column responsive grid of settings cards. Collapses to one column on
 * small screens and two columns on medium screens.
 */
export const SettingsGrid = ({ onLinkClick }: SettingsGridProps) => {
  const columns = getSettingsColumns();
  const flat = columns.flat();

  return (
    <>
      {/* Desktop: 3 explicit columns to preserve original grouping */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {columns.map((col, idx) => (
          <div key={idx} className="flex flex-col gap-4">
            {col.map((category) => (
              <SettingsCard
                key={category.id}
                category={category}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tablet / Mobile: simple flow grid */}
      <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-4">
        {flat.map((category) => (
          <SettingsCard
            key={category.id}
            category={category}
            onLinkClick={onLinkClick}
          />
        ))}
      </div>
    </>
  );
};
