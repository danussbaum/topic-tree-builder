import { resetThrottle } from "@/lib/auth";

export const APPLICATION_LOGOUT_CLEARING_KEY = "topic-tree-builder:logout-clearing";

/** Gruppierung der Planung pro Disziplin: gilt nur bis zum Logout. */
export const PLANNING_GROUPING_SESSION_KEY = "planning-discipline-grouping-v1";

export const APPLICATION_BROWSER_STORAGE_KEYS = [
  "assessment:cached-state:v2",
  "action-plan-templates-v2",
  "action-plan-disciplines-v2",
  "action-plan-classifications-v2",
  "action-plan-resources-v1",
  "action-plan-day-parts-v1",
  "action-plan-category-list-v1",
] as const;

// Abgeloeste Keys (Umbenennung Kategorie -> Klassifizierung, ohne Migration):
// werden nicht mehr gelesen, aber beim Logout mit entfernt.
const LEGACY_BROWSER_STORAGE_KEYS = [
  "assessment:cached-state:v1",
  "action-plan-templates-v1",
  "action-plan-disciplines-v1",
  "action-plan-categories-v1",
] as const;

/**
 * Version der lokal gespeicherten Daten. Erhöhen, wenn eine Programmänderung nicht
 * mehr zu bestehenden Browserdaten passt — Anwenderinnen müssen diese dann nach dem
 * Login zwingend löschen.
 */
export const APPLICATION_DATA_VERSION = 1;
const APPLICATION_DATA_VERSION_KEY = "application-data-version";

/** Veraltet heisst: Es liegen Daten im Browser, aber nicht in der aktuellen Version. */
export const isApplicationDataOutdated = () => {
  if (typeof window === "undefined") return false;
  const hasData = APPLICATION_BROWSER_STORAGE_KEYS.some(
    (key) => window.localStorage.getItem(key) !== null,
  );
  return (
    hasData &&
    window.localStorage.getItem(APPLICATION_DATA_VERSION_KEY) !== String(APPLICATION_DATA_VERSION)
  );
};

export const markApplicationDataCurrent = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APPLICATION_DATA_VERSION_KEY, String(APPLICATION_DATA_VERSION));
};

export const isApplicationLogoutClearing = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(APPLICATION_LOGOUT_CLEARING_KEY) === "true";
};

export const finishApplicationLogoutClearing = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(APPLICATION_LOGOUT_CLEARING_KEY);
};

export const clearApplicationBrowserData = () => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(APPLICATION_LOGOUT_CLEARING_KEY, "true");
  window.sessionStorage.removeItem(PLANNING_GROUPING_SESSION_KEY);
  [
    ...APPLICATION_BROWSER_STORAGE_KEYS,
    ...LEGACY_BROWSER_STORAGE_KEYS,
    APPLICATION_DATA_VERSION_KEY,
  ].forEach((key) => {
    window.localStorage.removeItem(key);
  });
  resetThrottle();
};
