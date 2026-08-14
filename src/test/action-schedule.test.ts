import { describe, expect, it } from "vitest";
import { getScheduleIssues, isActionSchedulable } from "@/lib/action-schedule";
import {
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
  getTemplateRecurrenceIssues,
  getTemplateValidationIssues,
  initialTemplates,
} from "@/lib/action-plan-templates";
import { buildInhouseSpitexSeedTopics } from "@/lib/inhouse-spitex-seed";
import { buildUnplannedActionNodes } from "@/lib/unplanned-action";

describe("getScheduleIssues", () => {
  it("akzeptiert eine vollständig geplante Handlung", () => {
    expect(isActionSchedulable({ validFrom: "2026-08-01", recurrence: "daily" })).toBe(true);
  });

  it("meldet fehlendes Gültig ab", () => {
    expect(getScheduleIssues({ recurrence: "daily" })).toContain("validFrom");
  });

  it("meldet fehlende Wiederholung", () => {
    expect(getScheduleIssues({ validFrom: "2026-08-01" })).toContain("recurrence");
  });

  it("meldet fehlende Wochentage bei wöchentlicher Wiederholung", () => {
    expect(
      getScheduleIssues({ validFrom: "2026-08-01", recurrence: "weekly" }),
    ).toContain("recurrenceWeekdays");
    expect(
      getScheduleIssues({
        validFrom: "2026-08-01",
        recurrence: "weekly",
        recurrenceWeekdays: ["monday"],
      }),
    ).toEqual([]);
  });

  it("meldet fehlende monatliche Regel", () => {
    expect(
      getScheduleIssues({ validFrom: "2026-08-01", recurrence: "monthly" }),
    ).toContain("recurrenceMonthlyPattern");
  });

  it("meldet ein Gültig bis vor dem Gültig ab", () => {
    expect(
      getScheduleIssues({ validFrom: "2026-08-10", validTo: "2026-08-01", recurrence: "daily" }),
    ).toContain("validTo");
  });
});

describe("Seed und ungeplante Handlungen", () => {
  it("seedet ausschliesslich Handlungen, die in der Umsetzung erscheinen", () => {
    const actions = buildInhouseSpitexSeedTopics().flatMap((topic) =>
      topic.targets.flatMap((target) => target.actions),
    );
    expect(actions.length).toBeGreaterThan(0);
    actions.forEach((action) => {
      expect({ title: action.title, issues: getScheduleIssues(action) }).toEqual({
        title: action.title,
        issues: [],
      });
    });
  });

  it("erzeugt ungeplante Handlungen immer mit vollständigem Zeitplan", () => {
    const nodes = buildUnplannedActionNodes("morning", { title: "Spontan", notes: "" }, "2026-08-14");
    expect(nodes.length).toBeGreaterThan(0);
    nodes.forEach((node) => expect(getScheduleIssues(node)).toEqual([]));
  });
});

describe("getTemplateRecurrenceIssues", () => {
  const editable = { wiederholungWochentage: true, wiederholungMonatlich: true };

  it("weist Handlungsarten ohne Wiederholung ab", () => {
    expect(
      getTemplateRecurrenceIssues(
        { wiederholung: "", wiederholungWochentage: "", wiederholungMonatlich: "none" },
        editable,
      ),
    ).toHaveLength(1);
  });

  it("erlaubt unvollständige Angaben, solange sie in der Planung ergänzbar sind", () => {
    expect(
      getTemplateRecurrenceIssues(
        { wiederholung: "weekly", wiederholungWochentage: "", wiederholungMonatlich: "none" },
        editable,
      ),
    ).toEqual([]);
  });

  it("weist gesperrte, unvollständige Wiederholungen ab", () => {
    expect(
      getTemplateRecurrenceIssues(
        { wiederholung: "weekly", wiederholungWochentage: "", wiederholungMonatlich: "none" },
        { wiederholungWochentage: false, wiederholungMonatlich: true },
      ),
    ).toHaveLength(1);
    expect(
      getTemplateRecurrenceIssues(
        { wiederholung: "monthly", wiederholungWochentage: "", wiederholungMonatlich: "none" },
        { wiederholungWochentage: true, wiederholungMonatlich: false },
      ),
    ).toHaveLength(1);
  });

  it("hält alle vorgeseedeten Handlungsarten regelkonform", () => {
    initialTemplates.forEach((template) => {
      expect({
        name: template.name,
        issues: getTemplateValidationIssues(template.name, template.fields, template.editable),
      }).toEqual({ name: template.name, issues: [] });
    });
  });
});

describe("getTemplateValidationIssues", () => {
  const fields = { ...buildDefaultTemplateFields(), titel: "Zahnpflege" };
  const editable = buildDefaultTemplateEditable(true);

  it("verlangt einen Handlungsvorlagennamen", () => {
    expect(getTemplateValidationIssues("   ", fields, editable)).toEqual([
      "Handlungsvorlagenname: zwingend",
    ]);
    expect(getTemplateValidationIssues("Zahnpflege", fields, editable)).toEqual([]);
  });

  it("verlangt einen Titel, wenn er in der Planung nicht erfassbar ist", () => {
    const withoutTitle = { ...fields, titel: "" };
    expect(getTemplateValidationIssues("Vorlage", withoutTitle, editable)).toEqual([]);
    expect(
      getTemplateValidationIssues("Vorlage", withoutTitle, { ...editable, titel: false }),
    ).toHaveLength(1);
  });
});
