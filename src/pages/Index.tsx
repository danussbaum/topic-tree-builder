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
  Download,
  Upload,
  ListTodo,
  ClipboardCheck,
} from "lucide-react";
import { ClientSidebar, ClientSidebarTrigger } from "@/components/assessment/ClientSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import { ConfirmationFilterPanel, type ConfirmationFilters, type ConfirmationPeriod } from "@/components/assessment/ConfirmationFilterPanel";
import type { ActionNode, Client, TopicNode } from "@/types/assessment";
import {
  DEFAULT_ASSESSMENT_FILTER,
  matchesAssessmentFilter,
  type AssessmentFilterModel,
} from "@/types/assessment-filter";
import { cn } from "@/lib/utils";
import { createSimpleXlsxBlob } from "@/lib/xlsx";
import {
  getConfirmationFilterForShowConfirmed,
  matchesConfirmationFilter,
} from "@/lib/confirmationFilter";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayLocalISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


interface ClientNameInputProps {
  value: string;
  label: string;
  onChange: (value: string) => void;
}

const ClientNameInput = ({ value, label, onChange }: ClientNameInputProps) => (
  <span className="relative inline-block align-baseline">
    <span
      className="invisible whitespace-pre text-2xl font-semibold"
      aria-hidden="true"
    >
      {value || " "}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="absolute inset-0 w-full min-w-0 text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0"
    />
  </span>
);

const hasVisibleConfirmationItems = (
  client: Client,
  selectedDate: string,
  period: ConfirmationPeriod,
  filterModel: AssessmentFilterModel,
) => {
  return getVisibleConfirmationItems(client, selectedDate, period, filterModel).length > 0;
};

const getVisibleConfirmationItems = (
  client: Client,
  selectedDate: string,
  period: ConfirmationPeriod,
  filterModel: AssessmentFilterModel,
) => {
  const items: Array<{
    topic: TopicNode;
    target: { id: string; title: string; notes: string };
    action: ActionNode;
  }> = [];

  const { start, end } = getPeriodRange(selectedDate, period);
  const filter = getConfirmationFilterForShowConfirmed(showConfirmed);

  client.topics.forEach((topic) => {
    topic.targets.forEach((target) => {
      target.actions.forEach((action) => {
        if (action.validFrom && action.validFrom > end) return;
        if (action.validTo && action.validTo < start) return;

        const status = getStatusForPeriod(action, selectedDate, period);
        if (
          !matchesConfirmationFilter(
            {
              status,
              plannedMinutes: action.plannedMinutes,
            },
            filter,
          )
        ) {
          return;
        }
        if (!matchesAssessmentFilter({ action, status }, filterModel)) return;

        items.push({ topic, target, action });
      });
    });
  });

  return items;
};

const getDueDatesInPeriod = (
  action: ActionNode,
  selectedDate: string,
  period: ConfirmationPeriod,
) => {
  if (period === "day") return [selectedDate];

  const { start, end } = getPeriodRange(selectedDate, period);
  const dueDates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (current <= endDate) {
    const day = dateToISO(current);
    if ((!action.validFrom || day >= action.validFrom) && (!action.validTo || day <= action.validTo)) {
      dueDates.push(day);
    }
    current.setDate(current.getDate() + 1);
  }

  return dueDates;
};

const getVisibleConfirmationRows = (
  client: Client,
  selectedDate: string,
  period: ConfirmationPeriod,
  filterModel: AssessmentFilterModel,
) => {
  const rows: Array<{
    dueDate: string;
    topic: TopicNode;
    target: { id: string; title: string; notes: string };
    action: ActionNode;
    status: ActionNode["status"];
  }> = [];

  const { start, end } = getPeriodRange(selectedDate, period);
  const filter = getConfirmationFilterForShowConfirmed(showConfirmed);

  client.topics.forEach((topic) => {
    topic.targets.forEach((target) => {
      target.actions.forEach((action) => {
        if (action.validFrom && action.validFrom > end) return;
        if (action.validTo && action.validTo < start) return;

        const dueDates = getDueDatesInPeriod(action, selectedDate, period);
        dueDates.forEach((dueDate) => {
          const confirmation = action.confirmations?.[dueDate];
          const status = confirmation?.status || "open";
          if (
            !matchesConfirmationFilter(
              {
                status,
                plannedMinutes: action.plannedMinutes,
                actualMinutes: confirmation?.actualMinutes,
              },
              filter,
            )
          ) {
            return;
          }
          if (!matchesAssessmentFilter({ action, status, confirmation }, filterModel)) return;
          rows.push({ dueDate, topic, target, action, status });
        });
      });
    });
  });

  return rows;
};

const dateToISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStartDate = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

const getPeriodRange = (selectedDate: string, period: ConfirmationPeriod) => {
  const date = new Date(`${selectedDate}T00:00:00`);
  if (period === "day") {
    return { start: selectedDate, end: selectedDate };
  }
  if (period === "week") {
    const start = getWeekStartDate(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: dateToISO(start), end: dateToISO(end) };
  }
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: dateToISO(start), end: dateToISO(end) };
};

const getStatusForPeriod = (
  action: ActionNode,
  selectedDate: string,
  period: ConfirmationPeriod,
) => {
  if (period === "day") {
    return action.confirmations?.[selectedDate]?.status || "open";
  }

  const { start, end } = getPeriodRange(selectedDate, period);
  const entries = Object.entries(action.confirmations || {}).filter(
    ([date, confirmation]) =>
      date >= start && date <= end && confirmation.status !== "open",
  );

  if (entries.length === 0) return "open";

  const latestEntry = entries.sort(([a], [b]) => b.localeCompare(a))[0];
  return latestEntry?.[1].status || "open";
};

const getWeekValue = (selectedDate: string) => {
  const date = new Date(`${selectedDate}T00:00:00`);
  const start = getWeekStartDate(date);
  const thursday = new Date(start);
  thursday.setDate(start.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstThursdayWeekStart = getWeekStartDate(firstThursday);
  const diffInDays = Math.round(
    (thursday.getTime() - firstThursdayWeekStart.getTime()) / 86400000,
  );
  const week = Math.floor(diffInDays / 7) + 1;
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
};


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
          "Strukturierte Förderziele für die Kinder- und Jugendarbeit, gegliedert nach Leistungstypen und individuellen Handlungn.",
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
  const [selectedDate, setSelectedDate] = useState<string>(todayLocalISO());
  const [confirmationPeriod, setConfirmationPeriod] = useState<ConfirmationPeriod>("day");
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([
    seedClients[0].id,
  ]);
  const [confirmationFilter, setConfirmationFilter] =
    useState<AssessmentFilterModel>(DEFAULT_ASSESSMENT_FILTER);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftShowConfirmed, setDraftShowConfirmed] = useState(showConfirmed);

  const selectedClients = clients.filter((c) => selectedClientIds.includes(c.id));
  const visibleSelectedClients =
    viewMode === "confirmation"
      ? selectedClients.filter((client) =>
          hasVisibleConfirmationItems(
            client,
            selectedDate,
            confirmationPeriod,
            confirmationFilter,
          ),
        )
      : selectedClients;

  const toggleClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAllClients = () => {
    setSelectedClientIds((prev) => {
      const clientIds = clients.map((c) => c.id);
      const allSelected =
        clientIds.length > 0 && clientIds.every((id) => prev.includes(id));

      return allSelected ? [] : clientIds;
    });
  };

  const updateClientTopicsFor = (
    clientId: string,
    fn: (topics: TopicNode[]) => TopicNode[],
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, topics: fn(c.topics) } : c)),
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
    setSelectedClientIds((prev) => [...prev, c.id]);
  };

  const addTopic = (clientId: string) => {
    updateClientTopicsFor(clientId, (topics) => [
      ...topics,
      { id: uid(), title: "", notes: "", targets: [] },
    ]);
  };

  const addTarget = (clientId: string, topicId: string) => {
    updateClientTopicsFor(clientId, (topics) =>
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

  const addAction = (clientId: string, topicId: string, targetId: string) => {
    updateClientTopicsFor(clientId, (topics) =>
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

  const updateTopic = (
    clientId: string,
    topicId: string,
    field: "title" | "notes",
    value: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) => (t.id === topicId ? { ...t, [field]: value } : t)),
    );
  };

  const updateTarget = (
    clientId: string,
    topicId: string,
    targetId: string,
    field: "title" | "notes",
    value: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
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
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    field: "title" | "notes" | "requiredResources",
    value: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
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
                        a.id === actionId
                          ? Object.keys(a.confirmations ?? {}).length > 0
                            ? a
                            : { ...a, [field]: value }
                          : a,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const updateActionField = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    field:
      | "plannedMinutes"
      | "requiredPersons"
      | "resultRequirement"
      | "actualMinutes"
      | "reason"
      | "dayPart"
      | "validFrom"
      | "validTo"
      | "observations",
    value: number | string | undefined,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
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
                        a.id === actionId
                          ? Object.keys(a.confirmations ?? {}).length > 0
                            ? a
                            : { ...a, [field]: value }
                          : a,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const confirmAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    payload:
      | { status: "done_as_planned"; result?: string; observations?: string }
      | { status: "done_with_deviation"; actualMinutes: number; reason: string; result?: string; observations?: string }
      | { status: "not_done"; reason: string }
      | { status: "open" },
    date?: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
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
                        if (!date) return a;

                        const nextConfirmations = { ...(a.confirmations || {}) };

                        if (payload.status === "open") {
                          delete nextConfirmations[date];
                        } else if (payload.status === "done_as_planned") {
                          nextConfirmations[date] = {
                            status: "done_as_planned",
                            done: true,
                            actualMinutes: a.plannedMinutes,
                            result: payload.result,
                            observations: payload.observations,
                          };
                        } else if (payload.status === "done_with_deviation") {
                          nextConfirmations[date] = {
                            status: "done_with_deviation",
                            done: true,
                            actualMinutes: payload.actualMinutes,
                            reason: payload.reason,
                            result: payload.result,
                            observations: payload.observations,
                          };
                        } else if (payload.status === "not_done") {
                          nextConfirmations[date] = {
                            status: "not_done",
                            done: true,
                            reason: payload.reason,
                          };
                        }

                        return { ...a, confirmations: nextConfirmations };
                      }),
                    },
              ),
            },
      ),
    );
  };

  const deleteTopic = (clientId: string, topicId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const topic = client?.topics.find((t) => t.id === topicId);
    const hasTargets = (topic?.targets.length ?? 0) > 0;

    if (
      hasTargets &&
      !window.confirm(
        "Dieser Schwerpunkt enthält Ziele. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?",
      )
    ) {
      return;
    }

    updateClientTopicsFor(clientId, (topics) => topics.filter((t) => t.id !== topicId));
  };

  const deleteTarget = (clientId: string, topicId: string, targetId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const topic = client?.topics.find((t) => t.id === topicId);
    const target = topic?.targets.find((tg) => tg.id === targetId);
    const hasActions = (target?.actions.length ?? 0) > 0;

    if (
      hasActions &&
      !window.confirm(
        "Dieses Ziel enthält Handlungen. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?",
      )
    ) {
      return;
    }

    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : { ...t, targets: t.targets.filter((tg) => tg.id !== targetId) },
      ),
    );
  };

  const deleteAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
  ) => {
    const client = clients.find((c) => c.id === clientId);
    const topic = client?.topics.find((t) => t.id === topicId);
    const target = topic?.targets.find((tg) => tg.id === targetId);
    const action = target?.actions.find((a) => a.id === actionId);
    const hasConfirmedActions = Object.keys(action?.confirmations ?? {}).length > 0;

    if (
      hasConfirmedActions &&
      !window.confirm(
        "Diese geplante Handlung hat bereits bestätigte Einträge. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?",
      )
    ) {
      return;
    }

    updateClientTopicsFor(clientId, (topics) =>
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
  };

  const updateClientName = (
    clientId: string,
    field: "firstName" | "lastName",
    value: string,
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, [field]: value } : c)),
    );
  };

  const shiftDate = (step: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    if (confirmationPeriod === "day") {
      d.setDate(d.getDate() + step);
    } else if (confirmationPeriod === "week") {
      d.setDate(d.getDate() + step * 7);
    } else {
      d.setMonth(d.getMonth() + step);
      d.setDate(1);
    }
    setSelectedDate(dateToISO(d));
  };

  const exportConfirmationExcel = () => {
    if (viewMode !== "confirmation") return;

    const rows = selectedClients.flatMap((client) =>
      getVisibleConfirmationRows(
        client,
        selectedDate,
        confirmationPeriod,
        confirmationFilter,
      ).map(({ dueDate, topic, target, action, status }) => {
        const confirmation = action.confirmations?.[dueDate];
        return {
          Datum: dueDate,
          "Klient/in": `${client.firstName} ${client.lastName}`.trim(),
          Schwerpunkt: topic.title,
          Ziel: target.title,
          Handlung: action.title,
          Beschreibung: action.notes,
          Hilfsmittel: action.requiredResources ?? "",
          Status:
            status === "done_as_planned"
              ? "Wie geplant durchgeführt"
              : status === "done_with_deviation"
                ? "Mit Abweichung durchgeführt"
                : status === "not_done"
                  ? "Nicht durchgeführt"
                  : "Offen",
          Grund: confirmation?.reason ?? "",
          Resultat: confirmation?.result ?? "",
          Beobachtungen: confirmation?.observations ?? "",
          "Gültig ab": action.validFrom ?? "",
          "Gültig bis": action.validTo ?? "",
          "Tageszeit": action.dayPart ?? "",
          "Minuten geplant": action.plannedMinutes ?? "",
          "Minuten tatsächlich": confirmation?.actualMinutes ?? "",
        };
      }),
    );

    const allHeaders = [
      "Datum",
      "Klient/in",
      "Schwerpunkt",
      "Ziel",
      "Handlung",
      "Beschreibung",
      "Hilfsmittel",
      "Status",
      "Grund",
      "Resultat",
      "Beobachtungen",
      "Gültig ab",
      "Gültig bis",
      "Tageszeit",
      "Minuten geplant",
      "Minuten tatsächlich",
    ];

    const dateHeaders = new Set(["Datum", "Gültig ab", "Gültig bis"]);
    const numberHeaders = new Set(["Minuten geplant", "Minuten tatsächlich"]);

    const blob = createSimpleXlsxBlob({
      sheetName: "Bestätigungen",
      headers: allHeaders,
      rows: rows.map((row) =>
        allHeaders.map((header) => {
          const value = row[header as keyof typeof row] ?? "";

          if (value === "") return "";
          if (dateHeaders.has(header)) return { type: "date" as const, value: String(value) };
          if (numberHeaders.has(header)) return { type: "number" as const, value };

          return value;
        }),
      ),
    });
    const periodLabel =
      confirmationPeriod === "day"
        ? selectedDate
        : confirmationPeriod === "week"
          ? (() => {
              const [year, week] = getWeekValue(selectedDate).split("-W");
              return `KW${week}-${year}`;
            })()
          : selectedDate.slice(0, 7);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bestaetigungen_alle_${periodLabel}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background flex w-full">
        <ClientSidebar
          clients={clients}
          selectedClientIds={selectedClientIds}
          onToggleClient={toggleClient}
          onToggleAllClients={toggleAllClients}
          onAddClient={addClient}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top tab bar */}
          <div className="flex items-center bg-topbar text-topbar-foreground border-b border-border h-12 pr-2">
            <nav className="flex items-stretch h-full overflow-x-auto">
              {[
                { label: "Handlungsplanung", icon: Workflow, active: true },
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
            <RibbonButton
              icon={Plus}
              label="Neuer Schwerpunkt"
              disabled={selectedClients.length !== 1 || viewMode === "confirmation"}
              onClick={() => {
                if (selectedClients[0]) addTopic(selectedClients[0].id);
              }}
            />
            <RibbonDivider />
            <RibbonButton
              icon={ListTodo}
              label="Planung"
              onClick={() => {
                setViewMode("planning");
                setIsFilterOpen(false);
              }}
              disabled={viewMode === "planning"}
              active={viewMode === "planning"}
            />
            <RibbonButton
              icon={ClipboardCheck}
              label="Bestätigung"
              onClick={() => setViewMode("confirmation")}
              disabled={viewMode === "confirmation"}
              active={viewMode === "confirmation"}
            />
            <RibbonDivider />
            <RibbonButton
              icon={Filter}
              label="Filter"
              onClick={() => setIsFilterPanelOpen(true)}
              disabled={viewMode !== "confirmation"}
              onClick={() => {
                if (viewMode !== "confirmation") return;
                setDraftShowConfirmed(showConfirmed);
                setIsFilterOpen(true);
              }}
              disabled={viewMode === "planning"}
              active={viewMode === "confirmation"}
            />
            <RibbonDivider />
            <RibbonButton
              icon={Download}
              label="Import"
              disabled={viewMode === "confirmation"}
            />
            <RibbonButton
              icon={Upload}
              label="Export"
              onClick={exportConfirmationExcel}
              disabled={viewMode !== "confirmation"}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-background">
            {isFilterOpen && viewMode === "confirmation" && (
              <div className="px-6 lg:px-10 pt-4 max-w-4xl mx-auto">
                <div className="rounded-lg border border-border bg-background shadow-sm p-4 flex flex-col gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">Filter</h2>
                    <p className="text-xs text-muted-foreground">
                      Änderungen werden erst nach „Anwenden“ übernommen.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draftShowConfirmed}
                      onChange={(e) => setDraftShowConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Bestätigte anzeigen
                  </label>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="h-9 px-3 rounded border border-border text-sm hover:bg-secondary"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Abbrechen
                    </button>
                    <button
                      className="h-9 px-3 rounded bg-primary text-primary-foreground text-sm hover:opacity-90"
                      onClick={() => {
                        setShowConfirmed(draftShowConfirmed);
                        setIsFilterOpen(false);
                      }}
                    >
                      Anwenden
                    </button>
                  </div>
                </div>
              </div>
            )}
            {selectedClients.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-lg">Wählen Sie eine oder mehrere Klient/innen in der Navigation.</p>
              </div>
            ) : (
              <div className="px-6 lg:px-10 py-6 max-w-4xl mx-auto space-y-10">
                {viewMode === "confirmation" && (
                  <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-border sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Zeitraum:</span>
                        <span className="font-medium">
                          {confirmationPeriod === "day"
                            ? "Tag"
                            : confirmationPeriod === "week"
                              ? "Woche"
                              : "Monat"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-background border border-border rounded-md p-1">
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-secondary"
                          onClick={() => shiftDate(-1)}
                          aria-label={
                            confirmationPeriod === "day"
                              ? "Vorheriger Tag"
                              : confirmationPeriod === "week"
                                ? "Vorherige Woche"
                                : "Vorheriger Monat"
                          }
                        >
                          ‹
                        </button>
                        <span className="min-w-36 text-center text-sm px-2">
                          {confirmationPeriod === "day"
                            ? selectedDate
                            : confirmationPeriod === "week"
                              ? getWeekValue(selectedDate)
                              : selectedDate.slice(0, 7)}
                        </span>
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-secondary"
                          onClick={() => shiftDate(1)}
                          aria-label={
                            confirmationPeriod === "day"
                              ? "Nächster Tag"
                              : confirmationPeriod === "week"
                                ? "Nächste Woche"
                                : "Nächster Monat"
                          }
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={confirmationFilter.statuses.length > 1}
                          onChange={(e) =>
                            setConfirmationFilter((prev) => ({
                              ...prev,
                              statuses: e.target.checked
                                ? ["open", "done_as_planned", "done_with_deviation", "not_done"]
                                : ["open"],
                            }))
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Bestätigte anzeigen
                      </label>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {showConfirmed ? "Bestätigte inklusiv" : "Nur offene Einträge"}
                    <div className="text-sm text-muted-foreground">
                      Filter: {showConfirmed ? "Bestätigte sichtbar" : "Nur offene Einträge"}
                    </div>
                  </div>
                )}

                {visibleSelectedClients.map((client) => (
                  <section key={client.id} className="space-y-6">
                    {/* Client header */}
                    <div className="flex items-center gap-4 pb-5 border-b border-border">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-0">
                          <ClientNameInput
                            value={client.firstName}
                            label="Vorname"
                            onChange={(value) => updateClientName(client.id, "firstName", value)}
                          />
                          <span
                            className="whitespace-pre text-2xl font-semibold"
                            aria-hidden="true"
                          >
                            {" "}
                          </span>
                          <ClientNameInput
                            value={client.lastName}
                            label="Nachname"
                            onChange={(value) => updateClientName(client.id, "lastName", value)}
                          />
                        </div>
                      </div>
                    </div>

                    <AssessmentOutline
                      viewMode={viewMode}
                      selectedDate={selectedDate}
                      onSelectedDateChange={setSelectedDate}
                      confirmationPeriod={confirmationPeriod}
                      topics={client.topics}
                      hideConfirmationHeader
                      filterModel={confirmationFilter}
                      onUpdateTopic={(topicId, field, value) =>
                        updateTopic(client.id, topicId, field, value)
                      }
                      onUpdateTarget={(topicId, targetId, field, value) =>
                        updateTarget(client.id, topicId, targetId, field, value)
                      }
                      onUpdateAction={(topicId, targetId, actionId, field, value) =>
                        updateAction(client.id, topicId, targetId, actionId, field, value)
                      }
                      onUpdateActionField={(topicId, targetId, actionId, field, value) =>
                        updateActionField(client.id, topicId, targetId, actionId, field, value)
                      }
                      onConfirmAction={(topicId, targetId, actionId, payload, date) =>
                        confirmAction(client.id, topicId, targetId, actionId, payload, date)
                      }
                      onAddTopic={() => addTopic(client.id)}
                      onAddTarget={(topicId) => addTarget(client.id, topicId)}
                      onAddAction={(topicId, targetId) => addAction(client.id, topicId, targetId)}
                      onDeleteTopic={(topicId) => deleteTopic(client.id, topicId)}
                      onDeleteTarget={(topicId, targetId) =>
                        deleteTarget(client.id, topicId, targetId)
                      }
                      onDeleteAction={(topicId, targetId, actionId) =>
                        deleteAction(client.id, topicId, targetId, actionId)
                      }
                    />
                  </section>
                ))}
              </div>
            )}
          </div>

          <ConfirmationFilterPanel
            open={isFilterPanelOpen}
            onOpenChange={setIsFilterPanelOpen}
            initialFilters={{
              selectedDate,
              confirmationPeriod,
              showConfirmed,
            }}
            onApply={(filters: ConfirmationFilters) => {
              setSelectedDate(filters.selectedDate);
              setConfirmationPeriod(filters.confirmationPeriod);
              setShowConfirmed(filters.showConfirmed);
            }}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

function RibbonButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-24 flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded transition-colors",
        active
          ? "bg-secondary text-foreground shadow-sm disabled:opacity-100"
          : "text-foreground/80 hover:bg-secondary hover:text-foreground",
        "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/80 disabled:cursor-not-allowed",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-center text-[11px] font-medium leading-tight whitespace-normal break-words">
        {label}
      </span>
    </button>
  );
}

function RibbonDivider() {
  return <div className="w-px h-10 bg-border mx-1" />;
}

export default Index;
