import { afterEach, describe, expect, it } from "vitest";
import {
  APPLICATION_BROWSER_STORAGE_KEYS,
  APPLICATION_DATA_VERSION,
  APPLICATION_LOGOUT_CLEARING_KEY,
  PLANNING_GROUPING_SESSION_KEY,
  clearApplicationBrowserData,
  isApplicationDataOutdated,
  isApplicationLogoutClearing,
  markApplicationDataCurrent,
} from "@/lib/application-storage";

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("application browser storage", () => {
  it("löscht alle lokal gespeicherten App-Daten und markiert den Logout-Vorgang", () => {
    APPLICATION_BROWSER_STORAGE_KEYS.forEach((key) => {
      window.localStorage.setItem(key, "cached");
    });
    window.localStorage.setItem("unrelated-key", "keep");
    window.sessionStorage.setItem(PLANNING_GROUPING_SESSION_KEY, "{}");

    clearApplicationBrowserData();

    APPLICATION_BROWSER_STORAGE_KEYS.forEach((key) => {
      expect(window.localStorage.getItem(key)).toBeNull();
    });
    expect(window.localStorage.getItem("unrelated-key")).toBe("keep");
    expect(window.sessionStorage.getItem(APPLICATION_LOGOUT_CLEARING_KEY)).toBe("true");
    expect(window.sessionStorage.getItem(PLANNING_GROUPING_SESSION_KEY)).toBeNull();
    expect(isApplicationLogoutClearing()).toBe(true);
  });
});

describe("Datenversion der Browserdaten", () => {
  it("gilt ohne gespeicherte Daten nicht als veraltet", () => {
    expect(isApplicationDataOutdated()).toBe(false);
  });

  it("meldet Daten ohne oder mit fremder Version als veraltet", () => {
    window.localStorage.setItem(APPLICATION_BROWSER_STORAGE_KEYS[1], "[]");
    expect(isApplicationDataOutdated()).toBe(true);

    window.localStorage.setItem("application-data-version", String(APPLICATION_DATA_VERSION - 1));
    expect(isApplicationDataOutdated()).toBe(true);
  });

  it("akzeptiert Daten in der aktuellen Version und vergisst die Version beim Löschen", () => {
    window.localStorage.setItem(APPLICATION_BROWSER_STORAGE_KEYS[1], "[]");
    markApplicationDataCurrent();
    expect(isApplicationDataOutdated()).toBe(false);

    clearApplicationBrowserData();
    expect(window.localStorage.getItem("application-data-version")).toBeNull();
  });
});
