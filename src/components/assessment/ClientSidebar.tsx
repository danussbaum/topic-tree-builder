import { Search, Users, Plus, ChevronLeft, Star, User } from "lucide-react";
import type { Client } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface Props {
  clients: Client[];
  selectedClientIds: string[];
  onToggleClient: (id: string) => void;
  onToggleAllClients: () => void;
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
  onToggleAllClients,
  onAddClient,
}: Props) {
  const [query, setQuery] = useState("");
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const filtered = clients.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()),
  );
  const allClientsSelected =
    clients.length > 0 && clients.every((c) => selectedClientIds.includes(c.id));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border text-white" style={{ backgroundColor: "hsl(158 28% 32%)" }}>
        {/* User chip */}
        <div className="flex items-center gap-3 px-2 py-2">
          <User className="h-5 w-5 shrink-0" strokeWidth={1.25} />
          {!collapsed && (
            <div className="text-sm leading-tight truncate">
              Assessor (GL)
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Section header */}
        <div className="flex items-center border-b border-sidebar-border" style={{ backgroundColor: "#666666" }}>
          <button
            className={cn(
              "min-w-0 flex-1 flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-black/10",
              collapsed && "justify-center px-2",
            )}
            onClick={onToggleAllClients}
            title={allClientsSelected ? "Alle Klient/innen deselektieren" : "Alle Klient/innen selektieren"}
            aria-pressed={allClientsSelected}
          >
            {collapsed ? <Users className="h-4 w-4 shrink-0" /> : <span className="truncate">Klient/innen</span>}
          </button>
          {!collapsed && (
            <button
              className="p-2.5 text-white hover:bg-black/10 transition-colors"
              onClick={onAddClient}
              title="Neue Klient/in hinzufügen"
              aria-label="Neue Klient/in hinzufügen"
            >
              <Plus className="h-4 w-4 opacity-80 shrink-0" />
            </button>
          )}
        </div>

        {/* Client list */}
        <div className="py-1">
          {filtered.map((c) => {
            const selected = selectedClientIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => onToggleClient(c.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-sidebar-border/60 border-l-2",
                  selected
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary"
                    : "border-l-transparent hover:bg-sidebar-primary/70",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? `${c.lastName}, ${c.firstName}` : undefined}
              >
                {!collapsed && (
                  <>
                    <Star className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {c.lastName}, {c.firstName}
                      </div>
                    </div>
                  </>
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

      <SidebarFooter className="border-t border-sidebar-border p-3" style={{ backgroundColor: "hsl(158 28% 32%)" }}>
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          {/* Search */}
          {!collapsed && (
            <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 min-w-0 flex-1">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suchen"
                className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full min-w-0"
              />
            </div>
          )}
          {/* Collapse trigger */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="shrink-0 p-1.5 rounded hover:bg-black/10 transition-colors text-white"
            title={collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function ClientSidebarTrigger() {
  return (
    <SidebarTrigger className="h-9 w-9 p-2 hover:bg-secondary rounded self-center">
      <PanelLeft className="h-5 w-5" />
    </SidebarTrigger>
  );
}
