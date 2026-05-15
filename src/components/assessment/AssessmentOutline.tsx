import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus,
  Trash2,
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
  ChevronRight,
  ChevronUp,
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
  loadActionPlanTemplates,
  type ActionPlanTemplate,
} from "@/lib/action-plan-templates";
import { DEFAULT_LAST_N_DAYS, type ConfirmationPeriod } from "@/lib/assessment-cache";

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
  | { status: "postponed"; postponedToDate?: string; postponedToTime?: string }
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

interface Props {
  viewMode: "planning" | "confirmation";
  selectedDate: string;
  showCompletedTargets?: boolean;
  onSelectedDateChange: (date: string) => void;
  confirmationPeriod?: ConfirmationPeriod;
  lastNDays?: number;
  clientName?: string;
  topics: TopicNode[];
  hideConfirmationHeader?: boolean;
  bulkNotDoneMode?: boolean;
  onBulkNotDoneModeChange?: (enabled: boolean) => void;
  showConfirmed?: boolean;
  confirmationFilter?: ConfirmationFilter;
  filterModel?: AssessmentFilterModel;
  onUpdateTopic: (topicId: string, field: "title" | "notes", value: string) => void;
  onUpdateTarget: (
    topicId: string,
    targetId: string,
    field: "title" | "notes",
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
  ) => void;
  onAddTopic: () => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteTarget: (topicId: string, targetId: string) => void;
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

const CATEGORY_CONFIRMATION_LEVELS: Partial<Record<ActionCategory, number[]>> = {
  a: [1],
  b: [2],
  c: [3],
};

const CURRENT_USER_CONFIRMATION_LEVELS = [2, 3];

const canConfirmAction = (action: ActionNode) => {
  if (!action.category) return true;

  const allowedLevels = CATEGORY_CONFIRMATION_LEVELS[action.category];
  if (!allowedLevels || allowedLevels.length === 0) return true;

  return allowedLevels.some((level) => CURRENT_USER_CONFIRMATION_LEVELS.includes(level));
};

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
  selectedDate,
  onSelectedDateChange,
  showCompletedTargets = false,
  confirmationPeriod = "day",
  lastNDays = DEFAULT_LAST_N_DAYS,
  clientName,
  topics,
  hideConfirmationHeader,
  bulkNotDoneMode = false,
  onBulkNotDoneModeChange,
  confirmationFilter,
  filterModel = DEFAULT_ASSESSMENT_FILTER,
  onUpdateTopic,
  onUpdateTarget,
  onUpdateAction,
  onUpdateActionField,
  onConfirmAction,
  onAddTarget,
  onAddAction,
  onAddTopic,
  onDeleteTopic,
  onDeleteTarget,
  onDeleteAction,
}: Props) {
  const [templateInline, setTemplateInline] = useState<{
    topicId: string;
    targetId: string;
    creationMode: "scratch" | "template";
    selectedIds: string[];
    serviceType: ActionServiceType | "none";
  } | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<ActionPlanTemplate[]>([]);
  const [templateQuery, setTemplateQuery] = useState("");
  const [isTemplateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const [selectedBulkNotDoneKeys, setSelectedBulkNotDoneKeys] = useState<Set<string>>(new Set());
  const [bulkNotDoneDialogOpen, setBulkNotDoneDialogOpen] = useState(false);
  const templateInputRef = useRef<HTMLInputElement | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!bulkNotDoneMode) {
      setSelectedBulkNotDoneKeys(new Set());
      setBulkNotDoneDialogOpen(false);
    }
  }, [bulkNotDoneMode]);

  const openAddActionDialog = (topicId: string, targetId: string) => {
    setAvailableTemplates(loadActionPlanTemplates());
    setTemplateInline({
      topicId,
      targetId,
      creationMode: "template",
      selectedIds: [],
      serviceType: "none",
    });
    setTemplateQuery("");
    setTemplateDropdownOpen(true);
    setActiveTemplateIndex(0);
  };

  const toggleTemplateSelection = (templateId: string, checked: boolean) => {
    setTemplateInline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedIds: checked
          ? prev.selectedIds.includes(templateId)
            ? prev.selectedIds
            : [...prev.selectedIds, templateId]
          : prev.selectedIds.filter((id) => id !== templateId),
      };
    });
  };
  const templateFilterQuery = templateQuery.toLocaleLowerCase("de");
  const hasTemplateFilterInput = templateFilterQuery.length >= 3;
  const filteredTemplates = hasTemplateFilterInput
    ? availableTemplates.filter((template) => {
        const wildcardQuery = templateFilterQuery
          .replace(/[.*+?^${}()|[\]\\]/g, "$&")
          .replace(/\s/g, ".*");

        return new RegExp(wildcardQuery).test(template.name.toLocaleLowerCase("de"));
      })
    : [];

  useEffect(() => {
    setActiveTemplateIndex(0);
  }, [templateQuery, isTemplateDropdownOpen]);

  useEffect(() => {
    if (!templateInline) return;
    window.requestAnimationFrame(() => {
      templateInputRef.current?.focus();
    });
  }, [templateInline]);

  const selectTemplateAndClose = (templateId: string) => {
    toggleTemplateSelection(templateId, true);
    setTemplateQuery("");
    setTemplateDropdownOpen(false);
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
            if (!matchesAssessmentFilter({ action, status, confirmation }, filterModel)) return;
            flatActions.push({ topic, target, action, dueDate, confirmationDate: dueDate, status });
          });

          Object.entries(action.confirmations ?? {}).forEach(([confirmationDate, confirmation]) => {
            if (!confirmation.postponedToDate) return;
            if (confirmation.postponedToDate < periodRange.start || confirmation.postponedToDate > periodRange.end) {
              return;
            }
            if (!matchesAssessmentFilter({ action, status: confirmation.status, confirmation }, filterModel)) return;
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
      matchesFilter(action, status, dueDate),
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
                  variant="outline"
                  size="sm"
                  className="border-border/70 bg-background/50 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                  disabled={selectedBulkNotDoneTargets.length === 0}
                  onClick={() => setBulkNotDoneDialogOpen(true)}
                >
                  Ausgewählte als „Nicht durchgeführt“ bestätigen
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
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <h3 className="text-sm font-semibold text-primary">
                  {format(parseISO(dateGroup.dueDate), "EEEE, dd.MM.yyyy", { locale: de })}
                </h3>
              </div>
              {dateGroup.dayPartGroups.map((group) => (
                <div key={`${dateGroup.dueDate}-${group.key}`}>
                  <DayPartHeader part={group.key} />
                  <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
                    <Table
                      className={cn(
                        "w-full table-fixed",
                        bulkNotDoneMode
                          ? clientName
                            ? "min-w-[1126px]"
                            : "min-w-[1016px]"
                          : clientName
                            ? "min-w-[1078px]"
                            : "min-w-[968px]",
                      )}
                    >
                      <TableHeader className="bg-secondary/40">
                        <TableRow className="hover:bg-transparent">
                          {bulkNotDoneMode && (
                            <TableHead className="w-[48px] px-2"><span className="sr-only">Mehrfachauswahl</span></TableHead>
                          )}
                          <TableHead className="w-[48px] px-1"><span className="sr-only">Umsetzung</span></TableHead>
                          {clientName && <TableHead className="w-[110px] px-2">Klient/in</TableHead>}
                          <TableHead className="w-[320px] px-2">Handlung</TableHead>
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
                          const openConfirmationDialog = (initialMode: ConfirmationMode) => {
                            if (!canConfirm) return;
                            setDialogTarget({
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
                                    <div className="flex flex-col items-center gap-1.5">
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
                                    </div>
                                  </TooltipProvider>
                                ) : (
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openConfirmationDialog(status as ConfirmationMode)
                                      }
                                      disabled={!canConfirm}
                                      aria-label="Umsetzung bearbeiten"
                                      title={
                                        canConfirm
                                          ? "Umsetzung bearbeiten"
                                          : "Keine Umsetzung möglich (zu geringe Berechtigung)"
                                      }
                                      className={cn(
                                        "pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-secondary/60",
                                        !canConfirm && "cursor-not-allowed opacity-50 hover:bg-background",
                                      )}
                                    >
                                      <StatusIcon status={status} />
                                    </button>
                                  </div>
                                )}
                              </TableCell>
                              {clientName && (
                                <TableCell className="px-3 py-3 align-top text-xs">
                                  <div className="font-medium text-foreground/80 line-clamp-2">{clientName}</div>
                                </TableCell>
                              )}
                              <TableCell className="px-3 py-3 align-top break-words">
                                <div className={cn("font-medium leading-snug break-words", status !== "open" && "text-foreground/70")}>
                                  {action.title}
                                </div>
                                {conf?.postponedToDate && (
                                  <div className="mt-1 inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                    <CalendarClock className="h-3 w-3" />
                                    Verschoben von {format(parseISO(confirmationDate), "dd.MM.yyyy", { locale: de })} auf {getPostponedLabel(conf.postponedToDate, conf.postponedToTime)}
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
                                <div className="mt-2 text-xs break-words">
                                  <div className="font-medium text-primary/70 line-clamp-2 break-words">{topic.title}</div>
                                  <div className="mt-1 text-muted-foreground line-clamp-2 break-words">{target.title}</div>
                                </div>
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

        <ConfirmActionDialog
          target={dialogTarget}
          onClose={() => setDialogTarget(null)}
          onConfirm={(payload) => {
            if (!dialogTarget) return;
            onConfirmAction(
              dialogTarget.topicId,
              dialogTarget.targetId,
              dialogTarget.action.id,
              payload,
              dialogTarget.dueDate
            );
            setDialogTarget(null);
          }}
        />
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
          }}
        />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-sm p-12 text-center text-muted-foreground">
        <p className="mb-4">Noch keine Schwerpunkte erfasst.</p>
        <button
          onClick={onAddTopic}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ersten Schwerpunkt hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {topics.map((topic) => (
        <section key={topic.id} className="group/topic">
          {/* Topic header */}
          <div className="flex items-start gap-3 pb-2 border-b-2 border-primary/30">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-accent mb-1">
                Schwerpunkt
              </div>
              <input
                value={topic.title}
                onChange={(e) => onUpdateTopic(topic.id, "title", e.target.value)}
                placeholder="Themenbezeichnung…"
                className="w-full text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              onClick={() => onDeleteTopic(topic.id)}
              className="opacity-0 group-hover/topic:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
              aria-label="Schwerpunkt löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Notes
            value={topic.notes}
            onChange={(v) => onUpdateTopic(topic.id, "notes", v)}
            placeholder="Freitext zum Schwerpunkt…"
            className="mt-3"
          />

          {/* Targets */}
          <div className="mt-6 space-y-6 pl-6 border-l border-border ml-4">
            {topic.targets.filter((target) => {
              if (showCompletedTargets) return true;
              if (target.actions.length === 0) return true;
              if (target.actions.some((action) => !action.validFrom)) return true;
              return target.actions.some(
                (action) =>
                  action.validFrom != null &&
                  action.validFrom <= today &&
                  (!action.validTo || today <= action.validTo),
              );
            }).map((target) => {
              return (
                <div key={target.id} className="group/target">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
                        Ziel
                      </div>
                      <input
                        value={target.title}
                        onChange={(e) =>
                          onUpdateTarget(topic.id, target.id, "title", e.target.value)
                        }
                        placeholder="Zielbezeichnung…"
                        className="w-full text-lg font-medium bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <button
                      onClick={() => onDeleteTarget(topic.id, target.id)}
                      className="opacity-0 group-hover/target:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                      aria-label="Ziel löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="pl-6">
                    <Notes
                      value={target.notes}
                      onChange={(v) => onUpdateTarget(topic.id, target.id, "notes", v)}
                      placeholder="Freitext zum Ziel…"
                      className="mt-2"
                    />

                    <div className="mt-3">
                      <ul className="space-y-1">
                        {target.actions.map((action) => (
                          <ActionRow
                            key={action.id}
                            viewMode={viewMode}
                            topicId={topic.id}
                            targetId={target.id}
                            action={action}
                            onUpdateAction={onUpdateAction}
                            onUpdateActionField={onUpdateActionField}
                            onDeleteAction={onDeleteAction}
                            onOpenDialog={(initialMode) =>
                              setDialogTarget({
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

                    <button
                      onClick={() => openAddActionDialog(topic.id, target.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Handlung hinzufügen
                    </button>
                    {templateInline?.topicId === topic.id && templateInline?.targetId === target.id && (
                      <div className="mt-2 rounded-md border border-border/60 bg-card p-3 space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateInline((prev) =>
                                prev ? { ...prev, creationMode: "template" } : prev,
                              );
                              setTemplateDropdownOpen(true);
                            }}
                            className={cn(
                              "rounded-md border p-3 text-left transition-colors",
                              templateInline.creationMode === "template"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-secondary/40",
                            )}
                          >
                            <div className="text-sm font-medium">Ab Vorlage verwenden</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Übernimmt Vorlagenwerte als Startpunkt; alle Felder bleiben danach editierbar.
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateInline((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      creationMode: "scratch",
                                      selectedIds: [],
                                      serviceType: prev.serviceType ?? "none",
                                    }
                                  : prev,
                              );
                              setTemplateDropdownOpen(false);
                              setTemplateQuery("");
                            }}
                            className={cn(
                              "rounded-md border p-3 text-left transition-colors",
                              templateInline.creationMode === "scratch"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-secondary/40",
                            )}
                          >
                            <div className="text-sm font-medium">Ohne Vorlage erfassen</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Erstellt eine leere Handlung, deren Felder direkt ausgefüllt werden können.
                            </div>
                          </button>
                        </div>

                        {templateInline.creationMode === "scratch" && (
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">Leistungsart</Label>
                            <Select
                              value={templateInline.serviceType}
                              onValueChange={(value) =>
                                setTemplateInline((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        serviceType: value as ActionServiceType | "none",
                                      }
                                    : prev,
                                )
                              }
                            >
                              <SelectTrigger className="h-9 bg-background">
                                <SelectValue placeholder="Leistungsart auswählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_SERVICE_TYPE_SELECT_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {templateInline.creationMode === "template" && (
                          <div className="rounded-md border border-input/70 bg-background shadow-sm focus-within:border-primary/70">
                            <div className="flex items-start gap-2 p-2">
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap gap-1">
                                  {templateInline.selectedIds.map((id) => {
                                    const template = availableTemplates.find((entry) => entry.id === id);
                                    if (!template) return null;
                                    return (
                                      <Badge
                                        key={id}
                                        variant="secondary"
                                        className="h-6 gap-1 rounded-sm border border-border/60 bg-secondary/40 px-1.5 font-normal text-foreground/90"
                                      >
                                        {template.name}
                                        <button
                                          type="button"
                                          className="text-xs leading-none text-muted-foreground hover:text-foreground"
                                          onClick={() => toggleTemplateSelection(id, false)}
                                        >
                                          ×
                                        </button>
                                      </Badge>
                                    );
                                  })}
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
                                    placeholder="Vorlagen suchen..."
                                    className="h-6 min-w-[12rem] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-secondary/70"
                                onClick={() => setTemplateDropdownOpen((prev) => !prev)}
                              >
                                <ChevronUp className={cn("h-4 w-4 transition-transform", !isTemplateDropdownOpen && "rotate-180")} />
                              </button>
                            </div>
                            {isTemplateDropdownOpen && hasTemplateFilterInput && (
                              <div className="max-h-56 overflow-y-auto border-t border-border/70 p-1.5">
                                {filteredTemplates.map((template) => {
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
                                      )}
                                    >
                                      <span className="truncate">{template.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setTemplateInline(null)}>Abbrechen</Button>
                          <Button
                            disabled={
                              templateInline.creationMode === "template" &&
                              templateInline.selectedIds.length === 0
                            }
                            onClick={() => {
                              if (!templateInline) return;
                              onAddAction(
                                templateInline.topicId,
                                templateInline.targetId,
                                templateInline.creationMode === "template" ? templateInline.selectedIds : [],
                                templateInline.creationMode === "scratch" &&
                                  templateInline.serviceType !== "none"
                                  ? templateInline.serviceType
                                  : undefined,
                              );
                              setTemplateInline(null);
                            }}
                          >
                            Handlung erstellen
                          </Button>
                        </div>
                      </div>
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
        </section>
      ))}

      <div className="pt-4 border-t border-dashed border-border">
        <button
          onClick={onAddTopic}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Neuer Schwerpunkt
        </button>
      </div>

      <ConfirmActionDialog
        target={dialogTarget}
        onClose={() => setDialogTarget(null)}
        onConfirm={(payload) => {
          if (!dialogTarget) return;
          onConfirmAction(
            dialogTarget.topicId,
            dialogTarget.targetId,
            dialogTarget.action.id,
            payload,
            dialogTarget.dueDate,
          );
          setDialogTarget(null);
        }}
      />
    </div>
  );
}

function DayPartHeader({ part }: { part: DayPart | "none" }) {
  if (part === "none") {
    return (
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
        <span className="h-px flex-1 bg-border" />
        <span>Ohne Tageszeit</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }
  const Icon = DAY_PART_ICONS[part];
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-accent">
      <Icon className="h-3.5 w-3.5" />
      <span>{DAY_PART_LABEL[part]}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function ActionRow({
  viewMode,
  topicId,
  targetId,
  action,
  onUpdateAction,
  onUpdateActionField,
  onDeleteAction,
  onOpenDialog,
}: {
  viewMode: "planning" | "confirmation";
  topicId: string;
  targetId: string;
  action: ActionNode;
  onUpdateAction: Props["onUpdateAction"];
  onUpdateActionField: Props["onUpdateActionField"];
  onDeleteAction: Props["onDeleteAction"];
  onOpenDialog: (initialMode: ConfirmationMode) => void;
}) {
  const isLocked = Object.keys(action.confirmations ?? {}).length > 0;
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

  return (
    <li className={cn(
      "group/action flex items-start gap-3 rounded transition-colors",
      viewMode === "planning"
        ? "p-3 bg-secondary/30 border border-border hover:border-primary/40"
        : "py-2 px-2 -mx-2 hover:bg-secondary/40"
    )}>
      {viewMode === "confirmation" && (
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
          title={
            isConfirmationRestricted
              ? "Keine Rechte zur Umsetzung von Kategorie A"
              : "Status ändern"
          }
          aria-disabled={isConfirmationRestricted}
        >
          <StatusIcon status={action.status} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <input
          value={action.title}
          readOnly={viewMode === "confirmation" || isLocked}
          onChange={(e) =>
            onUpdateAction(topicId, targetId, action.id, "title", e.target.value)
          }
          placeholder="Handlung…"
          className={cn(
            "w-full text-sm font-medium bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40",
            viewMode === "confirmation" && action.status === "done_as_planned" &&
              "line-through text-muted-foreground",
            viewMode === "confirmation" && action.status === "done_with_deviation" &&
              "line-through text-muted-foreground",
            viewMode === "confirmation" && action.status === "not_done" &&
              "line-through text-muted-foreground/70",
          )}
        />

        {viewMode === "planning" && (
          <div className="mt-1 space-y-1">
            <Notes
              value={action.notes}
              onChange={(v) =>
                onUpdateAction(topicId, targetId, action.id, "notes", v)
              }
              disabled={isLocked}
              placeholder="Beschreibung zur Handlung..."
              className="text-foreground/70"
              compact
            />
            <Notes
              value={action.requiredResources ?? ""}
              onChange={(v) =>
                onUpdateAction(topicId, targetId, action.id, "requiredResources", v)
              }
              disabled={isLocked}
              placeholder="Hilfsmittel zur Durchführung..."
              className="text-foreground/70"
              compact
            />
          </div>
        )}

        {/* Meta fields */}
        {viewMode === "planning" ? (
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5 transition-colors focus-within:border-primary">
              <span className="shrink-0 text-muted-foreground">Kategorie</span>
              <Select
                value={action.category ?? "none"}
                disabled={isLocked}
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
                <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
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

            <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5 transition-colors focus-within:border-primary">
              <span className="shrink-0 text-muted-foreground">Tageszeit</span>
              <Select
                value={action.dayPart ?? "none"}
                disabled={isLocked}
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
                <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
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
                disabled={isLocked}
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
                disabled={isLocked}
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
                disabled={isLocked}
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

            <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5 transition-colors focus-within:border-primary">
              <span className="shrink-0 text-muted-foreground">Resultat</span>
              <Select
                value={action.resultRequirement ?? "none"}
                disabled={isLocked}
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
                <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Kein Resultat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Resultat</SelectItem>
                  <SelectItem value="optional">Resultat optional</SelectItem>
                  <SelectItem value="required">Resultat zwingend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DateField
              label="Gültig ab"
              required
              disabled={isLocked}
              value={action.validFrom}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validFrom", v)
              }
              className="w-full md:col-start-1"
            />
            <DateField
              label="Gültig bis"
              disabled={false}
              value={action.validTo}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validTo", v)
              }
              className="w-full"
            />
            <div
              className={cn(
                "flex min-w-0 items-center gap-2 rounded border border-border bg-background px-2 py-1.5 transition-colors focus-within:border-primary",
                !action.recurrence && "border-destructive/60 text-destructive",
              )}
            >
              <span className="shrink-0 text-muted-foreground">Wiederholung</span>
              <Select
                value={action.recurrence ?? "none"}
                disabled={isLocked}
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
                <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
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
            {action.recurrence === "weekly" && (
              <div
                className={cn(
                  "col-span-1 md:col-span-3 rounded border border-border bg-background px-2 py-1.5",
                  weeklyDaysMissing && "border-destructive/60",
                )}
              >
                <div className="mb-1 text-muted-foreground">Wochentage</div>
                <div className="flex flex-wrap gap-1 select-none">
                  {WEEKDAY_OPTIONS.map((weekday, weekdayIndex) => {
                    const isSelected = (action.recurrenceWeekdays ?? []).includes(weekday.value);
                    return (
                      <button
                        key={weekday.value}
                        type="button"
                        disabled={isLocked}
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
            )}
            {action.recurrence === "monthly" && (
              <div
                className={cn(
                  "col-span-1 md:col-span-3 rounded border border-border bg-background px-2 py-1.5",
                  monthlyPatternMissing && "border-destructive/60",
                )}
              >
                <div className="mb-1 text-muted-foreground">Monatliche Regel</div>
                <Select
                  value={action.recurrenceMonthlyPattern ?? "none"}
                  disabled={isLocked}
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
                  <SelectTrigger className="h-7 w-full text-xs px-2 py-0">
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
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <Select
              value={action.dayPart ?? "none"}
              disabled={isLocked}
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
                disabled={isLocked}
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
                disabled={isLocked}
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
              disabled={isLocked}
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
              <SelectTrigger className="h-7 w-[130px] text-xs px-2 py-0">
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
              disabled={isLocked}
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
              disabled={isLocked}
              value={action.validFrom}
              onChange={(v) =>
                onUpdateActionField(topicId, targetId, action.id, "validFrom", v)
              }
            />
            <DateField
              label="Gültig bis"
              disabled={false}
              value={action.validTo}
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
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
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
            {targets.length} als „Nicht durchgeführt“ bestätigen
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
}: {
  target: DialogTarget | null;
  onClose: () => void;
  onConfirm: (p: ConfirmPayload) => void;
}) {
  const [mode, setMode] = useState<ActionStatus | null>(null);
  const [actualMinutes, setActualMinutes] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [observations, setObservations] = useState<string>("");
  const [postponedDate, setPostponedDate] = useState<string>("");
  const [postponedTime, setPostponedTime] = useState<string>("");
  const [postponedError, setPostponedError] = useState<string>("");

  const open = target !== null;

  useEffect(() => {
    if (target) {
      setMode(target.initialMode ?? (target.action.status === "open" ? null : target.action.status));
      setActualMinutes(
        target.action.actualMinutes != null ? String(target.action.actualMinutes) : "",
      );
      setReason(target.action.reason ?? "");
      setResult(target.action.result ?? "");
      setObservations(target.action.observations ?? "");
      const confirmation = target.action.confirmations?.[target.dueDate];
      setPostponedDate(confirmation?.postponedToDate ?? "");
      setPostponedTime(confirmation?.postponedToTime ?? "");
      setPostponedError("");
    }
  }, [target]);

  const handleClose = () => {
    setMode(null);
    setActualMinutes("");
    setReason("");
    setResult("");
    setObservations("");
    setPostponedDate("");
    setPostponedTime("");
    setPostponedError("");
    onClose();
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
      onConfirm({ status: "postponed", postponedToDate: nextDate, postponedToTime: nextTime });
    }
    setMode(null);
    setActualMinutes("");
    setReason("");
    setResult("");
    setObservations("");
    setPostponedDate("");
    setPostponedTime("");
    setPostponedError("");
  };

  const planned = target?.action.plannedMinutes;
  const hasPlannedMinutes = planned != null;
  const requiredPersons = target?.action.requiredPersons;
  const description = target?.action.notes.trim();
  const requiredResources = target?.action.requiredResources?.trim();
  const resultRequirement = target?.action.resultRequirement ?? "none";
  const showResult =
    resultRequirement !== "none" &&
    (mode === "done_as_planned" || mode === "done_with_deviation");
  const resultRequired = resultRequirement === "required";
  const showObservations = mode === "done_as_planned" || mode === "done_with_deviation";
  const selectedModeOption = CONFIRMATION_MODE_OPTIONS.find((option) => option.mode === mode);
  const activeConfirmation = target?.action.confirmations?.[target.dueDate];

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        {selectedModeOption && (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Gewählte Variante:</span>{" "}
            <span className="font-semibold text-foreground">{selectedModeOption.label}</span>
            {target?.confirmedAt && (
              <div className="mt-1 text-xs text-muted-foreground">
                Bestätigt von{" "}
                <span className="font-medium text-foreground/80">
                  {target.confirmedBy ?? "Unbekannt"}
                </span>{" "}
                am{" "}
                <span className="font-medium text-foreground/80">
                  {format(parseISO(target.confirmedAt), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                </span>
              </div>
            )}
            {activeConfirmation?.postponedAt && (
              <div className="mt-1 text-xs text-muted-foreground">
                Verschoben von{" "}
                <span className="font-medium text-foreground/80">
                  {activeConfirmation.postponedBy ?? "Unbekannt"}
                </span>{" "}
                am{" "}
                <span className="font-medium text-foreground/80">
                  {format(parseISO(activeConfirmation.postponedAt), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                </span>
              </div>
            )}
          </div>
        )}
        <DialogHeader>
          <DialogTitle>Handlung bestätigen</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {target?.action.title || "Handlung"}
            {target?.action.scheduledTime && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">
                · Uhrzeit {target.action.scheduledTime}
              </span>
            )}
            {planned != null && (
              <span className="ml-2 text-xs">· geplant {planned} Min</span>
            )}
            {requiredPersons != null && (
              <span className="ml-2 text-xs">
                · {requiredPersons}{" "}
                {requiredPersons === 1 ? "Person" : "Personen"}
              </span>
            )}
          </DialogDescription>
          {description && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {description}
            </div>
          )}
          {requiredResources && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              <span className="font-medium text-foreground/80">Hilfsmittel:</span>{" "}
              {requiredResources}
            </div>
          )}
        </DialogHeader>

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
            />
          </div>
        )}

        {mode === "postponed" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Bisher geplant: {target?.dueDate ? format(parseISO(target.dueDate), "dd.MM.yyyy", { locale: de }) : "—"}
              {target?.action.scheduledTime ? `, ${target.action.scheduledTime}` : ""}. Die neue Planung muss später liegen.
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
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {target?.action.status !== "open" ? (
            <Button
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
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              onClick={submit}
              disabled={
                !mode ||
                (mode === "done_with_deviation" &&
                  ((hasPlannedMinutes && actualMinutes === "") || !reason.trim())) ||
                (mode === "not_done" && !reason.trim()) ||
                (mode === "postponed" && !postponedDate && !postponedTime) ||
                (showResult && resultRequired && !result.trim())
              }
            >
              Bestätigen
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      rows={compact ? 1 : 2}
      className={cn(
        "w-full resize-none bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 leading-relaxed",
        compact ? "text-xs min-h-0 py-0.5" : "text-sm min-h-0 py-1",
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
