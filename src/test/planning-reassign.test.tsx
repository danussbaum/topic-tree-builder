import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline, type PlanningReassignMode } from "@/components/assessment/AssessmentOutline";
import type { ActionPlanDiscipline } from "@/lib/action-plan-disciplines";
import type { ActionConfirmation, ActionNode, TargetNode } from "@/types/assessment";
import { preferTargetGrouping } from "@/test/planning-grouping";

beforeEach(() => {
  preferTargetGrouping();
});

const disciplines: ActionPlanDiscipline[] = [
  { id: "discipline-ihp", title: "IHP", authorizedRoleIds: [], categoryIds: ["category-101", "category-102"] },
  { id: "discipline-physio", title: "Physiotherapie", authorizedRoleIds: [], categoryIds: [] },
];

const action = (id: string, title: string, overrides: Partial<ActionNode> = {}): ActionNode => ({
  id,
  groupId: `grp-${id}`,
  title,
  notes: "",
  status: "open",
  done: false,
  ...overrides,
});

const targets: TargetNode[] = [
  {
    id: "goal-a",
    disciplineId: "discipline-ihp",
    title: "Ziel A",
    notes: "",
    actions: [
      action("a1", "Waschen", { validFrom: "2026-01-01" }),
      action("a2", "Bestätigt", {
        validFrom: "2026-01-01",
        confirmations: { "2026-01-15": { status: "done_as_planned" } as ActionConfirmation },
      }),
      action("a3", "Gesperrt", { categoryId: "category-101", templateLockedFields: ["categoryId"] }),
    ],
  },
  { id: "goal-b", disciplineId: "discipline-ihp", title: "Ziel B", notes: "", validFrom: "2026-02-01", actions: [] },
  { id: "goal-c", disciplineId: "discipline-physio", title: "Ziel C", notes: "", actions: [action("c1", "Gehen")] },
];

const renderOutline = (reassignMode: PlanningReassignMode) => {
  const onMoveActionGroups = vi.fn();
  const onAssignCategory = vi.fn();
  const onExitReassignMode = vi.fn();
  render(
    <AssessmentOutline
      viewMode="planning"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      targets={targets}
      disciplines={disciplines}
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
      reassignMode={reassignMode}
      onMoveActionGroups={onMoveActionGroups}
      onAssignCategory={onAssignCategory}
      onExitReassignMode={onExitReassignMode}
    />,
  );
  return { onMoveActionGroups, onAssignCategory, onExitReassignMode };
};

describe("Planung: Mehrere einem Thema / Ziel zuteilen", () => {
  it("verschiebt nur Handlungen, deren Bestätigungen im neuen Ziel liegen, und warnt bei der Gültigkeit", () => {
    const { onMoveActionGroups } = renderOutline("target");
    fireEvent.click(screen.getByRole("heading", { name: "IHP" }));

    expect(screen.getByText("Handlungen auswählen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Waschen auswählen" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Bestätigt auswählen" }));
    expect(screen.getByText("2 Handlungen ausgewählt")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zu Thema / Ziel zuteilen…" }));
    const dialog = screen.getByRole("dialog");
    // Nur Ziele derselben Disziplin werden angeboten.
    expect(within(dialog).queryByRole("radio", { name: "Ziel C" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("radio", { name: "Ziel B" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Bestätigt — bestätigt am 15.01.2026");
    expect(within(dialog).getByText(/Gültigkeit reicht über das Thema \/ Ziel hinaus/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "1 zuteilen" }));
    expect(onMoveActionGroups).toHaveBeenCalledWith(new Set(["grp-a1"]), "goal-b");
  });

  it("wählt mit «alle» die Handlungen eines Themas / Ziels", () => {
    renderOutline("target");
    fireEvent.click(screen.getByRole("heading", { name: "IHP" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Alle Handlungen von Ziel A auswählen" }));
    expect(screen.getByText("3 Handlungen ausgewählt")).toBeInTheDocument();
  });
});

describe("Planung: Mehrfachauswahl beenden", () => {
  it("lässt sich auch ohne Auswahl direkt in der Leiste beenden", () => {
    const { onExitReassignMode } = renderOutline("target");
    fireEvent.click(screen.getByRole("button", { name: "Mehrfachauswahl beenden" }));
    expect(onExitReassignMode).toHaveBeenCalled();
  });
});

describe("Planung: Mehrere einer Kategorie zuteilen", () => {
  it("sperrt Handlungen mit festgelegter Kategorie und teilt die übrigen zu", () => {
    const { onAssignCategory } = renderOutline("category");
    fireEvent.click(screen.getByRole("heading", { name: "IHP" }));

    expect(screen.getByRole("checkbox", { name: "Gesperrt auswählen" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Alle Handlungen von Ziel A auswählen" }));
    expect(screen.getByText("2 Handlungen ausgewählt")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Kategorie zuteilen…" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("radio").map((radio) => radio.getAttribute("aria-label"))).toEqual([
      "Ohne Kategorie",
      "101 Hygiene und Komfort",
      "102 Atmung",
    ]);
    fireEvent.click(within(dialog).getByRole("radio", { name: "102 Atmung" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Zuteilen" }));
    expect(onAssignCategory).toHaveBeenCalledWith(new Set(["grp-a1", "grp-a2"]), "category-102");
  });
});
