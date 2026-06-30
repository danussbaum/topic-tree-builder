// Auth-Client für die serverseitige Login-Prüfung (Vercel Edge Function /api/auth).
//
// Das Passwort wird ausschliesslich auf dem Server geprüft (siehe api/auth.ts) und
// landet NICHT im Browser-Bundle. Hier liegt nur der Client: er ruft den Endpoint
// auf und merkt sich nichts Geheimes. Das Brute-Force-Throttling läuft bewusst
// weiterhin clientseitig (localStorage) — als UX-Bremse, nicht als harter Schutz.

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

// --- Serverseitiger Login (Vercel Edge Function /api/auth) ---

export interface SessionInfo {
  authenticated: boolean;
  /** Ablaufzeitpunkt der Sitzung als Unix-ms (für Auto-Logout im offenen Tab). */
  expiresAt?: number;
}

const AUTH_ENDPOINT = "/api/auth";

// Beim reinen `vite`-Dev-Server (npm run dev) existieren die /api-Funktionen nicht.
// In diesem Fall lassen wir die App offen, damit Frontend-Entwicklung möglich ist.
// Für echtes Login-Testen `vercel dev` verwenden (dort antwortet der Endpoint).
const isDev = import.meta.env.DEV;

/**
 * Fragt den Server, ob die aktuelle Sitzung (httpOnly-Cookie) gültig ist.
 */
export const checkSession = async (): Promise<SessionInfo> => {
  try {
    const response = await fetch(AUTH_ENDPOINT, { method: "GET", credentials: "same-origin" });
    if (!response.ok) {
      // 404 -> Funktionen laufen nicht (reines vite dev): lokal offen lassen.
      if (response.status === 404 && isDev) return { authenticated: true };
      return { authenticated: false };
    }
    return (await response.json()) as SessionInfo;
  } catch {
    // Netzwerk-/Parsefehler: lokal offen, in Production fail-closed.
    return { authenticated: isDev };
  }
};

/**
 * Sendet die Anmeldedaten an den Server. Bei Erfolg setzt der Server das Cookie.
 */
export const login = async (username: string, password: string): Promise<SessionInfo> => {
  try {
    const response = await fetch(AUTH_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) return { authenticated: false };
    return (await response.json()) as SessionInfo;
  } catch {
    return { authenticated: false };
  }
};

/**
 * Meldet serverseitig ab (löscht das httpOnly-Cookie) und setzt das Throttling zurück.
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch(AUTH_ENDPOINT, { method: "DELETE", credentials: "same-origin" });
  } catch {
    // Fehler beim Logout ignorieren — Cookie läuft spätestens nach Ablauf aus.
  }
  resetThrottle();
};
