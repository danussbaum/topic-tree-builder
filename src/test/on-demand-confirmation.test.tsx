import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import { matchesAssessmentFilter } from "@/types/assessment-filter";
import type { ActionNode, TopicNode } from "@/types/assessment";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";

const dailyAction: ActionNode = {
  id: "action-daily",
  groupId: "group-daily",
  title: "Morgentoilette",
  notes: "",
  status: "open",
  done: false,
  plannedMinutes: 20,
  dayPart: DAY_PART_SEED_IDS.morning,
  validFrom: "2026-05-01",
  recurrence: "daily",
};

const onDemandAction: ActionNode = {
  id: "action-on-demand",
  groupId: "group-on-demand",
  title: "Bedarfsmedikation",
  notes: "",
  status: "open",
  done: false,
  plannedMinutes: 15,
  dayPart: DAY_PART_SEED_IDS.morning,
  validFrom: "2026-05-01",
  recurrence: "on_demand",
};

const topicsWith = (actions: ActionNode[]): TopicNode[] => [
  {
    id: "topic-1",
    title: "Schwerpunkt",
    notes: "",
    targets: [{ id: "target-1", title: "Ziel", notes: "", actions }],
  },
];

const renderOutline = (
  actions: ActionNode[] = [dailyAction, onDemandAction],
  onAddOnDemandAction = vi.fn(),
) => {
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={topicsWith(actions)}
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
      onAddUnplannedAction={vi.fn()}
      onAddOnDemandAction={onAddOnDemandAction}
    />,
  );
  return { onAddOnDemandAction };
};

// Radix öffnet das Dropdown auf pointerdown; in jsdom greift zuverlässig die Tastatur.
const openCreateMenu = () => {
  fireEvent.keyDown(screen.getAllByRole("button", { name: "Handlung erfassen" })[0], { key: "Enter" });
};

const openOnDemandDialog = async () => {
  openCreateMenu();
  fireEvent.click(await screen.findByRole("menuitem", { name: "Handlung nach Bedarf erstellen" }));
  return within(await screen.findByRole("dialog", { name: "Handlung nach Bedarf erstellen" }));
};

