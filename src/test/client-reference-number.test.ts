import { describe, expect, it } from "vitest";
import {
  buildClientReferenceNumbers,
  CLIENT_REFERENCE_HEADER,
  formatClientReferenceNumber,
} from "@/lib/client-reference-number";

describe("Laufnummer", () => {
  it("beginnt bei B-2026-00001", () => {
    expect(formatClientReferenceNumber(0)).toBe("B-2026-00001");
  });

  it("fuellt die fortlaufende Nummer auf fuenf Stellen auf", () => {
    expect(formatClientReferenceNumber(216)).toBe("B-2026-00217");
    expect(formatClientReferenceNumber(99999)).toBe("B-2026-100000");
  });

  it("zaehlt in der Reihenfolge der Hauptnavigation", () => {
    const numbers = buildClientReferenceNumbers([{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(numbers.get("a")).toBe("B-2026-00001");
    expect(numbers.get("b")).toBe("B-2026-00002");
    expect(numbers.get("c")).toBe("B-2026-00003");
  });

  it("heisst als Spalte 'Laufnummer'", () => {
    expect(CLIENT_REFERENCE_HEADER).toBe("Laufnummer");
  });
});
