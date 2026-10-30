# UC-16 Handlung als nicht durchgeführt bestätigen

## Trigger
Der Benutzer klickt in der Umsetzung bei einer offenen oder verschobenen Handlung auf «Nicht durchgeführt».

## Pre-Condition
- Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv

## Postcondition
- Die Umsetzung hat den Status 'Nicht durchgeführt'.

## Main Path
1. Der Benutzer klickt auf «Nicht durchgeführt».
2. Das System zeigt den Dialog «Handlung bestätigen».
3. Der Benutzer erfasst die Begründung und klickt auf «Bestätigen».
4. Das System speichert die Umsetzung mit Bestätigt von und Bestätigt am.

## Alternative Paths
**3a. Begründung ist leer**
1. Das System lässt «Bestätigen» nicht zu.
2. Weiter bei Schritt 3.

**3b. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
