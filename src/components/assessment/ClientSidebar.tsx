import { Search, Users, Plus } from "lucide-react";
import type { Client } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onAddClient: () => void;
}

export function ClientSidebar({
  clients,
  selectedClientId,
  onSelectClient,
  onAddClient,
}: Props) {
  const [query, setQuery] = useState("");
  const filtered = clients.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="w-72 shrink-0 bg-sidebar text-sidebar-foreground h-dvh sticky top-0 flex flex-col">
      {/* User chip */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sidebar-border bg-sidebar-primary">
        <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold">
          AS
        </div>
        <div className="text-sm font-semibold leading-tight">
          Assessor (GL)
        </div>
      </div>

      {/* Section header */}
      <button
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-sidebar-border bg-sidebar-primary/60 hover:bg-sidebar-primary transition-colors"
        onClick={onAddClient}
        title="Neue Klient/in hinzufügen"
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <Users className="h-4 w-4" /> Klient/innen
        </div>
        <Plus className="h-4 w-4 opacity-80" />
      </button>

      {/* Client list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.map((c) => {
          const selected = c.id === selectedClientId;
          const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
          return (
            <button
              key={c.id}
              onClick={() => onSelectClient(c.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-sidebar-border/60",
                selected
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-primary/70",
              )}
            >
              <div className="h-8 w-8 rounded-full bg-sidebar-accent/40 flex items-center justify-center text-xs font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {c.lastName}, {c.firstName}
                </div>
                <div className="text-xs opacity-70 truncate">
                  {c.topics.length} Thema{c.topics.length === 1 ? "" : "en"}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-xs opacity-70">
            Keine Klient/innen gefunden.
          </div>
        )}
      </div>

      {/* Search */}
      <div className="border-t border-sidebar-border p-3 bg-sidebar-primary">
        <div className="flex items-center gap-2 bg-sidebar-accent/40 rounded px-2 py-1.5">
          <Search className="h-4 w-4 opacity-80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen (Ctrl+D)"
            className="bg-transparent outline-none text-sm placeholder:text-sidebar-foreground/60 w-full"
          />
        </div>
      </div>
    </aside>
  );
}
