import { format } from "date-fns";

// Abgeschlossen ist ein Ziel erst, wenn sein «Gültig bis» vor heute liegt —
// ein Enddatum in der Zukunft (oder heute) lässt es aktiv.
export function isTargetClosed(target: { validTo?: string }, today = format(new Date(), "yyyy-MM-dd")): boolean {
  return !!target.validTo && target.validTo < today;
}
