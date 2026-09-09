// Prototyp-Platzhalter fuer die socialweb-Laufnummer (Dossiernummer): fixes Jahr,
// Nummer aus der Position in der Hauptnavigation. Kein Feld am Client-Typ, damit
// die Nummer nicht mitpersistiert und auseinanderlaufen kann.
const CLIENT_REFERENCE_YEAR = 2026;

export const CLIENT_REFERENCE_HEADER = "Laufnummer";

export const formatClientReferenceNumber = (index: number) =>
  `B-${CLIENT_REFERENCE_YEAR}-${String(index + 1).padStart(5, "0")}`;

export const buildClientReferenceNumbers = (
  clients: readonly { id: string }[],
): ReadonlyMap<string, string> =>
  new Map(clients.map((client, index) => [client.id, formatClientReferenceNumber(index)]));
