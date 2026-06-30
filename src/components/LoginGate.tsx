import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkSession,
  getLockoutRemainingMs,
  login,
  registerFailedAttempt,
  resetThrottle,
} from "@/lib/auth";

interface LoginGateProps {
  children: ReactNode;
}

type Status = "checking" | "authed" | "login";

const formatRemaining = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")} min`;
  }
  return `${seconds} Sek.`;
};

/**
 * Sperrt den Zugriff auf die Applikation hinter einer Username/Passwort-Abfrage.
 * Die eigentliche Prüfung erfolgt serverseitig über /api/auth (das Passwort liegt
 * nur auf dem Server). Nach 3 Fehlversuchen wird die Anmeldung clientseitig
 * gedrosselt (1 Minute, danach mit jedem weiteren Fehlversuch doppelt so lange).
 */
export const LoginGate = ({ children }: LoginGateProps) => {
  const [status, setStatus] = useState<Status>("checking");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(() => getLockoutRemainingMs());

  // Beim Laden den Sitzungsstatus serverseitig prüfen.
  useEffect(() => {
    let active = true;
    checkSession().then((info) => {
      if (!active) return;
      setExpiresAt(info.expiresAt ?? null);
      setStatus(info.authenticated ? "authed" : "login");
    });
    return () => {
      active = false;
    };
  }, []);

  // Countdown herunterzählen, solange eine Sperre aktiv ist.
  useEffect(() => {
    if (lockoutMs <= 0) return;
    const interval = window.setInterval(() => {
      setLockoutMs(getLockoutRemainingMs());
    }, 500);
    return () => window.clearInterval(interval);
  }, [lockoutMs]);

  // Session-Ablauf auch im offenen Tab erzwingen.
  useEffect(() => {
    if (status !== "authed" || !expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setStatus("login");
      return;
    }
    const timeout = window.setTimeout(() => setStatus("login"), remaining);
    return () => window.clearTimeout(timeout);
  }, [status, expiresAt]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "authed") {
    return <>{children}</>;
  }

  const isLocked = lockoutMs > 0;
  const disabled = isLocked || submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    setSubmitting(true);
    const info = await login(username, password);
    setSubmitting(false);

    if (info.authenticated) {
      resetThrottle();
      setExpiresAt(info.expiresAt ?? null);
      setStatus("authed");
      return;
    }

    const remaining = registerFailedAttempt();
    setError(true);
    setPassword("");
    setLockoutMs(remaining);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Anmeldung</CardTitle>
          <CardDescription>Bitte melde dich an, um die Applikation zu nutzen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Benutzername</Label>
              <Input
                id="login-username"
                autoFocus
                autoComplete="username"
                disabled={disabled}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError(false);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Passwort</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                disabled={disabled}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(false);
                }}
              />
            </div>
            {error && !isLocked && (
              <p className="text-sm text-destructive">Benutzername oder Passwort ist falsch.</p>
            )}
            {isLocked && (
              <p className="text-sm text-destructive">
                Zu viele Fehlversuche. Bitte warte {formatRemaining(lockoutMs)}, bevor du es erneut
                versuchst.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={disabled}>
              {isLocked ? (
                `Gesperrt (${formatRemaining(lockoutMs)})`
              ) : submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmelden …
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Für Zugriff auf den Prototyp bitte bei{" "}
            <a
              href="mailto:daniel.nussbaum@glauxgroup.ch"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              daniel.nussbaum@glauxgroup.ch
            </a>{" "}
            melden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
