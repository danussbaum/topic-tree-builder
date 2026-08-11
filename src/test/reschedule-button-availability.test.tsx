import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

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

const renderOutline = (selectedDate: string, topics = buildTopics(selectedDate)) =>
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate={selectedDate}
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

describe("Verfügbarkeit der Neuplanung in der Umsetzung", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T09:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lässt „Neu planen“ für einen Termin innerhalb einer Woche zu", () => {
    renderOutline("2026-05-08");

    expect(screen.getAllByRole("button", { name: "Neu planen" })[0]).toBeEnabled();
  });

  it("sperrt „Neu planen“, wenn der Termin mehr als eine Woche zurückliegt", () => {
    renderOutline("2026-05-03");

    expect(screen.getAllByRole("button", { name: "Neu planen" })[0]).toBeDisabled();
    // Die übrigen Umsetzungs-Varianten bleiben verfügbar.
    expect(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]).toBeEnabled();
  });

  it("misst die Frist am ursprünglichen Termin, nicht am Verschiebe-Datum", () => {
    // Ursprünglich am 02.05. geplant, verschoben auf den 14.05., heute ist der 11.05.
    // 02.05. + 7 = 09.05. liegt vor heute — die Zeile erscheint am 14.05., trotzdem ist
    // keine weitere Neuplanung möglich. Sonst liesse sich die Frist endlos verlängern.
    const topics = buildTopics("2026-05-02");
    topics[0].targets[0].actions[0].confirmations = {
      "2026-05-02": {
        status: "postponed",
        done: false,
        postponedToDate: "2026-05-14",
        postponedReason: "Klient war abwesend",
      },
    };

    renderOutline("2026-05-14", topics);

    // Am 14.05. stehen zwei Zeilen: die vom 02.05. verschobene und die regulär am 14.05. fällige.
    const postponedRow = screen.getByText(/Verschoben von 02\.05\.2026/).closest("tr");
    expect(postponedRow).not.toBeNull();
    expect(
      within(postponedRow as HTMLElement).getByRole("button", { name: "Neu planen" }),
    ).toBeDisabled();

    // Gegenprobe: die regulär am 14.05. fällige Zeile bleibt neu planbar.
    const plainRow = screen
      .getAllByRole("button", { name: "Neu planen" })
      .map((button) => button.closest("tr"))
      .find((row) => row !== postponedRow);
    expect(plainRow).toBeTruthy();
    expect(within(plainRow as HTMLElement).getByRole("button", { name: "Neu planen" })).toBeEnabled();
  });
});
