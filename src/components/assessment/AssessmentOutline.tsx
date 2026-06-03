import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus,
  Pencil,
  Trash2,
  Lock,
  Clock,
  CalendarClock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  Minus,
  RotateCcw,
  Sunrise,
  Sun,
  Utensils,
  Sunset,
  Moon,
  Tag,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Info,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ActionNode,
  ActionStatus,
  ConfirmationFilter,
  DayPart,
  ActionCategory,
  ActionServiceType,
  Weekday,
  MonthlyRecurrencePattern,
  TopicNode,
} from "@/types/assessment";
import { DAY_PART_LABEL, DAY_PART_ORDER, DAY_PART_SELECT_OPTIONS } from "@/types/assessment";
import {
  DEFAULT_ASSESSMENT_FILTER,
  matchesAssessmentFilter,
  type AssessmentFilterModel,
} from "@/types/assessment-filter";
import { cn } from "@/lib/utils";
import { matchesConfirmationFilter } from "@/lib/confirmation-filter";
import {
  ACTION_SERVICE_TYPE_SELECT_OPTIONS,
  buildDefaultTemplateFields,
  getTemplateLockedActionFields,
  getTemplateRequiredActionFields,
  isTemplateLockedActionField,
  loadActionPlanTemplates,
  templateMatchesDiscipline,
  type ActionPlanTemplate,
} from "@/lib/action-plan-templates";
import { DEFAULT_LAST_N_DAYS, type ConfirmationPeriod } from "@/lib/assessment-cache";
import {
  initialActionPlanDisciplines,
  type ActionPlanDiscipline,
} from "@/lib/action-plan-disciplines";
import {
  canConfirmActionCategory,
  loadActionPlanCategoryPermissions,
} from "@/lib/action-plan-categories";

type ConfirmPayload =
  | { status: "done_as_planned"; result?: string; observations?: string }
  | {
      status: "done_with_deviation";
      actualMinutes?: number;
      reason: string;
      result?: string;
      observations?: string;
    }
  | { status: "not_done"; reason: string }
  | { status: "postponed"; postponedToDate?: string; postponedToTime?: string; postponedReason: string }
  | { status: "open" };

type ActionField =
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
  | "observations";


interface UnplannedActionDraft {
  title: string;
  notes: string;
  requiredResources?: string;
  plannedMinutes?: number;
  requiredPersons?: number;
  resultRequirement?: ActionNode["resultRequirement"];
  dayPart?: DayPart | "none";
  scheduledTime?: string;
  category?: ActionCategory;
  serviceType?: ActionServiceType;
  templateId?: string;
  templateName?: string;
  templateLockedFields?: string[];
  templateRequiredFields?: string[];
  dateFrom?: string;
  dateTo?: string;
}

type ActionDraftOverrides = Partial<Pick<ActionNode,
  | "title"
  | "notes"
  | "requiredResources"
  | "plannedMinutes"
  | "requiredPersons"
  | "resultRequirement"
  | "dayPart"
  | "scheduledTime"
  | "category"
  | "validFrom"
  | "validTo"
  | "recurrence"
  | "recurrenceWeekdays"
  | "recurrenceMonthlyPattern"
>>;

interface ActionDraft {
  title: string;
  notes: string;
  requiredResources: string;
  plannedMinutes: string;
  requiredPersons: string;
  resultRequirement: string;
  dayPart: string;
  scheduledTime: string;
  category: string;
  serviceType: string;
  validFrom: string;
  validTo: string;
  recurrence: string;
  recurrenceWeekdays: Weekday[];
  recurrenceMonthlyPattern: string;
}

function emptyActionDraft(): ActionDraft {
  return {
    title: "",
    notes: "",
    requiredResources: "",
    plannedMinutes: "",
    requiredPersons: "",
    resultRequirement: "none",
    dayPart: "none",
    scheduledTime: "",
    category: "none",
    serviceType: "none",
    validFrom: "",
    validTo: "",
    recurrence: "none",
    recurrenceWeekdays: [],
    recurrenceMonthlyPattern: "none",
  };
}

function actionToDraft(action: ActionNode): ActionDraft {
  return {
    title: action.title,
    notes: action.notes,
    requiredResources: action.requiredResources ?? "",
    plannedMinutes: action.plannedMinutes != null ? String(action.plannedMinutes) : "",
    requiredPersons: action.requiredPersons != null ? String(action.requiredPersons) : "",
    resultRequirement: action.resultRequirement ?? "none",
    dayPart: action.dayPart ?? "none",
    scheduledTime: action.scheduledTime ?? "",
    category: action.category ?? "none",
    serviceType: action.serviceType ?? "none",
    validFrom: action.validFrom ?? "",
    validTo: action.validTo ?? "",
    recurrence: action.recurrence ?? "none",
    recurrenceWeekdays: action.recurrenceWeekdays ?? [],
    recurrenceMonthlyPattern: action.recurrenceMonthlyPattern ?? "none",
  };
}

function draftToOverrides(draft: ActionDraft): ActionDraftOverrides {
  const weekdayMap: Record<string, Weekday> = {
    mon: "monday", tue: "tuesday", wed: "wednesday",
    thu: "thursday", fri: "friday", sat: "saturday", sun: "sunday",
  };
  return {
    title: draft.title,
    notes: draft.notes,
    requiredResources: draft.requiredResources || undefined,
    plannedMinutes: draft.plannedMinutes !== "" ? Math.max(0, Number(draft.plannedMinutes)) : undefined,
    requiredPersons: draft.requiredPersons !== "" ? Math.max(1, Math.floor(Number(draft.requiredPersons))) : undefined,
    resultRequirement: draft.resultRequirement !== "none" ? (draft.resultRequirement as ActionNode["resultRequirement"]) : undefined,
    dayPart: draft.dayPart !== "none" ? (draft.dayPart as DayPart) : undefined,
    scheduledTime: draft.scheduledTime || undefined,
    category: draft.category !== "none" ? (draft.category as ActionCategory) : undefined,
    validFrom: draft.validFrom || undefined,
    validTo: draft.validTo || undefined,
    recurrence: draft.recurrence !== "none" ? (draft.recurrence as ActionNode["recurrence"]) : undefined,
    recurrenceWeekdays: draft.recurrenceWeekdays.length > 0
      ? draft.recurrenceWeekdays.filter((v): v is Weekday => Boolean(weekdayMap[v] || v))
      : undefined,
    recurrenceMonthlyPattern: draft.recurrenceMonthlyPattern !== "none"
      ? (draft.recurrenceMonthlyPattern as MonthlyRecurrencePattern)
      : undefined,
  };
}

