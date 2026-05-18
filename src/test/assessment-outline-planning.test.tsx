import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionPlanDiscipline } from "@/lib/action-plan-disciplines";
import type { TopicNode } from "@/types/assessment";

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

const renderPlanningOutline = () =>
  render(
    <AssessmentOutline
      viewMode="planning"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      topics={topics}
      disciplines={disciplines}
      onUpdateTopic={vi.fn()}
      onUpdateTarget={vi.fn()}
      onUpdateAction={vi.fn()}
      onUpdateActionField={vi.fn()}
      onConfirmAction={vi.fn()}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onAddTopic={vi.fn()}
      onUpdateTopicDiscipline={vi.fn()}
      onDeleteTopic={vi.fn()}
      onDeleteTarget={vi.fn()}
      onDeleteAction={vi.fn()}
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
