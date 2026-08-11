import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DatePickerInput } from "@/components/ui/date-picker-input";

describe("DatePickerInput mit Bereichsgrenzen", () => {
  it("macht Tage ausserhalb von minDate/maxDate im Kalender nicht auswählbar", async () => {
    render(
      <DatePickerInput
        value="2026-05-15"
        onChange={vi.fn()}
        minDate="2026-05-13"
        maxDate="2026-05-20"
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    const dayButton = async (day: string) =>
      (await screen.findByRole("gridcell", { name: day })).closest("button") ??
      (await screen.findByRole("button", { name: day }));

    // Im Fenster: auswählbar.
    expect(await dayButton("13")).toBeEnabled();
    expect(await dayButton("20")).toBeEnabled();
    // Ausserhalb: gesperrt.
    expect(await dayButton("12")).toBeDisabled();
    expect(await dayButton("21")).toBeDisabled();
  });
});
