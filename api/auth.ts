// Serverseitiger Auth-Endpoint (Vercel Edge Function, im Hobby-/Free-Tier enthalten).
//
// Das Passwort wird ausschliesslich hier auf dem Server gegen die
// Umgebungsvariablen geprueft (APP_USER / APP_PASSWORD) und landet damit NIE im
// ausgelieferten Browser-Bundle. Bei Erfolg wird ein HMAC-signiertes Token als
// httpOnly-Cookie gesetzt, das der Browser nicht per JavaScript auslesen kann.
//
// Routen (alle unter /api/auth):
//   GET    -> Status der aktuellen Sitzung { authenticated, expiresAt? }
//   POST   -> Login mit { username, password } -> setzt Cookie
//   DELETE -> Logout -> loescht Cookie
//
// Benoetigte Env-Variablen (OHNE VITE_-Praefix, nur serverseitig):
//   APP_USER, APP_PASSWORD, AUTH_SECRET (langer Zufallsstring zum Signieren)

export const config = { runtime: "edge" };

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Stunden
const COOKIE_NAME = "app_auth";

const encoder = new TextEncoder();

const toBase64Url = (bytes: ArrayBuffer) => {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const sign = async (data: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(signature);
};

const createToken = async (secret: string) => {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const signature = await sign(String(expiresAt), secret);
  return { token: `${expiresAt}.${signature}`, expiresAt };
};

/** Prueft Signatur + Ablauf. Gibt den Ablaufzeitpunkt zurueck oder null. */
const verifyToken = async (token: string, secret: string): Promise<number | null> => {
  const separator = token.indexOf(".");
  if (separator < 0) return null;

  const expPart = token.slice(0, separator);
  const signaturePart = token.slice(separator + 1);
  const expiresAt = Number(expPart);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;

  const expected = await sign(expPart, secret);
  if (expected.length !== signaturePart.length) return null;

  // Konstantzeit-Vergleich gegen Timing-Angriffe.
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signaturePart.charCodeAt(i);
  }
  return diff === 0 ? expiresAt : null;
};

const readCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
};

const buildCookie = (token: string, maxAgeSeconds: number) => {
  // Secure nur ausserhalb der lokalen Entwicklung, damit das Cookie unter
  // http://localhost (vercel dev) ueberhaupt gesetzt wird.
  const secure = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });

export default async function handler(request: Request): Promise<Response> {
  const secret = process.env.AUTH_SECRET;
  const expectedUser = (process.env.APP_USER ?? "").trim();
  const expectedPassword = process.env.APP_PASSWORD ?? "";

  if (!secret || !expectedUser || !expectedPassword) {
    return json({ authenticated: false, error: "not_configured" }, { status: 500 });
  }

  if (request.method === "GET") {
    const token = readCookie(request, COOKIE_NAME);
    const expiresAt = token ? await verifyToken(token, secret) : null;
    return json({ authenticated: expiresAt !== null, expiresAt: expiresAt ?? undefined });
  }

  if (request.method === "POST") {
    let body: { username?: string; password?: string } = {};
    try {
      body = await request.json();
    } catch {
      // ungueltiger Body -> als Fehlversuch behandeln
    }

    const ok = (body.username ?? "").trim() === expectedUser && (body.password ?? "") === expectedPassword;
    if (!ok) {
      return json({ authenticated: false }, { status: 401 });
    }

    const { token, expiresAt } = await createToken(secret);
    return json(
      { authenticated: true, expiresAt },
      { headers: { "set-cookie": buildCookie(token, Math.floor(SESSION_DURATION_MS / 1000)) } },
    );
  }

  if (request.method === "DELETE") {
    return json({ authenticated: false }, { headers: { "set-cookie": buildCookie("", 0) } });
  }

  return json({ error: "method_not_allowed" }, { status: 405 });
}
