import { describe, expect, it } from "vitest";
import { isTargetClosed } from "@/lib/target-status";

describe("isTargetClosed", () => {
  const today = "2026-09-24";
  it("ohne Enddatum aktiv", () => expect(isTargetClosed({}, today)).toBe(false));
  it("Enddatum in der Zukunft bleibt aktiv", () => expect(isTargetClosed({ validTo: "2026-12-31" }, today)).toBe(false));
  it("Enddatum heute bleibt aktiv", () => expect(isTargetClosed({ validTo: today }, today)).toBe(false));
  it("Enddatum gestern ist abgeschlossen", () => expect(isTargetClosed({ validTo: "2026-09-23" }, today)).toBe(true));
});
