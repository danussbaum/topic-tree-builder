import { useMemo, useState } from "react";
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
  Plus,
  Filter,
  Printer,
  Download,
  Save,
} from "lucide-react";
import { ClientSidebar, ClientSidebarTrigger } from "@/components/assessment/ClientSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TopicTree } from "@/components/assessment/TopicTree";
import { NodeEditor } from "@/components/assessment/NodeEditor";
import type { Client, Selection, TopicNode } from "@/types/assessment";

const uid = () => Math.random().toString(36).slice(2, 10);

const seedClients: Client[] = [
  {
    id: uid(),
    firstName: "Anna",
    lastName: "Müller",
    topics: [
      {
        id: uid(),
        title: "Förderziele KJA",
        notes:
          "Strukturierte Förderziele für die Kinder- und Jugendarbeit, gegliedert nach Leistungstypen und individuellen Massnahmen.",
        targets: [
          {
            id: uid(),
            title: "Betreuung und Wohnen 2025",
            notes:
              "Die Erreichung der gemeinsam erarbeiteten Ziele wird durch die beteiligten Personen beurteilt.",
            actions: [
              {
                id: uid(),
                title: "LZ-1 IND-2: Ressourcen aktivieren",
                notes:
                  "Die Aktivierung und Förderung des Systems sowie die Erreichung der gemeinsam erarbeiteten Ziele wurden gemeinsam reflektiert.",
              },
              {
                id: uid(),
                title: "LZ-2 IND-1: Individuelle Kontaktregelung",
                notes:
                  "Eine individuelle Kontaktregelung liegt vor und wurde kongruent umgesetzt.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: uid(),
    firstName: "Lukas",
    lastName: "Bachmann",
    topics: [
      {
        id: uid(),
        title: "Tagesstruktur",
        notes: "Aufbau einer stabilen Tages- und Wochenstruktur.",
        targets: [
          {
            id: uid(),
            title: "Schule und Ausbildung",
            notes: "Regelmässiger Schulbesuch und Lerncoaching.",
            actions: [],
          },
        ],
      },
    ],
  },
  {
    id: uid(),
    firstName: "Sara",
    lastName: "Keller",
    topics: [],
  },
  {
    id: uid(),
    firstName: "Marco",
    lastName: "Schneider",
    topics: [],
  },
];

const Index = () => {
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    seedClients[0].id,
  );
  const [selectionByClient, setSelectionByClient] = useState<
    Record<string, Selection | null>
  >({
    [seedClients[0].id]: {
      kind: "topic",
      topicId: seedClients[0].topics[0].id,
    },
  });
  const [expandedByClient, setExpandedByClient] = useState<
    Record<string, Record<string, boolean>>
  >({
    [seedClients[0].id]: {
      [seedClients[0].topics[0].id]: true,
      [`${seedClients[0].topics[0].id}:${seedClients[0].topics[0].targets[0].id}`]: true,
    },
  });

  const client = clients.find((c) => c.id === selectedClientId) ?? null;
  const selection = selectedClientId
    ? selectionByClient[selectedClientId] ?? null
    : null;
  const expanded = selectedClientId
    ? expandedByClient[selectedClientId] ?? {}
    : {};

  const setSelection = (s: Selection | null) => {
    if (!selectedClientId) return;
    setSelectionByClient((prev) => ({ ...prev, [selectedClientId]: s }));
  };

  const toggle = (id: string) => {
    if (!selectedClientId) return;
    setExpandedByClient((prev) => {
      const cur = prev[selectedClientId] ?? {};
      return { ...prev, [selectedClientId]: { ...cur, [id]: !cur[id] } };
    });
  };

  const setExpandedKeys = (updates: Record<string, boolean>) => {
    if (!selectedClientId) return;
    setExpandedByClient((prev) => ({
      ...prev,
      [selectedClientId]: { ...(prev[selectedClientId] ?? {}), ...updates },
    }));
  };

  const updateClientTopics = (
    fn: (topics: TopicNode[]) => TopicNode[],
  ) => {
    if (!selectedClientId) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClientId ? { ...c, topics: fn(c.topics) } : c,
      ),
    );
  };

  const addClient = () => {
    const c: Client = {
      id: uid(),
      firstName: "Neu",
      lastName: "Klient/in",
      topics: [],
    };
    setClients((prev) => [...prev, c]);
    setSelectedClientId(c.id);
  };

  const addTopic = () => {
    const t: TopicNode = {
      id: uid(),
      title: "Neues Thema",
      notes: "",
      targets: [],
    };
    updateClientTopics((topics) => [...topics, t]);
    setExpandedKeys({ [t.id]: true });
    setSelection({ kind: "topic", topicId: t.id });
  };

  const addTarget = (topicId: string) => {
    const targetId = uid();
    updateClientTopics((topics) =>
      topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              targets: [
                ...t.targets,
                { id: targetId, title: "Neues Ziel", notes: "", actions: [] },
              ],
            }
          : t,
      ),
    );
    setExpandedKeys({ [topicId]: true, [`${topicId}:${targetId}`]: true });
    setSelection({ kind: "target", topicId, targetId });
  };

  const addAction = (topicId: string, targetId: string) => {
    const actionId = uid();
    updateClientTopics((topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : {
                      ...tg,
                      actions: [
                        ...tg.actions,
                        { id: actionId, title: "Neue Massnahme", notes: "" },
                      ],
                    },
              ),
            },
      ),
    );
    setExpandedKeys({ [topicId]: true, [`${topicId}:${targetId}`]: true });
    setSelection({ kind: "action", topicId, targetId, actionId });
  };

  const removeNode = (s: Selection) => {
    updateClientTopics((topics) => {
      if (s.kind === "topic") return topics.filter((t) => t.id !== s.topicId);
      if (s.kind === "target")
        return topics.map((t) =>
          t.id === s.topicId
            ? { ...t, targets: t.targets.filter((tg) => tg.id !== s.targetId) }
            : t,
        );
      return topics.map((t) =>
        t.id !== s.topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== s.targetId
                  ? tg
                  : { ...tg, actions: tg.actions.filter((a) => a.id !== s.actionId) },
              ),
            },
      );
    });
    if (selection && JSON.stringify(selection) === JSON.stringify(s)) {
      setSelection(null);
    }
  };

  const updateNode = (field: "title" | "notes", value: string) => {
    if (!selection) return;
    updateClientTopics((topics) =>
      topics.map((t) => {
        if (t.id !== selection.topicId) return t;
        if (selection.kind === "topic") return { ...t, [field]: value };
        return {
          ...t,
          targets: t.targets.map((tg) => {
            if (tg.id !== selection.targetId) return tg;
            if (selection.kind === "target") return { ...tg, [field]: value };
            return {
              ...tg,
              actions: tg.actions.map((a) =>
                a.id !== selection.actionId ? a : { ...a, [field]: value },
              ),
            };
          }),
        };
      }),
    );
  };

  const updateClientName = (field: "firstName" | "lastName", value: string) => {
    if (!selectedClientId) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClientId ? { ...c, [field]: value } : c,
      ),
    );
  };

  const current = useMemo(() => {
    if (!client || !selection) return null;
    const topic = client.topics.find((t) => t.id === selection.topicId);
    if (!topic) return null;
    if (selection.kind === "topic") {
      return {
        kindLabel: "Thema",
        breadcrumbs: [topic.title || "Unbenanntes Thema"],
        title: topic.title,
        notes: topic.notes,
      };
    }
    const target = topic.targets.find((tg) => tg.id === selection.targetId);
    if (!target) return null;
    if (selection.kind === "target") {
      return {
        kindLabel: "Ziel",
        breadcrumbs: [topic.title, target.title || "Unbenanntes Ziel"],
        title: target.title,
        notes: target.notes,
      };
    }
    const action = target.actions.find((a) => a.id === selection.actionId);
    if (!action) return null;
    return {
      kindLabel: "Massnahme",
      breadcrumbs: [topic.title, target.title, action.title || "Unbenannte Massnahme"],
      title: action.title,
      notes: action.notes,
    };
  }, [selection, client]);

  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background flex w-full">
        <ClientSidebar
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          onAddClient={addClient}
        />

        <main className="flex-1 min-w-0 flex flex-col">
        {/* Top tab bar */}
        <div className="flex items-center bg-topbar text-topbar-foreground border-b border-border h-12 pr-2">
          <nav className="flex items-stretch h-full overflow-x-auto">
            {[
              { label: "Prozesse", icon: Workflow, active: true },
              { label: "Journal", icon: BookOpen },
              { label: "Aufgaben", icon: CheckSquare },
              { label: "Termine", icon: Calendar },
              { label: "Texte", icon: FileText },
              { label: "Dateien", icon: Files },
              { label: "Pflege", icon: HeartPulse },
              { label: "Systeme", icon: Network },
              { label: "Bewertungen", icon: Star },
              { label: "Kontakte", icon: Users },
              { label: "Weitere", icon: MoreHorizontal },
            ].map((t) => (
              <button
                key={t.label}
                className={
                  "px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 border-r border-border transition-colors " +
                  (t.active
                    ? "bg-topbar-active text-topbar-active-foreground"
                    : "hover:bg-secondary")
                }
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 pl-2">
            <button className="p-2 rounded hover:bg-secondary text-muted-foreground" aria-label="Hilfe">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ribbon toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 bg-secondary/60 border-b border-border">
          <RibbonButton icon={Plus} label="Neu" onClick={addTopic} />
          <RibbonDivider />
          <RibbonButton icon={Filter} label="Filter" />
          <RibbonButton icon={Save} label="Speichern" />
          <RibbonDivider />
          <RibbonButton icon={Printer} label="Drucken" />
          <RibbonButton icon={Download} label="Export" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {!client ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-lg">Wählen Sie eine Klient/in in der Navigation.</p>
            </div>
          ) : (
            <div className="px-6 lg:px-10 py-6">
              {/* Client header */}
              <div className="flex items-center gap-4 pb-5 mb-6 border-b border-border">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                  {(client.firstName[0] ?? "") + (client.lastName[0] ?? "")}
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide font-semibold text-accent mb-0.5">
                    Klient/in
                  </div>
                  <div className="flex items-baseline gap-2">
                    <input
                      value={client.firstName}
                      onChange={(e) => updateClientName("firstName", e.target.value)}
                      className="text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0 w-auto min-w-[80px]"
                    />
                    <input
                      value={client.lastName}
                      onChange={(e) => updateClientName("lastName", e.target.value)}
                      className="text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0 w-auto min-w-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Two-column: tree on left, editor on right */}
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <TopicTree
                  topics={client.topics}
                  selection={selection}
                  expanded={expanded}
                  onToggle={toggle}
                  onSelect={setSelection}
                  onAddTopic={addTopic}
                  onAddTarget={addTarget}
                  onAddAction={addAction}
                  onDelete={removeNode}
                />

                <div>
                  {current ? (
                    <NodeEditor
                      kindLabel={current.kindLabel}
                      breadcrumbs={current.breadcrumbs}
                      title={current.title}
                      notes={current.notes}
                      onTitleChange={(v) => updateNode("title", v)}
                      onNotesChange={(v) => updateNode("notes", v)}
                    />
                  ) : (
                    <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded">
                      <p>Wählen Sie einen Knoten in der Baumstruktur oder fügen Sie ein neues Thema hinzu.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </SidebarProvider>
  );
};

function RibbonButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors min-w-[64px]"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function RibbonDivider() {
  return <div className="w-px h-10 bg-border mx-1" />;
}

export default Index;
