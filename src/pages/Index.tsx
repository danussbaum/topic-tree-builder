import { useEffect, useRef, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import { ApplicationLogoutButton } from "@/components/ApplicationLogoutButton";
import type {
  ActionNode,
  ActionServiceType,
  Client,
  DayPart,
  TopicNode,
  Weekday,
} from "@/types/assessment";
import { DAY_PART_LABEL, DAY_PART_SELECT_OPTIONS } from "@/types/assessment";
import {
  matchesAssessmentFilter,
  type AssessmentFilterModel,
  type NumericComparison,
} from "@/types/assessment-filter";
import { cn } from "@/lib/utils";
import { createSimpleXlsxBlob } from "@/lib/xlsx";
import {
  buildDefaultTemplateFields,
  getActionServiceTypeLabel,
  loadActionPlanTemplates,
} from "@/lib/action-plan-templates";
import {
  DEFAULT_LAST_N_DAYS,
  loadCachedAssessmentState,
  saveCachedAssessmentState,
  type CachedAssessmentState,
  type ConfirmationPeriod,
} from "@/lib/assessment-cache";
import {
  initialActionPlanDisciplines,
  loadActionPlanDisciplines,
} from "@/lib/action-plan-disciplines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayLocalISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const OPERATOR_OPTIONS: Array<{ value: NumericComparison["op"]; label: ">" | "<" | "=" }> = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "eq", label: "=" },
];

const COMPACT_FILTER_INPUT_CLASS = "h-8 px-2 text-xs";
const COMPACT_FILTER_SELECT_CLASS = "h-8 px-2 text-xs";

const INITIAL_CONFIRMATION_FILTER: AssessmentFilterModel = {
  statuses: ["open", "postponed"],
};

const DEFAULT_SEED_DISCIPLINE_ID = "discipline-kja-foerderplanung";

const clampLastNDays = (value: number) => Math.max(1, Math.floor(value));
const CONFIRMED_STATUSES: ActionNode["status"][] = [
  "done_as_planned",
  "done_with_deviation",
  "not_done",
];
const OPEN_CONFIRMATION_STATUSES: ActionNode["status"][] = ["open", "postponed"];

const WEEKDAY_TO_INDEX: Record<Weekday, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

const isTargetVisibleInPlanning = (target: TopicNode["targets"][number], today: string) => {
  if (target.actions.length === 0) return true;
  if (target.actions.some((action) => !action.validFrom)) return true;
  return target.actions.some(
    (action) =>
      action.validFrom != null &&
      action.validFrom <= today &&
      (!action.validTo || today <= action.validTo),
  );
};

const isRecurringOnDate = (action: ActionNode, date: Date) => {
  if (action.recurrence === "daily") return true;

  if (action.recurrence === "weekly") {
    return (action.recurrenceWeekdays ?? []).some(
      (weekday) => WEEKDAY_TO_INDEX[weekday] === date.getDay(),
    );
  }

  if (action.recurrence === "monthly") {
    const pattern = action.recurrenceMonthlyPattern;
    if (!pattern) return false;

    const currentDay = date.getDate();
    const dayOfWeek = date.getDay();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    if (pattern === "first_day") return currentDay === 1;
    if (pattern === "last_day") return currentDay === lastOfMonth.getDate();

    if (pattern === "first_monday") {
      const offset = (8 - firstOfMonth.getDay()) % 7;
      return dayOfWeek === 1 && currentDay === 1 + offset;
    }

    if (pattern === "last_friday") {
      const offset = (lastOfMonth.getDay() - 5 + 7) % 7;
      return dayOfWeek === 5 && currentDay === lastOfMonth.getDate() - offset;
    }
  }

  return false;
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
  lastNDays: number = DEFAULT_LAST_N_DAYS,
  transientUnplannedActionIds: Set<string> = new Set(),
) => {
  return getVisibleConfirmationRows(client, selectedDate, period, filterModel, lastNDays, transientUnplannedActionIds).length > 0;
};

