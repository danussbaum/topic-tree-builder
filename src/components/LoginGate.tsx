import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getLockoutRemainingMs,
  getSessionRemainingMs,
  isAuthenticated,
  registerFailedAttempt,
  resetThrottle,
  setAuthenticated,
  verifyCredentials,
} from "@/lib/auth";

interface LoginGateProps {
  children: ReactNode;
}

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
 * Sind keine Zugangsdaten konfiguriert, lässt isAuthenticated() den Zugriff
 * direkt durch (z. B. lokale Entwicklung ohne .env.local).
 *
 * Nach 3 Fehlversuchen wird die Anmeldung gesperrt (1 Minute, danach mit jedem
 * weiteren Fehlversuch doppelt so lange).
 */
export const LoginGate = ({ children }: LoginGateProps) => {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(() => getLockoutRemainingMs());

  // Countdown herunterzählen, solange eine Sperre aktiv ist.
  useEffect(() => {
    if (lockoutMs <= 0) return;
    const interval = window.setInterval(() => {
      setLockoutMs(getLockoutRemainingMs());
    }, 500);
    return () => window.clearInterval(interval);
  }, [lockoutMs]);

  // Session-Ablauf auch im offenen Tab erzwingen: nach Ablauf der Gültigkeit
  // automatisch ausloggen, ohne dass ein Reload nötig ist.
  useEffect(() => {
    if (!authed) return;
    const remaining = getSessionRemainingMs();
    if (remaining <= 0) {
      setAuthed(false);
      return;
    }
    const timeout = window.setTimeout(() => setAuthed(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [authed]);

  if (authed) {
    return <>{children}</>;
  }

  const isLocked = lockoutMs > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked) return;

    if (verifyCredentials(username, password)) {
      resetThrottle();
      setAuthenticated();
      setAuthed(true);
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
                disabled={isLocked}
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
                disabled={isLocked}
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
            <Button type="submit" className="w-full" disabled={isLocked}>
              {isLocked ? `Gesperrt (${formatRemaining(lockoutMs)})` : "Anmelden"}
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
