import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";
import { isFutureConfirmationDate } from "@/lib/confirmation-window";

const buildTopics = (validFrom: string): TopicNode[] => [
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
            id: "action-1",
            title: "Offene Handlung",
            notes: "",
            status: "open",
            done: false,
            validFrom,
            recurrence: "daily",
            plannedMinutes: 30,
          },
        ],
      },
    ],
  },
];

const renderOutline = (selectedDate: string) =>
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate={selectedDate}
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={buildTopics(selectedDate)}
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

const buttons = () => {
  const row = screen.getByText("Offene Handlung").closest("tr")!;
  return {
    planned: within(row).getByLabelText("Erledigt wie geplant"),
    deviation: within(row).getByLabelText("Erledigt mit Abweichung"),
    notDone: within(row).getByLabelText("Nicht durchgeführt"),
    reschedule: within(row).getByLabelText("Neu planen"),
  };
};

describe("Bestätigung zukünftiger Handlungen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T10:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prüft nur tagesgenau", () => {
    expect(isFutureConfirmationDate("2026-08-19", "2026-08-19")).toBe(false);
    expect(isFutureConfirmationDate("2026-08-18", "2026-08-19")).toBe(false);
    expect(isFutureConfirmationDate("2026-08-20", "2026-08-19")).toBe(true);
  });

  it("sperrt Bestätigungen für morgen, lässt die Neuplanung aber zu", () => {
    renderOutline("2026-08-20");
    const b = buttons();
    expect(b.planned).toBeDisabled();
    expect(b.deviation).toBeDisabled();
    expect(b.notDone).toBeDisabled();
    expect(b.reschedule).not.toBeDisabled();
  });

  it("erlaubt am selben Tag alle Bestätigungen", () => {
    renderOutline("2026-08-19");
    const b = buttons();
    expect(b.planned).not.toBeDisabled();
    expect(b.deviation).not.toBeDisabled();
    expect(b.notDone).not.toBeDisabled();
    expect(b.reschedule).not.toBeDisabled();
  });
});
