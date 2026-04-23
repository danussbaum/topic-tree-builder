import { useState } from "react";
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
  ListTodo,
  ClipboardCheck,
} from "lucide-react";
import { ClientSidebar, ClientSidebarTrigger } from "@/components/assessment/ClientSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionStatus, Client, TopicNode } from "@/types/assessment";
import { cn } from "@/lib/utils";

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
                  "Die Aktivierung und Förderung des Systems wurde gemeinsam reflektiert.",
                plannedMinutes: 45,
                actualMinutes: 60,
                reason: "Gespräch mit Familie länger als geplant.",
                status: "done_with_deviation",
                done: true,
              },
              {
                id: uid(),
                title: "LZ-2 IND-1: Individuelle Kontaktregelung",
                notes:
                  "Eine individuelle Kontaktregelung liegt vor und wurde kongruent umgesetzt.",
                plannedMinutes: 30,
                status: "open",
                done: false,
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
  { id: uid(), firstName: "Sara", lastName: "Keller", topics: [] },
  { id: uid(), firstName: "Marco", lastName: "Schneider", topics: [] },
];

const Index = () => {
  const [viewMode, setViewMode] = useState<"planning" | "confirmation">("planning");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    seedClients[0].id,
  );

  const client = clients.find((c) => c.id === selectedClientId) ?? null;

  const updateClientTopics = (fn: (topics: TopicNode[]) => TopicNode[]) => {
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
    updateClientTopics((topics) => [
      ...topics,
      { id: uid(), title: "", notes: "", targets: [] },
    ]);
  };

  const addTarget = (topicId: string) => {
    updateClientTopics((topics) =>
      topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              targets: [
                ...t.targets,
                { id: uid(), title: "", notes: "", actions: [] },
              ],
            }
          : t,
      ),
    );
  };

  const addAction = (topicId: string, targetId: string) => {
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
                        {
                          id: uid(),
                          title: "",
                          notes: "",
                          status: "open",
                          done: false,
                          validFrom: new Date().toISOString().slice(0, 10),
                        },
                      ],
                    },
              ),
            },
      ),
    );
  };

  const updateTopic = (topicId: string, field: "title" | "notes", value: string) => {
    updateClientTopics((topics) =>
      topics.map((t) => (t.id === topicId ? { ...t, [field]: value } : t)),
    );
  };

  const updateTarget = (
    topicId: string,
    targetId: string,
    field: "title" | "notes",
    value: string,
  ) => {
    updateClientTopics((topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id === targetId ? { ...tg, [field]: value } : tg,
              ),
            },
      ),
    );
  };

  const updateAction = (
    topicId: string,
    targetId: string,
    actionId: string,
    field: "title" | "notes",
    value: string,
  ) => {
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
                      actions: tg.actions.map((a) =>
                        a.id === actionId ? { ...a, [field]: value } : a,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const updateActionField = (
    topicId: string,
    targetId: string,
    actionId: string,
    field: "plannedMinutes" | "actualMinutes" | "reason" | "dayPart" | "validFrom" | "validTo" | "observations",
    value: number | string | undefined,
  ) => {
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
                      actions: tg.actions.map((a) =>
                        a.id === actionId ? { ...a, [field]: value } : a,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const confirmAction = (
    topicId: string,
    targetId: string,
        actionId: string,
    payload:
      | { status: "done_as_planned"; observations?: string }
      | { status: "done_with_deviation"; actualMinutes: number; reason: string; observations?: string }
      | { status: "not_done"; reason: string }
      | { status: "open" },
    date?: string,
  ) => {
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
                      actions: tg.actions.map((a) => {
                        if (a.id !== actionId) return a;
                        
                        // If no date provided, we might still want to support the old global status or just ignore
                        if (!date) return a;

                        const nextConfirmations = { ...(a.confirmations || {}) };

                        if (payload.status === "open") {
                          delete nextConfirmations[date];
                        } else if (payload.status === "done_as_planned") {
                          nextConfirmations[date] = {
                            status: "done_as_planned",
                            done: true,
                            actualMinutes: a.plannedMinutes,
                            observations: payload.observations,
                          };
                        } else if (payload.status === "done_with_deviation") {
                          nextConfirmations[date] = {
                            status: "done_with_deviation",
                            done: true,
                            actualMinutes: payload.actualMinutes,
                            reason: payload.reason,
                            observations: payload.observations,
                          };
                        } else if (payload.status === "not_done") {
                          nextConfirmations[date] = {
                            status: "not_done",
                            done: true,
                            reason: payload.reason,
                          };
                        }

                        return {
                          ...a,
                          confirmations: nextConfirmations,
                        };
                      }),
                    },
              ),
            },
      ),
    );
  };

  const deleteTopic = (topicId: string) =>
    updateClientTopics((topics) => topics.filter((t) => t.id !== topicId));

  const deleteTarget = (topicId: string, targetId: string) =>
    updateClientTopics((topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : { ...t, targets: t.targets.filter((tg) => tg.id !== targetId) },
      ),
    );

  const deleteAction = (topicId: string, targetId: string, actionId: string) =>
    updateClientTopics((topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : { ...tg, actions: tg.actions.filter((a) => a.id !== actionId) },
              ),
            },
      ),
    );

  const updateClientName = (field: "firstName" | "lastName", value: string) => {
    if (!selectedClientId) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClientId ? { ...c, [field]: value } : c,
      ),
    );
  };

  // Stats: total / done actions
  const stats = (() => {
    if (!client) return { total: 0, done: 0 };
    let total = 0,
      done = 0;
    client.topics.forEach((t) =>
      t.targets.forEach((tg) =>
        tg.actions.forEach((a) => {
          total++;
          if (a.done) done++;
        }),
      ),
    );
    return { total, done };
  })();

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
              <button
                className="p-2 rounded hover:bg-secondary text-muted-foreground"
                aria-label="Hilfe"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Ribbon toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 bg-secondary/60 border-b border-border">
            <div className="flex items-center gap-1 pr-2 border-r border-border mr-1">
              <ClientSidebarTrigger />
            </div>
            <RibbonButton icon={Plus} label="Neues Thema" onClick={addTopic} />
            <RibbonDivider />
            <div className="flex items-center gap-1 bg-background/50 p-1 rounded-md border border-border">
              <button
                onClick={() => setViewMode("planning")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  viewMode === "planning"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <ListTodo className="h-4 w-4" />
                Planung
              </button>
              <button
                onClick={() => setViewMode("confirmation")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  viewMode === "confirmation"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <ClipboardCheck className="h-4 w-4" />
                Bestätigung
              </button>
            </div>
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
              <div className="px-6 lg:px-10 py-6 max-w-4xl mx-auto">
                {/* Client header */}
                <div className="flex items-center gap-4 pb-5 mb-8 border-b border-border">
                  <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                    {(client.firstName[0] ?? "") + (client.lastName[0] ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
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
                  {stats.total > 0 && (
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                        Massnahmen
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {stats.done}<span className="text-muted-foreground">/{stats.total}</span>
                      </div>
                    </div>
                  )}
                </div>

                                <AssessmentOutline
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                  onSelectedDateChange={setSelectedDate}
                  topics={client.topics}
                  onUpdateTopic={updateTopic}
                  onUpdateTarget={updateTarget}
                  onUpdateAction={updateAction}
                  onUpdateActionField={updateActionField}
                  onConfirmAction={confirmAction}
                  onAddTopic={addTopic}
                  onAddTarget={addTarget}
                  onAddAction={addAction}
                  onDeleteTopic={deleteTopic}
                  onDeleteTarget={deleteTarget}
                  onDeleteAction={deleteAction}
                />
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
