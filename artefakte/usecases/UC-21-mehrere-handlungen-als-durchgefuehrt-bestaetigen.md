# UC-21 Mehrere Handlungen als durchgeführt bestätigen

## Trigger
Der Benutzer wählt in der Umsetzung im Klient/in-Menü «Mehrere als erledigt wie geplant abschliessen».

## Pre-Condition
- Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv
- Resultat nicht zwingend

## Postcondition
- Alle ausgewählten Umsetzungen haben den Status 'Durchgeführt'.

## Main Path
1. Der Benutzer markiert offene oder verschobene Handlungen.
2. Das System zeigt die Anzahl ausgewählter Handlungen; Handlungen mit zwingendem Resultat sind nicht wählbar.
3. Der Benutzer bestätigt im Dialog «Mehrere Handlungen als erledigt wie geplant bestätigen» mit «N als „Erledigt wie geplant“ bestätigen».
4. Das System speichert für jede Handlung eine Umsetzung wie in UC-14.

## Alternative Paths
**3a. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
