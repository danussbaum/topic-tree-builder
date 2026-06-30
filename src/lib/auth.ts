// Einfache clientseitige Zugangssperre für die Applikation.
//
// WICHTIG: Dies ist eine reine Client-SPA ohne Backend. Die Zugangsdaten werden
// beim Build aus den Vite-Umgebungsvariablen eingelesen und landen damit im
// ausgelieferten JavaScript-Bundle. Das ist KEINE echte Sicherheit, sondern nur
// eine simple Sperre gegen Gelegenheitsbesucher. Für echten Schutz wäre ein
// Backend nötig, das die Anmeldedaten serverseitig prüft.
//
// Konfiguration:
//   Lokal:   .env.local mit VITE_APP_USER / VITE_APP_PASSWORD (nicht in Git).
//   Vercel:  Project → Settings → Environment Variables → VITE_APP_USER,
//            VITE_APP_PASSWORD setzen und neu deployen.

export const APPLICATION_AUTH_STORAGE_KEY = "topic-tree-builder:auth:v1";
export const APPLICATION_AUTH_THROTTLE_KEY = "topic-tree-builder:auth-throttle:v1";

// Ab wie vielen Fehlversuchen gesperrt wird und wie lange die Basis-Sperre dauert.
const FREE_ATTEMPTS = 3;
const BASE_LOCKOUT_MS = 60_000; // 1 Minute, danach exponentiell (2x je weiterem Fehlversuch)

interface ThrottleState {
  failedAttempts: number;
  lockedUntil: number;
}

const readThrottleState = (): ThrottleState => {
  if (typeof window === "undefined") return { failedAttempts: 0, lockedUntil: 0 };
  try {
    const raw = window.localStorage.getItem(APPLICATION_AUTH_THROTTLE_KEY);
    if (!raw) return { failedAttempts: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as Partial<ThrottleState>;
    return {
      failedAttempts: Number(parsed.failedAttempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: 0 };
  }
};

const writeThrottleState = (state: ThrottleState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APPLICATION_AUTH_THROTTLE_KEY, JSON.stringify(state));
};

/**
 * Verbleibende Sperrzeit in Millisekunden (0 = nicht gesperrt).
 */
export const getLockoutRemainingMs = () => {
  const { lockedUntil } = readThrottleState();
  return Math.max(0, lockedUntil - Date.now());
};

/**
 * Registriert einen Fehlversuch und verhängt ab dem FREE_ATTEMPTS-ten Versuch
 * eine Sperre, die sich mit jedem weiteren Fehlversuch verdoppelt.
 * Gibt die verbleibende Sperrzeit in Millisekunden zurück.
 */
export const registerFailedAttempt = () => {
  const { failedAttempts } = readThrottleState();
  const nextAttempts = failedAttempts + 1;

  let lockedUntil = 0;
  if (nextAttempts >= FREE_ATTEMPTS) {
    const lockoutMs = BASE_LOCKOUT_MS * 2 ** (nextAttempts - FREE_ATTEMPTS);
    lockedUntil = Date.now() + lockoutMs;
  }

  writeThrottleState({ failedAttempts: nextAttempts, lockedUntil });
  return Math.max(0, lockedUntil - Date.now());
};

/**
 * Setzt die Fehlversuch-Zählung zurück (nach erfolgreichem Login).
 */
export const resetThrottle = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(APPLICATION_AUTH_THROTTLE_KEY);
};

const expectedUser = (import.meta.env.VITE_APP_USER ?? "").trim();
const expectedPassword = import.meta.env.VITE_APP_PASSWORD ?? "";

/**
 * Gibt true zurück, wenn überhaupt Zugangsdaten konfiguriert sind. Ist nichts
 * gesetzt (z. B. lokale Entwicklung ohne .env.local), bleibt die App offen,
 * statt sich auszusperren.
 */
export const isAuthConfigured = () => expectedUser.length > 0 && expectedPassword.length > 0;

/**
 * Prüft die eingegebenen Anmeldedaten gegen die konfigurierten Werte.
 */
export const verifyCredentials = (username: string, password: string) =>
  isAuthConfigured() && username.trim() === expectedUser && password === expectedPassword;

// Gültigkeitsdauer einer Anmeldung. Danach muss man sich erneut anmelden.
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Stunden

/**
 * Verbleibende Gültigkeit der aktuellen Anmeldung in Millisekunden (0 = abgelaufen
 * oder nicht angemeldet). Wird genutzt, um auch im offenen Tab automatisch
 * auszuloggen.
 */
export const getSessionRemainingMs = () => {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(APPLICATION_AUTH_STORAGE_KEY);
  if (!raw) return 0;
  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt)) return 0;
  return Math.max(0, expiresAt - Date.now());
};

/**
 * Ist der Nutzer aktuell angemeldet? Wenn keine Zugangsdaten konfiguriert sind,
 * gilt der Zugriff immer als erlaubt. Eine Anmeldung läuft nach SESSION_DURATION_MS
 * automatisch ab und verfällt zusätzlich beim Schließen des Browsers/Tabs
 * (Speicherung in sessionStorage).
 */
export const isAuthenticated = () => {
  if (!isAuthConfigured()) return true;
  if (typeof window === "undefined") return false;

  const raw = window.sessionStorage.getItem(APPLICATION_AUTH_STORAGE_KEY);
  if (!raw) return false;

  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    window.sessionStorage.removeItem(APPLICATION_AUTH_STORAGE_KEY);
    return false;
  }
  return true;
};

export const setAuthenticated = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(APPLICATION_AUTH_STORAGE_KEY, String(Date.now() + SESSION_DURATION_MS));
};

export const clearAuthentication = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(APPLICATION_AUTH_STORAGE_KEY);
  resetThrottle();
};
