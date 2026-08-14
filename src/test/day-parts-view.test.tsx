import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ActionPlanDayPartsView } from "@/components/settings/ActionPlanDayPartsView";
import {
  DAY_PARTS_STORAGE_KEY,
  DAY_PART_SEED_IDS,
  getDayPartUsage,
  invalidateDayPartsCache,
  loadDayParts,
} from "@/lib/day-parts";
import { ACTION_PLAN_TEMPLATES_STORAGE_KEY, buildDefaultTemplateFields } from "@/lib/action-plan-templates";
import { ASSESSMENT_CACHE_KEY } from "@/lib/assessment-cache";

const renderView = () => render(<ActionPlanDayPartsView searchQuery="" />);

describe("Einstellungen: Tageszeiten", () => {
  beforeEach(() => {
    window.localStorage.clear();
    invalidateDayPartsCache();
  });

  it("zeigt die konfigurierten Tageszeiten mit Von und Bis", () => {
    renderView();

    expect(screen.getByLabelText("Titel Morgen")).toHaveValue("Morgen");
    expect(screen.getByLabelText("Von Morgen")).toHaveValue("06:00");
    expect(screen.getByLabelText("Bis Morgen")).toHaveValue("11:00");
    // Die über-Mitternacht-Tageszeit wird als solche gekennzeichnet.
    expect(screen.getByText("über Mitternacht")).toBeInTheDocument();
  });

  it("speichert erst nach einer Änderung und dann als Ganzes", () => {
    renderView();

    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Titel Morgen"), { target: { value: "Frühdienst" } });
    fireEvent.change(screen.getByLabelText("Bis Frühdienst"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText("Von Mittag"), { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    invalidateDayPartsCache();
    const stored = loadDayParts();
    expect(stored.find((entry) => entry.id === DAY_PART_SEED_IDS.morning)).toMatchObject({
      title: "Frühdienst",
      from: "06:00",
      to: "10:00",
    });
    expect(stored.find((entry) => entry.id === DAY_PART_SEED_IDS.noon)?.from).toBe("10:00");
  });

  it("verweigert das Speichern bei einer Lücke und nennt sie", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("Bis Morgen"), { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(screen.getByText(/Zwischen 10:00 und 11:00 ist keine Tageszeit erfasst/)).toBeInTheDocument();
    expect(window.localStorage.getItem(DAY_PARTS_STORAGE_KEY)).toBeNull();
  });

  it("verweigert das Speichern bei einer Überlappung", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("Von Mittag"), { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(screen.getByText(/überlappt eine andere Tageszeit/)).toBeInTheDocument();
    expect(window.localStorage.getItem(DAY_PARTS_STORAGE_KEY)).toBeNull();
  });

  it("verwirft Änderungen auf Wunsch", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("Titel Morgen"), { target: { value: "Anders" } });
    fireEvent.click(screen.getByRole("button", { name: "Verwerfen" }));

    expect(screen.getByLabelText("Titel Morgen")).toHaveValue("Morgen");
    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled();
  });

  it("legt eine neue Tageszeit im Anschluss an die letzte an", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Tageszeit hinzufügen" }));

    // Die Nacht endet um 06:00 — dort setzt die neue Zeile an.
    expect(screen.getByLabelText("Von neue Tageszeit")).toHaveValue("06:00");
  });
});

describe("Tageszeiten: Löschschutz", () => {
  beforeEach(() => {
    window.localStorage.clear();
    invalidateDayPartsCache();
  });

  it("erkennt die Verwendung in einer Handlungsvorlage über den Titel", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        { id: "t1", name: "Morgenpflege", fields: { ...buildDefaultTemplateFields(), tageszeit: "Morgen" } },
      ]),
    );

    expect(getDayPartUsage(DAY_PART_SEED_IDS.morning)?.templateNames).toEqual(["Morgenpflege"]);
    expect(getDayPartUsage(DAY_PART_SEED_IDS.evening)).toBeUndefined();
  });

  it("erkennt die Verwendung in einer geplanten Handlung", () => {
    window.localStorage.setItem(
      ASSESSMENT_CACHE_KEY,
      JSON.stringify({
        clients: [
          {
            topics: [
              {
                targets: [
                  { actions: [{ title: "Lagerung", dayPart: DAY_PART_SEED_IDS.night }] },
                ],
              },
            ],
          },
        ],
      }),
    );

    expect(getDayPartUsage(DAY_PART_SEED_IDS.night)?.actionTitles).toEqual(["Lagerung"]);
  });

  it("zählt Uhrzeit-Handlungen nicht als Verwendung, weil sie keine Tageszeit speichern", () => {
    window.localStorage.setItem(
      ASSESSMENT_CACHE_KEY,
      JSON.stringify({
        clients: [
          { topics: [{ targets: [{ actions: [{ title: "Umlagern", scheduledTime: "01:00" }] }] }] },
        ],
      }),
    );

    expect(getDayPartUsage(DAY_PART_SEED_IDS.night)).toBeUndefined();
  });

  it("zieht Vorlagen beim Umbenennen einer Tageszeit mit", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "t1",
          name: "Morgenpflege",
          fields: { ...buildDefaultTemplateFields(), tageszeit: "Morgen,Abend" },
        },
      ]),
    );
    renderView();

    fireEvent.change(screen.getByLabelText("Titel Morgen"), { target: { value: "Frühdienst" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    const stored = JSON.parse(window.localStorage.getItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY)!);
    expect(stored[0].fields.tageszeit).toBe("Frühdienst,Abend");
    // Und die Verwendung wird weiterhin erkannt.
    expect(getDayPartUsage(DAY_PART_SEED_IDS.morning)?.templateNames).toEqual(["Morgenpflege"]);
  });

  it("sperrt den Löschen-Button einer verwendeten Tageszeit", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        { id: "t1", name: "Morgenpflege", fields: { ...buildDefaultTemplateFields(), tageszeit: "Morgen" } },
      ]),
    );
    renderView();

    expect(screen.getByRole("button", { name: "Tageszeit Morgen löschen" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tageszeit Abend löschen" })).toBeEnabled();
  });
});
