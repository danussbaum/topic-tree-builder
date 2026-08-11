import type {
  ActionNode,
  ActionServiceEntry,
  ActionServiceType,
  ConfirmedOptionalService,
  DayPart,
} from "@/types/assessment";

const uid = () => Math.random().toString(36).slice(2, 10);

const dateToISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface UnplannedActionDraft {
  title: string;
  notes: string;
  requiredResources?: string;
  plannedMinutes?: number;
  requiredPersons?: number;
  resultRequirement?: ActionNode["resultRequirement"];
  scheduledTime?: string;
  category?: ActionNode["category"];
  serviceEntries?: ActionServiceEntry[];
  optionalServiceTypes?: ActionServiceType[];
  optionalServices?: ConfirmedOptionalService[];
  templateId?: string;
  templateName?: string;
  templateLockedFields?: string[];
  dayPart?: DayPart | "none";
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Baut aus einem Draft die ungeplanten Handlungen — je eine ActionNode pro Tag
 * im Von-Bis-Bereich, jede mit eigener groupId.
 *
 * dayPart-Auflösung: draft.dayPart ist im Chip-Selektor-Modus "none" (die echten
 * Tageszeiten kommen pro Eintrag als dayPart-Argument). "none" gilt daher als
 * "nicht gesetzt", damit das übergebene dayPart greift.
 */
export const buildUnplannedActionNodes = (
  dayPart: DayPart | "none",
  draft: UnplannedActionDraft,
  dueDate: string,
): ActionNode[] => {
  const selectedDayPart = (draft.dayPart && draft.dayPart !== "none") ? draft.dayPart : dayPart;

  // Datumsbereich expandieren: eine ActionNode pro Tag.
  const dateFrom = (draft.dateFrom && draft.dateFrom !== "") ? draft.dateFrom : dueDate;
  const dateTo = (draft.dateTo && draft.dateTo !== "") ? draft.dateTo : dateFrom;
  const dates: string[] = [];
  for (let d = new Date(`${dateFrom}T00:00:00`); d <= new Date(`${dateTo}T00:00:00`); d.setDate(d.getDate() + 1)) {
    dates.push(dateToISO(d));
  }
  if (dates.length === 0) dates.push(dateFrom || dueDate);

  return dates.map((date): ActionNode => ({
    id: uid(),
    groupId: uid(),
    title: draft.title,
    notes: draft.notes,
    requiredResources: draft.requiredResources,
    // Ungeplante Handlungen haben keine geplante Zeit. Fix 0, damit die Auswertung die
    // Differenz zur tatsächlich erfassten Zeit ausweisen kann.
    plannedMinutes: 0,
    requiredPersons: draft.requiredPersons,
    resultRequirement: draft.resultRequirement,
    dayPart: selectedDayPart === "none" ? undefined : selectedDayPart,
    scheduledTime: draft.scheduledTime,
    category: draft.category,
    serviceEntries: draft.serviceEntries,
    optionalServiceTypes: draft.optionalServiceTypes,
    optionalServices: draft.optionalServices,
    validFrom: date,
    validTo: date,
    recurrence: "daily",
    isUnplanned: true,
    templateId: draft.templateId,
    templateName: draft.templateName,
    templateLockedFields: draft.templateLockedFields,
  }));
};
