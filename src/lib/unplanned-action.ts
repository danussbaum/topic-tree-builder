import type {
  ActionNode,
  Client,
  TopicNode,
  ActionServiceEntry,
  ActionServiceType,
  ConfirmedOptionalService,
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
  resourceIds?: string[];
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
  templateRequiredFields?: string[];
  /** Tageszeit-ID oder "none" */
  dayPart?: string | "none";
  dateFrom?: string;
  dateTo?: string;
}

/** Stabile Sentinel-IDs des virtuellen Themas/Ziels der ungeplanten Handlungen. */
export const UNPLANNED_TOPIC_ID = "__unplanned__";
export const UNPLANNED_TARGET_ID = "__unplanned__";
export const UNPLANNED_TOPIC_TITLE = "Ungeplante Handlungen";
export const UNPLANNED_TARGET_TITLE = "Direkt in der Umsetzung erfasst";

export const isUnplannedTopicId = (topicId: string) => topicId === UNPLANNED_TOPIC_ID;

/**
 * Ungeplante Handlungen liegen direkt am Klienten. Die Umsetzungs-Pipelines erwarten
 * pro Zeile aber ein Thema und ein Ziel, darum wird zur Laufzeit ein virtuelles
 * Thema/Ziel davorgehängt. Bewusst ohne validTo, damit der Abschluss-Filter der
 * Umsetzung sie nicht ausblendet, und ohne Disziplin, weil eine ungeplante Handlung
 * keinem Schwerpunkt und damit keiner Disziplin zugeordnet ist.
 */
export const buildUnplannedTopic = (client: Client): TopicNode => ({
  id: UNPLANNED_TOPIC_ID,
  title: UNPLANNED_TOPIC_TITLE,
  notes: "",
  targets: [
    {
      id: UNPLANNED_TARGET_ID,
      title: UNPLANNED_TARGET_TITLE,
      notes: "",
      actions: client.unplannedActions ?? [],
    },
  ],
});

/**
 * Baut aus einem Draft die ungeplanten Handlungen — je eine ActionNode pro Tag
 * im Von-Bis-Bereich, jede mit eigener groupId.
 *
 * dayPart-Auflösung: draft.dayPart ist im Chip-Selektor-Modus "none" (die echten
 * Tageszeiten kommen pro Eintrag als dayPart-Argument). "none" gilt daher als
 * "nicht gesetzt", damit das übergebene dayPart greift.
 */
export const buildUnplannedActionNodes = (
  dayPart: string | "none",
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
    // Der Status wird pro Termin aus der Bestaetigung abgeleitet; hier steht der Startwert.
    status: "open",
    done: false,
    title: draft.title,
    notes: draft.notes,
    requiredResources: draft.requiredResources,
    resourceIds: draft.resourceIds,
    // Ungeplante Handlungen haben keine geplante Zeit. Fix 0, damit die Auswertung die
    // Differenz zur tatsächlich erfassten Zeit ausweisen kann.
    plannedMinutes: 0,
    requiredPersons: draft.requiredPersons,
    resultRequirement: draft.resultRequirement,
    // Strikte Trennung: mit Uhrzeit wird die Tageszeit abgeleitet, nicht gespeichert.
    dayPart:
      draft.scheduledTime?.trim() || selectedDayPart === "none" ? undefined : selectedDayPart,
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
