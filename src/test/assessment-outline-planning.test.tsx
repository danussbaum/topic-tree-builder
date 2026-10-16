import { render, screen, within, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionPlanDiscipline } from "@/lib/action-plan-disciplines";
import type { ActionNode, TargetNode } from "@/types/assessment";

const disciplines: ActionPlanDiscipline[] = [
  { id: "discipline-ihp", title: "IHP", authorizedRoleIds: [] },
  { id: "discipline-physio", title: "Physiotherapie", authorizedRoleIds: [] },
];

const targets: TargetNode[] = [
  { id: "goal-1", title: "Mobilität erhalten", notes: "", disciplineId: "discipline-ihp", actions: [] },
  { id: "goal-2", title: "Alltag strukturieren", notes: "", disciplineId: "discipline-ihp", actions: [] },
  { id: "goal-3", title: "Gleichgewicht trainieren", notes: "", disciplineId: "discipline-physio", actions: [] },
];

const action = (id: string, groupId: string, title: string): ActionNode => ({
  id,
  groupId,
  title,
  notes: "",
  status: "open",
  done: false,
});

const targetsWithGoals: TargetNode[] = [
  {
    id: "goal-a",
    disciplineId: "discipline-ihp",
    title: "Ziel A",
    notes: "",
    actions: [action("act-a1", "grp-a1", "Handlung A1")],
  },
  {
    id: "goal-b",
    disciplineId: "discipline-ihp",
    title: "Ziel B",
    notes: "",
    actions: [action("act-b1", "grp-b1", "Handlung B1")],
  },
];

const renderPlanningOutline = (props?: { targets?: TargetNode[]; showClosedTargets?: boolean }) =>
  render(
    <AssessmentOutline
      viewMode="planning"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      targets={props?.targets ?? targets}
      disciplines={disciplines}
      showClosedTargets={props?.showClosedTargets}
      onUpdateTarget={vi.fn()}
      onUpdateAction={vi.fn()}
      onUpdateActionField={vi.fn()}
      onConfirmAction={vi.fn()}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onUpdateActionGroup={vi.fn()}
      onDeleteTarget={vi.fn()}
      onReactivateTarget={vi.fn()}
      onDeleteAction={vi.fn()}
      onDeleteActionGroup={vi.fn()}
    />,
  );

describe("AssessmentOutline planning discipline groups", () => {
  it("renders targets of the same discipline below one shared discipline header", () => {
    renderPlanningOutline();

    expect(screen.getAllByRole("heading", { name: "IHP" })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { name: "Physiotherapie" })).toHaveLength(1);

    const ihpSection = screen.getByRole("heading", { name: "IHP" }).closest("section");
    expect(ihpSection).not.toBeNull();
    expect(within(ihpSection!).getByText("Mobilität erhalten")).toBeInTheDocument();
    expect(within(ihpSection!).getByText("Alltag strukturieren")).toBeInTheDocument();
    expect(within(ihpSection!).queryByText("Gleichgewicht trainieren")).not.toBeInTheDocument();
  });
});

