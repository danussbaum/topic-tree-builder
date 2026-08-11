import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionServiceType, TopicNode } from "@/types/assessment";

const buildTopics = (optionalServiceTypes?: ActionServiceType[]): TopicNode[] => [
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
            groupId: "group-1",
            title: "Physiotherapie",
            notes: "",
            status: "open",
            done: false,
            validFrom: "2026-05-12",
            validTo: "2026-05-12",
            recurrence: "daily",
            plannedMinutes: 30,
            optionalServiceTypes,
          },
        ],
      },
    ],
  },
];

const renderOutline = (topics: TopicNode[], onConfirmAction = vi.fn()) => {
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
      onConfirmAction={onConfirmAction}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onAddTopic={vi.fn()}
      onDeleteTopic={vi.fn()}
      onDeleteTarget={vi.fn()}
      onDeleteAction={vi.fn()}
    />,
  );
  return onConfirmAction;
};

describe("Optionale Leistungen beim Bestätigen", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("zeigt ohne hinterlegte optionale Leistungsarten nichts an — auch keine Überschrift", async () => {
    renderOutline(buildTopics());

    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]);
    const dialog = within(await screen.findByRole("dialog"));

    expect(dialog.queryByText("Optionale Leistungen")).not.toBeInTheDocument();
  });

  it("speichert die erfassten Anzahlen mit der Bestätigung", async () => {
    const onConfirmAction = renderOutline(
      buildTopics(["material-tape-1m", "zuschlag-physio"]),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]);
    const dialog = within(await screen.findByRole("dialog"));

    expect(dialog.getByText("Optionale Leistungen")).toBeInTheDocument();

    // Anzahl-Feld steht links vom Text der Leistungsart (liest sich als «Anzahl × Leistungsart»).
    const quantityInput = dialog.getByLabelText("Verbrauchsmaterial Tape 1m");
    const label = dialog.getByText("Verbrauchsmaterial Tape 1m");
    expect(quantityInput.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Dezimalwerte sind erlaubt (z. B. 2,5 m Tape).
    fireEvent.change(quantityInput, { target: { value: "2.5" } });
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    expect(onConfirmAction).toHaveBeenCalledWith(
      "topic-1",
      "target-1",
      "action-1",
      expect.objectContaining({
        status: "done_as_planned",
        // "Zuschlag Physio" blieb leer und wird nicht mitgespeichert.
        optionalServices: [{ serviceType: "material-tape-1m", quantity: 2.5 }],
      }),
      "2026-05-12",
    );
  });

  it("lässt leere Anzahlen weg, statt Nullwerte zu speichern", async () => {
    const onConfirmAction = renderOutline(buildTopics(["zuschlag-physio"]));

    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]);
    const dialog = within(await screen.findByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    const payload = onConfirmAction.mock.calls[0][3];
    expect(payload.optionalServices).toBeUndefined();
  });

  it("blendet die optionalen Leistungen bei „Nicht durchgeführt“ und „Neu planen“ aus", async () => {
    renderOutline(buildTopics(["zuschlag-physio"]));

    fireEvent.click(screen.getAllByRole("button", { name: "Nicht durchgeführt" })[0]);
    const notDoneDialog = within(await screen.findByRole("dialog"));
    expect(notDoneDialog.queryByText("Optionale Leistungen")).not.toBeInTheDocument();
  });
});