interface Props {
  viewMode: "planning" | "confirmation";
  stickyOffset?: number;
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  confirmationPeriod?: ConfirmationPeriod;
  lastNDays?: number;
  clientName?: string;
  topics: TopicNode[];
  disciplines?: ActionPlanDiscipline[];
  hideConfirmationHeader?: boolean;
  bulkNotDoneMode?: boolean;
  onBulkNotDoneModeChange?: (enabled: boolean) => void;
  showConfirmed?: boolean;
  confirmationFilter?: ConfirmationFilter;
  filterModel?: AssessmentFilterModel;
  transientUnplannedActionIds?: Set<string>;
  onUpdateTopic: (topicId: string, field: "title" | "notes", value: string) => void;
  showClosedTargets?: boolean;
  onUpdateTarget: (
    topicId: string,
    targetId: string,
    field: "title" | "notes" | "validFrom" | "validTo",
    value: string,
  ) => void;
  onUpdateAction: (
    topicId: string,
    targetId: string,
    actionId: string,
    field: "title" | "notes" | "requiredResources",
    value: string,
  ) => void;
  onUpdateActionField: (
    topicId: string,
    targetId: string,
    actionId: string,
    field: ActionField,
    value: number | string | string[] | undefined,
  ) => void;
    onConfirmAction: (
    topicId: string,
    targetId: string,
    actionId: string,
    payload: ConfirmPayload,
    date?: string,
  ) => void;
  onAddTarget: (topicId: string) => void;
  onAddAction: (
    topicId: string,
    targetId: string,
    templateIds: string[],
    serviceType?: ActionServiceType,
    overrides?: ActionDraftOverrides,
  ) => void;
  onAddUnplannedAction?: (
    dueDate: string,
    dayPart: DayPart | "none",
    draft: UnplannedActionDraft,
  ) => string | void;
  onAddTopic: (disciplineId?: string) => void;
  onUpdateTopicDiscipline?: (topicId: string, disciplineId: string) => void;
  onDeleteDiscipline?: (disciplineId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteTarget: (topicId: string, targetId: string) => void;
  onReactivateTarget: (topicId: string, targetId: string) => void;
  onDeleteAction: (topicId: string, targetId: string, actionId: string) => void;
}

type ConfirmationMode = "done_as_planned" | "done_with_deviation" | "not_done" | "postponed";

interface DialogTarget {
  topicId: string;
  targetId: string;
  dueDate: string;
  action: ActionNode;
  initialMode?: ConfirmationMode;
  confirmedBy?: string;
  confirmedAt?: string;
}

interface BulkNotDoneTarget {
  key: string;
  topicId: string;
  targetId: string;
  actionId: string;
  dueDate: string;
  actionTitle: string;
}

const DAY_PART_ICONS: Record<DayPart, typeof Sunrise> = {
  morning: Sunrise,
  noon: Utensils,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const CATEGORY_LABEL: Record<ActionCategory, string> = {
  a: "A",
  b: "B",
  c: "C",
};

const CONFIRMATION_MODE_OPTIONS: Array<{
  mode: ConfirmationMode;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  iconClassName: string;
}> = [
  {
    mode: "done_as_planned",
    label: "Erledigt wie geplant",
    description: "Handlung wie vorgesehen durchgeführt",
    icon: CheckCircle2,
    iconClassName: "text-primary",
  },
  {
    mode: "done_with_deviation",
    label: "Erledigt mit Abweichung",
    description: "Andere tatsächliche Zeit oder Begründung zur Abweichung erfassen",
    icon: AlertTriangle,
    iconClassName: "text-accent",
  },
  {
    mode: "not_done",
    label: "Nicht durchgeführt",
    description: "Handlung nicht durchgeführt und Begründung erfassen",
    icon: XCircle,
    iconClassName: "text-destructive",
  },
  {
    mode: "postponed",
    label: "Später machen",
    description: "Handlung auf ein späteres Datum und/oder eine spätere Uhrzeit verschieben",
    icon: CalendarClock,
    iconClassName: "text-muted-foreground",
  },
];

const ACTION_PLAN_CATEGORY_PERMISSIONS = loadActionPlanCategoryPermissions();

const canConfirmAction = (action: ActionNode) =>
  canConfirmActionCategory(action.category, ACTION_PLAN_CATEGORY_PERMISSIONS);

const WEEKDAY_OPTIONS: Array<{ value: Weekday; label: string; dayIndex: number }> = [
  { value: "monday", label: "Mo", dayIndex: 1 },
  { value: "tuesday", label: "Di", dayIndex: 2 },
  { value: "wednesday", label: "Mi", dayIndex: 3 },
  { value: "thursday", label: "Do", dayIndex: 4 },
  { value: "friday", label: "Fr", dayIndex: 5 },
  { value: "saturday", label: "Sa", dayIndex: 6 },
  { value: "sunday", label: "So", dayIndex: 0 },
];

const MONTHLY_PATTERN_OPTIONS: Array<{ value: MonthlyRecurrencePattern; label: string }> = [
  { value: "first_day", label: "Erster Tag im Monat" },
  { value: "first_monday", label: "Erster Montag im Monat" },
  { value: "last_day", label: "Letzter Tag im Monat" },
  { value: "last_friday", label: "Letzter Freitag im Monat" },
];

const isRecurringOnDate = (action: ActionNode, date: Date) => {
  if (action.recurrence === "daily") return true;

  if (action.recurrence === "weekly") {
    return (action.recurrenceWeekdays ?? []).some((item) => {
      const option = WEEKDAY_OPTIONS.find((opt) => opt.value === item);
      return option?.dayIndex === date.getDay();
    });
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

function groupFlatActionsByDayPart<T extends { action: ActionNode }>(items: T[]) {
  const groups = new Map<DayPart | "none", T[]>();
  for (const key of DAY_PART_ORDER) groups.set(key, []);
  for (const item of items) {
    const key = (item.action.dayPart ?? "none") as DayPart | "none";
    groups.get(key)!.push(item);
  }
  return DAY_PART_ORDER
    .map((key) => ({ key, actions: groups.get(key)! }))
    .filter((group) => group.actions.length > 0);
}

function groupFlatActionsByDateThenDayPart<T extends { action: ActionNode; dueDate: string }>(items: T[]) {
  const byDate = new Map<string, T[]>();
  for (const item of items) {
    const current = byDate.get(item.dueDate) ?? [];
    current.push(item);
    byDate.set(item.dueDate, current);
  }

  return [...byDate.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([dueDate, dateItems]) => ({
      dueDate,
      dayPartGroups: groupFlatActionsByDayPart(dateItems),
    }));
}

const buildPlannedDateTime = (date: string, time?: string) =>
  new Date(`${date}T${time || "00:00"}:00`);

const buildBulkNotDoneKey = (topicId: string, targetId: string, actionId: string, dueDate: string) =>
  `${topicId}::${targetId}::${actionId}::${dueDate}`;

const getPostponedLabel = (date?: string, time?: string) => {
  if (!date && !time) return "später";
  const datePart = date ? format(parseISO(date), "dd.MM.yyyy", { locale: de }) : undefined;
  if (datePart && time) return `${datePart}, ${time}`;
  return datePart ?? time ?? "später";
};

export function AssessmentOutline({
  viewMode,
  stickyOffset,
  selectedDate,
  onSelectedDateChange,
  confirmationPeriod = "day",
  lastNDays = DEFAULT_LAST_N_DAYS,
  clientName,
  topics,
  disciplines = initialActionPlanDisciplines,
  hideConfirmationHeader,
  bulkNotDoneMode = false,
  onBulkNotDoneModeChange,
  confirmationFilter,
  filterModel = DEFAULT_ASSESSMENT_FILTER,
  showClosedTargets = false,
  transientUnplannedActionIds = new Set(),
  onUpdateTopic,
  onUpdateTarget,
  onUpdateAction,
  onUpdateActionField,
  onConfirmAction,
  onAddTarget,
  onAddAction,
  onAddUnplannedAction,
  onAddTopic,
  onUpdateTopicDiscipline,
  onDeleteDiscipline,
  onDeleteTopic,
  onDeleteTarget,
  onReactivateTarget,
  onDeleteAction,
}: Props) {
  const [panelContext, setPanelContext] = useState<{
    mode: "create" | "edit";
    topicId: string;
    targetId: string;
    topicDisciplineId?: string;
    targetValidFrom?: string;
    targetValidTo?: string;
    action?: ActionNode;
    initialDayPart?: DayPart | "none";
  } | null>(null);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [newTopicDisciplineId, setNewTopicDisciplineId] = useState(
    disciplines[0]?.id ?? initialActionPlanDisciplines[0]?.id ?? "",
  );
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const [isConfirmDialogMounted, setIsConfirmDialogMounted] = useState(false);

  const openConfirmDialog = (target: DialogTarget) => {
    setDialogTarget(target);
    setIsConfirmDialogMounted(true);
  };
  const closeConfirmDialog = () => {
    setIsConfirmDialogMounted(false);
    setDialogTarget(null);
  };
  const [selectedBulkNotDoneKeys, setSelectedBulkNotDoneKeys] = useState<Set<string>>(new Set());
  const [bulkNotDoneDialogOpen, setBulkNotDoneDialogOpen] = useState(false);
  const [unplannedDialogTarget, setUnplannedDialogTarget] = useState<{ dueDate?: string; dayPart: DayPart | "none" } | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const disciplineOptions = disciplines.length > 0 ? disciplines : initialActionPlanDisciplines;
  const getTopicDisciplineId = (topic: TopicNode) =>
    topic.disciplineId ?? disciplineOptions[0]?.id ?? "";
  const disciplineById = new Map(
    disciplineOptions.map((discipline) => [discipline.id, discipline]),
  );
  const topicsByDiscipline = topics.reduce((groups, topic) => {
    const disciplineId = getTopicDisciplineId(topic);
    const groupTopics = groups.get(disciplineId) ?? [];
    groupTopics.push(topic);
    groups.set(disciplineId, groupTopics);
    return groups;
  }, new Map<string, TopicNode[]>());
  const topicDisciplineGroups = [
    ...disciplineOptions
      .map((discipline) => ({
        discipline,
        topics: topicsByDiscipline.get(discipline.id) ?? [],
      }))
      .filter((group) => group.topics.length > 0),
    ...Array.from(topicsByDiscipline.entries())
      .filter(([disciplineId]) => !disciplineById.has(disciplineId))
      .map(([disciplineId, groupTopics]) => ({
        discipline: { id: disciplineId, title: "Unbekannte Disziplin", authorizedRoleIds: [] },
        topics: groupTopics,
      })),
  ];

  useEffect(() => {
    if (!bulkNotDoneMode) {
      setSelectedBulkNotDoneKeys(new Set());
      setBulkNotDoneDialogOpen(false);
    }
  }, [bulkNotDoneMode]);

  const openCreatePanel = (topicId: string, targetId: string, initialDayPart?: DayPart | "none") => {
    const topic = topics.find((t) => t.id === topicId);
    const topicDisciplineId = topic ? getTopicDisciplineId(topic) : undefined;
    const target = topic?.targets.find((tg) => tg.id === targetId);
    setPanelContext({ mode: "create", topicId, targetId, topicDisciplineId, targetValidFrom: target?.validFrom, targetValidTo: target?.validTo, initialDayPart });
    setIsPanelMounted(true);
  };

  const openEditPanel = (topicId: string, targetId: string, action: ActionNode) => {
    const topic = topics.find((t) => t.id === topicId);
    const target = topic?.targets.find((tg) => tg.id === targetId);
    setPanelContext({ mode: "edit", topicId, targetId, action, targetValidFrom: target?.validFrom, targetValidTo: target?.validTo });
    setIsPanelMounted(true);
  };

  const closePanel = () => setIsPanelOpen(false);

  const handlePanelAnimationEnd = () => {
    if (isPanelOpen) return;
    setIsPanelMounted(false);
    setPanelContext(null);
  };

  useEffect(() => {
    if (!isPanelMounted) return;
    const frame = requestAnimationFrame(() => setIsPanelOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelMounted]);

  const handlePanelSave = (draft: ActionDraft, selectedTemplateIds: string[]) => {
    if (!panelContext) return;
    const { topicId, targetId, mode, action } = panelContext;

    if (mode === "create") {
      const overrides = draftToOverrides(draft);
      const serviceType = draft.serviceType !== "none" ? (draft.serviceType as ActionServiceType) : undefined;
      onAddAction(topicId, targetId, selectedTemplateIds, serviceType, overrides);
    } else if (mode === "edit" && action) {
      onUpdateAction(topicId, targetId, action.id, "title", draft.title);
      onUpdateAction(topicId, targetId, action.id, "notes", draft.notes);
      onUpdateAction(topicId, targetId, action.id, "requiredResources", draft.requiredResources);
      onUpdateActionField(topicId, targetId, action.id, "dayPart", draft.dayPart !== "none" ? draft.dayPart : undefined);
      onUpdateActionField(topicId, targetId, action.id, "scheduledTime", draft.scheduledTime || undefined);
      onUpdateActionField(topicId, targetId, action.id, "plannedMinutes", draft.plannedMinutes !== "" ? Math.max(0, Number(draft.plannedMinutes)) : undefined);
      onUpdateActionField(topicId, targetId, action.id, "requiredPersons", draft.requiredPersons !== "" ? Math.max(1, Math.floor(Number(draft.requiredPersons))) : undefined);
      onUpdateActionField(topicId, targetId, action.id, "category", draft.category !== "none" ? draft.category : undefined);
      onUpdateActionField(topicId, targetId, action.id, "resultRequirement", draft.resultRequirement !== "none" ? draft.resultRequirement : undefined);
      onUpdateActionField(topicId, targetId, action.id, "validFrom", draft.validFrom || undefined);
      onUpdateActionField(topicId, targetId, action.id, "validTo", draft.validTo || undefined);
      onUpdateActionField(topicId, targetId, action.id, "recurrence", draft.recurrence !== "none" ? draft.recurrence : undefined);
      onUpdateActionField(topicId, targetId, action.id, "recurrenceWeekdays", draft.recurrenceWeekdays.length > 0 ? draft.recurrenceWeekdays : undefined);
      onUpdateActionField(topicId, targetId, action.id, "recurrenceMonthlyPattern", draft.recurrenceMonthlyPattern !== "none" ? draft.recurrenceMonthlyPattern : undefined);
    }

    closePanel();
  };

  const handlePanelDelete = () => {
    if (!panelContext?.action) return;
    onDeleteAction(panelContext.topicId, panelContext.targetId, panelContext.action.id);
    closePanel();
  };

  if (viewMode === "confirmation") {
    const getPeriodRange = () => {
      const current = new Date(`${selectedDate}T00:00:00`);
      if (confirmationPeriod === "day") {
        return { start: selectedDate, end: selectedDate };
      }
      if (confirmationPeriod === "week") {
        const weekDay = current.getDay();
        const diff = weekDay === 0 ? -6 : 1 - weekDay;
        const start = new Date(current);
        start.setDate(current.getDate() + diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return {
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
        };
      }
      if (confirmationPeriod === "lastNDays") {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date(end);
        start.setDate(end.getDate() - Math.max(1, Math.floor(lastNDays)));
        return {
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
        };
      }
      const start = new Date(current.getFullYear(), current.getMonth(), 1);
      const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      return {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      };
    };

    const periodRange = getPeriodRange();
    const getStatusForDate = (action: ActionNode, date: string) => {
      return action.confirmations?.[date]?.status || "open";
    };

    const getDueDatesInPeriod = (action: ActionNode) => {
      if (!action.recurrence) return [];
      if (confirmationPeriod === "day") {
        const selected = new Date(`${selectedDate}T00:00:00`);
        const isRecurringDay = isRecurringOnDate(action, selected);
        if (!isRecurringDay) return [];
        return [selectedDate];
      }

      const start = new Date(`${periodRange.start}T00:00:00`);
      const end = new Date(`${periodRange.end}T00:00:00`);
      const dueDates: string[] = [];
      const current = new Date(start);

      while (current <= end) {
        const day = format(current, "yyyy-MM-dd");
        const isWithinRange =
          (!action.validFrom || day >= action.validFrom) && (!action.validTo || day <= action.validTo);
        const isRecurringDay = isRecurringOnDate(action, current);

        if (isWithinRange && isRecurringDay) {
          dueDates.push(day);
        }
        current.setDate(current.getDate() + 1);
      }

      return dueDates;
    };

    const flatActions: Array<{
      topic: TopicNode;
      target: { id: string; title: string; notes: string };
      action: ActionNode;
      dueDate: string;
      confirmationDate: string;
      status: ActionStatus;
    }> = [];

    topics.forEach((topic) => {
      topic.targets.forEach((target) => {
        target.actions.forEach((action) => {
          if (!action.validFrom) return;
          if (!action.recurrence) return;
          // Date Filtering
          if (action.validFrom && action.validFrom > periodRange.end) return;
          if (action.validTo && action.validTo < periodRange.start) return;

          const dueDates = getDueDatesInPeriod(action);
          dueDates.forEach((dueDate) => {
            const confirmation = action.confirmations?.[dueDate];
            if (confirmation?.postponedToDate) return;
            const status = getStatusForDate(action, dueDate);
            const forceShowTransientUnplanned = action.isUnplanned && transientUnplannedActionIds.has(action.id);
            if (!forceShowTransientUnplanned && !matchesAssessmentFilter({ action, status, confirmation, disciplineId: topic.disciplineId }, filterModel)) return;
            flatActions.push({ topic, target, action, dueDate, confirmationDate: dueDate, status });
          });

          Object.entries(action.confirmations ?? {}).forEach(([confirmationDate, confirmation]) => {
            if (!confirmation.postponedToDate) return;
            if (confirmation.postponedToDate < periodRange.start || confirmation.postponedToDate > periodRange.end) {
              return;
            }
            const forceShowTransientUnplanned = action.isUnplanned && transientUnplannedActionIds.has(action.id);
            if (!forceShowTransientUnplanned && !matchesAssessmentFilter({ action, status: confirmation.status, confirmation, disciplineId: topic.disciplineId }, filterModel)) return;
            flatActions.push({
              topic,
              target,
              action,
              dueDate: confirmation.postponedToDate,
              confirmationDate,
              status: confirmation.status,
            });
          });
        });
      });
    });

    const matchesFilter = (
      action: ActionNode,
      status: ActionStatus,
      dueDate: string,
    ) => {
      if (!confirmationFilter) return true;
      return matchesConfirmationFilter(action, status, dueDate, confirmationFilter);
    };

    const filteredFlatActions = flatActions.filter(({ action, status, dueDate }) =>
      (action.isUnplanned && transientUnplannedActionIds.has(action.id)) || matchesFilter(action, status, dueDate),
    );

    const sortedFlatActions = [...filteredFlatActions].sort((left, right) => {
      if (left.dueDate !== right.dueDate) {
        return left.dueDate.localeCompare(right.dueDate);
      }

      const leftDayPartIndex = DAY_PART_ORDER.indexOf((left.action.dayPart ?? "none") as DayPart | "none");
      const rightDayPartIndex = DAY_PART_ORDER.indexOf((right.action.dayPart ?? "none") as DayPart | "none");
      if (leftDayPartIndex !== rightDayPartIndex) {
        return leftDayPartIndex - rightDayPartIndex;
      }

      return left.action.title.localeCompare(right.action.title, "de", { sensitivity: "base" });
    });
    const groupedFlatActions = groupFlatActionsByDateThenDayPart(sortedFlatActions);
    const bulkNotDoneTargets: BulkNotDoneTarget[] = sortedFlatActions
      .filter(({ action, status }) => canConfirmAction(action) && (status === "open" || status === "postponed"))
      .map(({ topic, target, action, confirmationDate }) => ({
        key: buildBulkNotDoneKey(topic.id, target.id, action.id, confirmationDate),
        topicId: topic.id,
        targetId: target.id,
        actionId: action.id,
        dueDate: confirmationDate,
        actionTitle: action.title,
      }));
    const bulkNotDoneTargetsByKey = new Map(bulkNotDoneTargets.map((target) => [target.key, target]));
    const selectedBulkNotDoneTargets = [...selectedBulkNotDoneKeys]
      .map((key) => bulkNotDoneTargetsByKey.get(key))
      .filter((target): target is BulkNotDoneTarget => Boolean(target));
    const visibleBulkNotDoneKeys = bulkNotDoneTargets.map((target) => target.key);
    const allVisibleBulkNotDoneSelected =
      visibleBulkNotDoneKeys.length > 0 && visibleBulkNotDoneKeys.every((key) => selectedBulkNotDoneKeys.has(key));
    const someVisibleBulkNotDoneSelected = visibleBulkNotDoneKeys.some((key) => selectedBulkNotDoneKeys.has(key));

    const toggleBulkNotDoneSelection = (key: string, checked: boolean) => {
      setSelectedBulkNotDoneKeys((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    };

    const toggleAllVisibleBulkNotDoneSelection = (checked: boolean) => {
      setSelectedBulkNotDoneKeys((prev) => {
        const next = new Set(prev);
        visibleBulkNotDoneKeys.forEach((key) => {
          if (checked) {
            next.add(key);
          } else {
            next.delete(key);
          }
        });
        return next;
      });
    };

    const shiftDate = (days: number) => {
      const d = new Date(`${selectedDate}T00:00:00`);
      d.setDate(d.getDate() + days);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      onSelectedDateChange(`${year}-${month}-${day}`);
    };

    return (
      <div className="space-y-4">
        {!hideConfirmationHeader && (
          <div className="flex items-center justify-between mb-6 bg-secondary/30 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-background border border-border rounded-md p-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DateField
                  label="Datum"
                  value={selectedDate}
                  onChange={(v) => v && onSelectedDateChange(v)}
                  required
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
              {filteredFlatActions.length} Handlungen geplant
            </div>
          </div>
        )}

        {bulkNotDoneMode && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="bulk-not-done-select-all"
                  checked={allVisibleBulkNotDoneSelected || (someVisibleBulkNotDoneSelected && "indeterminate")}
                  disabled={visibleBulkNotDoneKeys.length === 0}
                  onCheckedChange={(checked) => toggleAllVisibleBulkNotDoneSelection(checked === true)}
                  aria-label="Alle offenen Handlungen für Mehrfachbestätigung auswählen"
                />
                <Label htmlFor="bulk-not-done-select-all" className="text-sm font-normal text-muted-foreground">
                  Offene/verschobene Handlungen auswählen
                </Label>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {selectedBulkNotDoneTargets.length} ausgewählt
                </span>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => onBulkNotDoneModeChange?.(false)}
                >
                  Mehrfachauswahl beenden
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="shadow-sm shadow-destructive/20 hover:shadow-md hover:shadow-destructive/25"
                  disabled={selectedBulkNotDoneTargets.length === 0}
                  onClick={() => setBulkNotDoneDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Ausgewählte als „Nicht durchgeführt" bestätigen
                </Button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground/80">
              Ausnahmefall: Begründung einmalig erfassen und auf alle ausgewählten Handlungen kopieren. Bereits abgeschlossene Handlungen werden nicht in die Mehrfachauswahl aufgenommen.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {groupedFlatActions.map((dateGroup) => (
            <div key={dateGroup.dueDate} className="space-y-3">
              <div
                className={cn(stickyOffset !== undefined && "sticky z-[6] bg-[#f3f3f5] rounded-lg")}
                style={stickyOffset !== undefined ? { top: stickyOffset } : undefined}
              >
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <h3 className="text-sm font-semibold text-primary">
                    {format(parseISO(dateGroup.dueDate), "EEEE, dd.MM.yyyy", { locale: de })}
                  </h3>
                </div>
              </div>
              {dateGroup.dayPartGroups.map((group) => (
                <div key={`${dateGroup.dueDate}-${group.key}`}>
                  <DayPartHeader
                    part={group.key}
                    stickyTop={stickyOffset !== undefined ? stickyOffset + 46 : undefined}
                    onCreateUnplanned={onAddUnplannedAction ? () =>
                      setUnplannedDialogTarget({ dueDate: dateGroup.dueDate, dayPart: group.key }) : undefined}
                  />
                  <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
                    <Table
                      className={cn(
                        "w-full table-fixed",
                        bulkNotDoneMode
                          ? clientName
                            ? "min-w-[1130px]"
                            : "min-w-[1020px]"
                          : clientName
                            ? "min-w-[1082px]"
                            : "min-w-[972px]",
                      )}
                    >
                      <TableHeader className="bg-secondary/40">
                        <TableRow className="hover:bg-transparent">
                          {bulkNotDoneMode && (
                            <TableHead className="w-[48px] px-2"><span className="sr-only">Mehrfachauswahl</span></TableHead>
                          )}
                          <TableHead className="w-[76px] px-1"><span className="sr-only">Umsetzung</span></TableHead>
                          <TableHead className="w-[296px] px-2">Handlung</TableHead>
                          <TableHead className="w-[90px] px-2">Kategorie</TableHead>
                          <TableHead className="w-[80px] px-2">Uhrzeit</TableHead>
                          <TableHead className="w-[72px] px-2">Plan</TableHead>
                          <TableHead className="w-[80px] px-2">Ist</TableHead>
                          <TableHead className="w-[64px] px-2">Anz. Pers.</TableHead>
                          <TableHead className="w-[200px] px-2">Rückmeldung</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.actions.map(({ topic, target, action, dueDate, confirmationDate, status }) => {
                          const conf = action.confirmations?.[confirmationDate];
                          const canConfirm = canConfirmAction(action);
                          const bulkNotDoneKey = buildBulkNotDoneKey(topic.id, target.id, action.id, confirmationDate);
                          const isBulkNotDoneSelectable = canConfirm && (status === "open" || status === "postponed");
                          const disciplineTitle =
                            disciplineOptions.find((discipline) => discipline.id === topic.disciplineId)?.title ??
                            topic.disciplineId ??
                            "Ohne Disziplin";
                          const openConfirmationDialog = (initialMode: ConfirmationMode) => {
                            if (!canConfirm) return;
                            openConfirmDialog({
                              topicId: topic.id,
                              targetId: target.id,
                              dueDate: confirmationDate,
                              initialMode,
                              confirmedBy: conf?.confirmedBy,
                              confirmedAt: conf?.confirmedAt,
                              action: {
                                ...action,
                                status,
                                actualMinutes: conf?.actualMinutes,
                                reason: conf?.reason,
                                result: conf?.result,
                                observations: conf?.observations,
                              },
                            });
                          };

                          return (
                            <TableRow
                              key={`${action.id}-${confirmationDate}-${dueDate}`}
                              aria-disabled={!canConfirm}
                              className={cn(
                                "align-top transition-colors",
                                status === "postponed"
                                  ? "bg-muted/20 hover:bg-muted/30"
                                  : status !== "open"
                                    ? "bg-primary/5 hover:bg-primary/10"
                                    : "bg-card hover:bg-secondary/40",
                                !canConfirm && "opacity-90",
                              )}
                            >
                              {bulkNotDoneMode && (
                                <TableCell className="px-2 py-3 align-top text-center">
                                  <Checkbox
                                    checked={selectedBulkNotDoneKeys.has(bulkNotDoneKey)}
                                    disabled={!isBulkNotDoneSelectable}
                                    onCheckedChange={(checked) =>
                                      toggleBulkNotDoneSelection(bulkNotDoneKey, checked === true)
                                    }
                                    aria-label={`Handlung ${action.title} für Mehrfachbestätigung auswählen`}
                                  />
                                </TableCell>
                              )}
                              <TableCell className="px-2 py-3 align-top text-xs text-muted-foreground">
                                {status === "open" || status === "postponed" ? (
                                  <TooltipProvider delayDuration={150}>
                                    <div className="mx-auto grid w-max grid-cols-2 gap-1.5">
                                      {CONFIRMATION_MODE_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                          <Tooltip key={option.mode}>
                                            <TooltipTrigger asChild>
                                              <button
                                                type="button"
                                                onClick={() => openConfirmationDialog(option.mode)}
                                                disabled={!canConfirm}
                                                aria-label={option.label}
                                                className={cn(
                                                  "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                                                  "border-border bg-background hover:bg-secondary/60",
                                                  !canConfirm && "cursor-not-allowed opacity-50 hover:bg-background",
                                                )}
                                              >
                                                <Icon className={cn("h-4 w-4", option.iconClassName)} />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center">
                                              <div className="max-w-[220px] space-y-0.5">
                                                <div className="font-medium">{option.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {canConfirm
                                                    ? option.description
                                                    : "Keine Umsetzung möglich (zu geringe Berechtigung)"}
                                                </div>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                      {action.isUnplanned && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              onClick={() => onDeleteAction(topic.id, target.id, action.id)}
                                              aria-label="Ungeplante Handlung löschen"
                                              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" align="center">
                                            <div className="max-w-[220px] space-y-0.5">
                                              <div className="font-medium">Ungeplante Handlung löschen</div>
                                              <div className="text-xs text-muted-foreground">Handlung wird unwiderruflich entfernt</div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TooltipProvider>
                                ) : (
                                  <div className="flex justify-center">
                                    <TooltipProvider delayDuration={150}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openConfirmationDialog(status as ConfirmationMode)
                                            }
                                            disabled={!canConfirm}
                                            aria-label="Umsetzung bearbeiten"
                                            className={cn(
                                              "pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-secondary/60",
                                              !canConfirm && "cursor-not-allowed opacity-50 hover:bg-background",
                                            )}
                                          >
                                            <StatusIcon status={status} />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="center">
                                          <div className="max-w-[220px] space-y-0.5">
                                            <div className="font-medium">Umsetzung bearbeiten</div>
                                            <div className="text-xs text-muted-foreground">
                                              {canConfirm ? "Umsetzungsstatus anpassen oder ändern" : "Keine Umsetzung möglich (zu geringe Berechtigung)"}
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top break-words">
                                <div className={cn("min-w-0 font-medium leading-snug break-words", status !== "open" && "text-foreground/70")}>
                                  <span>{action.title}</span>
                                  {action.isUnplanned && (
                                    <Badge variant="outline" className="ml-2 border-amber-300 bg-amber-50 align-middle text-[10px] text-amber-800">
                                      Ungeplant
                                    </Badge>
                                  )}
                                  <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          tabIndex={0}
                                          aria-label="Details zu Disziplin, Schwerpunkt und Ziel anzeigen"
                                          className="ml-1.5 inline-flex h-6 w-6 shrink-0 cursor-help items-center justify-center rounded-full border border-border bg-background align-middle text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                          <Info className="h-3.5 w-3.5" aria-hidden="true" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" align="start" className="max-w-[320px] space-y-2 p-3 text-xs">
                                        <div>
                                          <div className="font-semibold text-foreground">Disziplin</div>
                                          <div className="mt-0.5 text-muted-foreground">{disciplineTitle}</div>
                                        </div>
                                        <div>
                                          <div className="font-semibold text-foreground">Schwerpunkt</div>
                                          <div className="mt-0.5 text-muted-foreground">{topic.title}</div>
                                        </div>
                                        <div>
                                          <div className="font-semibold text-foreground">Ziel</div>
                                          <div className="mt-0.5 text-muted-foreground">{target.title}</div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                {conf?.postponedToDate && (
                                  <div className="mt-1 inline-flex flex-col gap-0.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <CalendarClock className="h-3 w-3 shrink-0" />
                                      Verschoben von {format(parseISO(confirmationDate), "dd.MM.yyyy", { locale: de })} auf {getPostponedLabel(conf.postponedToDate, conf.postponedToTime)}
                                    </span>
                                    {conf.postponedReason && (
                                      <span className="pl-4">Grund: {conf.postponedReason}</span>
                                    )}
                                  </div>
                                )}
                                {action.notes.trim() && (
                                  <div className="mt-1 text-xs text-foreground/70 line-clamp-2 whitespace-pre-wrap break-words">
                                    <span className="font-medium">Beschreibung:</span> {action.notes}
                                  </div>
                                )}
                                {action.requiredResources?.trim() && (
                                  <div className="mt-1 text-xs text-foreground/70 line-clamp-2 whitespace-pre-wrap break-words">
                                    <span className="font-medium">Hilfsmittel:</span> {action.requiredResources}
                                  </div>
                                )}
                                {!canConfirm && (
                                  <div className="mt-1 text-[11px] italic text-muted-foreground/70">
                                    Keine Umsetzung möglich (zu geringe Berechtigung)
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top text-xs text-muted-foreground">
                                {action.category ? (
                                  <div className="inline-flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {CATEGORY_LABEL[action.category]}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top text-xs">
                                {(conf?.postponedToTime ?? action.scheduledTime) ? (
                                  <div className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-1 font-bold text-amber-900 shadow-sm">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span className="tabular-nums">{conf?.postponedToTime ?? action.scheduledTime}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top text-xs text-muted-foreground">
                                {action.plannedMinutes != null ? (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {action.plannedMinutes} Min
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top text-xs">
                                {status === "done_as_planned" && action.plannedMinutes != null ? (
                                  <div className="flex items-center gap-1 font-medium text-foreground/80">
                                    <Clock className="h-3 w-3" />
                                    {action.plannedMinutes} Min
                                  </div>
                                ) : status === "done_with_deviation" && conf?.actualMinutes != null ? (
                                  <div className="flex items-center gap-1 font-medium text-accent">
                                    <Clock className="h-3 w-3" />
                                    {conf.actualMinutes} Min
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60">-</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top text-xs text-muted-foreground">
                                {action.requiredPersons ? (
                                  <div className="flex items-center gap-1 font-medium text-foreground/80">
                                    <Users className="h-3 w-3" />
                                    <span className="tabular-nums">{action.requiredPersons}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 align-top text-xs text-foreground/70">
                                {conf?.reason || ((action.resultRequirement ?? "none") !== "none" && conf?.result) || conf?.observations ? (
                                  <div className="space-y-1">
                                    {conf.reason && (
                                      <div className="line-clamp-2 italic text-destructive/80">
                                        <span className="not-italic font-semibold mr-1">Grund:</span>
                                        {conf.reason}
                                      </div>
                                    )}
                                    {(action.resultRequirement ?? "none") !== "none" && conf.result && (
                                      <div className="line-clamp-2 border-l-2 border-primary/20 pl-2">
                                        <span className="font-semibold mr-1">Resultat:</span>
                                        {conf.result}
                                      </div>
                                    )}
                                    {conf.observations && (
                                      <div className="line-clamp-2 border-l-2 border-primary/20 pl-2">
                                        <span className="font-semibold mr-1">Beobachtung:</span>
                                        {conf.observations}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {isConfirmDialogMounted && dialogTarget && (
          <ConfirmActionDialog
            key={dialogTarget.action.id + "_" + dialogTarget.dueDate}
            target={dialogTarget}
            onClose={closeConfirmDialog}
            onConfirm={(payload) => {
              onConfirmAction(
                dialogTarget.topicId,
                dialogTarget.targetId,
                dialogTarget.action.id,
                payload,
                dialogTarget.dueDate
              );
              closeConfirmDialog();
            }}
            onDelete={dialogTarget.action.isUnplanned && dialogTarget.action.status === "open" ? () => {
              onDeleteAction(dialogTarget.topicId, dialogTarget.targetId, dialogTarget.action.id);
              closeConfirmDialog();
            } : undefined}
            clientName={clientName}
          />
        )}
        {unplannedDialogTarget && (
          <UnplannedActionDialog
            target={unplannedDialogTarget}
            onClose={() => setUnplannedDialogTarget(null)}
            onConfirm={(draft) => {
              if (!onAddUnplannedAction) return;
              onAddUnplannedAction(unplannedDialogTarget.dueDate ?? draft.dateFrom ?? "", unplannedDialogTarget.dayPart, draft);
              setUnplannedDialogTarget(null);
            }}
            clientName={clientName}
          />
        )}
        <BulkNotDoneDialog
          open={bulkNotDoneDialogOpen}
          targets={selectedBulkNotDoneTargets}
          onClose={() => setBulkNotDoneDialogOpen(false)}
          onConfirm={(reason) => {
            selectedBulkNotDoneTargets.forEach((target) => {
              onConfirmAction(
                target.topicId,
                target.targetId,
                target.actionId,
                { status: "not_done", reason },
                target.dueDate,
              );
            });
            setSelectedBulkNotDoneKeys(new Set());
            setBulkNotDoneDialogOpen(false);
            onBulkNotDoneModeChange?.(false);
          }}
        />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-sm p-12 text-center text-muted-foreground">
        <p className="mb-4">Noch keine Schwerpunkte erfasst.</p>
        <div className="mx-auto mb-4 max-w-xs text-left">
          <Label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
            Disziplin
          </Label>
          <Select value={newTopicDisciplineId} onValueChange={setNewTopicDisciplineId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Disziplin auswählen" />
            </SelectTrigger>
            <SelectContent>
              {disciplineOptions.map((discipline) => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => onAddTopic(newTopicDisciplineId)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ersten Schwerpunkt hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {topicDisciplineGroups.map(({ discipline, topics: groupTopics }) => (
        <section key={discipline.id} className="space-y-5">
          <div className="border-b-2 border-border pb-3">
            <div className="mt-1 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold">{discipline.title}</h3>
            </div>
          </div>

          <div className="space-y-8 border-l border-primary/20 pl-5">
            {groupTopics.map((topic) => (
              <article key={topic.id} className="group/topic space-y-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <input
                      value={topic.title}
                      onChange={(e) => onUpdateTopic(topic.id, "title", e.target.value)}
                      readOnly={topic.targets.some((t) => t.actions.length > 0)}
                      placeholder="Schwerpunkt…"
                      className={`w-full text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40 ${topic.targets.some((t) => t.actions.length > 0) ? "text-foreground cursor-default" : ""}`}
                    />
                  </div>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onDeleteTopic(topic.id)}
                          className="opacity-0 group-hover/topic:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                          aria-label="Schwerpunkt löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="max-w-[220px] space-y-0.5">
                          <div className="font-medium">Schwerpunkt löschen</div>
                          <div className="text-xs text-muted-foreground">Schwerpunkt mit allen Zielen und Handlungen entfernen</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Notes
                  value={topic.notes}
                  onChange={(v) => onUpdateTopic(topic.id, "notes", v)}
                  placeholder="Freitext zum Schwerpunkt…"
                  className="mt-1.5 w-1/2"
                />

                {/* Targets */}
                <div className="mt-6 space-y-6 pl-6 border-l border-border ml-4">
                  {topic.targets.filter((target) => showClosedTargets || !target.validTo).map((target) => {
              const isTargetClosed = !!target.validTo;
              return (
                <div key={target.id} className="group/target">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {isTargetClosed && (
                        <div className="mb-1">
                          <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Abgeschlossen
                          </span>
                        </div>
                      )}
                      <input
                        value={target.title}
                        readOnly={isTargetClosed}
                        onChange={(e) =>
                          isTargetClosed ? undefined : onUpdateTarget(topic.id, target.id, "title", e.target.value)
                        }
                        placeholder="Ziel…"
                        className="w-full text-lg font-medium bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40 read-only:cursor-default"
                      />
                      <div className="flex items-center gap-3 mt-1.5">
                        <DateField
                          label="Gültig ab"
                          value={target.validFrom}
                          disabled={isTargetClosed}
                          onChange={(v) => onUpdateTarget(topic.id, target.id, "validFrom", v ?? "")}
                          className="text-xs"
                        />
                        <DateField
                          label="Gültig bis"
                          value={target.validTo}
                          disabled={isTargetClosed}
                          onChange={(v) => onUpdateTarget(topic.id, target.id, "validTo", v ?? "")}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    {isTargetClosed ? (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onReactivateTarget(topic.id, target.id)}
                              className="p-1.5 hover:bg-primary/10 hover:text-primary rounded transition-colors"
                              aria-label="Ziel wieder aktivieren"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="max-w-[220px] space-y-0.5">
                              <div className="font-medium">Ziel wieder aktivieren</div>
                              <div className="text-xs text-muted-foreground">Abschlussdatum entfernen und Ziel reaktivieren</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onDeleteTarget(topic.id, target.id)}
                              className="opacity-0 group-hover/target:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                              aria-label="Ziel löschen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="max-w-[220px] space-y-0.5">
                              <div className="font-medium">Ziel löschen</div>
                              <div className="text-xs text-muted-foreground">Ziel mit allen Handlungen unwiderruflich entfernen</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className={cn("pl-6", isTargetClosed && "pointer-events-none opacity-60")}>
                    <Notes
                      value={target.notes}
                      onChange={(v) => onUpdateTarget(topic.id, target.id, "notes", v)}
                      placeholder="Freitext zum Ziel…"
                      className="mt-2 -ml-6 w-1/2"
                    />

                    <div className="mt-3 space-y-3">
                      {(() => {
                        const plannedActions = target.actions.filter((a) => !a.isUnplanned);
                        const grouped = DAY_PART_ORDER.map((part) => ({
                          part,
                          actions: plannedActions.filter((a) => (a.dayPart ?? "none") === part),
                        })).filter((g) => g.actions.length > 0);
                        const hasNone = grouped.length === 0 || grouped.every((g) => g.part === "none");
                        return grouped.length === 0 ? null : grouped.map(({ part, actions }) => (
                          <div key={part}>
                            {(!hasNone || part !== "none") && (
                              <DayPartHeader
                                part={part}
                                onAdd={!isTargetClosed ? () => openCreatePanel(topic.id, target.id, part === "none" ? undefined : part) : undefined}
                              />
                            )}
                            <ul className="mt-1.5 space-y-1">
                              {actions.map((action) => (
                                <ActionRow
                                  key={action.id}
                                  viewMode={viewMode}
                                  topicId={topic.id}
                                  targetId={target.id}
                                  action={action}
                                  targetValidFrom={target.validFrom}
                                  targetValidTo={target.validTo}
                                  onUpdateAction={onUpdateAction}
                                  onUpdateActionField={onUpdateActionField}
                                  onDeleteAction={onDeleteAction}
                                  onOpenEditPanel={() => openEditPanel(topic.id, target.id, action)}
                                  onOpenDialog={(initialMode) =>
                                    openConfirmDialog({
                                      topicId: topic.id,
                                      targetId: target.id,
                                      dueDate: selectedDate,
                                      initialMode,
                                      action,
                                    })
                                  }
                                />
                              ))}
                            </ul>
                          </div>
                        ));
                      })()}
                    </div>

                    {!isTargetClosed && (
                      <button
                        onClick={() => openCreatePanel(topic.id, target.id)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Neue Handlung erfassen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

                  <button
                    onClick={() => onAddTarget(topic.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Ziel hinzufügen
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-3 border-t border-dashed border-border pt-4 sm:flex-row sm:items-end">
        <div className="w-full max-w-xs">
          <Label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
            Disziplin für neuen Schwerpunkt
          </Label>
          <Select value={newTopicDisciplineId} onValueChange={setNewTopicDisciplineId}>
            <SelectTrigger>
              <SelectValue placeholder="Disziplin auswählen" />
            </SelectTrigger>
            <SelectContent>
              {disciplineOptions.map((discipline) => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => onAddTopic(newTopicDisciplineId)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Neuer Schwerpunkt
        </button>
      </div>

      {isConfirmDialogMounted && dialogTarget && (
        <ConfirmActionDialog
          key={dialogTarget.action.id + "_" + dialogTarget.dueDate}
          target={dialogTarget}
          onClose={closeConfirmDialog}
          onConfirm={(payload) => {
            onConfirmAction(
              dialogTarget.topicId,
              dialogTarget.targetId,
              dialogTarget.action.id,
              payload,
              dialogTarget.dueDate,
            );
            closeConfirmDialog();
          }}
          clientName={clientName}
        />
      )}

      {isPanelMounted && panelContext && (
        <ActionSidePanel
          key={panelContext.mode === "edit" ? panelContext.action?.id : "create"}
          mode={panelContext.mode}
          action={panelContext.action}
          topicDisciplineId={panelContext.topicDisciplineId}
          targetValidFrom={panelContext.targetValidFrom}
          targetValidTo={panelContext.targetValidTo}
          initialDayPart={panelContext.initialDayPart}
          isPanelOpen={isPanelOpen}
          onClose={closePanel}
          onSave={handlePanelSave}
          onDelete={handlePanelDelete}
          onTransitionEnd={handlePanelAnimationEnd}
          clientName={clientName}
        />
      )}
    </div>
  );
}

function DayPartHeader({
  part,
  stickyTop,
  onCreateUnplanned,
  onAdd,
}: {
  part: DayPart | "none";
  stickyTop?: number;
  onCreateUnplanned?: () => void;
  onAdd?: () => void;
}) {
  const addButton = (onClick: () => void, ariaLabel: string, tooltipTitle: string, tooltipDesc: string) => (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
            aria-label={ariaLabel}
            onClick={onClick}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[200] normal-case tracking-normal font-normal text-sm">
          <div className="max-w-[220px] space-y-0.5">
            <div className="font-medium">{tooltipTitle}</div>
            <div className="text-xs text-muted-foreground">{tooltipDesc}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const menu = (
    <>
      {onAdd && addButton(onAdd, "Handlung hinzufügen", "Handlung hinzufügen", "Neue geplante Handlung für diese Tageszeit erfassen")}
      {onCreateUnplanned && addButton(onCreateUnplanned, "Ungeplante Handlung erstellen", "Ungeplante Handlung erstellen", "Neue Handlung ausserhalb des Plans erfassen")}
    </>
  );

  const stickyProps = stickyTop !== undefined
    ? { className: "sticky z-[5] py-1 bg-[#f3f3f5]", style: { top: stickyTop } }
    : { className: "" };

  if (part === "none") {
    return (
      <div className={cn("flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70", stickyProps.className)} style={stickyProps.style}>
        <span className="h-px flex-1 bg-border" />
        <span>Ohne Tageszeit</span>
        <span className="h-px flex-1 bg-border" />
        {menu}
      </div>
    );
  }
  const Icon = DAY_PART_ICONS[part];
  return (
    <div className={cn("flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-accent", stickyProps.className)} style={stickyProps.style}>
      <Icon className="h-3.5 w-3.5" />
      <span>{DAY_PART_LABEL[part]}</span>
      <span className="h-px flex-1 bg-border" />
      {menu}
    </div>
  );
}

export function ActionRow({
  viewMode,
  topicId,
  targetId,
  action,
  targetValidFrom,
  targetValidTo,
  onUpdateAction,
  onUpdateActionField,
  onDeleteAction,
  onOpenEditPanel,
  onOpenDialog,
}: {
  viewMode: "planning" | "confirmation";
  topicId: string;
  targetId: string;
  action: ActionNode;
  targetValidFrom?: string;
  targetValidTo?: string;
  onUpdateAction: Props["onUpdateAction"];
  onUpdateActionField: Props["onUpdateActionField"];
  onDeleteAction: Props["onDeleteAction"];
  onOpenEditPanel: () => void;
  onOpenDialog: (initialMode: ConfirmationMode) => void;
}) {
  const isLocked = Object.keys(action.confirmations ?? {}).length > 0;
  const isFieldLocked = (field: keyof ActionNode | string) =>
    isLocked || isTemplateLockedActionField(action, field);
  const isConfirmationRestricted =
    viewMode === "confirmation" && !canConfirmAction(action);
  const weeklyDaysMissing =
    action.recurrence === "weekly" && (action.recurrenceWeekdays?.length ?? 0) === 0;
  const monthlyPatternMissing =
    action.recurrence === "monthly" && !action.recurrenceMonthlyPattern;

  const [weekdayDragState, setWeekdayDragState] = useState<{
    anchorIndex: number;
    baseSelection: Weekday[];
    mode: "add" | "remove";
  } | null>(null);

  const updateWeekdayRange = (
    dragState: { anchorIndex: number; baseSelection: Weekday[]; mode: "add" | "remove" },
    currentIndex: number,
  ) => {
    const from = Math.min(dragState.anchorIndex, currentIndex);
    const to = Math.max(dragState.anchorIndex, currentIndex);
    const range = WEEKDAY_OPTIONS.slice(from, to + 1).map((item) => item.value);
    const next = new Set<Weekday>(dragState.baseSelection);
    for (const day of range) {
      if (dragState.mode === "add") next.add(day);
      else next.delete(day);
    }
    const normalized = WEEKDAY_OPTIONS
      .map((item) => item.value)
      .filter((day) => next.has(day));
    onUpdateActionField(topicId, targetId, action.id, "recurrenceWeekdays", normalized);
  };

  useEffect(() => {
    if (!weekdayDragState) return;
    const stopDrag = () => setWeekdayDragState(null);
    window.addEventListener("pointerup", stopDrag);
    return () => window.removeEventListener("pointerup", stopDrag);
  }, [weekdayDragState]);

  if (viewMode === "planning") {
    const recurrenceTypeLabel = action.recurrence === "daily"
      ? "Täglich"
      : action.recurrence === "weekly"
        ? "Wöchentlich"
        : action.recurrence === "monthly"
          ? "Monatlich"
          : null;
    const weekdaysLabel = action.recurrence === "weekly"
      ? (action.recurrenceWeekdays ?? []).map((d) => WEEKDAY_OPTIONS.find((o) => o.value === d)?.label ?? "").filter(Boolean).join(" · ") || null
      : action.recurrence === "monthly"
        ? MONTHLY_PATTERN_OPTIONS.find((o) => o.value === action.recurrenceMonthlyPattern)?.label ?? null
        : null;

    return (
      <li className={cn(
        "group/action flex items-start gap-3 rounded px-3 py-2.5 border transition-colors",
        action.isUnplanned ? "border-amber-200 bg-amber-50/60" : "border-border bg-white hover:border-primary/40",
      )}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("text-base font-medium truncate", !action.title && "text-muted-foreground/40")}>
              {action.title || "Handlung…"}
            </span>
            {action.isUnplanned && (
              <Badge variant="outline" className="shrink-0 border-amber-300 bg-amber-50 text-[10px] text-amber-800">
                Ungeplant
              </Badge>
            )}
          </div>
          {(action.notes || action.requiredResources) && (
            <div className="mt-1.5 flex flex-col gap-0.5 text-sm text-muted-foreground">
              {action.notes && (
                <span><span className="font-medium text-foreground">Beschreibung:</span> {action.notes}</span>
              )}
              {action.requiredResources && (
                <span><span className="font-medium text-foreground">Hilfsmittel:</span> {action.requiredResources}</span>
              )}
            </div>
          )}
          <div
            className="mt-1.5 text-sm text-muted-foreground"
            style={{ display: "grid", gridTemplateColumns: "140px 1px 100px 1px 130px 1px 180px 1px 1fr", columnGap: "8px", rowGap: "4px" }}
          >
            {/* Zeile 1: Tageszeit | Uhrzeit | Minuten | Personen | Kategorie */}
            <span className="inline-flex items-center gap-1 overflow-hidden self-center">
              {action.dayPart
                ? <>{(() => { const Icon = DAY_PART_ICONS[action.dayPart]; return <Icon className="h-3.5 w-3.5 shrink-0" />; })()}<span className="truncate">{DAY_PART_LABEL[action.dayPart]}</span></>
                : <span className="opacity-40 italic">Keine Tageszeit</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="tabular-nums self-center">
              {action.scheduledTime || <span className="opacity-40 italic">Keine Uhrzeit</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="tabular-nums self-center">
              {action.plannedMinutes != null ? `${action.plannedMinutes} Min` : <span className="opacity-40 italic">Keine Minuten</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="inline-flex items-center gap-1 self-center">
              <Users className="h-3.5 w-3.5 shrink-0 opacity-50" />
              {action.requiredPersons != null ? action.requiredPersons : <span className="opacity-40 italic">k. A.</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="self-center">
              {action.category
                ? <span className="rounded bg-secondary px-1 font-medium">Kat. {CATEGORY_LABEL[action.category]}</span>
                : <span className="opacity-40 italic">Keine Kategorie</span>}
            </span>

            {/* Zeile 2: Gültig ab | Gültig bis | Wiederholung | Wochentage | Resultat */}
            <span className="tabular-nums self-center">
              {action.validFrom
                ? format(parseISO(action.validFrom), "dd.MM.yy", { locale: de })
                : <span className="opacity-40 italic">Kein Gültig ab</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="tabular-nums self-center">
              {action.validTo
                ? format(parseISO(action.validTo), "dd.MM.yy", { locale: de })
                : <span className="opacity-40 italic">Kein Gültig bis</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="self-center truncate">
              {recurrenceTypeLabel || <span className="opacity-40 italic">Keine Wiederholung</span>}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="self-center truncate">
              {weekdaysLabel || (
                action.recurrence === "weekly"
                  ? <span className="opacity-40 italic">Keine Wochentage</span>
                  : action.recurrence === "monthly"
                    ? <span className="opacity-40 italic">Kein Muster</span>
                    : <span className="opacity-40">–</span>
              )}
            </span>
            <span className="self-center h-3 bg-border" />
            <span className="self-center">
              {action.resultRequirement === "required"
                ? "Resultat zwingend"
                : action.resultRequirement === "optional"
                  ? "Resultat optional"
                  : <span className="opacity-40 italic">Kein Resultat</span>}
            </span>
          </div>
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenEditPanel}
                className="shrink-0 mt-0.5 opacity-0 group-hover/action:opacity-100 p-1 hover:bg-secondary rounded transition-opacity"
                aria-label="Handlung bearbeiten"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="max-w-[220px] space-y-0.5">
                <div className="font-medium">Handlung bearbeiten</div>
                <div className="text-xs text-muted-foreground">Felder und Einstellungen anpassen</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onDeleteAction(topicId, targetId, action.id)}
                className="shrink-0 mt-0.5 opacity-0 group-hover/action:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                aria-label="Handlung löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="max-w-[220px] space-y-0.5">
                <div className="font-medium">Handlung löschen</div>
                <div className="text-xs text-muted-foreground">Handlung unwiderruflich entfernen</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  }

  return (
    <li className={cn(
      "group/action flex items-start gap-3 rounded transition-colors",
      action.isUnplanned && "border-amber-200 bg-amber-50/60",
      "py-2 px-2 -mx-2 hover:bg-secondary/40"
    )}>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isConfirmationRestricted) return;
                onOpenDialog(action.status === "open" ? "done_as_planned" : action.status);
              }}
              className={cn(
                "pointer-events-auto mt-0.5 cursor-pointer",
                isConfirmationRestricted && "cursor-not-allowed opacity-70",
              )}
              aria-label="Status ändern"
              aria-disabled={isConfirmationRestricted}
            >
              <StatusIcon status={action.status} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="max-w-[220px] space-y-0.5">
              <div className="font-medium">Status ändern</div>
              <div className="text-xs text-muted-foreground">
                {isConfirmationRestricted ? "Keine Rechte zur Umsetzung von Kategorie A" : "Umsetzungsstatus anpassen"}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex-1 min-w-0">
        <input
          value={action.title}
          readOnly
          placeholder="Handlung…"
          className={cn(
            "w-full text-sm font-medium bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40",
            action.status === "done_as_planned" && "line-through text-muted-foreground",
            action.status === "done_with_deviation" && "line-through text-muted-foreground",
            action.status === "not_done" && "line-through text-muted-foreground/70",
          )}
        />
        {action.isUnplanned && (
          <Badge variant="outline" className="mt-1 w-fit border-amber-300 bg-amber-50 text-[10px] text-amber-800">
            Ungeplante Handlung
          </Badge>
        )}

        {false && (
          <div className="mt-1 space-y-1">
            <Notes
              value={action.notes}
              onChange={(v) =>
                onUpdateAction(topicId, targetId, action.id, "notes", v)
              }
              disabled={isFieldLocked("notes")}
              placeholder="Beschreibung zur Handlung..."
              className="text-foreground/70"
              compact
            />
            <Notes
              value={action.requiredResources ?? ""}
              onChange={(v) =>
                onUpdateAction(topicId, targetId, action.id, "requiredResources", v)
              }
              disabled={isFieldLocked("requiredResources")}
              placeholder="Hilfsmittel zur Durchführung..."
              className="text-foreground/70"
              compact
            />
          </div>
        )}

        {/* Meta fields */}
        {viewMode === "planning" ? (
          <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
            {/* Zeile 1: Tageszeit | Uhrzeit | geplante Minuten | Anz. Personen | Kategorie */}
            <div className="grid grid-cols-5 gap-1">
            <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1 transition-colors focus-within:border-primary">
              <span className="shrink-0 text-muted-foreground">Tageszeit</span>
              <Select
                value={action.dayPart ?? "none"}
                disabled={isFieldLocked("dayPart")}
                onValueChange={(v) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "dayPart",
                    v === "none" ? undefined : v,
                  )
                }
              >
                <SelectTrigger aria-label="Tageszeit" className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Keine Angabe" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_PART_SELECT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="shrink-0">Uhrzeit</span>
              <input
                type="time"
                disabled={isFieldLocked("scheduledTime")}
                value={action.scheduledTime ?? ""}
                onChange={(e) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "scheduledTime",
                    e.target.value || undefined,
                  )
                }
                className="h-7 w-full min-w-0 bg-transparent border border-border rounded focus:border-primary outline-none px-2 py-0.5 tabular-nums"
              />
            </label>

            <label className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="shrink-0">geplante Minuten</span>
              <input
                type="number"
                min={0}
                step={5}
                disabled={isFieldLocked("plannedMinutes")}
                value={action.plannedMinutes ?? ""}
                onChange={(e) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "plannedMinutes",
                    e.target.value === ""
                      ? undefined
                      : Math.max(0, Number(e.target.value)),
                  )
                }
                placeholder="–"
                className="h-7 w-full min-w-0 bg-transparent border border-border rounded focus:border-primary outline-none px-2 py-0.5 text-right tabular-nums"
              />
              <span className="shrink-0">Min</span>
            </label>

            <label className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="shrink-0">Anz. Personen</span>
              <input
                type="number"
                min={1}
                step={1}
                disabled={isFieldLocked("requiredPersons")}
                value={action.requiredPersons ?? ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "requiredPersons",
                    e.target.value === "" || !Number.isFinite(value)
                      ? undefined
                      : Math.max(1, Math.floor(value)),
                  );
                }}
                placeholder="-"
                className="h-7 w-full min-w-0 bg-transparent border border-border rounded focus:border-primary outline-none px-2 py-0.5 text-right tabular-nums"
              />
            </label>

            <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1 transition-colors focus-within:border-primary">
              <span className="shrink-0 text-muted-foreground">Kategorie</span>
              <Select
                value={action.category ?? "none"}
                disabled={isFieldLocked("category")}
                onValueChange={(v) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "category",
                    v === "none" ? undefined : v,
                  )
                }
              >
                <SelectTrigger aria-label="Kategorie" className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Keine Angabe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  <SelectItem value="a">A</SelectItem>
                  <SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>

            {/* Zeile 2: Gültig ab | Gültig bis | Wiederholung | (Wochentage/Monatl. Regel) | Resultat */}
            <div className="grid grid-cols-5 gap-1">
            <DateField
              label="Gültig ab"
              required
              disabled={isFieldLocked("validFrom")}
              value={action.validFrom}
              minDate={targetValidFrom}
              maxDate={targetValidTo}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validFrom", v)
              }
              className="w-full"
            />
            <DateField
              label="Gültig bis"
              disabled={false}
              value={action.validTo}
              minDate={targetValidFrom}
              maxDate={targetValidTo}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validTo", v)
              }
              className="w-full"
            />
            <div
              className={cn(
                "flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1 transition-colors focus-within:border-primary",
                !action.recurrence && "border-destructive/60 text-destructive",
              )}
            >
              <span className="shrink-0 text-muted-foreground">Wiederholung</span>
              <Select
                value={action.recurrence ?? "none"}
                disabled={isFieldLocked("recurrence")}
                onValueChange={(v) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "recurrence",
                    v === "none" ? undefined : v,
                  )
                }
              >
                <SelectTrigger aria-label="Wiederholung" className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Wählen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.recurrence === "weekly" ? (
              <div
                className={cn(
                  "rounded border border-border bg-background px-2 py-1",
                  weeklyDaysMissing && "border-destructive/60",
                )}
              >
                <div className="flex flex-wrap items-center gap-1 select-none">
                  {WEEKDAY_OPTIONS.map((weekday, weekdayIndex) => {
                    const isSelected = (action.recurrenceWeekdays ?? []).includes(weekday.value);
                    return (
                      <button
                        key={weekday.value}
                        type="button"
                        disabled={isFieldLocked("recurrenceWeekdays")}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          event.preventDefault();
                          const baseSelection = action.recurrenceWeekdays ?? [];
                          const mode: "add" | "remove" = isSelected ? "remove" : "add";
                          const dragState = {
                            anchorIndex: weekdayIndex,
                            baseSelection,
                            mode,
                          };
                          setWeekdayDragState(dragState);
                          updateWeekdayRange(dragState, weekdayIndex);
                        }}
                        onPointerEnter={() => {
                          if (!weekdayDragState) return;
                          updateWeekdayRange(weekdayDragState, weekdayIndex);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== " " && event.key !== "Enter") return;
                          event.preventDefault();
                          const next = isSelected
                            ? (action.recurrenceWeekdays ?? []).filter((value) => value !== weekday.value)
                            : [...(action.recurrenceWeekdays ?? []), weekday.value];
                          onUpdateActionField(topicId, targetId, action.id, "recurrenceWeekdays", next);
                        }}
                        className={cn(
                          "rounded border px-2 py-0.5 text-xs transition-colors cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-secondary/60",
                        )}
                      >
                        {weekday.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : action.recurrence === "monthly" ? (
              <div
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1 transition-colors focus-within:border-primary",
                  monthlyPatternMissing && "border-destructive/60",
                )}
              >
                <Select
                  value={action.recurrenceMonthlyPattern ?? "none"}
                  disabled={isFieldLocked("recurrenceMonthlyPattern")}
                  onValueChange={(v) =>
                    onUpdateActionField(
                      topicId,
                      targetId,
                      action.id,
                      "recurrenceMonthlyPattern",
                      v === "none" ? undefined : v,
                    )
                  }
                >
                  <SelectTrigger aria-label="Monatliche Regel" className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                    <SelectValue placeholder="Wählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Angabe</SelectItem>
                    {MONTHLY_PATTERN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div />
            )}
            <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1 transition-colors focus-within:border-primary">
              <span className="shrink-0 text-muted-foreground">Resultat</span>
              <Select
                value={action.resultRequirement ?? "none"}
                disabled={isFieldLocked("resultRequirement")}
                onValueChange={(v) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "resultRequirement",
                    v === "none" ? undefined : v,
                  )
                }
              >
                <SelectTrigger aria-label="Resultat" className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Kein Resultat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Resultat</SelectItem>
                  <SelectItem value="optional">Resultat optional</SelectItem>
                  <SelectItem value="required">Resultat zwingend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <Select
              value={action.dayPart ?? "none"}
              disabled={isFieldLocked("dayPart")}
              onValueChange={(v) =>
                onUpdateActionField(
                  topicId,
                  targetId,
                  action.id,
                  "dayPart",
                  v === "none" ? undefined : v,
                )
              }
            >
              <SelectTrigger className="h-7 w-[120px] text-xs px-2 py-0">
                <SelectValue placeholder="Tageszeit" />
              </SelectTrigger>
              <SelectContent>
                {DAY_PART_SELECT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {action.scheduledTime && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-1 font-bold text-amber-900 shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                <span className="tabular-nums">{action.scheduledTime}</span>
              </span>
            )}
            <label className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>geplant</span>
              <input
                type="number"
                min={0}
                step={5}
                disabled={isFieldLocked("plannedMinutes")}
                value={action.plannedMinutes ?? ""}
                onChange={(e) =>
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "plannedMinutes",
                    e.target.value === ""
                      ? undefined
                      : Math.max(0, Number(e.target.value)),
                  )
                }
                placeholder="–"
                className="w-14 bg-background border border-border rounded focus:border-primary outline-none px-1.5 py-0.5 text-right tabular-nums"
              />
              <span>Min</span>
            </label>
            <label className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Personen</span>
              <input
                type="number"
                min={1}
                step={1}
                disabled={isFieldLocked("requiredPersons")}
                value={action.requiredPersons ?? ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  onUpdateActionField(
                    topicId,
                    targetId,
                    action.id,
                    "requiredPersons",
                    e.target.value === "" || !Number.isFinite(value)
                      ? undefined
                      : Math.max(1, Math.floor(value)),
                  );
                }}
                placeholder="-"
                className="w-12 bg-background border border-border rounded focus:border-primary outline-none px-1.5 py-0.5 text-right tabular-nums"
              />
            </label>
            <Select
              value={action.category ?? "none"}
              disabled={isFieldLocked("category")}
              onValueChange={(v) =>
                onUpdateActionField(
                  topicId,
                  targetId,
                  action.id,
                  "category",
                  v === "none" ? undefined : v,
                )
              }
            >
              <SelectTrigger aria-label="Kategorie" className="h-7 w-[130px] text-xs px-2 py-0">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Angabe</SelectItem>
                <SelectItem value="a">A</SelectItem>
                <SelectItem value="b">B</SelectItem>
                <SelectItem value="c">C</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={action.resultRequirement ?? "none"}
              disabled={isFieldLocked("resultRequirement")}
              onValueChange={(v) =>
                onUpdateActionField(
                  topicId,
                  targetId,
                  action.id,
                  "resultRequirement",
                  v === "none" ? undefined : v,
                )
              }
            >
              <SelectTrigger className="h-7 w-[150px] text-xs px-2 py-0">
                <SelectValue placeholder="Resultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Resultat</SelectItem>
                <SelectItem value="optional">Resultat optional</SelectItem>
                <SelectItem value="required">Resultat zwingend</SelectItem>
              </SelectContent>
            </Select>
            <DateField
              label="Gültig ab"
              required
              disabled={isFieldLocked("validFrom")}
              value={action.validFrom}
              minDate={targetValidFrom}
              maxDate={targetValidTo}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validFrom", v)
              }
            />
            <DateField
              label="Gültig bis"
              disabled={false}
              value={action.validTo}
              minDate={targetValidFrom}
              maxDate={targetValidTo}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validTo", v)
              }
            />

            <StatusBadge action={action} />
          </div>
        )}

        {viewMode === "confirmation" && (action.reason ||
          action.status === "done_with_deviation" ||
          action.status === "not_done") && (
          <div className="mt-1 text-xs text-muted-foreground italic">
            {action.status === "done_with_deviation" &&
              action.actualMinutes != null && (
                <span className="not-italic mr-1 font-medium text-foreground/70">
                  {action.actualMinutes} Min tatsächlich:
                </span>
              )}
            {action.reason}
          </div>
        )}

        {viewMode === "confirmation" && action.observations && (
          <div className="mt-1 text-xs text-foreground/70">
            <span className="font-medium">Beobachtungen:</span>{" "}
            <span className="italic">{action.observations}</span>
          </div>
        )}

        {viewMode === "confirmation" &&
          (action.resultRequirement ?? "none") !== "none" &&
          action.result && (
          <div className="mt-1 text-xs text-foreground/70">
            <span className="font-medium">Resultat:</span>{" "}
            <span className="italic">{action.result}</span>
          </div>
        )}

        {viewMode === "confirmation" && action.notes.trim() && (
          <div className="mt-1 text-xs text-foreground/70 whitespace-pre-wrap">
            <span className="font-medium">Beschreibung:</span>{" "}
            {action.notes}
          </div>
        )}

        {viewMode === "confirmation" && action.requiredResources?.trim() && (
          <div className="mt-1 text-xs text-foreground/70 whitespace-pre-wrap">
            <span className="font-medium">Hilfsmittel:</span>{" "}
            {action.requiredResources}
          </div>
        )}
        {isConfirmationRestricted && (
          <div className="mt-1 text-[11px] text-muted-foreground/70 italic">
            Diese Handlung kann nicht bestätigt werden (zu geringe Berechtigung).
          </div>
        )}
      </div>
      <button
        onClick={() => onDeleteAction(topicId, targetId, action.id)}
        className="opacity-0 group-hover/action:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity self-start mt-0.5"
        aria-label="Handlung löschen"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function DateField({
  label,
  value,
  onChange,
  required,
  disabled,
  className,
  minDate,
  maxDate,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
}) {
  const missing = required && !value;
  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5 text-xs transition-colors focus-within:border-primary",
        className,
        disabled && "opacity-60",
        missing && "border-destructive/60 text-destructive",
      )}
    >
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <DatePickerInput
        disabled={disabled}
        value={value}
        onChange={(nextValue) => onChange(nextValue || undefined)}
        placeholder="TT.MM.JJJJ"
        minDate={minDate}
        maxDate={maxDate}
        className="h-6 min-h-0 w-full min-w-0 flex-1 border-0 bg-transparent p-0 pr-0 text-xs leading-none shadow-none"
      />
    </div>
  );
}

function StatusIcon({ status }: { status: ActionStatus }) {
  switch (status) {
    case "done_as_planned":
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case "done_with_deviation":
      return <AlertTriangle className="h-5 w-5 text-accent" />;
    case "not_done":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "postponed":
      return <CalendarClock className="h-5 w-5 text-muted-foreground" />;
    default:
      return (
        <Minus className="h-4 w-4 text-muted-foreground/50" aria-label="offen" />
      );
  }
}

function StatusBadge({ action }: { action: ActionNode }) {
  if (action.status === "open") return null;
  const map = {
    done_as_planned: { label: "wie geplant", cls: "bg-primary/10 text-primary" },
    done_with_deviation: {
      label: "mit Abweichung",
      cls: "bg-accent/15 text-accent",
    },
    not_done: { label: "nicht durchgeführt", cls: "bg-destructive/10 text-destructive" },
    postponed: { label: "verschoben", cls: "bg-muted text-muted-foreground" },
  } as const;
  const m = map[action.status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}


const ActionFieldCtx = createContext<{
  isLocked: (f: string) => boolean;
  isRequired: (f: string) => boolean;
  hasError: (f: string) => boolean;
}>({ isLocked: () => false, isRequired: () => false, hasError: () => false });

function ActionField({
  label,
  fieldKey,
  children,
  className,
}: {
  label: string;
  fieldKey?: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(ActionFieldCtx);
  const resolvedLocked = fieldKey ? ctx.isLocked(fieldKey) : false;
  const resolvedRequired = fieldKey ? ctx.isRequired(fieldKey) : false;
  const resolvedError = fieldKey ? ctx.hasError(fieldKey) : false;
  return (
    <div className={className}>
      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {label}
        {resolvedRequired && !resolvedLocked && <span className="text-destructive" title="Pflichtfeld">*</span>}
        {resolvedLocked && <Lock className="h-3 w-3 opacity-50" title="Von Vorlage gesperrt" />}
      </label>
      <div className={cn(resolvedLocked && "opacity-60 pointer-events-none")}>{children}</div>
      {resolvedError && <p className="mt-0.5 text-xs text-destructive">Pflichtfeld – bitte ausfüllen</p>}
    </div>
  );
}

function ActionSidePanel({
  mode,
  action,
  topicDisciplineId,
  targetValidFrom,
  targetValidTo,
  initialDayPart,
  isPanelOpen,
  onClose,
  onSave,
  onDelete,
  onTransitionEnd,
  clientName,
}: {
  mode: "create" | "edit";
  action?: ActionNode;
  topicDisciplineId?: string;
  targetValidFrom?: string;
  targetValidTo?: string;
  initialDayPart?: DayPart | "none";
  isPanelOpen: boolean;
  onClose: () => void;
  onSave: (draft: ActionDraft, selectedTemplateIds: string[]) => void;
  clientName?: string;
  onDelete: () => void;
  onTransitionEnd: () => void;
}) {
  const [draft, setDraft] = useState<ActionDraft>(() => {
    if (action) return actionToDraft(action);
    const base = emptyActionDraft();
    if (initialDayPart && initialDayPart !== "none") base.dayPart = initialDayPart;
    return base;
  });
  const [lockedFields, setLockedFields] = useState<string[]>(() => action?.templateLockedFields ?? []);
  const [requiredFields, setRequiredFields] = useState<string[]>(() => action?.templateRequiredFields ?? []);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [creationMode, setCreationMode] = useState<"template" | "scratch">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [availableTemplates, setAvailableTemplates] = useState<ActionPlanTemplate[]>([]);
  const [templateQuery, setTemplateQuery] = useState("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const templateInputRef = useRef<HTMLInputElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isPanelOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (asideRef.current && !asideRef.current.contains(target)) {
        if (target.closest?.("[data-radix-popper-content-wrapper],[data-radix-select-content],[data-radix-dropdown-menu-content],[data-radix-popover-content]")) return;
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPanelOpen, onClose]);

  useEffect(() => {
    if (mode !== "create") return;
    setAvailableTemplates(
      loadActionPlanTemplates().filter((t) => templateMatchesDiscipline(t, topicDisciplineId)),
    );
  }, [mode, topicDisciplineId]);

  useEffect(() => {
    setActiveIndex(0);
  }, [templateQuery, isDropdownOpen]);

  const templateFilterQuery = templateQuery.toLocaleLowerCase("de");
  const hasTemplateInput = templateFilterQuery.length >= 2;
  const filteredTemplates = hasTemplateInput
    ? availableTemplates.filter((t) => {
        const pattern = templateFilterQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s/g, ".*");
        return new RegExp(pattern).test(t.name.toLocaleLowerCase("de"));
      })
    : availableTemplates.slice(0, 20);

  const applyTemplate = (templateId: string) => {
    const template = availableTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const fields = template.fields;
    const weekdayMap: Record<string, Weekday> = {
      mon: "monday", tue: "tuesday", wed: "wednesday",
      thu: "thursday", fri: "friday", sat: "saturday", sun: "sunday",
    };
    const recurrenceWeekdays = fields.wiederholungWochentage
      .split(",")
      .map((v) => weekdayMap[v.trim().toLowerCase()])
      .filter((v): v is Weekday => Boolean(v));
    setDraft({
      title: template.name,
      notes: fields.beschreibung,
      requiredResources: fields.hilfsmittel || "",
      plannedMinutes: fields.dauer !== "0" && fields.dauer ? fields.dauer : "",
      requiredPersons: fields.personen !== "0" && fields.personen ? fields.personen : "",
      resultRequirement: fields.resultat !== "none" ? fields.resultat : "none",
      dayPart: fields.tageszeit !== "none" ? fields.tageszeit : (initialDayPart && initialDayPart !== "none" ? initialDayPart : "none"),
      scheduledTime: fields.uhrzeit || "",
      category: fields.kategorie !== "none" ? fields.kategorie : "none",
      serviceType: fields.leistungsart !== "none" ? fields.leistungsart : "none",
      validFrom: "",
      validTo: "",
      recurrence: fields.wiederholung !== "none" ? fields.wiederholung : "none",
      recurrenceWeekdays,
      recurrenceMonthlyPattern: fields.wiederholungMonatlich !== "none" ? fields.wiederholungMonatlich : "none",
    });
    setLockedFields(getTemplateLockedActionFields(template));
    setRequiredFields(getTemplateRequiredActionFields(template));
    setValidationErrors([]);
    setSelectedTemplateId(templateId);
    setTemplateQuery("");
    setDropdownOpen(false);
  };

  const clearTemplate = () => {
    setSelectedTemplateId("");
    setLockedFields([]);
    setRequiredFields([]);
    setValidationErrors([]);
    setDraft(emptyActionDraft());
  };

  const isLocked = (field: string) => lockedFields.includes(field);
  const isRequired = (field: string) => requiredFields.includes(field);
  const hasError = (field: string) => validationErrors.includes(field);

  const isDraftFieldFilled = (field: string): boolean => {
    switch (field) {
      case "title": return draft.title.trim() !== "";
      case "notes": return draft.notes.trim() !== "";
      case "requiredResources": return draft.requiredResources.trim() !== "";
      case "plannedMinutes": return draft.plannedMinutes !== "" && Number(draft.plannedMinutes) > 0;
      case "requiredPersons": return draft.requiredPersons !== "" && Number(draft.requiredPersons) > 0;
      case "category": return draft.category !== "none";
      case "dayPart": return draft.dayPart !== "none";
      case "scheduledTime": return draft.scheduledTime !== "";
      case "resultRequirement": return draft.resultRequirement !== "none";
      case "recurrence": return draft.recurrence !== "none";
      case "recurrenceWeekdays": return draft.recurrenceWeekdays.length > 0;
      case "recurrenceMonthlyPattern": return draft.recurrenceMonthlyPattern !== "none";
      case "serviceType": return draft.serviceType !== "none";
      default: return true;
    }
  };

  const handleSave = () => {
    const errors = requiredFields.filter((f) => !isDraftFieldFilled(f));
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    onSave(draft, selectedTemplateId ? [selectedTemplateId] : []);
  };

  const panelTitle = mode === "create" ? "Neue Handlung" : (action?.title || "Handlung bearbeiten");

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-end pointer-events-none overflow-hidden`}
    >
      <aside
        ref={asideRef}
        className={`pointer-events-auto flex h-dvh w-full max-w-2xl flex-col bg-[#f3f3f5] transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"}`}
        onTransitionEnd={onTransitionEnd}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
          <div>
            <h2 className="text-2xl font-light">{panelTitle}</h2>
            {clientName && <p className="text-sm opacity-80 mt-0.5">{clientName}</p>}
          </div>
          <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        {/* Content */}
        <ActionFieldCtx.Provider value={{ isLocked, isRequired, hasError }}>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Create mode: template selection */}
          {mode === "create" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setCreationMode("template"); setDropdownOpen(true); }}
                  className={cn(
                    "rounded-md border p-3 text-left transition-colors",
                    creationMode === "template" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/40",
                  )}
                >
                  <div className="text-sm font-medium">Ab Vorlage</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Felder aus Vorlage übernehmen</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode("scratch");
                    clearTemplate();
                    setDropdownOpen(false);
                    setTemplateQuery("");
                  }}
                  className={cn(
                    "rounded-md border p-3 text-left transition-colors",
                    creationMode === "scratch" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/40",
                  )}
                >
                  <div className="text-sm font-medium">Ohne Vorlage</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Leere Handlung anlegen</div>
                </button>
              </div>

              {creationMode === "template" && (
                <div className="rounded-md border border-input/70 bg-background shadow-sm focus-within:border-primary/70">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      ref={templateInputRef}
                      value={selectedTemplateId && !templateQuery ? (availableTemplates.find((t) => t.id === selectedTemplateId)?.name ?? templateQuery) : templateQuery}
                      onChange={(e) => { setTemplateQuery(e.target.value); setDropdownOpen(true); if (selectedTemplateId) clearTemplate(); }}
                      onFocus={() => setDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((p) => (p + 1) % filteredTemplates.length); }
                        if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((p) => (p - 1 + filteredTemplates.length) % filteredTemplates.length); }
                        if (e.key === "Enter") { e.preventDefault(); if (filteredTemplates[activeIndex]) applyTemplate(filteredTemplates[activeIndex].id); }
                        if (e.key === "Escape") setDropdownOpen(false);
                      }}
                      placeholder="Vorlage suchen…"
                      className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-0"
                    />
                    {selectedTemplateId && (
                      <button type="button" onClick={clearTemplate} className="text-xs text-muted-foreground hover:text-foreground">
                        ×
                      </button>
                    )}
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isDropdownOpen && "rotate-180")} />
                  </div>
                  {isDropdownOpen && (
                    <div className="max-h-52 overflow-y-auto border-t border-border/70 p-1">
                      {filteredTemplates.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-muted-foreground">Keine Vorlagen gefunden</div>
                      ) : (
                        filteredTemplates.map((t, idx) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => applyTemplate(t.id)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              "flex w-full items-center rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary/40",
                              activeIndex === idx && "bg-primary/10 text-primary",
                            )}
                          >
                            <span className="truncate">{t.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {creationMode === "scratch" && (
                <ActionField label="Leistungsart" fieldKey="serviceType">
                  <Select value={draft.serviceType} onValueChange={(v) => setDraft((p) => ({ ...p, serviceType: v }))}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Leistungsart wählen" /></SelectTrigger>
                    <SelectContent>
                      {ACTION_SERVICE_TYPE_SELECT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ActionField>
              )}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            <ActionField label="Bezeichnung" fieldKey="title">
              <Input
                value={draft.title}
                disabled={isLocked("title")}
                onChange={(e) => { setDraft((p) => ({ ...p, title: e.target.value })); setValidationErrors((prev) => prev.filter((f) => f !== "title")); }}
                placeholder="Handlung…"
                className={cn("bg-background", hasError("title") && "border-destructive")}
              />
            </ActionField>

            <ActionField label="Beschreibung" fieldKey="notes">
              <Textarea
                value={draft.notes}
                disabled={isLocked("notes")}
                onChange={(e) => { setDraft((p) => ({ ...p, notes: e.target.value })); setValidationErrors((prev) => prev.filter((f) => f !== "notes")); }}
                placeholder="Beschreibung zur Handlung…"
                rows={2}
                className={cn("bg-background", hasError("notes") && "border-destructive")}
              />
            </ActionField>

            <ActionField label="Hilfsmittel" fieldKey="requiredResources">
              <Textarea
                value={draft.requiredResources}
                disabled={isLocked("requiredResources")}
                onChange={(e) => { setDraft((p) => ({ ...p, requiredResources: e.target.value })); setValidationErrors((prev) => prev.filter((f) => f !== "requiredResources")); }}
                placeholder="Hilfsmittel zur Durchführung…"
                rows={2}
                className={cn("bg-background", hasError("requiredResources") && "border-destructive")}
              />
            </ActionField>

            <div className="grid grid-cols-2 gap-3">
              <ActionField label="Tageszeit" fieldKey="dayPart">
                <Select value={draft.dayPart} disabled={isLocked("dayPart")} onValueChange={(v) => { setDraft((p) => ({ ...p, dayPart: v })); setValidationErrors((prev) => prev.filter((f) => f !== "dayPart")); }}>
                  <SelectTrigger className={cn("bg-background", hasError("dayPart") && "border-destructive")}><SelectValue placeholder="Keine Angabe" /></SelectTrigger>
                  <SelectContent>
                    {DAY_PART_SELECT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ActionField>
              <ActionField label="Uhrzeit" fieldKey="scheduledTime">
                <Input
                  type="time"
                  value={draft.scheduledTime}
                  disabled={isLocked("scheduledTime")}
                  onChange={(e) => { setDraft((p) => ({ ...p, scheduledTime: e.target.value })); setValidationErrors((prev) => prev.filter((f) => f !== "scheduledTime")); }}
                  className={cn("bg-background", hasError("scheduledTime") && "border-destructive")}
                />
              </ActionField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionField label="Geplante Minuten" fieldKey="plannedMinutes">
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={draft.plannedMinutes}
                  disabled={isLocked("plannedMinutes")}
                  onChange={(e) => { setDraft((p) => ({ ...p, plannedMinutes: e.target.value })); setValidationErrors((prev) => prev.filter((f) => f !== "plannedMinutes")); }}
                  placeholder="–"
                  className={cn("bg-background", hasError("plannedMinutes") && "border-destructive")}
                />
              </ActionField>
              <ActionField label="Anz. Personen" fieldKey="requiredPersons">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.requiredPersons}
                  disabled={isLocked("requiredPersons")}
                  onChange={(e) => { setDraft((p) => ({ ...p, requiredPersons: e.target.value })); setValidationErrors((prev) => prev.filter((f) => f !== "requiredPersons")); }}
                  placeholder="–"
                  className={cn("bg-background", hasError("requiredPersons") && "border-destructive")}
                />
              </ActionField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionField label="Kategorie" fieldKey="category">
                <Select value={draft.category} disabled={isLocked("category")} onValueChange={(v) => { setDraft((p) => ({ ...p, category: v })); setValidationErrors((prev) => prev.filter((f) => f !== "category")); }}>
                  <SelectTrigger className={cn("bg-background", hasError("category") && "border-destructive")}><SelectValue placeholder="Keine Angabe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Angabe</SelectItem>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                  </SelectContent>
                </Select>
              </ActionField>
              <ActionField label="Resultat" fieldKey="resultRequirement">
                <Select value={draft.resultRequirement} disabled={isLocked("resultRequirement")} onValueChange={(v) => { setDraft((p) => ({ ...p, resultRequirement: v })); setValidationErrors((prev) => prev.filter((f) => f !== "resultRequirement")); }}>
                  <SelectTrigger className={cn("bg-background", hasError("resultRequirement") && "border-destructive")}><SelectValue placeholder="Kein Resultat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Resultat</SelectItem>
                    <SelectItem value="optional">Resultat optional</SelectItem>
                    <SelectItem value="required">Resultat zwingend</SelectItem>
                  </SelectContent>
                </Select>
              </ActionField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionField label="Gültig ab">
                <div className={cn("flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:border-primary", hasError("validFrom") && "border-destructive")}>
                  <DatePickerInput
                    value={draft.validFrom || undefined}
                    onChange={(v) => setDraft((p) => ({ ...p, validFrom: v ?? "" }))}
                    placeholder="TT.MM.JJJJ"
                    minDate={targetValidFrom}
                    maxDate={targetValidTo}
                    className="h-6 min-h-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none"
                  />
                </div>
              </ActionField>
              <ActionField label="Gültig bis">
                <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:border-primary">
                  <DatePickerInput
                    value={draft.validTo || undefined}
                    onChange={(v) => setDraft((p) => ({ ...p, validTo: v ?? "" }))}
                    placeholder="TT.MM.JJJJ"
                    minDate={targetValidFrom}
                    maxDate={targetValidTo}
                    className="h-6 min-h-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none"
                  />
                </div>
              </ActionField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionField label="Wiederholung" fieldKey="recurrence">
                <Select
                  value={draft.recurrence}
                  disabled={isLocked("recurrence")}
                  onValueChange={(v) => { setDraft((p) => ({ ...p, recurrence: v, recurrenceWeekdays: [], recurrenceMonthlyPattern: "none" })); setValidationErrors((prev) => prev.filter((f) => f !== "recurrence")); }}
                >
                  <SelectTrigger className={cn("bg-background", hasError("recurrence") && "border-destructive")}><SelectValue placeholder="Keine Angabe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Angabe</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </ActionField>
              {draft.recurrence === "weekly" && (
                <ActionField label="Wochentage" fieldKey="recurrenceWeekdays">
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAY_OPTIONS.map((wd) => {
                      const isSelected = draft.recurrenceWeekdays.includes(wd.value);
                      return (
                        <button
                          key={wd.value}
                          type="button"
                          disabled={isLocked("recurrenceWeekdays")}
                          onClick={() => {
                            const next = isSelected
                              ? draft.recurrenceWeekdays.filter((v) => v !== wd.value)
                              : [...draft.recurrenceWeekdays, wd.value];
                            setDraft((p) => ({ ...p, recurrenceWeekdays: next }));
                            setValidationErrors((prev) => prev.filter((f) => f !== "recurrenceWeekdays"));
                          }}
                          className={cn(
                            "rounded border px-2 py-0.5 text-xs transition-colors",
                            isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/60",
                            hasError("recurrenceWeekdays") && !isSelected && "border-destructive/60",
                          )}
                        >
                          {wd.label}
                        </button>
                      );
                    })}
                  </div>
                </ActionField>
              )}
              {draft.recurrence === "monthly" && (
                <ActionField label="Muster" fieldKey="recurrenceMonthlyPattern">
                  <Select
                    value={draft.recurrenceMonthlyPattern}
                    disabled={isLocked("recurrenceMonthlyPattern")}
                    onValueChange={(v) => { setDraft((p) => ({ ...p, recurrenceMonthlyPattern: v })); setValidationErrors((prev) => prev.filter((f) => f !== "recurrenceMonthlyPattern")); }}
                  >
                    <SelectTrigger className={cn("bg-background", hasError("recurrenceMonthlyPattern") && "border-destructive")}><SelectValue placeholder="Wählen…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Angabe</SelectItem>
                      {MONTHLY_PATTERN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ActionField>
              )}
            </div>
          </div>
        </div>
        </ActionFieldCtx.Provider>

        {/* Footer */}
        <div className="flex items-center justify-between bg-primary px-6 py-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
              Abbrechen
            </Button>
            {mode === "edit" && (
              <Button type="button" variant="ghost" onClick={onDelete} className="text-white hover:bg-white/10 hover:text-white">
                Löschen
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSave}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Speichern
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

const buildEmptyUnplannedTemplateDraft = (dayPart?: DayPart | "none"): UnplannedActionDraft => {
  const defaultFields = buildDefaultTemplateFields();
  return {
    title: "",
    notes: defaultFields.beschreibung,
    dayPart: dayPart ?? "none",
  };
};

export function UnplannedActionDialog({
  target,
  onClose,
  onConfirm,
  clientName,
}: {
  target: { dueDate?: string; dateFrom?: string; dayPart: DayPart | "none" };
  onClose: () => void;
  onConfirm: (draft: UnplannedActionDraft) => void;
  clientName?: string;
}) {
  const [creationMode, setCreationMode] = useState<"template" | "scratch">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<ActionPlanTemplate[]>(() => loadActionPlanTemplates());
  const [templateQuery, setTemplateQuery] = useState("");
  const [isTemplateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const templateInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<UnplannedActionDraft>(() => buildEmptyUnplannedTemplateDraft(target.dayPart));
  const [dateFrom, setDateFrom] = useState<string>(target.dateFrom ?? target.dueDate ?? "");
  const [dateTo, setDateTo] = useState<string>(target.dueDate ?? "");
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const unplannedAsideRef = useRef<HTMLElement | null>(null);

  // Mount-based animation (same pattern as TargetAssessmentPanel)
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsPanelVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setIsPanelVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    if (!isPanelVisible) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (unplannedAsideRef.current && !unplannedAsideRef.current.contains(t)) {
        if (t.closest?.("[data-radix-popper-content-wrapper],[data-radix-select-content],[data-radix-dropdown-menu-content],[data-radix-popover-content]")) return;
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPanelVisible]);

  const clearTemplateSelection = () => {
    setSelectedTemplateId("");
    setTemplateQuery("");
    setTemplateDropdownOpen(false);
    setDraft(buildEmptyUnplannedTemplateDraft(target?.dayPart));
  };

  const applyTemplate = (templateId: string, fallbackDayPart: DayPart | "none") => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    const fields = template.fields;
    const plannedMinutes = Number(fields.dauer);
    const requiredPersons = Number(fields.personen);
    setDraft({
      title: template.name,
      notes: fields.beschreibung,
      requiredResources: fields.hilfsmittel || undefined,
      plannedMinutes: Number.isFinite(plannedMinutes) ? plannedMinutes : undefined,
      requiredPersons: Number.isFinite(requiredPersons) ? requiredPersons : undefined,
      category: fields.kategorie !== "none" ? (fields.kategorie as ActionCategory) : undefined,
      serviceType: fields.leistungsart !== "none" ? (fields.leistungsart as ActionServiceType) : undefined,
      dayPart: fallbackDayPart,
      scheduledTime: fields.uhrzeit || undefined,
      resultRequirement: fields.resultat !== "none" ? (fields.resultat as ActionNode["resultRequirement"]) : undefined,
      templateId: template.id,
      templateName: template.name,
      templateLockedFields: getTemplateLockedActionFields(template),
      templateRequiredFields: getTemplateRequiredActionFields(template),
    });
  };


  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const templateFilterQuery = templateQuery.toLocaleLowerCase("de");
  const hasTemplateFilterInput = templateFilterQuery.length >= 3;
  const filteredTemplates = hasTemplateFilterInput
    ? templates.filter((template) => {
        const wildcardQuery = templateFilterQuery
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\s/g, ".*");

        return new RegExp(wildcardQuery).test(template.name.toLocaleLowerCase("de"));
      })
    : [];

  useEffect(() => {
    setActiveTemplateIndex(0);
  }, [templateQuery, isTemplateDropdownOpen]);

  useEffect(() => {
    if (creationMode !== "template") return;
    window.requestAnimationFrame(() => {
      templateInputRef.current?.focus();
    });
  }, [creationMode]);

  const selectTemplateAndClose = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (target) applyTemplate(templateId, target.dayPart);
    setTemplateQuery("");
    setTemplateDropdownOpen(false);
  };

  const isDraftFieldLocked = (field: keyof ActionNode | string) =>
    creationMode === "template" && (draft.templateLockedFields?.includes(String(field)) ?? false);

  const updateDraft = <K extends keyof UnplannedActionDraft>(field: K, value: UnplannedActionDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleModeChange = (mode: "template" | "scratch") => {
    setCreationMode(mode);
    if (mode === "scratch") {
      setSelectedTemplateId("");
      setDraft({
        title: "",
        notes: "",
        dayPart: target?.dayPart ?? "none",
      });
      return;
    }
    setSelectedTemplateId("");
    setTemplateQuery("");
    setTemplateDropdownOpen(true);
    setDraft(buildEmptyUnplannedTemplateDraft(target.dayPart));
  };

  const selectedDayPart = draft.dayPart ?? target.dayPart ?? "none";
  const selectedDayPartLabel = selectedDayPart === "none" ? "Ohne Tageszeit" : DAY_PART_LABEL[selectedDayPart];

  const dateRangeError = (() => {
    if (!dateFrom || !dateTo) return null;
    if (dateTo < dateFrom) return "Bis-Datum muss nach dem Von-Datum liegen.";
    const diffMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 7) return "Der Zeitraum darf maximal 1 Woche betragen.";
    return null;
  })();

  const isDraftRequiredFieldMissing = (field: string): boolean => {
    switch (field) {
      case "title": return !draft.title.trim();
      case "notes": return !draft.notes.trim();
      case "requiredResources": return !draft.requiredResources?.trim();
      case "plannedMinutes": return draft.plannedMinutes === undefined || draft.plannedMinutes === null;
      case "requiredPersons": return draft.requiredPersons === undefined || draft.requiredPersons === null;
      case "category": return !draft.category || draft.category === "none";
      case "dayPart": return !draft.dayPart || draft.dayPart === "none";
      case "scheduledTime": return !draft.scheduledTime;
      case "resultRequirement": return !draft.resultRequirement || draft.resultRequirement === "none";
      case "recurrence": return false;
      case "recurrenceWeekdays": return !draft.recurrenceWeekdays;
      case "recurrenceMonthlyPattern": return !draft.recurrenceMonthlyPattern || draft.recurrenceMonthlyPattern === "none";
      case "serviceType": return !draft.serviceType || draft.serviceType === "none";
      default: return false;
    }
  };

  const missingRequiredFields = creationMode === "template"
    ? (draft.templateRequiredFields ?? []).filter(isDraftRequiredFieldMissing)
    : [];

  const submit = () => {
    const title = draft.title.trim() || (creationMode === "scratch" ? "Ungeplante Handlung" : "");
    if (!title) return;
    if (!dateFrom || !dateTo) return;
    if (dateRangeError) return;
    if (missingRequiredFields.length > 0) return;
    onConfirm({
      ...draft,
      title,
      notes: draft.notes.trim(),
      requiredResources: draft.requiredResources?.trim() || undefined,
      dayPart: draft.dayPart ?? "none",
      dateFrom: dateFrom,
      dateTo: dateTo,
    });
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-end pointer-events-none overflow-hidden`}
    >
      <aside
        ref={unplannedAsideRef}
        className={`pointer-events-auto flex h-dvh w-full max-w-2xl flex-col bg-[#f3f3f5] transition-transform duration-300 ease-out ${isPanelVisible ? "translate-x-0 shadow-2xl" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
          <div>
            <h2 className="text-2xl font-light">Ungeplante Handlung erstellen</h2>
            {clientName && <p className="text-sm opacity-80 mt-0.5">{clientName}</p>}
          </div>
          <button type="button" onClick={handleClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleModeChange("template")}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                creationMode === "template" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/40",
              )}
            >
              <div className="text-sm font-medium">Ab Vorlage verwenden</div>
              <div className="mt-1 text-xs text-muted-foreground">Vorlagenwerte übernehmen und vor dem Bestätigen anpassen.</div>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("scratch")}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                creationMode === "scratch" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/40",
              )}
            >
              <div className="text-sm font-medium">Ohne Vorlage erstellen</div>
              <div className="mt-1 text-xs text-muted-foreground">Leere Handlung manuell erfassen.</div>
            </button>
          </div>

          {creationMode === "template" && (
            <div className="space-y-1.5">
              <Label>Vorlage</Label>
              <div className="rounded-md border border-input/70 bg-background shadow-sm focus-within:border-primary/70">
                <div className="flex items-start gap-2 p-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate && (
                        <Badge
                          variant="secondary"
                          className="h-6 max-w-full gap-1 rounded-sm border border-border/60 bg-secondary/40 px-1.5 font-normal text-foreground/90"
                        >
                          <span className="truncate">{selectedTemplate.name}</span>
                          <button
                            type="button"
                            aria-label="Vorlage entfernen"
                            className="text-xs leading-none text-muted-foreground hover:text-foreground"
                            onClick={clearTemplateSelection}
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                        </Badge>
                      )}
                      <Input
                        value={templateQuery}
                        onChange={(e) => {
                          setTemplateQuery(e.target.value);
                          setTemplateDropdownOpen(true);
                        }}
                        onFocus={() => setTemplateDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (!isTemplateDropdownOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                            e.preventDefault();
                            setTemplateDropdownOpen(true);
                            return;
                          }
                          if (!isTemplateDropdownOpen || !hasTemplateFilterInput || filteredTemplates.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActiveTemplateIndex((prev) => (prev + 1) % filteredTemplates.length);
                            return;
                          }
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActiveTemplateIndex((prev) => (prev - 1 + filteredTemplates.length) % filteredTemplates.length);
                            return;
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const activeTemplate = filteredTemplates[activeTemplateIndex];
                            if (!activeTemplate) return;
                            selectTemplateAndClose(activeTemplate.id);
                            return;
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setTemplateDropdownOpen(false);
                          }
                        }}
                        ref={templateInputRef}
                        placeholder={templates.length === 0 ? "Keine Vorlage vorhanden" : "Vorlagen suchen..."}
                        disabled={templates.length === 0}
                        className="h-6 min-w-[12rem] flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-secondary/70 disabled:opacity-50"
                    disabled={templates.length === 0}
                    onClick={() => setTemplateDropdownOpen((prev) => !prev)}
                  >
                    <ChevronUp className={cn("h-4 w-4 transition-transform", !isTemplateDropdownOpen && "rotate-180")} />
                  </button>
                </div>
                {isTemplateDropdownOpen && hasTemplateFilterInput && (
                  <div className="max-h-56 overflow-y-auto border-t border-border/70 p-1.5">
                    {filteredTemplates.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine Vorlage gefunden.</div>
                    ) : (
                      filteredTemplates.map((template) => {
                        const templateIndex = filteredTemplates.findIndex((entry) => entry.id === template.id);
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => selectTemplateAndClose(template.id)}
                            onMouseEnter={() => setActiveTemplateIndex(templateIndex)}
                            className={cn(
                              "flex w-full items-center rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary/40",
                              activeTemplateIndex === templateIndex && "bg-primary/10 text-primary",
                              selectedTemplateId === template.id && "font-medium",
                            )}
                          >
                            <span className="truncate">{template.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                {isTemplateDropdownOpen && !hasTemplateFilterInput && templateQuery.length > 0 && (
                  <div className="border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
                    Bitte mindestens 3 Zeichen eingeben.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <Label>Von <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={dateFrom}
                required
                className="bg-background"
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  if (!dateTo || e.target.value > dateTo) setDateTo(e.target.value);
                }}
              />
            </label>
            <label className="space-y-1.5">
              <Label>Bis <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom}
                required
                className="bg-background"
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
            {dateRangeError && (
              <p className="sm:col-span-2 text-sm text-destructive">{dateRangeError}</p>
            )}
            <label className="space-y-1.5 sm:col-span-2">
              <Label>Beschreibung</Label>
              <Textarea rows={2} value={draft.notes} disabled={isDraftFieldLocked("notes")} onChange={(e) => updateDraft("notes", e.target.value)} className="bg-background" />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <Label>Hilfsmittel</Label>
              <Textarea rows={2} value={draft.requiredResources ?? ""} disabled={isDraftFieldLocked("requiredResources")} onChange={(e) => updateDraft("requiredResources", e.target.value || undefined)} className="bg-background" />
            </label>
            <div className="space-y-1.5">
              <Label>Tageszeit</Label>
              <Select value={draft.dayPart ?? "none"} disabled={isDraftFieldLocked("dayPart")} onValueChange={(value) => updateDraft("dayPart", value as DayPart | "none")}>
                <SelectTrigger aria-label="Tageszeit" className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_PART_SELECT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="space-y-1.5">
              <Label>Uhrzeit</Label>
              <Input type="time" value={draft.scheduledTime ?? ""} disabled={isDraftFieldLocked("scheduledTime")} onChange={(e) => updateDraft("scheduledTime", e.target.value || undefined)} className="bg-background" />
            </label>
            <label className="space-y-1.5">
              <Label>Geplante Minuten</Label>
              <Input type="number" min={0} step={5} value={draft.plannedMinutes ?? ""} disabled={isDraftFieldLocked("plannedMinutes")} onChange={(e) => updateDraft("plannedMinutes", e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)))} className="bg-background" />
            </label>
            <label className="space-y-1.5">
              <Label>Anz. Personen</Label>
              <Input type="number" min={1} step={1} value={draft.requiredPersons ?? ""} disabled={isDraftFieldLocked("requiredPersons")} onChange={(e) => updateDraft("requiredPersons", e.target.value === "" ? undefined : Math.max(1, Math.floor(Number(e.target.value))))} className="bg-background" />
            </label>
            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Select
                value={draft.category ?? "none"}
                disabled={isDraftFieldLocked("category")}
                onValueChange={(value) => updateDraft("category", value === "none" ? undefined : value as ActionCategory)}
              >
                <SelectTrigger aria-label="Kategorie" className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  <SelectItem value="a">A</SelectItem>
                  <SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resultat</Label>
              <Select value={draft.resultRequirement ?? "none"} disabled={isDraftFieldLocked("resultRequirement")} onValueChange={(value) => updateDraft("resultRequirement", value === "none" ? undefined : value as ActionNode["resultRequirement"])}>
                <SelectTrigger aria-label="Resultat" className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Resultat</SelectItem>
                  <SelectItem value="optional">Resultat optional</SelectItem>
                  <SelectItem value="required">Resultat zwingend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {creationMode === "scratch" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Leistungsart</Label>
                <Select value={draft.serviceType ?? "none"} onValueChange={(value) => updateDraft("serviceType", value === "none" ? undefined : value as ActionServiceType)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Leistungsart" /></SelectTrigger>
                  <SelectContent>
                    {ACTION_SERVICE_TYPE_SELECT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Abbrechen
          </Button>
          <div className="flex flex-col items-end gap-1">
            {missingRequiredFields.length > 0 && (
              <p className="text-xs text-primary-foreground/80">Zwingend erforderliche Felder sind nicht ausgefüllt.</p>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={submit}
              disabled={(creationMode === "template" && !selectedTemplate) || !!dateRangeError || missingRequiredFields.length > 0}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Bestätigen
            </Button>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function BulkNotDoneDialog({
  open,
  targets,
  onClose,
  onConfirm,
}: {
  open: boolean;
  targets: BulkNotDoneTarget[];
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const submit = () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason || targets.length === 0) return;
    onConfirm(trimmedReason);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? handleClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mehrere Handlungen nicht durchgeführt bestätigen</DialogTitle>
          <DialogDescription>
            Die Begründung wird auf {targets.length} ausgewählte {targets.length === 1 ? "Handlung" : "Handlungen"} kopiert.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-sm">
            {targets.length > 0 ? (
              <ul className="space-y-1">
                {targets.map((target) => (
                  <li key={target.key} className="line-clamp-1 text-foreground/80">
                    {target.actionTitle}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">Keine Handlungen ausgewählt.</div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-not-done-reason">Begründung</Label>
            <Textarea
              id="bulk-not-done-reason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Warum wurden die ausgewählten Handlungen nicht durchgeführt?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
          <Button variant="destructive" onClick={submit} disabled={!reason.trim() || targets.length === 0}>
            {targets.length} als „Nicht durchgeführt" bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmActionDialog({
  target,
  onClose,
  onConfirm,
  onDelete,
  clientName,
}: {
  target: DialogTarget;
  onClose: () => void;
  onConfirm: (p: ConfirmPayload) => void;
  onDelete?: () => void;
  clientName?: string;
}) {
  const confirmation = target.action.confirmations?.[target.dueDate];
  const [mode, setMode] = useState<ActionStatus | null>(
    target.initialMode ?? (target.action.status === "open" ? null : target.action.status)
  );
  const [actualMinutes, setActualMinutes] = useState<string>(
    target.action.actualMinutes != null ? String(target.action.actualMinutes) : ""
  );
  const [reason, setReason] = useState<string>(target.action.reason ?? "");
  const [result, setResult] = useState<string>(target.action.result ?? "");
  const [observations, setObservations] = useState<string>(target.action.observations ?? "");
  const [postponedDate, setPostponedDate] = useState<string>(confirmation?.postponedToDate ?? "");
  const [postponedTime, setPostponedTime] = useState<string>(confirmation?.postponedToTime ?? "");
  const [postponedReason, setPostponedReason] = useState<string>(confirmation?.postponedReason ?? "");
  const [postponedError, setPostponedError] = useState<string>("");
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const confirmAsideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsPanelVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!isPanelVisible) return;
    const handler = (e: MouseEvent) => {
      const el = e.target as Element;
      if (confirmAsideRef.current && !confirmAsideRef.current.contains(el)) {
        if (el.closest?.("[data-radix-popper-content-wrapper],[data-radix-select-content],[data-radix-dropdown-menu-content],[data-radix-popover-content]")) return;
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPanelVisible]);

  const handleClose = () => {
    setIsPanelVisible(false);
    setTimeout(onClose, 300);
  };

  const submit = () => {
    if (!target || !mode) return;
    const res = result.trim() ? result.trim() : undefined;
    const resultRequirement = target.action.resultRequirement ?? "none";
    if (
      resultRequirement === "required" &&
      (mode === "done_as_planned" || mode === "done_with_deviation") &&
      !res
    ) {
      return;
    }
    const obs = observations.trim() ? observations.trim() : undefined;
    if (mode === "done_as_planned") {
      onConfirm({ status: "done_as_planned", result: res, observations: obs });
    } else if (mode === "done_with_deviation") {
      const hasPlannedMinutes = target.action.plannedMinutes != null;
      const min = Number(actualMinutes);
      if ((hasPlannedMinutes && (!Number.isFinite(min) || min < 0)) || !reason.trim()) return;
      onConfirm({
        status: "done_with_deviation",
        actualMinutes: hasPlannedMinutes ? min : undefined,
        reason: reason.trim(),
        result: res,
        observations: obs,
      });
    } else if (mode === "not_done") {
      if (!reason.trim()) return;
      onConfirm({ status: "not_done", reason: reason.trim() });
    } else if (mode === "postponed") {
      const nextDate = postponedDate || undefined;
      const nextTime = postponedTime || undefined;
      if (!nextDate && !nextTime) {
        setPostponedError("Bitte ein neues Datum und/oder eine neue Uhrzeit erfassen.");
        return;
      }
      if (!postponedReason.trim()) {
        setPostponedError("Bitte einen Grund für die Verschiebung angeben.");
        return;
      }

      const plannedDateTime = buildPlannedDateTime(target.dueDate, target.action.scheduledTime);
      const shiftedDateTime = buildPlannedDateTime(
        nextDate ?? target.dueDate,
        nextTime ?? target.action.scheduledTime,
      );

      if (shiftedDateTime <= plannedDateTime) {
        setPostponedError("Die Verschiebung muss später als der bisher geplante Zeitpunkt liegen.");
        return;
      }

      setPostponedError("");
      onConfirm({ status: "postponed", postponedToDate: nextDate, postponedToTime: nextTime, postponedReason: postponedReason.trim() });
    }
    setMode(null);
    setActualMinutes("");
    setReason("");
    setResult("");
    setObservations("");
    setPostponedDate("");
    setPostponedTime("");
    setPostponedReason("");
    setPostponedError("");
  };

  const planned = target.action.plannedMinutes;
  const hasPlannedMinutes = planned != null;
  const requiredPersons = target.action.requiredPersons;
  const description = target.action.notes.trim();
  const requiredResources = target.action.requiredResources?.trim();
  const resultRequirement = target.action.resultRequirement ?? "none";
  const showResult =
    resultRequirement !== "none" &&
    (mode === "done_as_planned" || mode === "done_with_deviation");
  const resultRequired = resultRequirement === "required";
  const showObservations = mode === "done_as_planned" || mode === "done_with_deviation";
  const selectedModeOption = CONFIRMATION_MODE_OPTIONS.find((option) => option.mode === mode);
  const activeConfirmation = target.action.confirmations?.[target.dueDate];

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-end pointer-events-none overflow-hidden`}
    >
      <aside
        ref={confirmAsideRef}
        className={`pointer-events-auto flex h-dvh w-full max-w-2xl flex-col bg-[#f3f3f5] transition-transform duration-300 ease-out ${isPanelVisible ? "translate-x-0 shadow-2xl" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
          <div>
            <h2 className="text-2xl font-light">Handlung bestätigen</h2>
            {clientName && <p className="text-sm opacity-80 mt-0.5">{clientName}</p>}
          </div>
          <button type="button" onClick={handleClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Action info */}
          <div className="rounded-md border border-border bg-background p-3 text-sm space-y-1.5">
            <div className="font-medium">{target.action.title}</div>
            <div className="text-muted-foreground">
              Datum: <span className="font-medium text-foreground">{format(parseISO(target.dueDate), "dd.MM.yyyy", { locale: de })}</span>
            </div>
            {(target.action.scheduledTime || planned != null || requiredPersons != null) && (
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                {target.action.scheduledTime && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                    Uhrzeit {target.action.scheduledTime}
                  </span>
                )}
                {planned != null && <span>geplant {planned} Min</span>}
                {requiredPersons != null && (
                  <span>{requiredPersons} {requiredPersons === 1 ? "Person" : "Personen"}</span>
                )}
              </div>
            )}
            {description && (
              <div className="text-muted-foreground whitespace-pre-wrap">{description}</div>
            )}
            {requiredResources && (
              <div className="text-muted-foreground whitespace-pre-wrap">
                <span className="font-medium text-foreground/80">Hilfsmittel:</span> {requiredResources}
              </div>
            )}
          </div>

          {/* Selected mode + confirmation metadata */}
          {selectedModeOption && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Gewählte Variante:</span>{" "}
              <span className="font-semibold text-foreground">{selectedModeOption.label}</span>
              {target.confirmedAt && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Bestätigt von{" "}
                  <span className="font-medium text-foreground/80">{target.confirmedBy ?? "Unbekannt"}</span>{" "}
                  am{" "}
                  <span className="font-medium text-foreground/80">
                    {format(parseISO(target.confirmedAt), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                  </span>
                </div>
              )}
              {activeConfirmation?.postponedAt && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Verschoben von{" "}
                  <span className="font-medium text-foreground/80">{activeConfirmation.postponedBy ?? "Unbekannt"}</span>{" "}
                  am{" "}
                  <span className="font-medium text-foreground/80">
                    {format(parseISO(activeConfirmation.postponedAt), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                  </span>
                </div>
              )}
            </div>
          )}

          {mode === "done_with_deviation" && (
            <div className="space-y-3 pt-2 border-t border-border">
              {planned != null && (
                <div className="space-y-1.5">
                  <Label htmlFor="actual-min">Tatsächliche Minuten</Label>
                  <Input
                    id="actual-min"
                    type="number"
                    min={0}
                    step={5}
                    value={actualMinutes}
                    onChange={(e) => setActualMinutes(e.target.value)}
                    placeholder="z. B. 60"
                    className="bg-background"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="dev-reason">Begründung</Label>
                <Textarea
                  id="dev-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Was ist der Grund für die Abweichung?"
                  className="bg-background"
                />
              </div>
            </div>
          )}

          {mode === "not_done" && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="not-reason">Begründung</Label>
              <Textarea
                id="not-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Warum wurde die Handlung nicht durchgeführt?"
                className="bg-background"
              />
            </div>
          )}

          {mode === "postponed" && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Bisher geplant: {target.dueDate ? format(parseISO(target.dueDate), "dd.MM.yyyy", { locale: de }) : "—"}
                {target.action.scheduledTime ? `, ${target.action.scheduledTime}` : ""}. Die neue Planung muss später liegen.
              </div>
              <DateField
                label="Neues Datum"
                value={postponedDate}
                onChange={(value) => {
                  setPostponedDate(value ?? "");
                  setPostponedError("");
                }}
              />
              <div className="space-y-1.5">
                <Label htmlFor="postponed-time">Neue Uhrzeit</Label>
                <Input
                  id="postponed-time"
                  type="time"
                  value={postponedTime}
                  onChange={(event) => {
                    setPostponedTime(event.target.value);
                    setPostponedError("");
                  }}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postponed-reason">Grund <span className="text-destructive">*</span></Label>
                <Textarea
                  id="postponed-reason"
                  rows={2}
                  value={postponedReason}
                  onChange={(e) => {
                    setPostponedReason(e.target.value);
                    setPostponedError("");
                  }}
                  placeholder="Warum wird die Handlung verschoben?"
                  className="bg-background"
                />
              </div>
              {postponedError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {postponedError}
                </div>
              )}
            </div>
          )}

          {showResult && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="result">
                Resultat{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({resultRequired ? "zwingend" : "optional"})
                </span>
              </Label>
              <Textarea
                id="result"
                rows={3}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Resultat der Handlung..."
                className="bg-background"
              />
            </div>
          )}

          {showObservations && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="observations">
                Beobachtungen{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="observations"
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Beobachtungen während der Durchführung…"
                className="bg-background"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Abbrechen
          </Button>
          <div className="flex items-center gap-2">
            {target.action.status !== "open" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onConfirm({ status: "open" });
                  setMode(null);
                  setActualMinutes("");
                  setReason("");
                  setResult("");
                  setObservations("");
                  setPostponedDate("");
                  setPostponedTime("");
                  setPostponedError("");
                }}
                className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </Button>
            ) : target.action.isUnplanned && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                Löschen
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={submit}
              disabled={
                !mode ||
                (mode === "done_with_deviation" &&
                  ((hasPlannedMinutes && actualMinutes === "") || !reason.trim())) ||
                (mode === "not_done" && !reason.trim()) ||
                (mode === "postponed" && ((!postponedDate && !postponedTime) || !postponedReason.trim())) ||
                (showResult && resultRequired && !result.trim())
              }
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Bestätigen
            </Button>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function Notes({
  value,
  onChange,
  placeholder,
  className,
  compact,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <Textarea
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "w-full resize-none bg-white shadow-none leading-relaxed border border-border/50 rounded-md px-2 focus-visible:ring-0 focus-visible:border-primary/50 placeholder:text-muted-foreground/40 transition-colors hover:border-border",
        compact ? "text-xs min-h-0 py-0.5" : "text-sm min-h-0 py-1 max-h-[4.75rem] overflow-y-auto",
        className,
      )}
      onInput={(e) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }}
    />
  );
}
