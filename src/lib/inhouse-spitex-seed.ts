import type { ActionNode, DayPart, TopicNode } from "@/types/assessment";

const uid = () => Math.random().toString(36).slice(2, 10);

const SPITEX_SEED_START = "2026-08-01";

/**
 * Beispielplanung Inhouse-Spitex: Handlungen entsprechen den vorgeseedeten
 * Handlungsarten samt deren Hilfsmitteln und starten alle am selben Datum.
 */
export const buildInhouseSpitexSeedTopics = (): TopicNode[] => {
  const action = (
    title: string,
    fields: Partial<ActionNode> & { dayPart: DayPart; plannedMinutes: number },
  ): ActionNode => ({
    id: uid(),
    groupId: uid(),
    title,
    notes: "",
    requiredPersons: 1,
    validFrom: SPITEX_SEED_START,
    recurrence: "daily",
    status: "open",
    done: false,
    templateName: title,
    ...fields,
  });

  /**
   * Handlung, die mehrmals pro Tag durchgeführt wird: ein Knoten je Uhrzeit,
   * alle mit derselben groupId — genau die Struktur, die der Planungsdialog erzeugt.
   */
  const repeatedAction = (
    title: string,
    times: Array<{ dayPart: DayPart; scheduledTime: string }>,
    fields: Partial<ActionNode> & { plannedMinutes: number },
  ): ActionNode[] => {
    const groupId = uid();
    return times.map(({ dayPart, scheduledTime }) => ({
      ...action(title, { ...fields, dayPart, scheduledTime }),
      groupId,
    }));
  };

  return [
    {
      id: uid(),
      title: "Körperpflege und Selbstständigkeit",
      disciplineId: "discipline-inhouse-spitex",
      notes:
        "Erhalt der Selbstständigkeit bei der täglichen Körperpflege mit so wenig Unterstützung wie nötig.",
      targets: [
        {
          id: uid(),
          title: "Morgendliche Körperpflege selbstständig bewältigen",
          notes:
            "Herr Bachmann führt die Körperpflege mit Anleitung und Hilfsmitteln weitgehend selbst durch.",
          validFrom: SPITEX_SEED_START,
          actions: [
            action("10102 Ganzwäsche in Bad, Dusche oder am Lavabo", {
              dayPart: "morning",
              scheduledTime: "07:30",
              plannedMinutes: 40,
              category: "c",
              serviceEntries: [{ serviceType: "spitex-klv-c" }],
              resourceIds: [
                "resource-duschstuhl",
                "resource-duschrollstuhl",
                "resource-einmalwaschlappen",
              ],
            }),
            action("10112 Zahnpflege", {
              dayPart: "morning",
              scheduledTime: "08:15",
              plannedMinutes: 5,
              category: "c",
              serviceEntries: [{ serviceType: "spitex-klv-c" }],
              resourceIds: ["resource-zahnpflegeset"],
            }),
            action("10115 Kompressionsstrümpfe/-verband", {
              dayPart: "morning",
              scheduledTime: "08:30",
              plannedMinutes: 10,
              category: "b",
              serviceEntries: [{ serviceType: "spitex-klv-b" }],
              resourceIds: ["resource-kompressionsstruempfe", "resource-anziehhilfe"],
            }),
          ],
        },
        {
          id: uid(),
          title: "Nagel- und Hautpflege regelmässig sicherstellen",
          notes: "Kontrolle und Pflege alle zwei Wochen, Hautzustand wird dokumentiert.",
          validFrom: SPITEX_SEED_START,
          actions: [
            action("10109 Nägel schneiden Zehen", {
              dayPart: "afternoon",
              scheduledTime: "14:00",
              plannedMinutes: 15,
              category: "c",
              recurrence: "monthly",
              recurrenceMonthlyPattern: "first_monday",
              resultRequirement: "optional",
              serviceEntries: [{ serviceType: "spitex-klv-c" }],
              resourceIds: ["resource-nagelset"],
            }),
          ],
        },
      ],
    },
    {
      id: uid(),
      title: "Mobilität und Transfer",
      disciplineId: "discipline-inhouse-spitex",
      notes:
        "Sichere Transfers und tägliche Gehstrecken erhalten, Sturzrisiko möglichst tief halten.",
      targets: [
        {
          id: uid(),
          title: "Transfers sicher und ohne Sturz durchführen",
          notes:
            "Transfer erfolgt kinästhetisch angeleitet mit den vereinbarten Hilfsmitteln. "
            + "Zur Dekubitusprophylaxe wird Herr Bachmann nachts alle drei Stunden umgelagert.",
          validFrom: SPITEX_SEED_START,
          actions: [
            action("10503 Aufstehen oder Hinlegen mit Hilfe", {
              dayPart: "morning",
              scheduledTime: "07:15",
              plannedMinutes: 15,
              category: "c",
              serviceEntries: [{ serviceType: "spitex-klv-c" }],
              resourceIds: [
                "resource-rutschbrett",
                "resource-rutschtuch",
                "resource-drehscheibe",
                "resource-bettgalgen",
              ],
            }),
            // Umlagern zur Dekubitusprophylaxe: dreimal pro Nacht. 01:00 und 04:00
            // sind laut Rollover-Regel am Folgetag fällig, 22:00 am Planungstag.
            ...repeatedAction(
              "10501 Lagerung der Klientin im Bett",
              [
                { dayPart: "night", scheduledTime: "22:00" },
                { dayPart: "night", scheduledTime: "01:00" },
                { dayPart: "night", scheduledTime: "04:00" },
              ],
              {
                plannedMinutes: 10,
                category: "c",
                serviceEntries: [{ serviceType: "spitex-klv-c" }],
                resourceIds: [
                  "resource-lagerungskissen",
                  "resource-rutschtuch",
                  "resource-antidekubitus-matratze",
                ],
              },
            ),
          ],
        },
        {
          id: uid(),
          title: "Täglich mindestens 200 Meter gehen",
          notes: "Gehtraining im Flur, bei gutem Wetter im Garten.",
          validFrom: SPITEX_SEED_START,
          actions: [
            action("10505 Hilfe beim Gehen", {
              dayPart: "afternoon",
              scheduledTime: "15:30",
              plannedMinutes: 20,
              category: "b",
              recurrence: "weekly",
              recurrenceWeekdays: ["monday", "wednesday", "friday"],
              resultRequirement: "required",
              serviceEntries: [{ serviceType: "spitex-klv-b" }],
              resourceIds: ["resource-rollator", "resource-gehstock"],
            }),
          ],
        },
      ],
    },
    {
      id: uid(),
      title: "Wundversorgung Unterschenkel",
      disciplineId: "discipline-inhouse-spitex",
      notes: "Versorgung des Ulcus am rechten Unterschenkel bis zur Abheilung.",
      targets: [
        {
          id: uid(),
          title: "Wunde heilt reizlos ab",
          notes: "Wundgrösse und Exsudat werden bei jedem Verbandwechsel dokumentiert.",
          validFrom: SPITEX_SEED_START,
          actions: [
            action("10702 Mittlerer Verband", {
              dayPart: "morning",
              scheduledTime: "09:00",
              plannedMinutes: 20,
              category: "b",
              recurrence: "weekly",
              recurrenceWeekdays: ["monday", "thursday"],
              resultRequirement: "required",
              serviceEntries: [{ serviceType: "spitex-klv-b" }],
              optionalServiceTypes: ["material-tape-1m"],
              resourceIds: [
                "resource-verbandmaterial-mittel",
                "resource-wundauflage-steril",
                "resource-kompressen",
                "resource-fixierbinde",
                "resource-einmalhandschuhe",
                "resource-desinfektionsmittel",
              ],
            }),
            action("10801 Gesundheitskontrolle (Vitalparameter)", {
              dayPart: "morning",
              scheduledTime: "09:30",
              plannedMinutes: 10,
              category: "b",
              resultRequirement: "required",
              serviceEntries: [{ serviceType: "spitex-klv-b" }],
            }),
          ],
        },
      ],
    },
  ];
};
