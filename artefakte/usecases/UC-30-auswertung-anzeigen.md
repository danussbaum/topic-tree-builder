# UC-30 Auswertung anzeigen

## Trigger
Der Benutzer wählt im Menü «Auswertungen» «Nach Klassifizierung», «Nach Klientin», «Nach Mitarbeitenden» oder «Nach Resultat und Beobachtung».

## Pre-Condition
- Mindestens eine Klient/in ist ausgewählt.

## Postcondition
- Keine Datenänderung.

## Main Path
1. Der Benutzer wählt die Auswertung und den Monat.
2. Das System zeigt die Umsetzungen des Monats mit Status 'Durchgeführt', 'Mit Abweichung durchgeführt' und 'Nicht durchgeführt' gemäss Filter: als Baum mit Tatsächlich, Geplant und Differenz bzw. als Tabelle mit Resultat und Beobachtung.

## Alternative Paths
**2a. Im Monat gibt es keine solchen Umsetzungen**
1. Das System zeigt «Keine abgeschlossenen Handlungen in diesem Monat.»
2. Use Case endet.
