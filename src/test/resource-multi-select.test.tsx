import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceMultiSelect } from "@/components/settings/ResourceMultiSelect";
import type { ActionPlanResource } from "@/lib/action-plan-resources";

const options: ActionPlanResource[] = [
  {
    id: "r-rollator",
    name: "Rollator",
    description: "Gehhilfe mit Rädern und Bremsen.",
    disciplineIds: [],
  },
  { id: "r-ohne", name: "Ohne Beschreibung", description: "", disciplineIds: [] },
];

const openList = () => fireEvent.click(screen.getByLabelText("Hilfsmittel anzeigen"));

describe("Hilfsmittel-Auswahl: Beschreibung aus dem Katalog", () => {
  it("zeigt die Beschreibung in der Auswahlliste unter dem Namen", () => {
    render(<ResourceMultiSelect options={options} value={[]} onChange={vi.fn()} />);
    openList();

    expect(screen.getByText("Gehhilfe mit Rädern und Bremsen.")).toBeInTheDocument();
    // Der zugängliche Name bleibt der Hilfsmittel-Name.
    expect(screen.getByRole("button", { name: "Rollator" })).toBeInTheDocument();
  });

  it("lässt Hilfsmittel ohne Beschreibung einzeilig", () => {
    render(<ResourceMultiSelect options={options} value={[]} onChange={vi.fn()} />);
    openList();

    const option = screen.getByRole("button", { name: "Ohne Beschreibung" });
    expect(option.textContent).toBe("Ohne Beschreibung");
  });

  it("zeigt die Beschreibung am gewählten Hilfsmittel als Tooltip", () => {
    render(<ResourceMultiSelect options={options} value={["r-rollator"]} onChange={vi.fn()} />);

    // Das Badge trägt die Beschreibung, ohne die Zeile zu verlängern.
    const badge = screen.getByTitle("Gehhilfe mit Rädern und Bremsen.");
    expect(badge.textContent).toContain("Rollator");
  });

  it("setzt am Badge ohne Beschreibung keinen Tooltip", () => {
    render(<ResourceMultiSelect options={options} value={["r-ohne"]} onChange={vi.fn()} />);

    expect(
      screen.getByLabelText("Ohne Beschreibung entfernen").closest("[title]"),
    ).toBeNull();
  });
});
