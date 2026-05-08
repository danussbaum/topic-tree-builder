import { afterEach, describe, expect, it } from "vitest";
import {
  APPLICATION_BROWSER_STORAGE_KEYS,
  APPLICATION_LOGOUT_CLEARING_KEY,
  clearApplicationBrowserData,
  isApplicationLogoutClearing,
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

    clearApplicationBrowserData();

    APPLICATION_BROWSER_STORAGE_KEYS.forEach((key) => {
      expect(window.localStorage.getItem(key)).toBeNull();
    });
    expect(window.localStorage.getItem("unrelated-key")).toBe("keep");
    expect(window.sessionStorage.getItem(APPLICATION_LOGOUT_CLEARING_KEY)).toBe("true");
    expect(isApplicationLogoutClearing()).toBe(true);
  });
});
