import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

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
          {
            id: "action-past-open",
            title: "Vergangene offene Handlung",
            notes: "",
            status: "open",
            done: false,
            validFrom: "2026-05-01",
            recurrence: "daily",
            plannedMinutes: 30,
          },
        ],
      },
    ],
  },
];

describe("AssessmentOutline confirmation actions", () => {
  it("opens the confirmation dialog for planned unconfirmed actions in the past", async () => {
    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="lastNDays"
        lastNDays={3}
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

    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Vergangene offene Handlung").length).toBeGreaterThan(0);
  });
});
