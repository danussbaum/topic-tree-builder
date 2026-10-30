# UC-17 Handlung neu planen

## Trigger
Der Benutzer klickt in der Umsetzung bei einer offenen oder verschobenen Handlung auf «Neu planen».

## Pre-Condition
- Ursprünglicher Termin max. 1 Woche zurück, Berechtigung für Klassifizierung, Thema / Ziel aktiv

## Postcondition
- Die Umsetzung hat den Status 'Verschoben' mit neuem Datum, neuer Tageszeit und/oder neuer Uhrzeit.
- Die Handlung erscheint am neuen Termin in der neuen Tageszeit.

## Main Path
1. Der Benutzer klickt auf «Neu planen».
2. Das System zeigt den ursprünglichen und den aktuellen Termin sowie den möglichen Bereich (max. 1 Woche früher oder später als der ursprüngliche Termin, nicht in der Vergangenheit).
3. Der Benutzer erfasst Neues Datum, Neue Tageszeit und/oder Neue Uhrzeit (nur mit Tageszeit) sowie den Grund und klickt auf «Bestätigen».
4. Das System speichert die Verschiebung mit Verschoben von und Verschoben am.

## Alternative Paths
**3a. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.

**4a. Weder Datum noch Tageszeit noch Uhrzeit geändert**
1. Das System zeigt «Bitte ein neues Datum, eine neue Tageszeit und/oder eine neue Uhrzeit erfassen.»
2. Weiter bei Schritt 3.

**4b. Grund fehlt**
1. Das System zeigt «Bitte einen Grund für die Verschiebung angeben.»
2. Weiter bei Schritt 3.

**4c. Neuer Termin entspricht dem bisherigen**
1. Das System zeigt «Die Neuplanung muss vom bisher geplanten Zeitpunkt abweichen.»
2. Weiter bei Schritt 3.

**4d. Neues Datum liegt vor dem erlaubten Bereich**
1. Das System zeigt «Das neue Datum darf nicht vor dem … liegen (nicht in der Vergangenheit, max. 1 Woche früher).»
2. Weiter bei Schritt 3.

**4e. Neues Datum liegt nach dem erlaubten Bereich**
1. Das System zeigt «Das neue Datum darf nicht nach dem … liegen (max. 1 Woche später).»
2. Weiter bei Schritt 3.
