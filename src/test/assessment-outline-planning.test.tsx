import { render, screen, within, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionPlanDiscipline } from "@/lib/action-plan-disciplines";
import type { ActionNode, TopicNode } from "@/types/assessment";

const disciplines: ActionPlanDiscipline[] = [
  { id: "discipline-ihp", title: "IHP", authorizedRoleIds: [] },
  { id: "discipline-physio", title: "Physiotherapie", authorizedRoleIds: [] },
];

const topics: TopicNode[] = [
  {
    id: "topic-1",
    title: "Mobilität erhalten",
    notes: "",
    disciplineId: "discipline-ihp",
    targets: [],
  },
  {
    id: "topic-2",
    title: "Alltag strukturieren",
    notes: "",
    disciplineId: "discipline-ihp",
    targets: [],
  },
  {
    id: "topic-3",
    title: "Gleichgewicht trainieren",
    notes: "",
    disciplineId: "discipline-physio",
    targets: [],
  },
];

const action = (id: string, groupId: string, title: string): ActionNode => ({
  id,
  groupId,
  title,
  notes: "",
  status: "open",
  done: false,
});

const topicsWithGoals: TopicNode[] = [
  {
    id: "topic-1",
    title: "Mobilität erhalten",
    notes: "",
    disciplineId: "discipline-ihp",
    targets: [
      {
        id: "goal-a",
        title: "Ziel A",
        notes: "",
        actions: [action("act-a1", "grp-a1", "Handlung A1")],
      },
      {
        id: "goal-b",
        title: "Ziel B",
        notes: "",
        actions: [action("act-b1", "grp-b1", "Handlung B1")],
      },
    ],
  },
];

const renderPlanningOutline = (props?: { topics?: TopicNode[] }) =>
  render(
    <AssessmentOutline
      viewMode="planning"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      topics={props?.topics ?? topics}
      disciplines={disciplines}
      onUpdateTopic={vi.fn()}
      onUpdateTarget={vi.fn()}
      onUpdateAction={vi.fn()}
      onUpdateActionField={vi.fn()}
      onConfirmAction={vi.fn()}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onUpdateActionGroup={vi.fn()}
      onAddTopic={vi.fn()}
      onUpdateTopicDiscipline={vi.fn()}
      onDeleteTopic={vi.fn()}
      onDeleteTarget={vi.fn()}
      onReactivateTarget={vi.fn()}
      onDeleteAction={vi.fn()}
      onDeleteActionGroup={vi.fn()}
    />,
  );

