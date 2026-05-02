import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckSquare,
  Calendar,
  FileText,
  Workflow,
  Files,
  HeartPulse,
  Network,
  Star,
  Users,
  KeyRound,
  CalendarRange,
  Settings as SettingsIcon,
  HelpCircle,
  Power,
  Globe,
  type LucideIcon,
} from "lucide-react";

interface TopTab {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
}

const tabs: TopTab[] = [
  { label: "Journal", icon: BookOpen },
  { label: "Aufgaben", icon: CheckSquare },
  { label: "Termine", icon: Calendar },
  { label: "Texte", icon: FileText },
  { label: "Prozesse", icon: Workflow },
  { label: "Dateien", icon: Files },
  { label: "Pflege", icon: HeartPulse },
  { label: "Systeme", icon: Network },
  { label: "Bewertungen", icon: Star },
  { label: "Anwesenheiten", icon: CheckSquare },
  { label: "Kontakte", icon: Users },
  { label: "Schlüssel", icon: KeyRound },
  { label: "Planung", icon: CalendarRange },
  { label: "Einstellungen", icon: SettingsIcon, active: true, href: "/settings" },
];

/**
 * Top navigation bar shown on the settings page, including the active
 * "Einstellungen" tab and the right-hand utility icons.
 */
export const SettingsTopBar = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center bg-topbar text-topbar-foreground border-b border-border h-12">
      <nav className="flex items-stretch h-full overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              if (t.href) navigate(t.href);
              else navigate("/");
            }}
            className={
              "px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 border-r border-border transition-colors " +
              (t.active
                ? "bg-topbar-active text-topbar-active-foreground"
                : "hover:bg-secondary")
            }
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1 pl-2 pr-2">
        <button
          type="button"
          className="p-2 rounded hover:bg-secondary text-muted-foreground"
          aria-label="Sprache"
        >
          <Globe className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-secondary text-muted-foreground"
          aria-label="Hilfe"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-secondary text-muted-foreground"
          aria-label="Abmelden"
        >
          <Power className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
