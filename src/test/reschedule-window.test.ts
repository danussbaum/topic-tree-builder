import { describe, expect, it } from "vitest";
import { getRescheduleWindow } from "@/lib/reschedule";

describe("getRescheduleWindow", () => {
  it("erlaubt +/- 1 Woche um das geplante Datum", () => {
    expect(getRescheduleWindow("2026-05-20", "2026-05-11")).toEqual({
      minDate: "2026-05-13",
      maxDate: "2026-05-27",
      isAvailable: true,
    });
  });

  it("schneidet das Fenster beim heutigen Tag ab", () => {
    // Geplant übermorgen: 1 Woche früher läge in der Vergangenheit.
    expect(getRescheduleWindow("2026-05-13", "2026-05-11")).toEqual({
      minDate: "2026-05-11",
      maxDate: "2026-05-20",
      isAvailable: true,
    });
  });

  it("lässt bei einer heute geplanten Handlung nur die Zukunft zu", () => {
    expect(getRescheduleWindow("2026-05-11", "2026-05-11")).toEqual({
      minDate: "2026-05-11",
      maxDate: "2026-05-18",
      isAvailable: true,
    });
  });

  it("hält den letzten Tag des Fensters noch offen", () => {
    // Geplant genau 1 Woche zurück: nur noch heute selbst ist wählbar.
    expect(getRescheduleWindow("2026-05-04", "2026-05-11")).toEqual({
      minDate: "2026-05-11",
      maxDate: "2026-05-11",
      isAvailable: true,
    });
  });

  it("meldet kein Fenster, wenn der Termin mehr als 1 Woche zurückliegt", () => {
    expect(getRescheduleWindow("2026-05-03", "2026-05-11").isAvailable).toBe(false);
    expect(getRescheduleWindow("2026-04-20", "2026-05-11").isAvailable).toBe(false);
  });
});
