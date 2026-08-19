import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

const DATE = "2026-08-19";

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
            id: "action-frei",
            title: "Handlung ohne Resultatpflicht",
            notes: "",
            status: "open",
            done: false,
            validFrom: DATE,
            recurrence: "daily",
            plannedMinutes: 30,
          },
          {
            id: "action-pflicht",
            title: "Handlung mit Resultatpflicht",
            notes: "",
            status: "open",
            done: false,
            validFrom: DATE,
            recurrence: "daily",
            plannedMinutes: 30,
            resultRequirement: "required",
          },
        ],
      },
    ],
  },
];

const renderOutline = (mode: "notDone" | "done") =>
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate={DATE}
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={topics}
      hideConfirmationHeader
      filterModel={{ statuses: ["open", "postponed"] }}
      bulkNotDoneMode={mode === "notDone"}
      onBulkNotDoneModeChange={vi.fn()}
      bulkDoneAsPlannedMode={mode === "done"}
      onBulkDoneAsPlannedModeChange={vi.fn()}
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

const checkbox = (title: string) => {
  const row = screen.getByText(title).closest("tr")!;
  return within(row).getByLabelText(`Handlung ${title} für Mehrfachbestätigung auswählen`);
};

describe("Zwingendes Resultat in der Mehrfachauswahl", () => {
  beforeEach(() => window.localStorage.clear());

  it("sperrt «erledigt wie geplant» für Handlungen mit Resultatpflicht", () => {
    renderOutline("done");
    expect(checkbox("Handlung ohne Resultatpflicht")).not.toBeDisabled();
    expect(checkbox("Handlung mit Resultatpflicht")).toBeDisabled();
  });

  it("nimmt sie auch über «alle auswählen» nicht auf", () => {
    renderOutline("done");
    fireEvent.click(screen.getByLabelText("Alle offenen Handlungen für Mehrfachbestätigung auswählen"));
    expect(screen.getByText("1 ausgewählt")).toBeInTheDocument();
    expect(checkbox("Handlung mit Resultatpflicht")).not.toBeChecked();
  });

  it("lässt «nicht durchgeführt» weiterhin zu", () => {
    renderOutline("notDone");
    expect(checkbox("Handlung mit Resultatpflicht")).not.toBeDisabled();
    fireEvent.click(screen.getByLabelText("Alle offenen Handlungen für Mehrfachbestätigung auswählen"));
    expect(screen.getByText("2 ausgewählt")).toBeInTheDocument();
  });
});