const selectAction = async (dialog: ReturnType<typeof within>, label: string | RegExp) => {
  fireEvent.keyDown(dialog.getByRole("combobox", { name: "Handlung" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("option", { name: label }));
};

describe("Handlungen nach Bedarf in der Umsetzung", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("wird nicht automatisch fällig", () => {
    renderOutline();

    expect(screen.getByText("Morgentoilette")).toBeInTheDocument();
    expect(screen.queryByText("Bedarfsmedikation")).not.toBeInTheDocument();
  });

  it("bietet im (+)-Menü der Tageszeit beide Erfassungsarten in fester Reihenfolge", async () => {
    renderOutline();

    openCreateMenu();

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Handlung nach Bedarf erstellen",
      "Ungeplante Handlung erstellen",
    ]);
  });

  it("übergibt die im Plan gewählte Handlung mit Tag und Tageszeit", async () => {
    const { onAddOnDemandAction } = renderOutline();

    const dialog = await openOnDemandDialog();
    // Leeres Auswahlfeld: Bestätigen wird erst mit einer gewählten Handlung aktiv.
    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeDisabled();

    await selectAction(dialog, /Bedarfsmedikation/);
    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeEnabled();
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    expect(onAddOnDemandAction).toHaveBeenCalledWith(
      expect.objectContaining({
        topicId: "topic-1",
        targetId: "target-1",
        date: "2026-05-12",
        dayPart: DAY_PART_SEED_IDS.morning,
        action: expect.objectContaining({ id: "action-on-demand" }),
      }),
    );
  });

  it("stellt alle Nach-Bedarf-Handlungen des Plans zur Auswahl", async () => {
    const zweite: ActionNode = { ...onDemandAction, id: "action-on-demand-2", title: "Wundkontrolle" };
    const { onAddOnDemandAction } = renderOutline([dailyAction, onDemandAction, zweite]);

    const dialog = await openOnDemandDialog();
    fireEvent.keyDown(dialog.getByRole("combobox", { name: "Handlung" }), { key: "Enter" });
    const options = await screen.findAllByRole("option");
    // Nur Nach-Bedarf-Handlungen, nicht die täglich wiederkehrende — jede mit ihrer
    // Herkunft, damit gleich benannte Handlungen unterscheidbar sind.
    expect(options.map((option) => option.textContent)).toEqual([
      "Schwerpunkt › ZielBedarfsmedikation (15 Min)",
      "Schwerpunkt › ZielWundkontrolle (15 Min)",
    ]);

    fireEvent.click(screen.getByRole("option", { name: /Wundkontrolle/ }));
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    expect(onAddOnDemandAction).toHaveBeenCalledTimes(1);
    expect(onAddOnDemandAction.mock.calls[0][0].action.id).toBe("action-on-demand-2");
  });

  it("zeigt Datum und Zeitangabe aus dem (+)-Kontext unveränderbar an", async () => {
    renderOutline();

    const dialog = await openOnDemandDialog();
    expect(dialog.getByText("12.05.2026")).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: /Datum wählen|12\.05\.2026/ })).not.toBeInTheDocument();
    expect(dialog.getByRole("combobox", { name: "Zeitangabe" })).toBeDisabled();
  });

  it("erfasst aus dem Vortags-Abschnitt auf den Vortag mit Uhrzeit nach Mitternacht", async () => {
    // Eine Nacht-Handlung um 01:00 am 11.05. erscheint am 12.05. als Vortags-Abschnitt — damit
    // gibt es diesen Abschnitt am gewählten Tag.
    const nachts: ActionNode = {
      ...dailyAction,
      id: "action-night",
      groupId: "group-night",
      title: "Lagerung",
      scheduledTime: "01:00",
    };
    const bedarfNachts: ActionNode = {
      ...onDemandAction,
      scheduledTime: "02:00",
    };
    const { onAddOnDemandAction } = renderOutline([nachts, bedarfNachts]);

    const trigger = screen
      .getAllByRole("button", { name: "Handlung erfassen" })
      .find((button) => button.closest("div")?.textContent?.includes("Vortag"))!;
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Handlung nach Bedarf erstellen" }));

    const dialog = within(await screen.findByRole("dialog", { name: "Handlung nach Bedarf erstellen" }));
    expect(dialog.getByText("Nacht vom 11.05.2026 auf den 12.05.2026")).toBeInTheDocument();

    await selectAction(dialog, /Bedarfsmedikation/);
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    // Vortag + Nacht + Uhrzeit nach Mitternacht ⇒ die Durchführung landet wieder im Vortags-Abschnitt.
    expect(onAddOnDemandAction).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-05-11", dayPart: "none", scheduledTime: "02:00" }),
    );
  });

  it("meldet die fehlende Vortags-Uhrzeit erst beim Bestätigen", async () => {
    const nachts: ActionNode = {
      ...dailyAction,
      id: "action-night",
      groupId: "group-night",
      title: "Lagerung",
      scheduledTime: "01:00",
    };
    // Geplant um 22:00 — das rollt nicht zurück und darf darum nicht übernommen werden.
    const bedarfAbends: ActionNode = {
      ...onDemandAction,
      scheduledTime: "22:00",
    };
    const { onAddOnDemandAction } = renderOutline([nachts, bedarfAbends]);

    const trigger = screen
      .getAllByRole("button", { name: "Handlung erfassen" })
      .find((button) => button.closest("div")?.textContent?.includes("Vortag"))!;
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Handlung nach Bedarf erstellen" }));

    const dialog = within(await screen.findByRole("dialog", { name: "Handlung nach Bedarf erstellen" }));
    await selectAction(dialog, /Bedarfsmedikation/);

    // 22:00 rollt nicht zurück und wird darum nicht übernommen — der Hinweis fehlt aber noch.
    expect(dialog.getByLabelText("Uhrzeit")).toHaveValue("");
    expect(dialog.queryByText(/Zwingend zwischen 00:00 und 06:00/)).not.toBeInTheDocument();

    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));
    expect(dialog.getByText(/Zwingend zwischen 00:00 und 06:00/)).toBeInTheDocument();
    expect(onAddOnDemandAction).not.toHaveBeenCalled();

    fireEvent.change(dialog.getByLabelText("Uhrzeit"), { target: { value: "03:30" } });
    expect(dialog.queryByText(/Zwingend zwischen 00:00 und 06:00/)).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));
    expect(onAddOnDemandAction).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-05-11", dayPart: "none", scheduledTime: "03:30" }),
    );
  });

  it("erfasst auch eine ungeplante Handlung im Vortags-Abschnitt auf den Vortag", async () => {
    const nachts: ActionNode = {
      ...dailyAction,
      id: "action-night",
      groupId: "group-night",
      title: "Lagerung",
      scheduledTime: "01:00",
    };
    const onAddUnplannedAction = vi.fn();
    render(
      <AssessmentOutline
        viewMode="confirmation"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        confirmationPeriod="day"
        topics={topicsWith([nachts])}
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
        onAddUnplannedAction={onAddUnplannedAction}
      />,
    );

    const trigger = screen
      .getAllByRole("button", { name: "Handlung erfassen" })
      .find((button) => button.closest("div")?.textContent?.includes("Vortag"))!;
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Ungeplante Handlung erstellen" }));

    const dialog = within(await screen.findByRole("dialog", { name: "Ungeplante Handlung erstellen" }));
    // Ohne Vorlage genügt der Standardtitel — hier geht es allein um die Vortags-Regel.
    fireEvent.click(dialog.getByRole("button", { name: /Ohne Vorlage/ }));

    // Der Hinweis erscheint erst beim Bestätigen ohne gültige Uhrzeit.
    expect(dialog.queryByText(/Zwingend zwischen 00:00 und 06:00/)).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));
    expect(dialog.getByText(/Zwingend zwischen 00:00 und 06:00/)).toBeInTheDocument();
    expect(onAddUnplannedAction).not.toHaveBeenCalled();

    fireEvent.change(dialog.getByLabelText("Uhrzeit"), { target: { value: "04:15" } });
    fireEvent.click(dialog.getByRole("button", { name: "Bestätigen" }));

    expect(onAddUnplannedAction).toHaveBeenCalledWith(
      "2026-05-11",
      DAY_PART_SEED_IDS.night,
      expect.objectContaining({ dateFrom: "2026-05-11", dateTo: "2026-05-11", scheduledTime: "04:15" }),
    );
  });

  it("weist auf einen leeren Plan hin, wenn keine Nach-Bedarf-Handlung hinterlegt ist", async () => {
    renderOutline([dailyAction]);

    const dialog = await openOnDemandDialog();
    expect(dialog.getByText(/keine Handlung mit der Wiederholung/)).toBeInTheDocument();
    expect(dialog.queryByRole("combobox", { name: "Handlung" })).not.toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Bestätigen" })).toBeDisabled();
  });

  it("führt Bedarfs-Durchführungen als eigene Planungsart im Filter", () => {
    const occurrence: ActionNode = { ...onDemandAction, recurrence: "daily", isOnDemandOccurrence: true };
    const input = { action: occurrence, status: "open" as const };
    const planned = { action: dailyAction, status: "open" as const };

    expect(matchesAssessmentFilter(input, { statuses: ["open"], unplanned: "on_demand" })).toBe(true);
    expect(matchesAssessmentFilter(input, { statuses: ["open"], unplanned: "planned" })).toBe(false);
    expect(matchesAssessmentFilter(input, { statuses: ["open"], unplanned: "unplanned" })).toBe(false);
    expect(matchesAssessmentFilter(planned, { statuses: ["open"], unplanned: "planned" })).toBe(true);
    expect(matchesAssessmentFilter(planned, { statuses: ["open"], unplanned: "on_demand" })).toBe(false);
  });
});

