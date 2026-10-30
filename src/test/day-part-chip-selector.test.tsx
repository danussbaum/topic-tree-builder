import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DayPartChipSelector } from "@/components/assessment/DayPartChipSelector";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";
import { scheduleEntriesError, type DayPartEntry } from "@/lib/day-part-entries";

let latest: DayPartEntry[] = [];
const Harness = ({ initial }: { initial: DayPartEntry[] }) => {
  const [value, setValue] = useState(initial);
  latest = value;
  return <DayPartChipSelector value={value} onChange={setValue} />;
};

describe("DayPartChipSelector", () => {
  it("übernimmt eine bestehende Durchführung ohne Zeitangabe beim Wählen einer Tageszeit", () => {
    // Regression: Die Durchführung ohne Tageszeit blieb unsichtbar daneben bestehen,
    // und das Speichern meldete «Eine Uhrzeit braucht eine Tageszeit.».
    render(<Harness initial={[{ id: "action-1" }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Mittag" }));
    fireEvent.change(screen.getByLabelText("Uhrzeit Mittag 1"), { target: { value: "12:00" } });

    expect(latest).toEqual([{ id: "action-1", dayPart: DAY_PART_SEED_IDS.noon, scheduledTime: "12:00" }]);
    expect(scheduleEntriesError(latest)).toBeNull();
  });

  it("macht beim Abwählen der letzten Tageszeit wieder eine Durchführung ohne Zeitangabe daraus", () => {
    render(<Harness initial={[{ id: "action-1", dayPart: DAY_PART_SEED_IDS.noon, scheduledTime: "12:00" }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Mittag" }));

    expect(latest).toEqual([{ id: "action-1" }]);
    expect(screen.getByText("Ohne Zeitangabe")).toBeInTheDocument();
  });
});
