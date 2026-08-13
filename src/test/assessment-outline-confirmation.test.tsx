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
            hilfsmittel: "resource-rutschbrett",
            dauer: "25",
            personen: "2",
            kategorie: "b",
            tageszeit: "morning(08:15)",
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
    expect(within(dialog).getByPlaceholderText("Hilfsmittel suchen...")).toBeDisabled();
    // Ohne fixe Tageszeit rendert der Dialog den Chip-Selektor; bei gesperrter
    // Tageszeit sind dessen Chips (inkl. Uhrzeit-Eingaben) deaktiviert.
    expect(within(dialog).getByRole("button", { name: "Morgen" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Abend" })).toBeDisabled();
    expect(within(dialog).getByLabelText("Anz. Personen")).toBeDisabled();
    expect(within(dialog).getByRole("combobox", { name: "Klassifizierung" })).toBeDisabled();
    expect(within(dialog).getByRole("combobox", { name: "Resultat" })).toBeDisabled();
  });

  it("deaktiviert alle gesperrten Vorlagenfelder in der Planung", async () => {
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
                groupId: "grp-monthly",
                title: "Gesperrte Vorlage",
                notes: "Fixe Beschreibung",
                resourceIds: ["resource-rutschbrett"],
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
                  "resourceIds",
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
                groupId: "grp-weekly",
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

    const outlineProps = {
      selectedDate: "2026-05-12",
      onSelectedDateChange: vi.fn(),
      clientName: "Test Klient",
      topics: lockedTopics,
      hideConfirmationHeader: true,
      viewMode: "planning" as const,
      onUpdateTopic: vi.fn(),
      onUpdateTarget: vi.fn(),
      onUpdateAction: vi.fn(),
      onUpdateActionField,
      onUpdateActionGroup: vi.fn(),
      onConfirmAction: vi.fn(),
      onAddTarget: vi.fn(),
      onAddAction: vi.fn(),
      onAddTopic: vi.fn(),
      onUpdateTopicDiscipline: vi.fn(),
      onReactivateTarget: vi.fn(),
      onDeleteTopic: vi.fn(),
      onDeleteTarget: vi.fn(),
      onDeleteAction: vi.fn(),
      onDeleteActionGroup: vi.fn(),
    };

    // In der Master-Detail-Planung erscheinen Handlungen als Übersichtszeilen;
    // bearbeitet (und dabei gemäss Vorlage gesperrt) werden sie im Seitenpanel.
    const { unmount } = render(<AssessmentOutline {...outlineProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Schwerpunkt" }));

    const monthlyRow = screen.getByText("Gesperrte Vorlage").closest("li");
    expect(monthlyRow).not.toBeNull();
    fireEvent.click(within(monthlyRow as HTMLElement).getByRole("button", { name: "Handlung bearbeiten" }));

    const monthlyPanel = within(await screen.findByRole("dialog"));
    expect(monthlyPanel.getByDisplayValue("Gesperrte Vorlage")).toBeDisabled();
    expect(monthlyPanel.getByDisplayValue("Fixe Beschreibung")).toBeDisabled();
    expect(monthlyPanel.getByPlaceholderText("Hilfsmittel suchen...")).toBeDisabled();
    expect(monthlyPanel.getByDisplayValue("25")).toBeDisabled();
    expect(monthlyPanel.getByDisplayValue("2")).toBeDisabled();
    // Tageszeit steckt jetzt im Chip-Selektor — gesperrt heisst: Chips deaktiviert.
    expect(monthlyPanel.getByRole("button", { name: "Morgen" })).toBeDisabled();
    // Klassifizierung, Resultat, Wiederholung und Monatsmuster sind Comboboxen.
    const monthlyComboboxes = monthlyPanel.getAllByRole("combobox");
    expect(monthlyComboboxes).toHaveLength(4);
    monthlyComboboxes.forEach((combobox) => expect(combobox).toBeDisabled());

    unmount();

    // Zweite Handlung: nur die Wochentage sind gesperrt.
    render(<AssessmentOutline {...outlineProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Schwerpunkt" }));
    const weeklyRow = screen.getByText("Gesperrte Wochentage").closest("li");
    expect(weeklyRow).not.toBeNull();
    fireEvent.click(within(weeklyRow as HTMLElement).getByRole("button", { name: "Handlung bearbeiten" }));

    const weeklyPanel = within(await screen.findByRole("dialog"));
    expect(weeklyPanel.getByRole("button", { name: "Mo" })).toBeDisabled();
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
      // Zweites Argument: die im Chip-Selektor gewählten Tageszeit-Einträge.
      expect.any(Array),
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

    // Ohne fixe Tageszeit rendert der Dialog den Chip-Selektor: Morgen (aus der
    // Vorlage) abwählen, Abend manuell wählen.
    fireEvent.click(within(dialog).getByRole("button", { name: "Morgen" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Abend" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));

    // Die gewählten Tageszeiten kommen als zweites Argument (dayPartEntries).
    expect(onAddUnplannedAction).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Morgenroutine" }),
      [{ dayPart: "evening" }],
    );
  });

  it("füllt das Bis-Datum automatisch mit dem Von-Datum, wenn nur ein Von übergeben wird", async () => {
    // Regression: ohne dueDate blieb "Bis" leer, wodurch Bestätigen still abbrach.
    render(
      <UnplannedActionDialog
        target={{ dateFrom: "2026-07-08", dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = within(await screen.findByRole("dialog"));
    // Von und Bis tragen beide das vorgegebene Datum.
    expect(dialog.getAllByDisplayValue("2026-07-08")).toHaveLength(2);
  });

  it("hält Bestätigen deaktiviert, solange Von oder Bis fehlt", async () => {
    render(
      <UnplannedActionDialog
        target={{ dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = within(await screen.findByRole("dialog"));
    // Vorlage wählen, damit nur noch die fehlenden Daten die Bestätigung blockieren.
    fireEvent.change(dialog.getByPlaceholderText("Vorlagen suchen..."), { target: { value: "Morg" } });
    fireEvent.click(await dialog.findByText("Morgenroutine"));

    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeDisabled();
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

  it("allows deleting an unconfirmed unplanned action from the confirmation dialog", async () => {
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
                    id: "unplanned-open",
                    title: "Spontane Begleitung",
                    notes: "",
                    status: "open",
                    done: false,
                    validFrom: "2026-05-12",
                    recurrence: "daily",
                    isUnplanned: true,
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
        onDeleteAction={onDeleteAction}
      />,
    );

    // Offene Handlung: Dialog über eine Umsetzungs-Variante öffnen. Bei einer ungeplanten
    // Handlung ist "Erledigt wie geplant" gesperrt (keine geplante Zeit), daher die Abweichung.
    fireEvent.click(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]);
    const dialog = within(await screen.findByRole("dialog"));

    fireEvent.click(dialog.getByRole("button", { name: "Löschen" }));

    expect(onDeleteAction).toHaveBeenCalledWith(
      "topic-unplanned",
      "target-unplanned",
      "unplanned-open",
    );
  });

});