const getDueDatesInPeriod = (
  action: ActionNode,
  selectedDate: string,
  period: ConfirmationPeriod,
  lastNDays: number = DEFAULT_LAST_N_DAYS,
) => {
  if (!action.recurrence) return [];

  if (period === "day") {
    const selected = new Date(`${selectedDate}T00:00:00`);
    return isRecurringOnDate(action, selected) ? [selectedDate] : [];
  }

  const { start, end } = getPeriodRange(selectedDate, period, lastNDays);
  const dueDates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (current <= endDate) {
    const day = dateToISO(current);
    if (
      (!action.validFrom || day >= action.validFrom) &&
      (!action.validTo || day <= action.validTo) &&
      isRecurringOnDate(action, current)
    ) {
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
  lastNDays: number = DEFAULT_LAST_N_DAYS,
  transientUnplannedActionIds: Set<string> = new Set(),
) => {
  const rows: Array<{
    dueDate: string;
    topic: TopicNode;
    target: { id: string; title: string; notes: string };
    action: ActionNode;
    confirmationDate: string;
    status: ActionNode["status"];
  }> = [];

  const { start, end } = getPeriodRange(selectedDate, period, lastNDays);

  client.topics.forEach((topic) => {
    topic.targets.forEach((target) => {
      target.actions.forEach((action) => {
        if (action.validFrom && action.validFrom > end) return;
        if (action.validTo && action.validTo < start) return;

        const dueDates = getDueDatesInPeriod(action, selectedDate, period, lastNDays);
        dueDates.forEach((dueDate) => {
          const confirmation = action.confirmations?.[dueDate];
          if (confirmation?.postponedToDate) return;
          const status = confirmation?.status || "open";
          const forceShowTransientUnplanned = action.isUnplanned && transientUnplannedActionIds.has(action.id);
          if (!forceShowTransientUnplanned && !matchesAssessmentFilter({ action, status, confirmation, disciplineId: topic.disciplineId }, filterModel)) return;
          rows.push({ dueDate, topic, target, action, confirmationDate: dueDate, status });
        });

        Object.entries(action.confirmations ?? {}).forEach(([confirmationDate, confirmation]) => {
          if (!confirmation.postponedToDate) return;
          if (confirmation.postponedToDate < start || confirmation.postponedToDate > end) return;
          const forceShowTransientUnplanned = action.isUnplanned && transientUnplannedActionIds.has(action.id);
          if (!forceShowTransientUnplanned && !matchesAssessmentFilter({ action, status: confirmation.status, confirmation, disciplineId: topic.disciplineId }, filterModel)) return;
          rows.push({
            dueDate: confirmation.postponedToDate,
            topic,
            target,
            action,
            confirmationDate,
            status: confirmation.status,
          });
        });
      });
    });
  });

  return rows;
};

const formatGermanDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
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

const getPeriodRange = (
  selectedDate: string,
  period: ConfirmationPeriod,
  lastNDays: number = DEFAULT_LAST_N_DAYS,
) => {
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
  if (period === "lastNDays") {
    const end = new Date(`${todayLocalISO()}T00:00:00`);
    const start = new Date(end);
    start.setDate(end.getDate() - clampLastNDays(lastNDays));
    return { start: dateToISO(start), end: dateToISO(end) };
  }
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: dateToISO(start), end: dateToISO(end) };
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

const formatLastNDaysRange = (lastNDays: number) => {
  const { start, end } = getPeriodRange(todayLocalISO(), "lastNDays", lastNDays);
  return `${formatGermanDate(end)} - ${formatGermanDate(start)}`;
};

const weekValueToDate = (weekValue: string) => {
  const [yearPart, weekPart] = weekValue.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (!year || !week) return todayLocalISO();

  const jan4 = new Date(year, 0, 4);
  const weekStart = getWeekStartDate(jan4);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  return dateToISO(weekStart);
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
        disciplineId: DEFAULT_SEED_DISCIPLINE_ID,
        notes:
          "Strukturierte Förderziele für die Kinder- und Jugendarbeit, gegliedert nach Leistungstypen und individuellen Handlungen.",
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
        disciplineId: DEFAULT_SEED_DISCIPLINE_ID,
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
  const navigate = useNavigate();
  const cached = loadCachedAssessmentState(todayLocalISO(), INITIAL_CONFIRMATION_FILTER);
  const [viewMode, setViewMode] = useState<"planning" | "confirmation">(
    cached?.viewMode ?? "planning",
  );
  const [selectedDate, setSelectedDate] = useState<string>(cached?.selectedDate ?? todayLocalISO());
  const [confirmationPeriod, setConfirmationPeriod] = useState<ConfirmationPeriod>(
    cached?.confirmationPeriod ?? "day",
  );
  const [lastNDays, setLastNDays] = useState<number>(
    cached?.lastNDays ?? DEFAULT_LAST_N_DAYS,
  );
  const [clients, setClients] = useState<Client[]>(cached?.clients ?? seedClients);
  const [transientUnplannedActionIds, setTransientUnplannedActionIds] = useState<Set<string>>(new Set());
  const [availableDisciplines] = useState(() => loadActionPlanDisciplines());
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(
    cached?.selectedClientIds ?? [seedClients[0].id],
  );
  const [confirmationFilter, setConfirmationFilter] = useState<AssessmentFilterModel>(
    cached?.confirmationFilter ?? INITIAL_CONFIRMATION_FILTER,
  );
  const [showCompletedTargets, setShowCompletedTargets] = useState(
    cached?.showCompletedTargets ?? false,
  );
  const [draftFilter, setDraftFilter] = useState<AssessmentFilterModel>(confirmationFilter);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTargetHiddenHintOpen, setIsTargetHiddenHintOpen] = useState(false);
  const [hideTargetHiddenHint, setHideTargetHiddenHint] = useState(false);
  const [bulkNotDoneClientIds, setBulkNotDoneClientIds] = useState<Set<string>>(new Set());
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLDivElement | null>(null);
  const [filterMenuLeft, setFilterMenuLeft] = useState(0);
  const latestAssessmentStateRef = useRef<CachedAssessmentState>({
    viewMode,
    selectedDate,
    confirmationPeriod,
    lastNDays,
    clients,
    selectedClientIds,
    confirmationFilter,
    showCompletedTargets,
  });

  const setClientBulkNotDoneMode = (clientId: string, enabled: boolean) => {
    setBulkNotDoneClientIds((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(clientId);
      } else {
        next.delete(clientId);
      }
      return next;
    });
  };

  const saveAssessmentStateImmediately = (patch: Partial<CachedAssessmentState>) => {
    const nextState = { ...latestAssessmentStateRef.current, ...patch };
    latestAssessmentStateRef.current = nextState;
    saveCachedAssessmentState(nextState);
  };

  useEffect(() => {
    const cachePayload: CachedAssessmentState = {
      viewMode,
      selectedDate,
      confirmationPeriod,
      lastNDays,
      clients,
      selectedClientIds,
      confirmationFilter,
      showCompletedTargets,
    };
    latestAssessmentStateRef.current = cachePayload;
    saveCachedAssessmentState(cachePayload);
  }, [
    viewMode,
    selectedDate,
    confirmationPeriod,
    lastNDays,
    clients,
    selectedClientIds,
    confirmationFilter,
    showCompletedTargets,
  ]);

  useEffect(() => {
    if (viewMode !== "confirmation") {
      setBulkNotDoneClientIds(new Set());
    }
  }, [viewMode]);

  useEffect(() => {
    const saveLatestStateBeforeUnload = () => {
      saveCachedAssessmentState(latestAssessmentStateRef.current);
    };

    window.addEventListener("pagehide", saveLatestStateBeforeUnload);
    return () => window.removeEventListener("pagehide", saveLatestStateBeforeUnload);
  }, []);

  useEffect(() => {
    if (!isFilterOpen || !filterButtonRef.current) return;
    const btn = filterButtonRef.current;
    const parent = btn.offsetParent as HTMLElement | null;
    const parentRect = parent?.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setFilterMenuLeft(btnRect.left - (parentRect?.left ?? 0));
  }, [isFilterOpen]);

  const isFilterActive = (() => {
    const f = confirmationFilter;
    const statusesDefault =
      f.statuses.length === OPEN_CONFIRMATION_STATUSES.length &&
      OPEN_CONFIRMATION_STATUSES.every((status) => f.statuses.includes(status));
    return (
      !statusesDefault ||
      f.plannedMinutes != null ||
      f.actualMinutes != null ||
      f.differenceMinutes != null ||
      f.differencePercent != null ||
      f.dayPart != null ||
      f.category != null ||
      f.unplanned != null ||
      (f.disciplineIds?.length ?? 0) > 0 ||
      f.persons != null ||
      f.result != null
    );
  })();
  const isOpenVisible = OPEN_CONFIRMATION_STATUSES.some((status) =>
    confirmationFilter.statuses.includes(status),
  );
  const isConfirmedVisible = CONFIRMED_STATUSES.some((status) =>
    confirmationFilter.statuses.includes(status),
  );

  const selectedClients = clients.filter((c) => selectedClientIds.includes(c.id));
  const visibleSelectedClients =
    viewMode === "confirmation"
      ? selectedClients.filter((client) =>
          hasVisibleConfirmationItems(
            client,
            selectedDate,
            confirmationPeriod,
            confirmationFilter,
            lastNDays,
            transientUnplannedActionIds,
          ),
        )
      : selectedClients;

  const toggleClient = (id: string) => {
    setSelectedClientIds((prev) => {
      const nextSelectedClientIds = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      saveAssessmentStateImmediately({ selectedClientIds: nextSelectedClientIds });
      return nextSelectedClientIds;
    });
  };

  const openFilter = () => {
    setDraftFilter(confirmationFilter);
    setIsFilterOpen(true);
  };

  const cancelFilter = () => {
    setDraftFilter(confirmationFilter);
    setIsFilterOpen(false);
  };

  const resetFilter = () => {
    setDraftFilter(INITIAL_CONFIRMATION_FILTER);
  };

  const applyFilter = () => {
    setConfirmationFilter(draftFilter);
    setTransientUnplannedActionIds(new Set());
    setIsFilterOpen(false);
  };

  useEffect(() => {
    if (!isFilterOpen) return;

    const closeMenu = () => {
      setDraftFilter(confirmationFilter);
      setIsFilterOpen(false);
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!filterMenuRef.current) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      // Ignore clicks inside the menu itself
      if (filterMenuRef.current.contains(target)) return;
      // Ignore clicks inside Radix portals (Select dropdowns, etc.)
      if (target.closest("[data-radix-popper-content-wrapper]")) return;
      if (target.closest("[role='listbox']")) return;
      // Ignore clicks on the filter ribbon button itself (it has its own toggle)
      if (filterButtonRef.current?.contains(target)) return;
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterOpen, confirmationFilter]);

  const toggleDraftStatus = (status: ActionNode["status"]) => {
    setDraftFilter((prev) => {
      const exists = prev.statuses.includes(status);
      const statuses = exists
        ? prev.statuses.filter((item) => item !== status)
        : [...prev.statuses, status];
      return { ...prev, statuses: statuses.length > 0 ? statuses : ["open"] };
    });
  };

  const toggleDraftDiscipline = (disciplineId: string) => {
    setDraftFilter((prev) => {
      const selected = prev.disciplineIds ?? [];
      const disciplineIds = selected.includes(disciplineId)
        ? selected.filter((id) => id !== disciplineId)
        : [...selected, disciplineId];
      return {
        ...prev,
        disciplineIds: disciplineIds.length > 0 ? disciplineIds : undefined,
      };
    });
  };

  const setOptionalNumber = (
    value: string,
    onDefined: (num: number) => void,
    onEmpty: () => void,
  ) => {
    if (value === "") {
      onEmpty();
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) onDefined(parsed);
  };

  const toggleAllClients = () => {
    setSelectedClientIds((prev) => {
      const clientIds = clients.map((c) => c.id);
      const allSelected =
        clientIds.length > 0 && clientIds.every((id) => prev.includes(id));

      const nextSelectedClientIds = allSelected ? [] : clientIds;
      saveAssessmentStateImmediately({ selectedClientIds: nextSelectedClientIds });
      return nextSelectedClientIds;
    });
  };

  const updateClientTopicsFor = (
    clientId: string,
    fn: (topics: TopicNode[]) => TopicNode[],
  ) => {
    setClients((prev) => {
      const nextClients = prev.map((c) =>
        c.id === clientId ? { ...c, topics: fn(c.topics) } : c,
      );
      saveAssessmentStateImmediately({ clients: nextClients });
      return nextClients;
    });
  };

  const addClient = () => {
    const c: Client = {
      id: uid(),
      firstName: "Neu",
      lastName: "Klient/in",
      topics: [],
    };
    setClients((prev) => {
      const nextClients = [...prev, c];
      saveAssessmentStateImmediately({ clients: nextClients });
      return nextClients;
    });
    setSelectedClientIds((prev) => {
      const nextSelectedClientIds = [...prev, c.id];
      saveAssessmentStateImmediately({ selectedClientIds: nextSelectedClientIds });
      return nextSelectedClientIds;
    });
  };

  const addTopic = (clientId: string, disciplineId?: string) => {
    updateClientTopicsFor(clientId, (topics) => [
      ...topics,
      {
        id: uid(),
        title: "",
        notes: "",
        disciplineId: disciplineId ?? availableDisciplines[0]?.id ?? DEFAULT_SEED_DISCIPLINE_ID,
        targets: [],
      },
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

  const addAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    templateIds: string[],
    serviceType?: ActionServiceType,
  ) => {
    const templates = loadActionPlanTemplates().filter((template) => templateIds.includes(template.id));
    const weekdayMap: Record<string, Weekday> = {
      mon: "monday",
      tue: "tuesday",
      wed: "wednesday",
      thu: "thursday",
      fri: "friday",
      sat: "saturday",
      sun: "sunday",
    };

    const createActionFromTemplate = (
      template?: (typeof templates)[number],
      scratchServiceType?: ActionServiceType,
    ): ActionNode => {
      const fields = template?.fields ?? buildDefaultTemplateFields();
      const plannedMinutes = Number(fields.dauer);
      const requiredPersons = Number(fields.personen);
      const selectedServiceType = template
        ? fields.leistungsart !== "none"
          ? (fields.leistungsart as ActionServiceType)
          : undefined
        : scratchServiceType;
      const recurrenceWeekdays = fields.wiederholungWochentage
        .split(",")
        .map((value) => weekdayMap[value.trim().toLowerCase()])
        .filter((value): value is Weekday => Boolean(value));
      return {
        id: uid(),
        title: fields.titel,
        notes: fields.beschreibung,
        requiredResources: fields.hilfsmittel || undefined,
        plannedMinutes: Number.isFinite(plannedMinutes) ? plannedMinutes : undefined,
        requiredPersons: Number.isFinite(requiredPersons) ? requiredPersons : undefined,
        category: fields.kategorie !== "none" ? (fields.kategorie as ActionNode["category"]) : undefined,
        serviceType: selectedServiceType,
        dayPart: fields.tageszeit !== "none" ? (fields.tageszeit as ActionNode["dayPart"]) : undefined,
        scheduledTime: fields.uhrzeit || undefined,
        resultRequirement: fields.resultat !== "none"
          ? (fields.resultat as ActionNode["resultRequirement"])
          : undefined,
        recurrence: fields.wiederholung as ActionNode["recurrence"],
        recurrenceWeekdays: recurrenceWeekdays.length > 0 ? recurrenceWeekdays : undefined,
        recurrenceMonthlyPattern: fields.wiederholungMonatlich !== "none"
          ? (fields.wiederholungMonatlich as ActionNode["recurrenceMonthlyPattern"])
          : undefined,
        status: "open",
        done: false,
        templateId: template?.id,
        templateName: template?.name,
      };
    };

    const newActions = templates.length > 0
      ? templates.map((template) => createActionFromTemplate(template))
      : [createActionFromTemplate(undefined, serviceType)];

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
                        ...newActions,
                      ],
                    },
              ),
            },
      ),
    );
  };


  const addUnplannedAction = (
    clientId: string,
    dueDate: string,
    dayPart: DayPart | "none",
    draft: {
      title: string;
      notes: string;
      requiredResources?: string;
      plannedMinutes?: number;
      requiredPersons?: number;
      resultRequirement?: ActionNode["resultRequirement"];
      scheduledTime?: string;
      category?: ActionNode["category"];
      serviceType?: ActionServiceType;
      templateId?: string;
      templateName?: string;
      dayPart?: DayPart | "none";
    },
  ) => {
    const auditTrail = {
      confirmedBy: "danuss",
      confirmedAt: new Date().toISOString().slice(0, 19) + "Z",
    };
    const actionId = uid();
    const unplannedTopicTitle = "Ungeplante Handlungen";
    const unplannedTargetTitle = "Direkt in der Umsetzung erfasst";
    const selectedDayPart = draft.dayPart ?? dayPart;

    const newAction: ActionNode = {
      id: actionId,
      title: draft.title,
      notes: draft.notes,
      requiredResources: draft.requiredResources,
      plannedMinutes: draft.plannedMinutes,
      requiredPersons: draft.requiredPersons,
      resultRequirement: draft.resultRequirement,
      dayPart: selectedDayPart === "none" ? undefined : selectedDayPart,
      scheduledTime: draft.scheduledTime,
      category: draft.category,
      serviceType: draft.serviceType,
      validFrom: dueDate,
      validTo: dueDate,
      recurrence: "daily",
      status: "done_as_planned",
      done: true,
      isUnplanned: true,
      templateId: draft.templateId,
      templateName: draft.templateName,
      confirmations: {
        [dueDate]: {
          status: "done_as_planned",
          serviceType: draft.serviceType,
          actualMinutes: draft.plannedMinutes,
          done: true,
          ...auditTrail,
        },
      },
    };

    updateClientTopicsFor(clientId, (topics) => {
      const existingTopic = topics.find((topic) => topic.title === unplannedTopicTitle);
      if (!existingTopic) {
        return [
          ...topics,
          {
            id: uid(),
            title: unplannedTopicTitle,
            notes: "",
            disciplineId: availableDisciplines[0]?.id ?? DEFAULT_SEED_DISCIPLINE_ID,
            targets: [
              {
                id: uid(),
                title: unplannedTargetTitle,
                notes: "",
                actions: [newAction],
              },
            ],
          },
        ];
      }

      return topics.map((topic) => {
        if (topic.id !== existingTopic.id) return topic;
        const existingTarget = topic.targets.find((target) => target.title === unplannedTargetTitle);
        if (!existingTarget) {
          return {
            ...topic,
            targets: [
              ...topic.targets,
              { id: uid(), title: unplannedTargetTitle, notes: "", actions: [newAction] },
            ],
          };
        }
        return {
          ...topic,
          targets: topic.targets.map((target) =>
            target.id === existingTarget.id
              ? { ...target, actions: [...target.actions, newAction] }
              : target,
          ),
        };
      });
    });

    setTransientUnplannedActionIds((prev) => new Set(prev).add(actionId));

    return actionId;
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

  const updateTopicDiscipline = (
    clientId: string,
    topicId: string,
    disciplineId: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((topic) =>
        topic.id === topicId ? { ...topic, disciplineId } : topic,
      ),
    );
  };

  const deleteDiscipline = (clientId: string, disciplineId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const topicsInDiscipline = client?.topics.filter(
      (topic) => (topic.disciplineId ?? DEFAULT_SEED_DISCIPLINE_ID) === disciplineId,
    ) ?? [];
    const hasNestedPlanning = topicsInDiscipline.length > 0;

    if (
      hasNestedPlanning &&
      !window.confirm(
        "Diese Disziplin enthält Schwerpunkte, Ziele oder Handlungen. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?",
      )
    ) {
      return;
    }

    updateClientTopicsFor(clientId, (topics) =>
      topics.filter((topic) => (topic.disciplineId ?? DEFAULT_SEED_DISCIPLINE_ID) !== disciplineId),
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
      | "scheduledTime"
      | "category"
      | "serviceType"
      | "validFrom"
      | "validTo"
      | "recurrence"
      | "recurrenceWeekdays"
      | "recurrenceMonthlyPattern"
      | "observations",
    value: number | string | string[] | undefined,
  ) => {
    const getOldestConfirmationDate = (confirmations?: Record<string, unknown>) => {
      const dates = Object.keys(confirmations ?? {});
      if (dates.length === 0) return undefined;
      return [...dates].sort()[0];
    };

    const isTargetVisibleInPlanning = (actions: ActionNode[]) => {
      if (showCompletedTargets) return true;
      if (actions.length === 0) return true;
      if (actions.some((action) => !action.validFrom)) return true;
      return actions.some(
        (action) =>
          action.validFrom != null &&
          action.validFrom <= selectedDate &&
          (!action.validTo || selectedDate <= action.validTo),
      );
    };

    const client = clients.find((c) => c.id === clientId);
    const topic = client?.topics.find((t) => t.id === topicId);
    const target = topic?.targets.find((tg) => tg.id === targetId);
    const currentAction = target?.actions.find((a) => a.id === actionId);

    const wasVisible = target ? isTargetVisibleInPlanning(target.actions) : false;

    const nextAction = (() => {
      if (!currentAction) return undefined;
      const hasConfirmations = Object.keys(currentAction.confirmations ?? {}).length > 0;
      const isValidToUpdate = field === "validTo";
      if (hasConfirmations && !isValidToUpdate) return currentAction;

      if (isValidToUpdate && typeof value === "string" && value) {
        const oldestConfirmationDate = getOldestConfirmationDate(currentAction.confirmations);
        if (oldestConfirmationDate && value < oldestConfirmationDate) {
          return currentAction;
        }
      }

      return { ...currentAction, [field]: value };
    })();

    const isVisibleAfterUpdate = target
      ? isTargetVisibleInPlanning(
          target.actions.map((action) => (action.id === actionId && nextAction ? nextAction : action)),
        )
      : false;

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
                          ? (() => {
                              const hasConfirmations = Object.keys(a.confirmations ?? {}).length > 0;
                              const isValidToUpdate = field === "validTo";

                              if (hasConfirmations && !isValidToUpdate) return a;

                              if (isValidToUpdate && typeof value === "string" && value) {
                                const oldestConfirmationDate = getOldestConfirmationDate(a.confirmations);
                                if (oldestConfirmationDate && value < oldestConfirmationDate) {
                                  return a;
                                }
                              }

                              return { ...a, [field]: value };
                            })()
                          : a,
                      ),
                    },
              ),
            },
      ),
    );

    if (viewMode === "planning" && !showCompletedTargets && wasVisible && !isVisibleAfterUpdate) {
      setIsTargetHiddenHintOpen(true);
    }
  };

  const confirmAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    payload:
      | { status: "done_as_planned"; result?: string; observations?: string }
      | { status: "done_with_deviation"; actualMinutes?: number; reason: string; result?: string; observations?: string }
      | { status: "not_done"; reason: string }
      | { status: "postponed"; postponedToDate?: string; postponedToTime?: string }
      | { status: "open" },
    date?: string,
  ) => {
    const auditTrail = {
      confirmedBy: "danuss",
      confirmedAt: new Date().toISOString().slice(0, 19) + "Z",
    };

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

                        const existing = nextConfirmations[date];
                        const postponementAudit = existing
                          ? {
                              postponedToDate: existing.postponedToDate,
                              postponedToTime: existing.postponedToTime,
                              postponedBy: existing.postponedBy,
                              postponedAt: existing.postponedAt,
                            }
                          : {};

                        if (payload.status === "open") {
                          delete nextConfirmations[date];
                        } else if (payload.status === "done_as_planned") {
                          nextConfirmations[date] = {
                            status: "done_as_planned",
                            serviceType: a.serviceType,
                            done: true,
                            actualMinutes: a.plannedMinutes,
                            result: payload.result,
                            observations: payload.observations,
                            ...postponementAudit,
                            ...auditTrail,
                          };
                        } else if (payload.status === "done_with_deviation") {
                          nextConfirmations[date] = {
                            status: "done_with_deviation",
                            serviceType: a.serviceType,
                            done: true,
                            actualMinutes: payload.actualMinutes,
                            reason: payload.reason,
                            result: payload.result,
                            observations: payload.observations,
                            ...postponementAudit,
                            ...auditTrail,
                          };
                        } else if (payload.status === "not_done") {
                          nextConfirmations[date] = {
                            status: "not_done",
                            done: true,
                            reason: payload.reason,
                            ...postponementAudit,
                            ...auditTrail,
                          };
                        } else if (payload.status === "postponed") {
                          nextConfirmations[date] = {
                            ...existing,
                            status: "postponed",
                            serviceType: undefined,
                            done: false,
                            postponedToDate: payload.postponedToDate,
                            postponedToTime: payload.postponedToTime,
                            postponedBy: auditTrail.confirmedBy,
                            postponedAt: auditTrail.confirmedAt,
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
    const hasTitle = (topic?.title ?? "").trim().length > 0;
    const hasNotes = (topic?.notes ?? "").trim().length > 0;
    const hasTargets = (topic?.targets.length ?? 0) > 0;
    const requiresConfirmation = hasTitle || hasNotes || hasTargets;

    if (
      requiresConfirmation &&
      !window.confirm(
        hasTargets
          ? "Dieser Schwerpunkt enthält Ziele oder Handlungen. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?"
          : "Diesen Schwerpunkt wirklich löschen?",
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
        action?.isUnplanned
          ? "Diese ungeplante Handlung wurde bereits bestätigt. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?"
          : "Diese geplante Handlung hat bereits bestätigte Einträge. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?",
      )
    ) {
      return;
    }

    setTransientUnplannedActionIds((prev) => {
      if (!prev.has(actionId)) return prev;
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });

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
    setClients((prev) => {
      const nextClients = prev.map((c) =>
        c.id === clientId ? { ...c, [field]: value } : c,
      );
      saveAssessmentStateImmediately({ clients: nextClients });
      return nextClients;
    });
  };

  const shiftDate = (step: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    if (confirmationPeriod === "lastNDays") return;
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
        lastNDays,
        transientUnplannedActionIds,
      ).map(({ dueDate, topic, target, action, confirmationDate, status }) => {
        const confirmation = action.confirmations?.[confirmationDate];
        return {
          Datum: dueDate,
          "Klient/in": `${client.firstName} ${client.lastName}`.trim(),
          Disziplin:
            availableDisciplines.find((discipline) => discipline.id === topic.disciplineId)?.title ??
            topic.disciplineId ??
            "",
          Schwerpunkt: topic.title,
          Ziel: target.title,
          Handlung: action.title,
          "Planungsart": action.isUnplanned ? "Ungeplant" : "Geplant",
          Beschreibung: action.notes,
          Hilfsmittel: action.requiredResources ?? "",
          Status:
            status === "done_as_planned"
              ? "Wie geplant durchgeführt"
              : status === "done_with_deviation"
                ? "Mit Abweichung durchgeführt"
                : status === "not_done"
                  ? "Nicht durchgeführt"
                  : status === "postponed"
                    ? "Verschoben"
                    : "Offen",
          Grund: confirmation?.reason ?? "",
          Resultat: confirmation?.result ?? "",
          Beobachtungen: confirmation?.observations ?? "",
          "Verschoben auf Datum": confirmation?.postponedToDate ?? "",
          "Verschoben auf Uhrzeit": confirmation?.postponedToTime ?? "",
          "Verschoben von": confirmation?.postponedBy ?? "",
          "Verschoben am": confirmation?.postponedAt ?? "",
          Benutzername: confirmation?.confirmedBy ?? "",
          Timestamp: confirmation?.confirmedAt ?? "",
          "Gültig ab": action.validFrom ?? "",
          "Gültig bis": action.validTo ?? "",
          "Tageszeit": action.dayPart ? DAY_PART_LABEL[action.dayPart] : "",
          "Uhrzeit": action.scheduledTime ?? "",
          Kategorie: action.category ?? "",
          Leistungsart:
            confirmation?.done && confirmation.status !== "not_done"
              ? getActionServiceTypeLabel(confirmation.serviceType)
              : "",
          "Minuten geplant": action.plannedMinutes ?? "",
          "Minuten tatsächlich": confirmation?.actualMinutes ?? "",
        };
      }),
    );

    const allHeaders = [
      "Datum",
      "Klient/in",
      "Disziplin",
      "Schwerpunkt",
      "Ziel",
      "Handlung",
      "Planungsart",
      "Beschreibung",
      "Hilfsmittel",
      "Status",
      "Grund",
      "Resultat",
      "Beobachtungen",
      "Verschoben auf Datum",
      "Verschoben auf Uhrzeit",
      "Verschoben von",
      "Verschoben am",
      "Benutzername",
      "Timestamp",
      "Gültig ab",
      "Gültig bis",
      "Tageszeit",
      "Uhrzeit",
      "Kategorie",
      "Leistungsart",
      "Minuten geplant",
      "Minuten tatsächlich",
    ];

    const dateHeaders = new Set(["Datum", "Verschoben auf Datum", "Gültig ab", "Gültig bis"]);
    const numberHeaders = new Set(["Minuten geplant", "Minuten tatsächlich"]);

    const blob = createSimpleXlsxBlob({
      sheetName: "Umsetzungen",
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
          : confirmationPeriod === "lastNDays"
            ? `letzte-${lastNDays}-tage`
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 border-r border-border transition-colors hover:bg-secondary focus:outline-none data-[state=open]:bg-secondary"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Weitere
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-48">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Einstellungen
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
            <div className="ml-auto flex items-center gap-1 pl-2">
              <button
                className="p-2 rounded hover:bg-secondary text-muted-foreground"
                aria-label="Hilfe"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <ApplicationLogoutButton />
            </div>
          </div>

          {/* Ribbon toolbar */}
          <div className="relative">
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
              onClick={() => setViewMode("planning")}
              disabled={viewMode === "planning"}
              active={viewMode === "planning"}
            />
            <RibbonButton
              icon={ClipboardCheck}
              label="Umsetzung"
              onClick={() => setViewMode("confirmation")}
              disabled={viewMode === "confirmation"}
              active={viewMode === "confirmation"}
            />
            <RibbonDivider />
            <div ref={filterButtonRef} className="inline-flex">
              <RibbonButton
                icon={Filter}
                label="Filter"
                disabled={viewMode === "planning"}
                onClick={() => (isFilterOpen ? cancelFilter() : openFilter())}
                active={isFilterOpen}
                highlighted={isFilterActive}
              />
            </div>
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

            {viewMode === "confirmation" && isFilterOpen && (
              <div
                ref={filterMenuRef}
                style={{ left: `${filterMenuLeft}px` }}
                className="absolute top-full z-40 mt-1 w-[28rem] max-w-[calc(100vw-2rem)] rounded-sm border border-border bg-background text-sm shadow-xl"
              >
                <div className="border-b border-border px-3 py-2 text-sm font-medium">
                  Filter
                </div>

                <div className="space-y-3 p-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">Status (ODER)</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {[
                        { value: "open", label: "Offen" },
                        { value: "done_as_planned", label: "Erledigt wie geplant" },
                        { value: "done_with_deviation", label: "Erledigt mit Abweichung" },
                        { value: "not_done", label: "Nicht durchgeführt" },
                        { value: "postponed", label: "Verschoben" },
                      ].map((item) => (
                        <label key={item.value} className="inline-flex items-center gap-1.5 leading-tight">
                          <input
                            type="checkbox"
                            checked={draftFilter.statuses.includes(item.value as ActionNode["status"])}
                            onChange={() => toggleDraftStatus(item.value as ActionNode["status"])}
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Minuten geplant</div>
                      <div className="flex gap-1.5">
                        <Select
                          value={draftFilter.plannedMinutes?.op ?? "eq"}
                          onValueChange={(value) =>
                            setDraftFilter((prev) => ({
                              ...prev,
                              plannedMinutes: prev.plannedMinutes
                                ? {
                                    op: value as NumericComparison["op"],
                                    value: prev.plannedMinutes.value,
                                  }
                                : undefined,
                            }))
                          }
                        >
                          <SelectTrigger className={cn("w-14", COMPACT_FILTER_SELECT_CLASS)}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {OPERATOR_OPTIONS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className={COMPACT_FILTER_INPUT_CLASS}
                          value={draftFilter.plannedMinutes?.value ?? ""}
                          onChange={(e) =>
                            setOptionalNumber(
                              e.target.value,
                              (num) =>
                                setDraftFilter((prev) => ({
                                  ...prev,
                                  plannedMinutes: { op: prev.plannedMinutes?.op ?? "eq", value: num },
                                })),
                              () => setDraftFilter((prev) => ({ ...prev, plannedMinutes: undefined })),
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium">Minuten tatsächlich</div>
                      <div className="flex gap-1.5">
                        <Select
                          value={draftFilter.actualMinutes?.op ?? "eq"}
                          onValueChange={(value) =>
                            setDraftFilter((prev) => ({
                              ...prev,
                              actualMinutes: prev.actualMinutes
                                ? {
                                    op: value as NumericComparison["op"],
                                    value: prev.actualMinutes.value,
                                  }
                                : undefined,
                            }))
                          }
                        >
                          <SelectTrigger className={cn("w-14", COMPACT_FILTER_SELECT_CLASS)}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {OPERATOR_OPTIONS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className={COMPACT_FILTER_INPUT_CLASS}
                          value={draftFilter.actualMinutes?.value ?? ""}
                          onChange={(e) =>
                            setOptionalNumber(
                              e.target.value,
                              (num) =>
                                setDraftFilter((prev) => ({
                                  ...prev,
                                  actualMinutes: { op: prev.actualMinutes?.op ?? "eq", value: num },
                                })),
                              () => setDraftFilter((prev) => ({ ...prev, actualMinutes: undefined })),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">Differenz geplant / tatsächlich (UND)</div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {(["differenceMinutes", "differencePercent"] as const).map((key) => {
                      const label = key === "differenceMinutes" ? "Differenz Minuten" : "Differenz %";
                      const range = draftFilter[key];
                      const updateRange = (patch: { min?: number; max?: number }) => {
                        setDraftFilter((prev) => {
                          const current = prev[key] ?? {};
                          const next = { ...current, ...patch };
                          const cleaned = {
                            min: next.min,
                            max: next.max,
                          };
                          const isEmpty = cleaned.min == null && cleaned.max == null;
                          return { ...prev, [key]: isEmpty ? undefined : cleaned };
                        });
                      };
                      return (
                        <div key={key} className="space-y-1">
                          <div className="text-[11px] text-muted-foreground">{label}</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <Input
                              type="number"
                              className={COMPACT_FILTER_INPUT_CLASS}
                              placeholder="Min (≥)"
                              value={range?.min ?? ""}
                              onChange={(e) =>
                                setOptionalNumber(
                                  e.target.value,
                                  (num) => updateRange({ min: num }),
                                  () => updateRange({ min: undefined }),
                                )
                              }
                            />
                            <Input
                              type="number"
                              className={COMPACT_FILTER_INPUT_CLASS}
                              placeholder="Max (≤)"
                              value={range?.max ?? ""}
                              onChange={(e) =>
                                setOptionalNumber(
                                  e.target.value,
                                  (num) => updateRange({ max: num }),
                                  () => updateRange({ max: undefined }),
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Disziplin</div>
                      <div className="max-h-24 space-y-0.5 overflow-y-auto rounded-md border border-border bg-background p-1">
                        {availableDisciplines.map((discipline) => (
                          <label
                            key={discipline.id}
                            className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-xs leading-tight hover:bg-secondary/50"
                          >
                            <input
                              type="checkbox"
                              checked={(draftFilter.disciplineIds ?? []).includes(discipline.id)}
                              onChange={() => toggleDraftDiscipline(discipline.id)}
                              className="h-3.5 w-3.5 rounded border-border accent-primary"
                            />
                            <span>{discipline.title}</span>
                          </label>
                        ))}
                        {availableDisciplines.length === 0 && (
                          <div className="px-1.5 py-0.5 text-xs text-muted-foreground">Keine Disziplinen erfasst</div>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Keine Auswahl zeigt alle Disziplinen.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium">Tageszeit</div>
                      <Select
                        value={draftFilter.dayPart ?? "all"}
                        onValueChange={(value) =>
                          setDraftFilter((prev) => ({ ...prev, dayPart: value === "all" ? undefined : value as AssessmentFilterModel["dayPart"] }))
                        }
                      >
                        <SelectTrigger className={COMPACT_FILTER_SELECT_CLASS}><SelectValue placeholder="Tageszeit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Tageszeiten</SelectItem>
                          {DAY_PART_SELECT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium">Planungsart</div>
                      <Select
                        value={draftFilter.unplanned ?? "all"}
                        onValueChange={(value) =>
                          setDraftFilter((prev) => ({
                            ...prev,
                            unplanned: value === "all" ? undefined : value as AssessmentFilterModel["unplanned"],
                          }))
                        }
                      >
                        <SelectTrigger className={COMPACT_FILTER_SELECT_CLASS}><SelectValue placeholder="Planungsart" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Handlungen</SelectItem>
                          <SelectItem value="planned">Nur geplante Handlungen</SelectItem>
                          <SelectItem value="unplanned">Nur ungeplante Handlungen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium">Kategorie</div>
                      <Select
                        value={draftFilter.category ?? "all"}
                        onValueChange={(value) =>
                          setDraftFilter((prev) => ({
                            ...prev,
                            category:
                              value === "all"
                                ? undefined
                                : (value as AssessmentFilterModel["category"]),
                          }))
                        }
                      >
                        <SelectTrigger className={COMPACT_FILTER_SELECT_CLASS}><SelectValue placeholder="Kategorie" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Kategorien</SelectItem>
                          <SelectItem value="none">Keine Angabe</SelectItem>
                          <SelectItem value="a">A</SelectItem>
                          <SelectItem value="b">B</SelectItem>
                          <SelectItem value="c">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium">Anzahl Personen</div>
                      <div className="flex gap-1.5">
                        <Select
                          value={draftFilter.persons?.kind ?? "all"}
                          onValueChange={(value) =>
                            setDraftFilter((prev) => ({
                              ...prev,
                              persons: value === "all" ? undefined : value === "none" ? { kind: "none" } : { kind: "exact", value: prev.persons?.kind === "exact" ? prev.persons.value : 0 },
                            }))
                          }
                        >
                          <SelectTrigger className={cn("flex-1", COMPACT_FILTER_SELECT_CLASS)}><SelectValue placeholder="Anzahl Personen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle</SelectItem>
                            <SelectItem value="none">Keine Angabe</SelectItem>
                            <SelectItem value="exact">Genaue Anzahl</SelectItem>
                          </SelectContent>
                        </Select>
                        {draftFilter.persons?.kind === "exact" && (
                          <Input
                            type="number"
                            step={1}
                            className={cn("w-20", COMPACT_FILTER_INPUT_CLASS)}
                            value={draftFilter.persons.value}
                            onChange={(e) =>
                              setOptionalNumber(
                                e.target.value,
                                (num) => setDraftFilter((prev) => ({
                                  ...prev,
                                  persons: { kind: "exact", value: Math.max(0, Math.floor(num)) },
                                })),
                                () => setDraftFilter((prev) => ({ ...prev, persons: { kind: "exact", value: 0 } })),
                              )
                            }
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium">Resultat</div>
                      <Select
                        value={draftFilter.result ?? "all"}
                        onValueChange={(value) =>
                          setDraftFilter((prev) => ({ ...prev, result: value === "all" ? undefined : value as AssessmentFilterModel["result"] }))
                        }
                      >
                        <SelectTrigger className={COMPACT_FILTER_SELECT_CLASS}><SelectValue placeholder="Resultat" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle</SelectItem>
                          <SelectItem value="none">Kein Resultat</SelectItem>
                          <SelectItem value="with_result">Mit Resultat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-border px-3 py-2">
                  <div className="flex gap-1.5">
                    <Button variant="outline" onClick={cancelFilter}>Abbrechen</Button>
                    <Button variant="outline" onClick={resetFilter}>Zurücksetzen</Button>
                    <Button onClick={applyFilter}>Anwenden</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-background">
            {selectedClients.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-lg">Wählen Sie eine oder mehrere Klient/innen in der Navigation.</p>
              </div>
            ) : (
              <div className="px-6 lg:px-10 py-6 w-full space-y-10">
                {viewMode === "confirmation" && (
                  <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-border sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-background border border-border rounded-md p-1">
                        <button
                          className={cn(
                            "h-8 px-2 text-xs rounded",
                            confirmationPeriod === "day"
                              ? "bg-secondary text-foreground"
                              : "hover:bg-secondary",
                          )}
                          onClick={() => setConfirmationPeriod("day")}
                        >
                          Tag
                        </button>
                        <button
                          className={cn(
                            "h-8 px-2 text-xs rounded",
                            confirmationPeriod === "week"
                              ? "bg-secondary text-foreground"
                              : "hover:bg-secondary",
                          )}
                          onClick={() => setConfirmationPeriod("week")}
                        >
                          Woche
                        </button>
                        <button
                          className={cn(
                            "h-8 px-2 text-xs rounded",
                            confirmationPeriod === "month"
                              ? "bg-secondary text-foreground"
                              : "hover:bg-secondary",
                          )}
                          onClick={() => setConfirmationPeriod("month")}
                        >
                          Monat
                        </button>
                        <button
                          className={cn(
                            "h-8 px-2 text-xs rounded",
                            confirmationPeriod === "lastNDays"
                              ? "bg-secondary text-foreground"
                              : "hover:bg-secondary",
                          )}
                          onClick={() => setConfirmationPeriod("lastNDays")}
                        >
                          Letzte N Tage
                        </button>
                      </div>
                      {confirmationPeriod === "lastNDays" ? (
                        <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-1">
                          <label className="text-xs text-muted-foreground" htmlFor="last-n-days-input">
                            Tage
                          </label>
                          <Input
                            id="last-n-days-input"
                            type="number"
                            min={1}
                            step={1}
                            value={lastNDays}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setLastNDays(Number.isFinite(value) ? clampLastNDays(value) : DEFAULT_LAST_N_DAYS);
                            }}
                            className="h-8 w-20"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Zeitraum: {formatLastNDaysRange(lastNDays)}
                          </span>
                        </div>
                      ) : (
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
                          {confirmationPeriod === "day" && (
                            <DatePickerInput
                              value={selectedDate}
                              onChange={setSelectedDate}
                              className="h-8 w-[170px] border-0 bg-transparent text-sm shadow-none"
                            />
                          )}
                          {confirmationPeriod === "week" && (
                            <input
                              type="week"
                              value={getWeekValue(selectedDate)}
                              onChange={(e) => setSelectedDate(weekValueToDate(e.target.value))}
                              className="bg-transparent text-sm px-2 py-1 outline-none"
                            />
                          )}
                          {confirmationPeriod === "month" && (
                            <input
                              type="month"
                              value={selectedDate.slice(0, 7)}
                              onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
                              className="bg-transparent text-sm px-2 py-1 outline-none"
                            />
                          )}
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
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isOpenVisible}
                          onChange={(e) =>
                            setConfirmationFilter((prev) => ({
                              ...prev,
                              statuses: e.target.checked
                                ? [...new Set([...OPEN_CONFIRMATION_STATUSES, ...prev.statuses])]
                                : prev.statuses.filter((status) => !OPEN_CONFIRMATION_STATUSES.includes(status)),
                            }))
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Unbestätigte anzeigen
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isConfirmedVisible}
                          onChange={(e) =>
                            setConfirmationFilter((prev) => ({
                              ...prev,
                              statuses: e.target.checked
                                ? [...new Set([...prev.statuses, ...CONFIRMED_STATUSES])]
                                : prev.statuses.filter((status) => !CONFIRMED_STATUSES.includes(status)),
                            }))
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Bestätigte anzeigen
                      </label>
                    </div>
                  </div>
                )}
                {viewMode === "planning" && (
                  <div className="flex items-center justify-end">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showCompletedTargets}
                        onChange={(event) => setShowCompletedTargets(event.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      Abgeschlossene Ziele einblenden
                    </label>
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
                      {viewMode === "confirmation" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground"
                              aria-label="Aktionen für Klient/in öffnen"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-64">
                            {bulkNotDoneClientIds.has(client.id) ? (
                              <DropdownMenuItem onClick={() => setClientBulkNotDoneMode(client.id, false)}>
                                Mehrfachauswahl beenden
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setClientBulkNotDoneMode(client.id, true)}>
                                Mehrere als nicht durchgeführt abschliessen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <AssessmentOutline
                      viewMode={viewMode}
                      selectedDate={selectedDate}
                      showCompletedTargets={showCompletedTargets}
                      onSelectedDateChange={setSelectedDate}
                      confirmationPeriod={confirmationPeriod}
                      lastNDays={lastNDays}
                      clientName={`${client.firstName} ${client.lastName}`.trim()}
                      topics={client.topics}
                      disciplines={availableDisciplines.length > 0 ? availableDisciplines : initialActionPlanDisciplines}
                      hideConfirmationHeader
                      bulkNotDoneMode={bulkNotDoneClientIds.has(client.id)}
                      onBulkNotDoneModeChange={(enabled) => setClientBulkNotDoneMode(client.id, enabled)}
                      filterModel={confirmationFilter}
                      transientUnplannedActionIds={transientUnplannedActionIds}
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
                      onAddTopic={(disciplineId) => addTopic(client.id, disciplineId)}
                      onUpdateTopicDiscipline={(topicId, disciplineId) =>
                        updateTopicDiscipline(client.id, topicId, disciplineId)
                      }
                      onDeleteDiscipline={(disciplineId) => deleteDiscipline(client.id, disciplineId)}
                      onAddTarget={(topicId) => addTarget(client.id, topicId)}
                      onAddAction={(topicId, targetId, templateIds, serviceType) =>
                        addAction(client.id, topicId, targetId, templateIds, serviceType)
                      }
                      onAddUnplannedAction={(dueDate, dayPart, draft) =>
                        addUnplannedAction(client.id, dueDate, dayPart, draft)
                      }
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
        </main>

      </div>
      <Dialog open={isTargetHiddenHintOpen} onOpenChange={setIsTargetHiddenHintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ziel ausgeblendet</DialogTitle>
            <DialogDescription>
              Das Ziel wurde ausgeblendet, weil die letzte Handlung abgeschlossen wurde.
              Du kannst das Ziel über den Filter oben rechts mit „Abgeschlossene Ziele einblenden“
              wieder sichtbar machen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideTargetHiddenHint}
                onChange={(event) => setHideTargetHiddenHint(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Diese Meldung künftig nicht mehr anzeigen
            </label>
            <Button onClick={() => setIsTargetHiddenHintOpen(false)}>Verstanden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

function RibbonButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  highlighted,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  highlighted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-24 flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded transition-colors",
        highlighted
          ? "bg-primary/15 text-foreground ring-1 ring-primary/40 shadow-sm hover:bg-primary/25 disabled:opacity-100"
          : active
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
