# UC-14 Handlung als durchgeführt bestätigen

## Trigger
Der Benutzer klickt in der Umsetzung bei einer offenen oder verschobenen Handlung auf «Erledigt wie geplant».

## Pre-Condition
- Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv

## Postcondition
- Die Umsetzung hat den Status 'Durchgeführt'.
- Tatsächliche Minuten und Personen entsprechen den geplanten Werten zum Bestätigungszeitpunkt.

## Main Path
1. Der Benutzer klickt auf «Erledigt wie geplant».
2. Das System zeigt den Dialog «Handlung bestätigen» mit den Angaben zur Handlung.
3. Der Benutzer erfasst Resultat, Beobachtungen und optionale Leistungen und klickt auf «Bestätigen».
4. Das System speichert die Umsetzung mit den geplanten Werten als tatsächliche Werte, Leistungsart und Tageszeit bei Umsetzung, Bestätigt von und Bestätigt am.

## Alternative Paths
**3a. Resultat ist zwingend und leer**
1. Das System lässt «Bestätigen» nicht zu.
2. Weiter bei Schritt 3.

**3b. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
