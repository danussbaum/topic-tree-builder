import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionNode, TopicNode } from "@/types/assessment";

const action = (
  title: string,
  dayPart: ActionNode["dayPart"],
  scheduledTime?: string,
): ActionNode => ({
  id: `action-${title}`,
  groupId: `grp-${title}`,
  title,
  notes: "",
  dayPart,
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
          action("Zweite ohne Uhrzeit", "morning"),
          action("Spät am Morgen", "morning", "09:45"),
          action("Erste ohne Uhrzeit", "morning"),
          action("Früh am Morgen", "morning", "07:05"),
          action("Am Nachmittag", "afternoon", "14:00"),
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
