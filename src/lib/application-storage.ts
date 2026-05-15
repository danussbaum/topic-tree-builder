export const APPLICATION_LOGOUT_CLEARING_KEY = "topic-tree-builder:logout-clearing";

export const APPLICATION_BROWSER_STORAGE_KEYS = [
  "assessment:cached-state:v1",
  "action-plan-templates-v1",
  "action-plan-disciplines-v1",
] as const;

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
  APPLICATION_BROWSER_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};
