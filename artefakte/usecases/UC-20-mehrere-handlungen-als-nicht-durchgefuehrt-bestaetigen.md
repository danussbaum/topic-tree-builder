# UC-20 Mehrere Handlungen als nicht durchgeführt bestätigen

## Trigger
Der Benutzer wählt in der Umsetzung im Klient/in-Menü «Mehrere als nicht durchgeführt abschliessen».

## Pre-Condition
- Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv

## Postcondition
- Alle ausgewählten Umsetzungen haben den Status 'Nicht durchgeführt' mit derselben Begründung.

## Main Path
1. Der Benutzer markiert offene oder verschobene Handlungen (einzeln, pro Tag oder pro Tageszeit).
2. Das System zeigt die Anzahl ausgewählter Handlungen.
3. Der Benutzer klickt auf «Ausgewählte als „Nicht durchgeführt“ bestätigen».
4. Das System zeigt den Dialog «Mehrere Handlungen nicht durchgeführt bestätigen».
5. Der Benutzer erfasst die Begründung und klickt auf «N als „Nicht durchgeführt“ bestätigen».
6. Das System speichert für jede Handlung eine Umsetzung mit dieser Begründung.

## Alternative Paths
**5a. Begründung ist leer**
1. Das System lässt die Bestätigung nicht zu.
2. Weiter bei Schritt 5.

**5b. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
