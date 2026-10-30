import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { UnplannedActionDialog } from "@/components/assessment/AssessmentOutline";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";

/** Erfassung über das (+) einer Tageszeit: die Tageszeit ist fix vorgegeben. */
const renderForDayPart = (onConfirm = vi.fn()) => {
  render(
    <UnplannedActionDialog
      target={{ dueDate: "2026-05-12", dayPart: DAY_PART_SEED_IDS.morning }}
      fixedDayPart={DAY_PART_SEED_IDS.morning}
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
};

const openScratchMode = async () => {
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByText("Ohne Vorlage erstellen"));
  // Die Bezeichnung ist Pflicht, sonst bleibt "Bestätigen" deaktiviert.
  fireEvent.change(within(dialog).getByLabelText("Bezeichnung *"), {
    target: { value: "Spontane Begleitung" },
  });
  return dialog;
};

describe("Ungeplante Handlung: Uhrzeit zur Tageszeit", () => {
  it("erlaubt die Eingabe einer Uhrzeit bei fixer Tageszeit ohne Grenzen", async () => {
    renderForDayPart();
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByLabelText("Uhrzeit")).toBeEnabled();
    expect(within(dialog).getByLabelText("Uhrzeit")).not.toHaveAttribute("min");
    expect(within(dialog).getByLabelText("Uhrzeit")).not.toHaveAttribute("max");
  });

  it("übernimmt eine Uhrzeit ausserhalb der üblichen Zeit ohne Meldung", async () => {
    const onConfirm = renderForDayPart();
    const dialog = await openScratchMode();

    fireEvent.change(within(dialog).getByLabelText("Uhrzeit"), { target: { value: "23:30" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledTime: "23:30" }),
      undefined,
    );
  });

  it("bietet ohne Tageszeit keine Uhrzeit an", async () => {
    render(
      <UnplannedActionDialog
        target={{ dueDate: "2026-05-12", dayPart: "none" }}
        fixedDayPart="none"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Uhrzeit")).not.toBeInTheDocument();
  });

  it("übernimmt eine Uhrzeit innerhalb der Tageszeit", async () => {
    const onConfirm = renderForDayPart();
    const dialog = await openScratchMode();

    fireEvent.change(within(dialog).getByLabelText("Uhrzeit"), { target: { value: "07:15" } });

    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledTime: "07:15" }),
      undefined,
    );
  });
});
