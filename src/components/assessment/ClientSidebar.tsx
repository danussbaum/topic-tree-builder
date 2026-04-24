import { Search, Users, Plus, PanelLeft } from "lucide-react";
import type { Client } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Props {
  clients: Client[];
  selectedClientIds: string[];
  onToggleClient: (id: string) => void;
  onAddClient: () => void;
}

export function ClientSidebarProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex w-full">
      {children}
    </div>
  );
}

export function ClientSidebar({
  clients,
  selectedClientIds,
  onToggleClient,
  onAddClient,
}: Props) {
  const [query, setQuery] = useState("");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const filtered = clients.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        {/* User chip */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold shrink-0">
            AS
          </div>
          {!collapsed && (
            <div className="text-sm font-semibold leading-tight truncate">
              Assessor (GL)
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Section header */}
        <button
          className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-sidebar-border bg-sidebar-primary/60 hover:bg-sidebar-primary transition-colors w-full"
          onClick={onAddClient}
          title="Neue Klient/in hinzufügen"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <Users className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">Klient/innen</span>}
          </div>
          {!collapsed && <Plus className="h-4 w-4 opacity-80 shrink-0" />}
        </button>

        {/* Client list */}
        <div className="py-1">
          {filtered.map((c) => {
            const selected = selectedClientIds.includes(c.id);
            const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
            return (
              <button
                key={c.id}
                onClick={() => onToggleClient(c.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-sidebar-border/60",
                  selected
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-primary/70",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? `${c.lastName}, ${c.firstName}` : undefined}
              >
                <div className="h-7 w-7 rounded-full bg-sidebar-accent/40 flex items-center justify-center text-[10px] font-semibold shrink-0">
                  {initials}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {c.lastName}, {c.firstName}
                    </div>
                    <div className="text-[10px] opacity-70 truncate">
                      {c.topics.length} Thema{c.topics.length === 1 ? "" : "en"}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && !collapsed && (
            <div className="px-4 py-6 text-xs opacity-70">
              Keine Klient/innen gefunden.
            </div>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-sidebar-accent/40 rounded px-2 py-1.5">
          <Search className="h-4 w-4 opacity-80 shrink-0" />
          {!collapsed && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen (Ctrl+D)"
              className="bg-transparent outline-none text-sm placeholder:text-sidebar-foreground/60 w-full"
            />
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function ClientSidebarTrigger() {
  return (
    <SidebarTrigger className="h-9 w-9 p-2 hover:bg-secondary rounded">
      <PanelLeft className="h-5 w-5" />
    </SidebarTrigger>
  );
}
