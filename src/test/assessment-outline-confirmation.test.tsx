import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline, UnplannedActionDialog } from "@/components/assessment/AssessmentOutline";
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
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("allows confirming category A actions for the simulated Inhouse-Spitex A role", async () => {
    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="lastNDays"
        lastNDays={3}
        clientName="Test Klient"
        topics={[
          {
            ...topics[0],
            targets: [
              {
                ...topics[0].targets[0],
                actions: [
                  {
                    ...topics[0].targets[0].actions[0],
                    category: "a",
                  },
                ],
              },
            ],
          },
        ]}
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
  });
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
  it("hides bulk not-done controls until the bulk mode is active", () => {
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

    expect(
      screen.queryByRole("button", { name: /Ausgewählte als „Nicht durchgeführt“ bestätigen/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", {
        name: /Handlung Vergangene offene Handlung für Mehrfachbestätigung auswählen/,
      }),
    ).not.toBeInTheDocument();
  });

  it("allows leaving the bulk not-done mode without changing the view", () => {
    const onBulkNotDoneModeChange = vi.fn();

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
        bulkNotDoneMode
        onBulkNotDoneModeChange={onBulkNotDoneModeChange}
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

    fireEvent.click(screen.getByRole("button", { name: "Mehrfachauswahl beenden" }));

    expect(onBulkNotDoneModeChange).toHaveBeenCalledWith(false);
  });

  it("confirms multiple selected actions as not done with one shared reason and leaves bulk mode", async () => {
    const onConfirmAction = vi.fn();
    const onBulkNotDoneModeChange = vi.fn();

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
        bulkNotDoneMode
        onBulkNotDoneModeChange={onBulkNotDoneModeChange}
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

    const rowCheckboxes = screen.getAllByRole("checkbox", {
      name: /Handlung Vergangene offene Handlung für Mehrfachbestätigung auswählen/,
    });
    fireEvent.click(rowCheckboxes[0]);
    fireEvent.click(rowCheckboxes[1]);

    fireEvent.click(screen.getByRole("button", { name: /Ausgewählte als „Nicht durchgeführt“ bestätigen/ }));

    const reasonInput = await screen.findByLabelText("Begründung");
    fireEvent.change(reasonInput, { target: { value: "Klient war abwesend" } });
    fireEvent.click(screen.getByRole("button", { name: /2 als „Nicht durchgeführt“ bestätigen/ }));

    expect(onConfirmAction).toHaveBeenCalledTimes(2);
    expect(onConfirmAction).toHaveBeenNthCalledWith(
      1,
      "topic-1",
      "target-1",
      "action-past-open",
      { status: "not_done", reason: "Klient war abwesend" },
      expect.any(String),
    );
    expect(onConfirmAction).toHaveBeenNthCalledWith(
      2,
      "topic-1",
      "target-1",
      "action-past-open",
      { status: "not_done", reason: "Klient war abwesend" },
      expect.any(String),
    );
    expect(onBulkNotDoneModeChange).toHaveBeenCalledWith(false);
  });

  it("opens unplanned template creation without a preselected template or visible title field", async () => {
    const onAddUnplannedAction = vi.fn();

    render(
      <UnplannedActionDialog
        target={{ dueDate: "2026-05-12", dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={onAddUnplannedAction}
      />,
    );

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).queryByText("Morgenroutine")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Titel")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Bestätigen" })).toBeDisabled();
  });

  it("uses the selected template name as title for unplanned template actions", async () => {
    const onAddUnplannedAction = vi.fn();

    render(
      <UnplannedActionDialog
        target={{ dueDate: "2026-05-12", dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={onAddUnplannedAction}
      />,
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByPlaceholderText("Vorlagen suchen..."), { target: { value: "Morg" } });
    fireEvent.click(await within(dialog).findByText("Morgenroutine"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));

    expect(onAddUnplannedAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Morgenroutine",
        templateName: "Morgenroutine",
      }),
    );
  });

  it("keeps a newly created confirmed unplanned action visible while the unconfirmed filter is active", () => {
    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="day"
        clientName="Test Klient"
        topics={[
          {
            id: "topic-unplanned",
            title: "Ungeplante Handlungen",
            notes: "",
            targets: [
              {
                id: "target-unplanned",
                title: "Direkt in der Umsetzung erfasst",
                notes: "",
                actions: [
                  {
                    id: "unplanned-confirmed",
                    title: "Spontane Begleitung",
                    notes: "",
                    status: "done_as_planned",
                    done: true,
                    validFrom: "2026-05-12",
                    validTo: "2026-05-12",
                    recurrence: "daily",
                    isUnplanned: true,
                    confirmations: {
                      "2026-05-12": {
                        status: "done_as_planned",
                        done: true,
                        actualMinutes: 20,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ]}
        hideConfirmationHeader
        filterModel={{ statuses: ["open", "postponed"] }}
        transientUnplannedActionIds={new Set(["unplanned-confirmed"])}
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

    expect(screen.getByText("Spontane Begleitung")).toBeInTheDocument();
  });

  it("allows deleting a confirmed unplanned action from the confirmation dialog", async () => {
    const onDeleteAction = vi.fn();

    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="day"
        clientName="Test Klient"
        topics={[
          {
            id: "topic-unplanned",
            title: "Ungeplante Handlungen",
            notes: "",
            targets: [
              {
                id: "target-unplanned",
                title: "Direkt in der Umsetzung erfasst",
                notes: "",
                actions: [
                  {
                    id: "unplanned-confirmed",
                    title: "Spontane Begleitung",
                    notes: "",
                    status: "done_as_planned",
                    done: true,
                    validFrom: "2026-05-12",
                    validTo: "2026-05-12",
                    recurrence: "daily",
                    isUnplanned: true,
                    confirmations: {
                      "2026-05-12": {
                        status: "done_as_planned",
                        done: true,
                        actualMinutes: 20,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ]}
        hideConfirmationHeader
        filterModel={{ statuses: ["done_as_planned"] }}
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
        onDeleteAction={onDeleteAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Umsetzung bearbeiten" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    expect(onDeleteAction).toHaveBeenCalledWith(
      "topic-unplanned",
      "target-unplanned",
      "unplanned-confirmed",
    );
  });

});
