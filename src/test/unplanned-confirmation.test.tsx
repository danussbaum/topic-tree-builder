import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline, UnplannedActionDialog } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

const topicsWith = (isUnplanned: boolean, requiredPersons?: number): TopicNode[] => [
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
            title: "Spontane Begleitung",
            notes: "",
            status: "open",
            done: false,
            validFrom: "2026-05-12",
            validTo: "2026-05-12",
            recurrence: "daily",
            plannedMinutes: isUnplanned ? 0 : 30,
            requiredPersons,
            isUnplanned: isUnplanned || undefined,
          },
        ],
      },
    ],
  },
];

const renderOutline = (isUnplanned: boolean, requiredPersons?: number) => {
  const onConfirmAction = vi.fn();
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={topicsWith(isUnplanned, requiredPersons)}
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
      onUpdateActionGroup={vi.fn()}
      onReactivateTarget={vi.fn()}
      onDeleteActionGroup={vi.fn()}
    />,
  );
  return { onConfirmAction };
};

describe("Ungeplante Handlungen ohne geplante Zeit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("bietet im Erfassen-Dialog keine geplante Zeit an", async () => {
    render(
      <UnplannedActionDialog
        target={{ dueDate: "2026-05-12", dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.queryByText("Geplante Minuten")).not.toBeInTheDocument();
  });

  it("lässt ohne geplante Dauer beide Erledigt-Varianten zu", () => {
    renderOutline(true);

    expect(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]).toBeEnabled();
  });

  it("lässt „Erledigt wie geplant“ bei einer geplanten Handlung zu", () => {
    renderOutline(false);

    expect(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]).toBeEnabled();
  });

  it("verlangt bei Abweichung ohne geplante Dauer keine tatsächlichen Minuten", async () => {
    renderOutline(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]);

    const dialog = within(await screen.findByRole("dialog"));
    // Ohne geplante Dauer fehlt der Vergleichswert — kein Minutenfeld.
    expect(dialog.queryByLabelText("Tatsächliche Minuten")).not.toBeInTheDocument();

    fireEvent.change(dialog.getByLabelText("Begründung"), { target: { value: "Spontan nötig" } });
    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeEnabled();
  });

  it("verlangt bei Abweichung mit geplanter Dauer die tatsächlichen Minuten", async () => {
    renderOutline(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]);

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByLabelText("Tatsächliche Minuten")).toBeInTheDocument();

    fireEvent.change(dialog.getByLabelText("Begründung"), { target: { value: "Länger gedauert" } });
    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeDisabled();

    fireEvent.change(dialog.getByLabelText("Tatsächliche Minuten"), { target: { value: "45" } });
    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeEnabled();
  });
});

describe("Anzahl Personen bei Abweichung", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("bietet die Anzahl Personen nur an, wenn die Handlung eine vorsieht", async () => {
    renderOutline(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]);

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.queryByLabelText("Tatsächliche Anzahl Personen")).not.toBeInTheDocument();
  });

  it("belegt die Anzahl Personen mit der geplanten vor und übernimmt die Änderung", async () => {
    const { onConfirmAction } = renderOutline(false, 2);
    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]);

    const dialog = within(await screen.findByRole("dialog"));
    const personsInput = dialog.getByLabelText("Tatsächliche Anzahl Personen");
    expect(personsInput).toHaveValue(2);

    fireEvent.change(dialog.getByLabelText("Tatsächliche Minuten"), { target: { value: "45" } });
    fireEvent.change(dialog.getByLabelText("Begründung"), { target: { value: "Zweite Person nötig" } });
    fireEvent.change(personsInput, { target: { value: "3" } });
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    expect(onConfirmAction).toHaveBeenCalledWith(
      "topic-1",
      "target-1",
      "action-1",
      expect.objectContaining({ status: "done_with_deviation", actualMinutes: 45, actualPersons: 3 }),
      expect.any(String),
    );
  });

  it("blockiert das Bestätigen, solange die Anzahl Personen leer ist", async () => {
    renderOutline(false, 2);
    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]);

    const dialog = within(await screen.findByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Tatsächliche Minuten"), { target: { value: "45" } });
    fireEvent.change(dialog.getByLabelText("Begründung"), { target: { value: "Zweite Person nötig" } });
    fireEvent.change(dialog.getByLabelText("Tatsächliche Anzahl Personen"), { target: { value: "" } });

    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeDisabled();
  });
});
