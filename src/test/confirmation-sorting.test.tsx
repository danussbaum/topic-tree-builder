import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionNode, TopicNode } from "@/types/assessment";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";

const action = (
  title: string,
  dayPart: ActionNode["dayPart"],
  scheduledTime?: string,
): ActionNode => ({
  // Strikte Trennung: mit Uhrzeit wird die Tageszeit abgeleitet, nicht gesetzt.
  id: `action-${title}`,
  groupId: `grp-${title}`,
  title,
  notes: "",
  dayPart: scheduledTime ? undefined : dayPart,
  scheduledTime,
  plannedMinutes: 10,
  validFrom: "2026-05-01",
  recurrence: "daily",
  status: "open",
  done: false,
});

const topics: TopicNode[] = [
  {
    id: "topic-1",
    title: "Schwerpunkt",
    notes: "",
    targets: [
      {
        id: "target-1",
        title: "Ziel",
        notes: "",
        actions: [
          action("Zweite ohne Uhrzeit", DAY_PART_SEED_IDS.morning),
          action("Spät am Morgen", undefined, "09:45"),
          action("Erste ohne Uhrzeit", DAY_PART_SEED_IDS.morning),
          action("Früh am Morgen", undefined, "07:05"),
          action("Am Nachmittag", undefined, "14:00"),
        ],
      },
    ],
  },
];

describe("Umsetzung: Sortierung innerhalb der Tageszeit", () => {
  it("sortiert nach Uhrzeit, dann Handlungen ohne Uhrzeit, jeweils alphabetisch", () => {
    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="day"
        clientName="Test Klient"
        topics={topics}
        hideConfirmationHeader
        filterModel={{ statuses: ["open", "postponed"] }}
        onUpdateTopic={vi.fn()}
        onUpdateTarget={vi.fn()}
        onUpdateAction={vi.fn()}
        onUpdateActionField={vi.fn()}
        onConfirmAction={vi.fn()}
        onAddTarget={vi.fn()}
        onAddAction={vi.fn()}
        onAddTopic={vi.fn()}
        onDeleteTopic={vi.fn()}
        onDeleteTarget={vi.fn()}
        onDeleteAction={vi.fn()}
      />,
    );

    const titles = [
      "Früh am Morgen",
      "Spät am Morgen",
      "Erste ohne Uhrzeit",
      "Zweite ohne Uhrzeit",
      "Am Nachmittag",
    ];
    // Reihenfolge im DOM prüfen: jede Handlung steht vor der jeweils nächsten.
    const rendered = titles.map((title) => screen.getAllByText(title)[0]);
    for (let index = 0; index < rendered.length - 1; index += 1) {
      expect(
        rendered[index].compareDocumentPosition(rendered[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});

describe("Einordnung verschobener Nacht-Handlungen", () => {
  const nightTopics: TopicNode[] = [
    {
      id: "topic-1",
      title: "Schwerpunkt",
      notes: "",
      targets: [
        {
          id: "target-1",
          title: "Ziel",
          notes: "",
          actions: [
            {
              id: "act-2200",
              groupId: "grp-night",
              title: "Umlagern spaet",
              notes: "",
              status: "open",
              done: false,
              validFrom: "2026-08-01",
              recurrence: "daily",
              scheduledTime: "22:00",
            },
            {
              id: "act-0100",
              groupId: "grp-night",
              title: "Umlagern frueh",
              notes: "",
              status: "open",
              done: false,
              validFrom: "2026-08-01",
              recurrence: "daily",
              scheduledTime: "01:00",
            },
            {
              id: "act-morning",
              groupId: "grp-morning",
              title: "Koerperpflege",
              notes: "",
              status: "open",
              done: false,
              validFrom: "2026-08-01",
              recurrence: "daily",
              scheduledTime: "07:30",
            },
          ],
        },
      ],
    },
  ];

  it("zeigt den Vortags-Abschnitt vor dem Morgen und die eigene Nacht danach", () => {
    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-08-02"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="day"
        clientName="Test Klient"
        topics={nightTopics}
        hideConfirmationHeader
        filterModel={{ statuses: ["open", "postponed"] }}
        onUpdateTopic={vi.fn()}
        onUpdateTarget={vi.fn()}
        onUpdateAction={vi.fn()}
        onUpdateActionField={vi.fn()}
        onConfirmAction={vi.fn()}
        onAddTarget={vi.fn()}
        onAddAction={vi.fn()}
        onAddTopic={vi.fn()}
        onDeleteTopic={vi.fn()}
        onDeleteTarget={vi.fn()}
        onDeleteAction={vi.fn()}
      />,
    );

    const order = screen
      .getAllByText(/^(Nacht \(Vortag\)|Morgen|Nacht|Umlagern frueh|Umlagern spaet|Koerperpflege)$/)
      .map((el) => el.textContent);

    expect(order).toEqual([
      "Nacht (Vortag)",
      "Umlagern frueh",
      "Morgen",
      "Koerperpflege",
      "Nacht",
      "Umlagern spaet",
    ]);
  });
});