describe("AssessmentOutline planning master-detail", () => {
  const targetsInOneDiscipline: TargetNode[] = [
    ...targetsWithGoals,
    {
      id: "goal-c",
      disciplineId: "discipline-ihp",
      title: "Ziel C",
      notes: "",
      actions: [action("act-c1", "grp-c1", "Handlung C1")],
    },
  ];

  const targetsInTwoDisciplines: TargetNode[] = [
    ...targetsWithGoals,
    {
      id: "goal-d",
      disciplineId: "discipline-physio",
      title: "Ziel D",
      notes: "",
      actions: [action("act-d1", "grp-d1", "Handlung D1")],
    },
  ];

  it("wählt standardmässig kein Ziel aus", () => {
    renderPlanningOutline({ targets: targetsWithGoals });

    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
    expect(screen.getByText(/Ziel links wählen/)).toBeInTheDocument();
  });

  it("zeigt nur das gewählte Ziel mit seinen Handlungen", () => {
    renderPlanningOutline({ targets: targetsWithGoals });

    fireEvent.click(screen.getByRole("button", { name: /Ziel A/ }));

    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung B1")).not.toBeInTheDocument();
  });

  it("zeigt mehrere gewählte Ziele derselben Disziplin gleichzeitig", () => {
    renderPlanningOutline({ targets: targetsInOneDiscipline });

    fireEvent.click(screen.getByRole("button", { name: /Ziel A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ziel C/ }));

    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
    expect(screen.getByText("Handlung C1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung B1")).not.toBeInTheDocument();
  });

  it("ersetzt die Auswahl beim Wechsel in eine andere Disziplin", () => {
    renderPlanningOutline({ targets: targetsInTwoDisciplines });

    fireEvent.click(screen.getByRole("button", { name: /Ziel A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ziel B/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ziel D/ }));

    expect(screen.getByText("Handlung D1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
    expect(screen.queryByText("Handlung B1")).not.toBeInTheDocument();
  });

  it("wählt ein Ziel mit einem zweiten Klick wieder ab", () => {
    renderPlanningOutline({ targets: targetsWithGoals });

    fireEvent.click(screen.getByRole("button", { name: /Ziel A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ziel A/ }));

    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
    expect(screen.getByText(/Ziel links wählen/)).toBeInTheDocument();
  });

  it("wählt mit Klick auf die Disziplin alle ihre Ziele, einzelne lassen sich abwählen", () => {
    renderPlanningOutline({ targets: targetsInOneDiscipline });

    fireEvent.click(screen.getByRole("button", { name: "IHP" }));
    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
    expect(screen.getByText("Handlung B1")).toBeInTheDocument();
    expect(screen.getByText("Handlung C1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ziel B/ }));
    expect(screen.queryByText("Handlung B1")).not.toBeInTheDocument();
    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
  });

  it("ersetzt mit Klick auf eine andere Disziplin die bisherige Auswahl", () => {
    renderPlanningOutline({ targets: targetsInTwoDisciplines });

    fireEvent.click(screen.getByRole("button", { name: /Ziel D/ }));
    fireEvent.click(screen.getByRole("button", { name: "IHP" }));

    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
    expect(screen.getByText("Handlung B1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung D1")).not.toBeInTheDocument();
  });

  it("hebt mit erneutem Klick auf die Disziplin die Auswahl auf", () => {
    renderPlanningOutline({ targets: targetsWithGoals });

    fireEvent.click(screen.getByRole("button", { name: "IHP" }));
    fireEvent.click(screen.getByRole("button", { name: "IHP" }));

    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
    expect(screen.getByText(/Ziel links wählen/)).toBeInTheDocument();
  });
});

describe("AssessmentOutline planning abgeschlossene Ziele", () => {
  const withClosedTarget: TargetNode[] = [
    ...targetsWithGoals,
    { id: "goal-closed", disciplineId: "discipline-ihp", title: "Ziel Z", notes: "", validTo: "2020-01-31", actions: [] },
  ];

  it("blendet abgeschlossene Ziele in der Navigation standardmässig aus", () => {
    renderPlanningOutline({ targets: withClosedTarget });

    expect(screen.queryByRole("button", { name: /Ziel Z/ })).not.toBeInTheDocument();
  });

  it("kennzeichnet eingeblendete abgeschlossene Ziele in der Navigation", () => {
    renderPlanningOutline({ targets: withClosedTarget, showClosedTargets: true });

    expect(screen.getByText("Ziel Z")).toHaveClass("line-through");
    expect(screen.getByRole("button", { name: /Ziel Z \(abgeschlossen\)/ })).toBeInTheDocument();
    expect(screen.getByText("Ziel A")).not.toHaveClass("line-through");
  });
});

describe("AssessmentOutline planning ungeplante Handlungen", () => {
  const unplannedTargets: TargetNode[] = [
    {
      id: "goal-unplanned",
      disciplineId: "discipline-ihp",
      title: "Direkt in der Umsetzung erfasst",
      notes: "",
      actions: [
        { ...action("act-u1", "grp-u1", "Spontane Begleitung"), isUnplanned: true, plannedMinutes: 0, validFrom: "2026-05-12", validTo: "2026-05-12" },
        { ...action("act-u2", "grp-u2", "Spontane Begleitung"), isUnplanned: true, plannedMinutes: 0, validFrom: "2026-05-13", validTo: "2026-05-13" },
      ],
    },
  ];

  it("zeigt ungeplante Handlungen in der Planung nicht an", () => {
    renderPlanningOutline({ targets: unplannedTargets });
    fireEvent.click(screen.getByRole("button", { name: /Direkt in der Umsetzung erfasst/ }));

    expect(screen.queryByText("Spontane Begleitung")).not.toBeInTheDocument();
    expect(screen.queryByText("Ungeplant")).not.toBeInTheDocument();
  });
});

describe("Mehrfache Durchführungen pro Tageszeit", () => {
  const nightGroup: ActionNode[] = [
    {
      ...action("act-n1", "grp-night", "Umlagern"),
      scheduledTime: "22:00",
      recurrence: "daily",
      validFrom: "2026-08-01",
    },
    {
      ...action("act-n2", "grp-night", "Umlagern"),
      scheduledTime: "01:00",
      recurrence: "daily",
      validFrom: "2026-08-01",
      confirmations: {
        "2026-08-02": { status: "done_as_planned", done: true },
      },
    },
  ];

  const nightTargets: TargetNode[] = [
    { id: "goal-a", title: "Ziel A", notes: "", validFrom: "2026-08-01", actions: nightGroup, disciplineId: "discipline-ihp" },
  ];

  const renderWithGroup = (onUpdateActionGroup = vi.fn()) => {
    render(
      <AssessmentOutline
        viewMode="planning"
        selectedDate="2026-08-01"
        onSelectedDateChange={vi.fn()}
        targets={nightTargets}
        disciplines={disciplines}
        onUpdateTarget={vi.fn()}
        onUpdateAction={vi.fn()}
        onUpdateActionField={vi.fn()}
        onConfirmAction={vi.fn()}
        onAddTarget={vi.fn()}
        onAddAction={vi.fn()}
        onUpdateActionGroup={onUpdateActionGroup}
        onDeleteTarget={vi.fn()}
        onReactivateTarget={vi.fn()}
        onDeleteAction={vi.fn()}
        onDeleteActionGroup={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Ziel A/ }));
    fireEvent.click(screen.getByRole("button", { name: "Handlung bearbeiten" }));
    return onUpdateActionGroup;
  };

  it("zeigt jede Uhrzeit der Gruppe als eigene Zeile mit Rollover-Hinweis", () => {
    renderWithGroup();

    expect(screen.getByLabelText("Uhrzeit 1")).toHaveValue("01:00");
    expect(screen.getByLabelText("Uhrzeit 2")).toHaveValue("22:00");
    // 01:00 ist am Folgetag fällig, 22:00 am Planungstag.
    expect(screen.getAllByText("(+1 Tag)")).toHaveLength(1);
  });

  it("legt über den Plus-Button eine weitere Durchführung an", () => {
    const onUpdateActionGroup = renderWithGroup();

    fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit" }));
    fireEvent.change(screen.getByLabelText("Uhrzeit 3"), { target: { value: "04:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(onUpdateActionGroup).toHaveBeenCalledTimes(1);
    const entries = onUpdateActionGroup.mock.calls[0][3];
    expect(entries).toEqual([
      { dayPart: undefined, scheduledTime: "01:00", existingActionId: "act-n2" },
      { dayPart: undefined, scheduledTime: "04:00", existingActionId: undefined },
      { dayPart: undefined, scheduledTime: "22:00", existingActionId: "act-n1" },
    ]);
  });

  it("setzt den Fokus auf das neue Uhrzeit-Feld", () => {
    renderWithGroup();

    fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit" }));

    expect(screen.getByLabelText("Uhrzeit 3")).toHaveFocus();
  });

  it("verweigert das Speichern bei doppelter Uhrzeit in derselben Tageszeit", () => {
    const onUpdateActionGroup = renderWithGroup();

    fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit" }));
    fireEvent.change(screen.getByLabelText("Uhrzeit 3"), { target: { value: "22:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(onUpdateActionGroup).not.toHaveBeenCalled();
    expect(
      screen.getByText(/eigene, unterschiedliche Uhrzeit/i),
    ).toBeInTheDocument();
  });

  it("warnt beim Entfernen einer einzelnen Uhrzeit mit Bestätigungen", () => {
    const onUpdateActionGroup = renderWithGroup();

    // 01:00 ist die erste Zeile und hat eine Bestätigung.
    fireEvent.click(screen.getByRole("button", { name: "Uhrzeit 1 entfernen" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(onUpdateActionGroup).not.toHaveBeenCalled();
    expect(screen.getByText(/Durchführung mit Bestätigungen entfernen/i)).toBeInTheDocument();
  });
});
