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
  MoreHorizontal,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryTabs = [
  { label: "Handlungsplanung", icon: Workflow, href: "/" },
  { label: "Journal", icon: BookOpen },
  { label: "Aufgaben", icon: CheckSquare },
  { label: "Termine", icon: Calendar },
  { label: "Texte", icon: FileText },
  { label: "Dateien", icon: Files },
  { label: "Pflege", icon: HeartPulse },
  { label: "Systeme", icon: Network },
  { label: "Bewertungen", icon: Star },
  { label: "Kontakte", icon: Users },
];

export const SettingsTopBar = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center bg-sidebar-background text-sidebar-foreground border-b border-sidebar-border h-12 pr-2">
      <div className="flex items-center h-full gap-3 px-4 border-r border-sidebar-border bg-sidebar-primary shrink-0">
        <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground shrink-0">
          AS
        </div>
        <div className="text-sm font-semibold leading-tight truncate">Assessor (GL)</div>
      </div>

      <nav className="flex items-stretch h-full overflow-x-auto">
        {primaryTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.href && navigate(tab.href)}
            className="px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 border-r border-sidebar-border transition-colors hover:bg-sidebar-primary"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 border-r border-sidebar-border transition-colors bg-sidebar-accent text-sidebar-accent-foreground focus:outline-none"
            >
              <MoreHorizontal className="h-4 w-4" />
              Weitere
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuItem>
              <SettingsIcon className="h-4 w-4 mr-2" />
              <span className="text-xs font-semibold uppercase tracking-wide">Einstellungen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <div className="ml-auto flex items-center gap-1 pl-2">
        <button
          type="button"
          className="p-2 rounded hover:bg-sidebar-primary text-sidebar-foreground/80"
          aria-label="Hilfe"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
