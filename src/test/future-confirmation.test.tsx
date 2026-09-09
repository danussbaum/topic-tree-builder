import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionNode, TopicNode } from "@/types/assessment";
import type { ScheduledAction } from "@/lib/day-part-rollover";
import { getConfirmationStart, isBeforeConfirmationStart } from "@/lib/confirmation-window";
import { initialDayParts } from "@/lib/day-parts";

const buildTopics = (validFrom: string, schedule: ScheduledAction = {}): TopicNode[] => [
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
            ...schedule,
          },
        ],
      },
    ],
  },
];

const renderOutline = (selectedDate: string, schedule: ScheduledAction = {}) =>
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate={selectedDate}
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={buildTopics(selectedDate, schedule)}
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

  const at = (iso: string) => new Date(iso);
  const timing = (dueDate: string, action: Partial<ActionNode>, postponedToTime?: string) => ({
    dueDate,
    action: action as ActionNode,
    confirmation: postponedToTime ? { postponedToTime } : undefined,
  });

  it("sperrt bis zur geplanten Uhrzeit und danach nie mehr", () => {
    const evening = timing("2026-08-19", { scheduledTime: "22:00" });
    expect(isBeforeConfirmationStart(evening, at("2026-08-19T10:00:00"))).toBe(true);
    expect(isBeforeConfirmationStart(evening, at("2026-08-19T21:59:59"))).toBe(true);
    expect(isBeforeConfirmationStart(evening, at("2026-08-19T22:00:00"))).toBe(false);
    // Später erfassen ist zeitlich unbeschränkt.
    expect(isBeforeConfirmationStart(timing("2026-08-18", { scheduledTime: "22:00" }), at("2026-08-19T10:00:00"))).toBe(false);
  });

  it("nimmt im Tageszeit-Modus die Von-Zeit der Zeitspanne", () => {
    const morning = initialDayParts.find((part) => part.title === "Morgen")!;
    const row = timing("2026-08-19", { dayPart: morning.id });
    expect(getConfirmationStart(row)).toEqual(new Date(`2026-08-19T${morning.from}:00`));
    expect(isBeforeConfirmationStart(row, at("2026-08-19T05:00:00"))).toBe(true);
    expect(isBeforeConfirmationStart(row, at(`2026-08-19T${morning.from}:00`))).toBe(false);
  });

  it("lässt Handlungen ohne Zeitangabe ab Tagesbeginn zu", () => {
    const row = timing("2026-08-19", {});
    expect(getConfirmationStart(row)).toEqual(new Date("2026-08-19T00:00:00"));
    expect(isBeforeConfirmationStart(row, at("2026-08-19T00:00:00"))).toBe(false);
    expect(isBeforeConfirmationStart(row, at("2026-08-18T23:59:59"))).toBe(true);
  });

  it("misst verschobene Nacht-Handlungen am Folgetag", () => {
    // 01:00 gehört fachlich zum Vortag, kalendarisch zum Folgetag (dueDate).
    const row = timing("2026-08-20", { scheduledTime: "01:00" });
    expect(isBeforeConfirmationStart(row, at("2026-08-19T23:00:00"))).toBe(true);
    expect(isBeforeConfirmationStart(row, at("2026-08-20T01:00:00"))).toBe(false);
  });

  it("nimmt bei einer Neuplanung die neue Uhrzeit", () => {
    const row = timing("2026-08-19", { scheduledTime: "08:00" }, "20:00");
    expect(isBeforeConfirmationStart(row, at("2026-08-19T10:00:00"))).toBe(true);
    expect(isBeforeConfirmationStart(row, at("2026-08-19T20:00:00"))).toBe(false);
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

  it("sperrt eine Uhrzeit später am heutigen Tag und gibt sie danach frei", () => {
    const { unmount } = renderOutline("2026-08-19", { scheduledTime: "22:00" });
    const before = buttons();
    expect(before.planned).toBeDisabled();
    expect(before.deviation).toBeDisabled();
    expect(before.notDone).toBeDisabled();
    expect(before.reschedule).not.toBeDisabled();
    unmount();

    vi.setSystemTime(new Date("2026-08-19T22:00:00"));
    renderOutline("2026-08-19", { scheduledTime: "22:00" });
    const after = buttons();
    expect(after.planned).not.toBeDisabled();
    expect(after.deviation).not.toBeDisabled();
    expect(after.notDone).not.toBeDisabled();
  });
});
