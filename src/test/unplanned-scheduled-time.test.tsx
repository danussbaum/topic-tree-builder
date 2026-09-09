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

describe("Ungeplante Handlung: Uhrzeit innerhalb der Tageszeit", () => {
  it("erlaubt die Eingabe einer Uhrzeit bei fixer Tageszeit", async () => {
    renderForDayPart();
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByLabelText("Uhrzeit")).toBeEnabled();
    // Grenzen der Tageszeit "Morgen" (06:00 bis 11:00, bis exklusiv).
    expect(within(dialog).getByLabelText("Uhrzeit")).toHaveAttribute("min", "06:00");
    expect(within(dialog).getByLabelText("Uhrzeit")).toHaveAttribute("max", "10:59");
  });

  it("meldet eine Uhrzeit ausserhalb der Tageszeit und bestätigt nicht", async () => {
    const onConfirm = renderForDayPart();
    const dialog = await openScratchMode();

    fireEvent.change(within(dialog).getByLabelText("Uhrzeit"), { target: { value: "15:30" } });

    expect(within(dialog).getByText(/Uhrzeit muss im Bereich der Tageszeit/)).toBeInTheDocument();

    expect(within(dialog).getByRole("button", { name: "Bestätigen" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("übernimmt eine Uhrzeit innerhalb der Tageszeit", async () => {
    const onConfirm = renderForDayPart();
    const dialog = await openScratchMode();

    fireEvent.change(within(dialog).getByLabelText("Uhrzeit"), { target: { value: "07:15" } });

    expect(within(dialog).queryByText(/Uhrzeit muss im Bereich der Tageszeit/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Bestätigen" }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledTime: "07:15" }),
      undefined,
    );
  });
});