describe("Bedarfs-Durchführungen in der Planung", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("erscheinen nicht als Zeile in der Planung — nur die Nach-Bedarf-Handlung selbst", () => {
    const occurrence: ActionNode = {
      ...onDemandAction,
      id: "occurrence-1",
      groupId: "group-occurrence",
      title: "Bedarfsmedikation",
      recurrence: "daily",
      validFrom: "2026-05-12",
      validTo: "2026-05-12",
      isOnDemandOccurrence: true,
      onDemandSourceActionId: "action-on-demand",
    };

    render(
      <AssessmentOutline
        viewMode="planning"
        selectedDate="2026-05-12"
        onSelectedDateChange={vi.fn()}
        topics={topicsWith([onDemandAction, occurrence])}
        onUpdateTopic={vi.fn()}
        onUpdateTarget={vi.fn()}
        onUpdateAction={vi.fn()}
        onUpdateActionField={vi.fn()}
        onConfirmAction={vi.fn()}
        onAddTarget={vi.fn()}
        onAddAction={vi.fn()}
        onUpdateActionGroup={vi.fn()}
        onAddTopic={vi.fn()}
        onDeleteTopic={vi.fn()}
        onDeleteTarget={vi.fn()}
        onReactivateTarget={vi.fn()}
        onDeleteAction={vi.fn()}
        onDeleteActionGroup={vi.fn()}
      />,
    );

    screen.getAllByRole("button", { name: /Schwerpunkt/ }).forEach((button) => fireEvent.click(button));

    // Die Plan-Handlung steht genau einmal da, die Durchführung gar nicht.
    expect(screen.getAllByText("Bedarfsmedikation")).toHaveLength(1);
    expect(screen.getByText("Nach Bedarf")).toBeInTheDocument();
  });
});
