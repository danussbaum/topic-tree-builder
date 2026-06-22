import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline, UnplannedActionDialog } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";
import {
  ACTION_PLAN_TEMPLATES_STORAGE_KEY,
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
} from "@/lib/action-plan-templates";

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

  it("sperrt die Kategorie im ungeplanten Vorlagendialog, wenn die Vorlage Kategorie nicht veränderbar setzt", async () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "tpl-locked-category",
          name: "Kategorie gesperrt",
          disciplineIds: [],
          fields: {
            ...buildDefaultTemplateFields(),
            beschreibung: "Fixe Beschreibung",
            hilfsmittel: "Fixes Hilfsmittel",
            dauer: "25",
            personen: "2",
            kategorie: "b",
            tageszeit: "morning",
            uhrzeit: "08:15",
            resultat: "required",
          },
          editable: {
            ...buildDefaultTemplateEditable(true),
            beschreibung: false,
            hilfsmittel: false,
            dauer: false,
            personen: false,
            kategorie: false,
            tageszeit: false,
            uhrzeit: false,
            resultat: false,
          },
        },
      ]),
    );

    render(
      <UnplannedActionDialog
        target={{ dueDate: "2026-05-12", dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByPlaceholderText("Vorlagen suchen..."), { target: { value: "Kat" } });
    fireEvent.click(await within(dialog).findByText("Kategorie gesperrt"));

    expect(within(dialog).getByLabelText("Beschreibung")).toBeDisabled();
    expect(within(dialog).getByLabelText("Hilfsmittel")).toBeDisabled();
    expect(within(dialog).getByRole("combobox", { name: "Tageszeit" })).toBeDisabled();
    expect(within(dialog).getByLabelText("Uhrzeit")).toBeDisabled();
    expect(within(dialog).getByLabelText("Geplante Minuten")).toBeDisabled();
    expect(within(dialog).getByLabelText("Anz. Personen")).toBeDisabled();
    expect(within(dialog).getByRole("combobox", { name: "Klassifizierung" })).toBeDisabled();
    expect(within(dialog).getByRole("combobox", { name: "Resultat" })).toBeDisabled();
  });

  it("deaktiviert alle gesperrten Vorlagenfelder in der Planung", () => {
    const onUpdateActionField = vi.fn();
    const lockedTopics: TopicNode[] = [
      {
        id: "topic-locked",
        title: "Schwerpunkt",
        notes: "",
        targets: [
          {
            id: "target-locked",
            title: "Ziel",
            notes: "",
            actions: [
              {
                id: "action-locked-monthly",
                title: "Gesperrte Vorlage",
                notes: "Fixe Beschreibung",
                requiredResources: "Fixes Hilfsmittel",
                status: "open",
                done: false,
                validFrom: "2026-05-01",
                recurrence: "monthly",
                recurrenceMonthlyPattern: "first_day",
                category: "b",
                dayPart: "morning",
                scheduledTime: "08:15",
                plannedMinutes: 25,
                requiredPersons: 2,
                resultRequirement: "required",
                templateLockedFields: [
                  "title",
                  "notes",
                  "requiredResources",
                  "category",
                  "dayPart",
                  "scheduledTime",
                  "plannedMinutes",
                  "requiredPersons",
                  "resultRequirement",
                  "recurrence",
                  "recurrenceMonthlyPattern",
                ],
              },
              {
                id: "action-locked-weekly",
                title: "Gesperrte Wochentage",
                notes: "",
                status: "open",
                done: false,
                validFrom: "2026-05-01",
                recurrence: "weekly",
                recurrenceWeekdays: ["monday"],
                templateLockedFields: ["recurrenceWeekdays"],
              },
            ],
          },
        ],
      },
    ];

    render(
      <AssessmentOutline
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        clientName="Test Klient"
        topics={lockedTopics}
        hideConfirmationHeader
        onUpdateTopic={vi.fn()}
        onUpdateTarget={vi.fn()}
        onUpdateAction={vi.fn()}
        onUpdateActionField={onUpdateActionField}
        onConfirmAction={vi.fn()}
        onAddTarget={vi.fn()}
        onAddAction={vi.fn()}
        onAddTopic={vi.fn()}
        onDeleteTopic={vi.fn()}
        onDeleteTarget={vi.fn()}
        onDeleteAction={vi.fn()}
        viewMode="planning"
      />,
    );

    const monthlyAction = screen.getByDisplayValue("Gesperrte Vorlage").closest("li");
    expect(monthlyAction).not.toBeNull();
    const monthlyScope = within(monthlyAction as HTMLElement);

    expect(monthlyScope.getByDisplayValue("Gesperrte Vorlage")).toHaveAttribute("readonly");
    expect(monthlyScope.getByPlaceholderText("Beschreibung zur Handlung...")).toBeDisabled();
    expect(monthlyScope.getByPlaceholderText("Hilfsmittel zur Durchführung...")).toBeDisabled();
    expect(monthlyScope.getByRole("combobox", { name: "Klassifizierung" })).toBeDisabled();
    expect(monthlyScope.getByRole("combobox", { name: "Tageszeit" })).toBeDisabled();
    expect(monthlyScope.getByLabelText("Uhrzeit")).toBeDisabled();
    expect(monthlyScope.getByDisplayValue("25")).toBeDisabled();
    expect(monthlyScope.getByDisplayValue("2")).toBeDisabled();
    expect(monthlyScope.getByRole("combobox", { name: "Resultat" })).toBeDisabled();
    expect(monthlyScope.getByRole("combobox", { name: "Wiederholung" })).toBeDisabled();
    expect(monthlyScope.getByRole("combobox", { name: "Monatliche Regel" })).toBeDisabled();

    const weeklyAction = screen.getByDisplayValue("Gesperrte Wochentage").closest("li");
    expect(weeklyAction).not.toBeNull();
    expect(within(weeklyAction as HTMLElement).getByRole("button", { name: "Mo" })).toBeDisabled();
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

  it("allows clearing a selected template from the unplanned action field", async () => {
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

    expect(within(dialog).getByText("Morgenroutine")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Bestätigen" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Vorlage entfernen" }));

    expect(within(dialog).queryByText("Morgenroutine")).not.toBeInTheDocument();
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

  it("submits the manually selected day part for unplanned template actions", async () => {
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

    fireEvent.click(within(dialog).getByRole("combobox", { name: "Tageszeit" }));
    fireEvent.click(await screen.findByRole("option", { name: "Abend" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));

    expect(onAddUnplannedAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Morgenroutine",
        dayPart: "evening",
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

  it("hides the transient confirmed unplanned action again after the filter is adjusted", () => {
    const props = {
      viewMode: "confirmation" as const,
      selectedDate: "2026-05-12",
      onSelectedDateChange: vi.fn(),
      confirmationPeriod: "day" as const,
      clientName: "Test Klient",
      topics: [
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
                  status: "done_as_planned" as const,
                  done: true,
                  validFrom: "2026-05-12",
                  validTo: "2026-05-12",
                  recurrence: "daily" as const,
                  isUnplanned: true,
                  confirmations: {
                    "2026-05-12": {
                      status: "done_as_planned" as const,
                      done: true,
                      actualMinutes: 20,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      hideConfirmationHeader: true,
      filterModel: { statuses: ["open", "postponed"] as const },
      onUpdateTopic: vi.fn(),
      onUpdateTarget: vi.fn(),
      onUpdateAction: vi.fn(),
      onUpdateActionField: vi.fn(),
      onConfirmAction: vi.fn(),
      onAddTarget: vi.fn(),
      onAddAction: vi.fn(),
      onAddTopic: vi.fn(),
      onDeleteTopic: vi.fn(),
      onDeleteTarget: vi.fn(),
      onDeleteAction: vi.fn(),
    };

    const { rerender } = render(
      <AssessmentOutline
        {...props}
        transientUnplannedActionIds={new Set(["unplanned-confirmed"])}
      />,
    );

    expect(screen.getByText("Spontane Begleitung")).toBeInTheDocument();

    rerender(
      <AssessmentOutline
        {...props}
        transientUnplannedActionIds={new Set()}
      />,
    );

    expect(screen.queryByText("Spontane Begleitung")).not.toBeInTheDocument();
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
