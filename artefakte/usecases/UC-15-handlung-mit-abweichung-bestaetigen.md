# UC-15 Handlung mit Abweichung bestätigen

## Trigger
Der Benutzer klickt in der Umsetzung bei einer offenen oder verschobenen Handlung auf «Erledigt mit Abweichung».

## Pre-Condition
- Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv

## Postcondition
- Die Umsetzung hat den Status 'Mit Abweichung durchgeführt'.

## Main Path
1. Der Benutzer klickt auf «Erledigt mit Abweichung».
2. Das System zeigt den Dialog «Handlung bestätigen» und belegt Tatsächliche Anzahl Personen mit dem geplanten Wert vor.
3. Der Benutzer erfasst Tatsächliche Minuten, Tatsächliche Anzahl Personen, Begründung, Resultat, Beobachtungen und optionale Leistungen und klickt auf «Bestätigen».
4. Das System speichert die Umsetzung mit Leistungsart und Tageszeit bei Umsetzung, Bestätigt von und Bestätigt am.

## Alternative Paths
**3a. Begründung fehlt, Tatsächliche Minuten fehlen bei geplanten Minuten > 0, Tatsächliche Anzahl Personen fehlt bei geplanter Anzahl oder Resultat ist zwingend und leer**
1. Das System lässt «Bestätigen» nicht zu.
2. Weiter bei Schritt 3.

**3b. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