describe("AssessmentOutline planning discipline groups", () => {
  it("renders topics of the same discipline below one shared discipline header", () => {
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
  const topicsWithTwoTopics: TopicNode[] = [
    ...topicsWithGoals,
    {
      id: "topic-2",
      title: "Alltag strukturieren",
      notes: "",
      disciplineId: "discipline-ihp",
      targets: [
        {
          id: "goal-c",
          title: "Ziel C",
          notes: "",
          actions: [action("act-c1", "grp-c1", "Handlung C1")],
        },
      ],
    },
  ];

  const topicsInTwoDisciplines: TopicNode[] = [
    ...topicsWithGoals,
    {
      id: "topic-3",
      title: "Gleichgewicht trainieren",
      notes: "",
      disciplineId: "discipline-physio",
      targets: [
        {
          id: "goal-d",
          title: "Ziel D",
          notes: "",
          actions: [action("act-d1", "grp-d1", "Handlung D1")],
        },
      ],
    },
  ];

  it("wählt standardmässig keinen Schwerpunkt aus", () => {
    renderPlanningOutline({ topics: topicsWithGoals });

    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
    expect(screen.getByText(/Schwerpunkt links wählen/)).toBeInTheDocument();
  });

  it("zeigt alle Ziele des gewählten Schwerpunkts mit ihren Handlungen", () => {
    renderPlanningOutline({ topics: topicsWithGoals });

    fireEvent.click(screen.getByRole("button", { name: /Mobilität erhalten/ }));

    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
    expect(screen.getByText("Handlung B1")).toBeInTheDocument();
  });

  it("ersetzt die Auswahl innerhalb derselben Disziplin", () => {
    renderPlanningOutline({ topics: topicsWithTwoTopics });

    fireEvent.click(screen.getByRole("button", { name: /Mobilität erhalten/ }));
    fireEvent.click(screen.getByRole("button", { name: /Alltag strukturieren/ }));

    expect(screen.getByText("Handlung C1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
  });

  it("ersetzt die Auswahl auch über Disziplinen hinweg", () => {
    renderPlanningOutline({ topics: topicsInTwoDisciplines });

    fireEvent.click(screen.getByRole("button", { name: /Mobilität erhalten/ }));
    fireEvent.click(screen.getByRole("button", { name: /Gleichgewicht trainieren/ }));

    expect(screen.getByText("Handlung D1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
  });
});

describe("AssessmentOutline planning ungeplante Handlungen", () => {
  const unplannedTopics: TopicNode[] = [
    {
      id: "topic-unplanned",
      title: "Ungeplante Handlungen",
      notes: "",
      disciplineId: "discipline-ihp",
      targets: [
        {
          id: "goal-unplanned",
          title: "Direkt in der Umsetzung erfasst",
          notes: "",
          actions: [
            { ...action("act-u1", "grp-u1", "Spontane Begleitung"), isUnplanned: true, plannedMinutes: 0, validFrom: "2026-05-12", validTo: "2026-05-12" },
            { ...action("act-u2", "grp-u2", "Spontane Begleitung"), isUnplanned: true, plannedMinutes: 0, validFrom: "2026-05-13", validTo: "2026-05-13" },
          ],
        },
      ],
    },
  ];

  it("zeigt ungeplante Handlungen in der Planungsübersicht als eine Zeile mit Zeitraum", () => {
    renderPlanningOutline({ topics: unplannedTopics });
    fireEvent.click(screen.getByRole("button", { name: /Ungeplante Handlungen/ }));

    expect(screen.getAllByText("Spontane Begleitung")).toHaveLength(1);
    expect(screen.getByText("Ungeplant")).toBeInTheDocument();
    expect(screen.getByText("12.05.2026 – 13.05.2026")).toBeInTheDocument();
  });

  it("bietet für ungeplante Handlungen keine Bearbeiten-/Löschen-Aktion an", () => {
    renderPlanningOutline({ topics: unplannedTopics });
    fireEvent.click(screen.getByRole("button", { name: /Ungeplante Handlungen/ }));

    expect(screen.queryByRole("button", { name: "Handlung bearbeiten" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Handlung löschen" })).not.toBeInTheDocument();
  });
});

describe("Mehrfache Durchführungen pro Tageszeit", () => {
  const nightGroup: ActionNode[] = [
    {
      ...action("act-n1", "grp-night", "Umlagern"),
      dayPart: "night",
      scheduledTime: "22:00",
      recurrence: "daily",
      validFrom: "2026-08-01",
    },
    {
      ...action("act-n2", "grp-night", "Umlagern"),
      dayPart: "night",
      scheduledTime: "01:00",
      recurrence: "daily",
      validFrom: "2026-08-01",
      confirmations: {
        "2026-08-02": { status: "done_as_planned", done: true },
      },
    },
  ];

  const nightTopics: TopicNode[] = [
    {
      id: "topic-1",
      title: "Mobilität und Transfer",
      notes: "",
      disciplineId: "discipline-ihp",
      targets: [
        { id: "goal-a", title: "Ziel A", notes: "", validFrom: "2026-08-01", actions: nightGroup },
      ],
    },
  ];

  const renderWithGroup = (onUpdateActionGroup = vi.fn()) => {
    render(
      <AssessmentOutline
        viewMode="planning"
        selectedDate="2026-08-01"
        onSelectedDateChange={vi.fn()}
        topics={nightTopics}
        disciplines={disciplines}
        onUpdateTopic={vi.fn()}
        onUpdateTarget={vi.fn()}
        onUpdateAction={vi.fn()}
        onUpdateActionField={vi.fn()}
        onConfirmAction={vi.fn()}
        onAddTarget={vi.fn()}
        onAddAction={vi.fn()}
        onUpdateActionGroup={onUpdateActionGroup}
        onAddTopic={vi.fn()}
        onUpdateTopicDiscipline={vi.fn()}
        onDeleteTopic={vi.fn()}
        onDeleteTarget={vi.fn()}
        onReactivateTarget={vi.fn()}
        onDeleteAction={vi.fn()}
        onDeleteActionGroup={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Mobilität und Transfer/ }));
    fireEvent.click(screen.getByRole("button", { name: "Handlung bearbeiten" }));
    return onUpdateActionGroup;
  };

  it("zeigt jede Uhrzeit der Gruppe als eigene Zeile mit Rollover-Hinweis", () => {
    renderWithGroup();

    expect(screen.getByLabelText("Uhrzeit Nacht 1")).toHaveValue("01:00");
    expect(screen.getByLabelText("Uhrzeit Nacht 2")).toHaveValue("22:00");
    // 01:00 ist am Folgetag fällig, 22:00 am Planungstag.
    expect(screen.getAllByText("(+1 Tag)")).toHaveLength(1);
  });

  it("legt über den Plus-Button eine weitere Durchführung an", () => {
    const onUpdateActionGroup = renderWithGroup();

    fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit Nacht" }));
    fireEvent.change(screen.getByLabelText("Uhrzeit Nacht 3"), { target: { value: "04:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(onUpdateActionGroup).toHaveBeenCalledTimes(1);
    const entries = onUpdateActionGroup.mock.calls[0][4];
    expect(entries).toEqual([
      { dayPart: "night", scheduledTime: "01:00", existingActionId: "act-n2" },
      { dayPart: "night", scheduledTime: "04:00", existingActionId: undefined },
      { dayPart: "night", scheduledTime: "22:00", existingActionId: "act-n1" },
    ]);
  });

  it("setzt den Fokus auf das neue Uhrzeit-Feld", () => {
    renderWithGroup();

    fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit Nacht" }));

    expect(screen.getByLabelText("Uhrzeit Nacht 3")).toHaveFocus();
  });

  it("verweigert das Speichern bei doppelter Uhrzeit in derselben Tageszeit", () => {
    const onUpdateActionGroup = renderWithGroup();

    fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit Nacht" }));
    fireEvent.change(screen.getByLabelText("Uhrzeit Nacht 3"), { target: { value: "22:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(onUpdateActionGroup).not.toHaveBeenCalled();
    expect(
      screen.getByText(/eigene, unterschiedliche Uhrzeit/i),
    ).toBeInTheDocument();
  });

  it("warnt beim Entfernen einer einzelnen Uhrzeit mit Bestätigungen", () => {
    const onUpdateActionGroup = renderWithGroup();

    // 01:00 ist die erste Zeile und hat eine Bestätigung.
    fireEvent.click(screen.getByRole("button", { name: "Uhrzeit Nacht 1 entfernen" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(onUpdateActionGroup).not.toHaveBeenCalled();
    expect(screen.getByText(/Durchführung mit Bestätigungen entfernen/i)).toBeInTheDocument();
  });
});
