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
    expect(within(ihpSection!).getByDisplayValue("Mobilität erhalten")).toBeInTheDocument();
    expect(within(ihpSection!).getByDisplayValue("Alltag strukturieren")).toBeInTheDocument();
    expect(within(ihpSection!).queryByDisplayValue("Gleichgewicht trainieren")).not.toBeInTheDocument();
  });
});

describe("AssessmentOutline planning master-detail", () => {
  it("zeigt standardmässig die Handlungen des ersten Ziels und blendet die übrigen aus", () => {
    renderPlanningOutline({ topics: topicsWithGoals });

    expect(screen.getByText("Handlung A1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung B1")).not.toBeInTheDocument();
  });

  it("wechselt das Detail beim Klick auf ein anderes Ziel in der Master-Spalte", () => {
    renderPlanningOutline({ topics: topicsWithGoals });

    fireEvent.click(screen.getByRole("button", { name: /Ziel B/ }));

    expect(screen.getByText("Handlung B1")).toBeInTheDocument();
    expect(screen.queryByText("Handlung A1")).not.toBeInTheDocument();
  });
});
