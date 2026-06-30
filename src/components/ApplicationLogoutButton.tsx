import { Power } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearApplicationBrowserData } from "@/lib/application-storage";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface ApplicationLogoutButtonProps {
  className?: string;
}

export const ApplicationLogoutButton = ({ className }: ApplicationLogoutButtonProps) => {
  const handleLogout = async () => {
    await logout();
    clearApplicationBrowserData();
    window.location.assign("/");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={cn("p-2 rounded hover:bg-secondary text-muted-foreground", className)}
          aria-label="Logout"
          title="Logout"
        >
          <Power className="h-5 w-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout bestätigen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du dich wirklich ausloggen? Bei „Ja“ werden alle lokal im Browser
            gespeicherten Daten dieser Applikation gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Nein</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>Ja</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
